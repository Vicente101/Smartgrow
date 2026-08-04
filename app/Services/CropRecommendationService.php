<?php

namespace App\Services;

use App\Models\Crop;
use Carbon\CarbonImmutable;

class CropRecommendationService
{
    /**
     * @param  array<string, mixed>  $location
     * @param  array<string, mixed>|null  $forecast
     * @param  array<string, mixed>  $climate
     * @return array<string, mixed>
     */
    public function analyse(array $location, ?array $forecast, array $climate, int $month, string $soilType, string $irrigation): array
    {
        $baseline = collect($climate['months'] ?? [])->firstWhere('month', $month);
        if (! $baseline) {
            throw new \RuntimeException('There is not enough monthly climate data for this location.');
        }

        $metrics = [
            'temperature' => (float) ($baseline['temperature'] ?? $forecast['current']['temperature'] ?? 0),
            'temp_max' => (float) ($baseline['temp_max'] ?? $forecast['summary']['average_high'] ?? 0),
            'temp_min' => (float) ($baseline['temp_min'] ?? $forecast['summary']['average_low'] ?? 0),
            'rainfall' => (float) ($baseline['rainfall'] ?? 0),
            'rain_days' => $baseline['rain_days'] ?? null,
            'humidity' => (float) ($baseline['humidity'] ?? $forecast['current']['humidity'] ?? 60),
            'wind' => (float) ($baseline['wind'] ?? $forecast['current']['wind_speed'] ?? 0),
            'et0' => $baseline['et0'] ?? null,
        ];

        $crops = Crop::query()->orderBy('name')->get();
        $ranked = $crops
            ->map(fn (Crop $crop) => $this->scoreCrop($crop, $metrics, $forecast, $month, $soilType, $irrigation))
            ->sortByDesc('score')
            ->values();

        return [
            'generated_at' => now()->toIso8601String(),
            'location' => $location,
            'planting_month' => [
                'number' => $month,
                'name' => CarbonImmutable::create(2024, $month, 1)->format('F'),
                'season' => $this->seasonLabel($month, (float) $location['latitude'], $metrics['rainfall']),
            ],
            'farm_profile' => [
                'soil_type' => $soilType,
                'irrigation' => $irrigation,
            ],
            'weather' => $forecast,
            'climate' => [
                ...$climate,
                'selected_month' => $metrics,
            ],
            'recommendations' => $ranked->take(8)->all(),
            'alternative_count' => max($ranked->count() - 8, 0),
            'field_actions' => $this->fieldActions($metrics, $forecast, $soilType, $irrigation),
            'confidence' => $this->confidence($forecast, $climate, $soilType),
            'methodology' => [
                'name' => 'Munda agronomic suitability model',
                'version' => '2.1',
                'type' => 'explainable weighted scoring',
                'signals' => ['5-year monthly climate', '14-day forecast', 'crop tolerance bands', 'soil match', 'water access'],
                'disclaimer' => 'Decision support only. Confirm seed choice and planting dates with a local extension officer and a current soil test.',
            ],
        ];
    }

    /**
     * @param  array<string, float|int|null>  $metrics
     * @param  array<string, mixed>|null  $forecast
     * @return array<string, mixed>
     */
    private function scoreCrop(Crop $crop, array $metrics, ?array $forecast, int $month, string $soilType, string $irrigation): array
    {
        $effectiveRainfall = $this->effectiveRainfall($metrics['rainfall'], $crop, $irrigation);
        $temperatureScore = $this->rangeScore($metrics['temperature'], $crop->temp_min, $crop->temp_opt_min, $crop->temp_opt_max, $crop->temp_max);
        $rainfallScore = $this->rangeScore($effectiveRainfall, $crop->rainfall_min, $crop->rainfall_opt_min, $crop->rainfall_opt_max, $crop->rainfall_max);
        $humidityScore = $this->softRangeScore($metrics['humidity'], $crop->humidity_min, $crop->humidity_max, 2.2);
        $soilScore = $soilType === 'unknown' ? 76 : (in_array($soilType, $crop->soil_types, true) ? 100 : 48);
        $forecastScore = $this->nearTermScore($crop, $forecast, $month, $irrigation);

        if ($forecast && $month === now()->month) {
            $score = $temperatureScore * .31 + $rainfallScore * .27 + $humidityScore * .13 + $soilScore * .12 + $forecastScore * .17;
        } else {
            $score = $temperatureScore * .38 + $rainfallScore * .34 + $humidityScore * .16 + $soilScore * .12;
        }

        $score = (int) round($this->clamp($score));
        $components = [
            'temperature' => (int) round($temperatureScore),
            'rainfall' => (int) round($rainfallScore),
            'humidity' => (int) round($humidityScore),
            'soil' => (int) round($soilScore),
            'near_term' => (int) round($forecastScore),
        ];

        [$strengths, $watchouts] = $this->explain($crop, $components, $metrics, $forecast, $soilType, $irrigation);

        return [
            'id' => $crop->id,
            'name' => $crop->name,
            'slug' => $crop->slug,
            'scientific_name' => $crop->scientific_name,
            'category' => $crop->category,
            'description' => $crop->description,
            'score' => $score,
            'rating' => $this->rating($score),
            'components' => $components,
            'strengths' => $strengths,
            'watchouts' => $watchouts,
            'cycle_days' => $crop->cycle_days,
            'water_need' => $crop->water_need,
            'soil_types' => $crop->soil_types,
            'planting_note' => $crop->planting_note,
            'requirements' => [
                'temperature' => [$crop->temp_opt_min, $crop->temp_opt_max],
                'monthly_rainfall' => [$crop->rainfall_opt_min, $crop->rainfall_opt_max],
                'humidity' => [$crop->humidity_min, $crop->humidity_max],
            ],
        ];
    }

