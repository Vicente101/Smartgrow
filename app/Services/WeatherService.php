<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class WeatherService
{
    /** @return array<string, mixed> */
    public function forecast(float $latitude, float $longitude): array
    {
        $cacheKey = 'forecast:'.$this->coordinateKey($latitude, $longitude);

        return Cache::remember($cacheKey, now()->addMinutes(45), function () use ($latitude, $longitude) {
            $response = Http::acceptJson()
                ->timeout(12)
                ->retry(2, 250)
                ->get(config('services.crop_intelligence.open_meteo_forecast_url'), [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'timezone' => 'auto',
                    'forecast_days' => 14,
                    'current' => implode(',', [
                        'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
                        'precipitation', 'weather_code', 'wind_speed_10m', 'soil_temperature_6cm',
                        'soil_moisture_9_to_27cm',
                    ]),
                    'daily' => implode(',', [
                        'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
                        'precipitation_probability_max', 'wind_speed_10m_max', 'et0_fao_evapotranspiration',
                        'sunshine_duration',
                    ]),
                ])
                ->throw();

            $data = $response->json();
            $current = $data['current'] ?? [];
            $daily = $data['daily'] ?? [];

            if (empty($current) || empty($daily['time'])) {
                throw new RuntimeException('The weather provider returned an incomplete forecast.');
            }

            $days = collect($daily['time'])->map(function (string $date, int $index) use ($daily) {
                $code = (int) ($daily['weather_code'][$index] ?? 0);

                return [
                    'date' => $date,
                    'weather_code' => $code,
                    'condition' => $this->condition($code),
                    'temp_max' => round((float) ($daily['temperature_2m_max'][$index] ?? 0), 1),
                    'temp_min' => round((float) ($daily['temperature_2m_min'][$index] ?? 0), 1),
                    'rainfall' => round((float) ($daily['precipitation_sum'][$index] ?? 0), 1),
                    'rain_chance' => (int) ($daily['precipitation_probability_max'][$index] ?? 0),
                    'wind_max' => round((float) ($daily['wind_speed_10m_max'][$index] ?? 0), 1),
                    'et0' => round((float) ($daily['et0_fao_evapotranspiration'][$index] ?? 0), 1),
                    'sunshine_hours' => round(((float) ($daily['sunshine_duration'][$index] ?? 0)) / 3600, 1),
                ];
            })->all();

            $code = (int) ($current['weather_code'] ?? 0);

            return [
                'source' => 'Open-Meteo',
                'source_status' => 'live',
                'timezone' => $data['timezone'] ?? 'UTC',
                'updated_at' => $current['time'] ?? now()->toIso8601String(),
                'current' => [
                    'temperature' => round((float) ($current['temperature_2m'] ?? 0), 1),
                    'feels_like' => round((float) ($current['apparent_temperature'] ?? 0), 1),
                    'humidity' => (int) ($current['relative_humidity_2m'] ?? 0),
                    'wind_speed' => round((float) ($current['wind_speed_10m'] ?? 0), 1),
                    'precipitation' => round((float) ($current['precipitation'] ?? 0), 1),
                    'soil_temperature' => isset($current['soil_temperature_6cm']) ? round((float) $current['soil_temperature_6cm'], 1) : null,
                    'soil_moisture' => isset($current['soil_moisture_9_to_27cm']) ? round((float) $current['soil_moisture_9_to_27cm'], 3) : null,
                    'weather_code' => $code,
                    'condition' => $this->condition($code),
                    'is_day' => (bool) ($current['is_day'] ?? true),
                ],
                'daily' => $days,
                'summary' => $this->forecastSummary($days),
            ];
        });
    }

    /** @return array<string, mixed> */
    public function climate(float $latitude, float $longitude): array
    {
        $cacheKey = 'climate:'.$this->coordinateKey($latitude, $longitude).':'.now()->year;

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($latitude, $longitude) {
            try {
                return $this->openMeteoClimate($latitude, $longitude);
            } catch (\Throwable) {
                return $this->nasaClimate($latitude, $longitude);
            }
        });
    }

    /** @return array<string, mixed> */
    private function openMeteoClimate(float $latitude, float $longitude): array
    {
        $end = CarbonImmutable::now()->startOfYear()->subDay();
        $start = $end->startOfYear()->subYears(4);

        $response = Http::acceptJson()
            ->timeout(20)
            ->retry(2, 350)
            ->get(config('services.crop_intelligence.open_meteo_archive_url'), [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'timezone' => 'auto',
                'daily' => implode(',', [
                    'temperature_2m_mean', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
                    'relative_humidity_2m_mean', 'wind_speed_10m_max', 'et0_fao_evapotranspiration',
                ]),
            ])
            ->throw();

        $daily = $response->json('daily', []);
        if (empty($daily['time'])) {
            throw new RuntimeException('No historical climate records were returned.');
        }

        $yearMonths = [];
        foreach ($daily['time'] as $index => $date) {
            $day = CarbonImmutable::parse($date);
            $bucket = $day->format('Y-m');
            $rain = (float) ($daily['precipitation_sum'][$index] ?? 0);
            $yearMonths[$bucket]['month'] = $day->month;
            $yearMonths[$bucket]['temperature'][] = (float) ($daily['temperature_2m_mean'][$index] ?? 0);
            $yearMonths[$bucket]['temp_max'][] = (float) ($daily['temperature_2m_max'][$index] ?? 0);
            $yearMonths[$bucket]['temp_min'][] = (float) ($daily['temperature_2m_min'][$index] ?? 0);
            $yearMonths[$bucket]['humidity'][] = (float) ($daily['relative_humidity_2m_mean'][$index] ?? 0);
            $yearMonths[$bucket]['wind'][] = (float) ($daily['wind_speed_10m_max'][$index] ?? 0);
            $yearMonths[$bucket]['et0'][] = (float) ($daily['et0_fao_evapotranspiration'][$index] ?? 0);
            $yearMonths[$bucket]['rainfall'] = ($yearMonths[$bucket]['rainfall'] ?? 0) + $rain;
            $yearMonths[$bucket]['rain_days'] = ($yearMonths[$bucket]['rain_days'] ?? 0) + ($rain >= 1 ? 1 : 0);
        }

        $months = [];
        for ($month = 1; $month <= 12; $month++) {
            $buckets = array_values(array_filter($yearMonths, fn (array $item) => $item['month'] === $month));
            $months[] = $this->aggregateMonth($month, $buckets);
        }

        return [
            'source' => 'Open-Meteo ERA5',
            'source_status' => 'historical',
            'period' => $start->year.'–'.$end->year,
            'years' => 5,
            'months' => $months,
        ];
    }

    /** @return array<string, mixed> */
    private function nasaClimate(float $latitude, float $longitude): array
    {
        $response = Http::acceptJson()
            ->timeout(20)
            ->retry(2, 350)
            ->get(config('services.crop_intelligence.nasa_power_url'), [
                'parameters' => 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS10M',
                'community' => 'AG',
                'longitude' => $longitude,
                'latitude' => $latitude,
                'format' => 'JSON',
            ])
            ->throw();

        $parameters = $response->json('properties.parameter', []);
        if (empty($parameters['T2M'])) {
            throw new RuntimeException('Climate baselines are temporarily unavailable.');
        }

        $labels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        $months = [];
        foreach ($labels as $index => $label) {
            $month = $index + 1;
            $rainPerDay = $this->powerValue($parameters, 'PRECTOTCORR', $label);
            $months[] = [
                'month' => $month,
                'label' => CarbonImmutable::create(2024, $month, 1)->format('F'),
                'temperature' => $this->powerValue($parameters, 'T2M', $label),
                'temp_max' => $this->powerValue($parameters, 'T2M_MAX', $label),
                'temp_min' => $this->powerValue($parameters, 'T2M_MIN', $label),
                'rainfall' => round($rainPerDay * CarbonImmutable::create(2024, $month, 1)->daysInMonth, 1),
                'rain_days' => null,
                'humidity' => $this->powerValue($parameters, 'RH2M', $label),
                'wind' => $this->powerValue($parameters, 'WS10M', $label),
                'et0' => null,
            ];
        }

        return [
            'source' => 'NASA POWER',
            'source_status' => 'climatology_fallback',
            'period' => 'long-term climatology',
            'years' => null,
            'months' => $months,
        ];
    }

    /** @param array<int, array<string, mixed>> $buckets */
    private function aggregateMonth(int $month, array $buckets): array
    {
        $average = function (string $key) use ($buckets): ?float {
            $values = [];
            foreach ($buckets as $bucket) {
                if (is_array($bucket[$key] ?? null)) {
                    $values[] = array_sum($bucket[$key]) / max(count($bucket[$key]), 1);
                } elseif (isset($bucket[$key])) {
                    $values[] = (float) $bucket[$key];
                }
            }

            return $values === [] ? null : round(array_sum($values) / count($values), 1);
        };

        return [
            'month' => $month,
            'label' => CarbonImmutable::create(2024, $month, 1)->format('F'),
            'temperature' => $average('temperature'),
            'temp_max' => $average('temp_max'),
            'temp_min' => $average('temp_min'),
            'rainfall' => $average('rainfall'),
            'rain_days' => $average('rain_days'),
            'humidity' => $average('humidity'),
            'wind' => $average('wind'),
            'et0' => $average('et0'),
        ];
    }

    /** @param array<string, mixed> $parameters */
    private function powerValue(array $parameters, string $parameter, string $month): float
    {
        $value = (float) ($parameters[$parameter][$month] ?? 0);

        return $value <= -900 ? 0 : round($value, 1);
    }

    /** @param array<int, array<string, mixed>> $days */
    private function forecastSummary(array $days): array
    {
        $rainfall = array_sum(array_column($days, 'rainfall'));
        $averageMax = collect($days)->avg('temp_max');
        $averageMin = collect($days)->avg('temp_min');

        return [
            'days' => count($days),
            'rainfall_total' => round($rainfall, 1),
            'average_high' => round((float) $averageMax, 1),
            'average_low' => round((float) $averageMin, 1),
            'rain_days' => count(array_filter($days, fn (array $day) => $day['rainfall'] >= 1)),
            'heavy_rain_days' => count(array_filter($days, fn (array $day) => $day['rainfall'] >= 35)),
        ];
    }

    private function condition(int $code): string
    {
        return match (true) {
            $code === 0 => 'Clear',
            in_array($code, [1, 2], true) => 'Partly cloudy',
            $code === 3 => 'Overcast',
            in_array($code, [45, 48], true) => 'Foggy',
            in_array($code, [51, 53, 55, 56, 57], true) => 'Drizzle',
            in_array($code, [61, 63, 65, 66, 67, 80, 81, 82], true) => 'Rain',
            in_array($code, [71, 73, 75, 77, 85, 86], true) => 'Snow',
            in_array($code, [95, 96, 99], true) => 'Thunderstorm',
            default => 'Variable conditions',
        };
    }

    private function coordinateKey(float $latitude, float $longitude): string
    {
        return number_format($latitude, 2, '.', '').':'.number_format($longitude, 2, '.', '');
    }
}