    private function rangeScore(float $value, float $minimum, float $optimalMinimum, float $optimalMaximum, float $maximum): float
    {
        if ($value >= $optimalMinimum && $value <= $optimalMaximum) {
            return 100;
        }

        if ($value >= $minimum && $value < $optimalMinimum) {
            return 55 + 45 * (($value - $minimum) / max($optimalMinimum - $minimum, .1));
        }

        if ($value > $optimalMaximum && $value <= $maximum) {
            return 100 - 45 * (($value - $optimalMaximum) / max($maximum - $optimalMaximum, .1));
        }

        $distance = $value < $minimum ? $minimum - $value : $value - $maximum;

        return $this->clamp(55 - $distance * 7.5);
    }

    private function softRangeScore(float $value, float $minimum, float $maximum, float $penalty): float
    {
        if ($value >= $minimum && $value <= $maximum) {
            return 100;
        }

        $distance = $value < $minimum ? $minimum - $value : $value - $maximum;

        return $this->clamp(100 - $distance * $penalty);
    }

    private function effectiveRainfall(float $rainfall, Crop $crop, string $irrigation): float
    {
        return match ($irrigation) {
            'reliable' => max($rainfall, (float) $crop->rainfall_opt_min),
            'supplemental' => max($rainfall, (float) $crop->rainfall_min),
            default => $rainfall,
        };
    }

    /** @param array<string, mixed>|null $forecast */
    private function nearTermScore(Crop $crop, ?array $forecast, int $month, string $irrigation): float
    {
        if (! $forecast || $month !== now()->month) {
            return 75;
        }

        $summary = $forecast['summary'];
        $days = max((int) ($summary['days'] ?? 14), 1);
        $temperature = (((float) $summary['average_high']) + ((float) $summary['average_low'])) / 2;
        $projectedRainfall = ((float) $summary['rainfall_total']) * (30 / $days);
        $projectedRainfall = $this->effectiveRainfall($projectedRainfall, $crop, $irrigation);

        return $this->rangeScore($temperature, $crop->temp_min, $crop->temp_opt_min, $crop->temp_opt_max, $crop->temp_max) * .55
            + $this->rangeScore($projectedRainfall, $crop->rainfall_min, $crop->rainfall_opt_min, $crop->rainfall_opt_max, $crop->rainfall_max) * .45;
    }

    /**
     * @param  array<string, int>  $components
     * @param  array<string, float|int|null>  $metrics
     * @param  array<string, mixed>|null  $forecast
     * @return array{0: array<int, string>, 1: array<int, string>}
     */
    private function explain(Crop $crop, array $components, array $metrics, ?array $forecast, string $soilType, string $irrigation): array
    {
        $strengths = [];
        $watchouts = [];

        if ($components['temperature'] >= 85) {
            $strengths[] = 'Monthly temperatures sit in this crop’s preferred band.';
        } elseif ($components['temperature'] < 55) {
            $watchouts[] = $metrics['temperature'] < $crop->temp_min ? 'The month is likely too cool for reliable establishment.' : 'Heat stress could reduce establishment or flowering.';
        }

        if ($components['rainfall'] >= 85) {
            $strengths[] = $irrigation === 'none' ? 'Expected monthly rainfall is well aligned.' : 'Your water access closes the expected rainfall gap.';
        } elseif ($components['rainfall'] < 55) {
            $watchouts[] = $metrics['rainfall'] < $crop->rainfall_min ? 'Expected rain is below this crop’s normal requirement.' : 'Excess moisture and drainage may be a concern.';
        }

        if ($soilType !== 'unknown' && $components['soil'] >= 85) {
            $strengths[] = ucfirst($soilType).' soil is a good structural match.';
        } elseif ($soilType !== 'unknown' && $components['soil'] < 60) {
            $watchouts[] = 'The selected soil type is not an ideal match; improve structure or choose a better field.';
        }

        if ($forecast && ($forecast['summary']['heavy_rain_days'] ?? 0) > 0) {
            $watchouts[] = 'Heavy rain is possible in the next two weeks; protect drainage and delay field work on saturated soil.';
        }

        if ($strengths === []) {
            $strengths[] = 'This crop remains possible with careful field management.';
        }
        if ($watchouts === []) {
            $watchouts[] = 'No major climate mismatch detected; still confirm soil fertility and seed availability.';
        }

        return [array_slice($strengths, 0, 3), array_slice($watchouts, 0, 3)];
    }

    /** @param array<string, mixed>|null $forecast */
    private function fieldActions(array $metrics, ?array $forecast, string $soilType, string $irrigation): array
    {
        $actions = [];

        if ($soilType === 'unknown') {
            $actions[] = ['title' => 'Test the soil first', 'detail' => 'A pH and N-P-K test can materially change crop and fertiliser choices.', 'priority' => 'high'];
        }
        if ($metrics['rainfall'] < 40 && $irrigation === 'none') {
            $actions[] = ['title' => 'Plan for moisture stress', 'detail' => 'Prioritise drought-tolerant crops, mulch, and plant only after an effective soaking rain.', 'priority' => 'high'];
        }
        if ($forecast && ($forecast['summary']['heavy_rain_days'] ?? 0) > 0) {
            $actions[] = ['title' => 'Open drainage channels', 'detail' => 'The forecast contains at least one heavy-rain signal in the next 14 days.', 'priority' => 'medium'];
        }
        if ($metrics['et0'] !== null && $metrics['rainfall'] < ((float) $metrics['et0'] * 25)) {
            $actions[] = ['title' => 'Reduce evaporation losses', 'detail' => 'Use residue cover, minimum tillage, and early weed control to conserve water.', 'priority' => 'medium'];
        }
        $actions[] = ['title' => 'Confirm locally', 'detail' => 'Check seed variety, disease pressure, and the district planting calendar with an extension officer.', 'priority' => 'standard'];

        return array_slice($actions, 0, 4);
    }

    /** @param array<string, mixed>|null $forecast */
    private function confidence(?array $forecast, array $climate, string $soilType): array
    {
        $points = 0;
        $reasons = [];
        if (($climate['source_status'] ?? '') === 'historical') {
            $points += 2;
            $reasons[] = 'five years of location-specific climate history';
        } else {
            $points += 1;
            $reasons[] = 'long-term satellite climatology fallback';
        }
        if ($forecast) {
            $points += 2;
            $reasons[] = 'live 14-day forecast';
        }
        if ($soilType !== 'unknown') {
            $points += 1;
            $reasons[] = 'farmer-supplied soil type';
        } else {
            $reasons[] = 'soil type not supplied';
        }

        return [
            'level' => $points >= 5 ? 'high' : ($points >= 3 ? 'moderate' : 'limited'),
            'score' => $points,
            'out_of' => 5,
            'reasons' => $reasons,
        ];
    }

    private function rating(int $score): string
    {
        return match (true) {
            $score >= 82 => 'Excellent fit',
            $score >= 70 => 'Strong fit',
            $score >= 56 => 'Possible with care',
            default => 'Higher risk',
        };
    }

    private function seasonLabel(int $month, float $latitude, float $rainfall): string
    {
        $southern = $latitude < 0;
        $season = $southern
            ? match (true) {
                in_array($month, [12, 1, 2], true) => 'summer',
                in_array($month, [3, 4, 5], true) => 'autumn',
                in_array($month, [6, 7, 8], true) => 'winter',
                default => 'spring',
            }
        : match (true) {
            in_array($month, [12, 1, 2], true) => 'winter',
            in_array($month, [3, 4, 5], true) => 'spring',
            in_array($month, [6, 7, 8], true) => 'summer',
            default => 'autumn',
        };

        $moisture = $rainfall >= 90 ? 'wet' : ($rainfall >= 40 ? 'transition' : 'dry');

        return ucfirst($season).' · '.$moisture.' signal';
    }

    private function clamp(float $value, float $minimum = 0, float $maximum = 100): float
    {
        return max($minimum, min($maximum, $value));
    }
}
