<?php

namespace Tests\Feature;

use Database\Seeders\CropSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AdviceApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CropSeeder::class);
        Cache::flush();
        Http::preventStrayRequests();
    }

    public function test_it_returns_ranked_explainable_crop_advice(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                'address' => ['city' => 'Ndola', 'state' => 'Copperbelt Province', 'country' => 'Zambia', 'country_code' => 'zm'],
            ]),
            'api.open-meteo.com/*' => Http::response($this->forecastPayload()),
            'archive-api.open-meteo.com/*' => Http::response($this->archivePayload()),
        ]);

        $response = $this->postJson('/api/advice', [
            'latitude' => -12.968,
            'longitude' => 28.633,
            'month' => 12,
            'soil_type' => 'loamy',
            'irrigation' => 'supplemental',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.location.country', 'Zambia')
            ->assertJsonPath('data.planting_month.name', 'December')
            ->assertJsonPath('data.methodology.type', 'explainable weighted scoring')
            ->assertJsonCount(8, 'data.recommendations')
            ->assertJsonStructure([
                'data' => [
                    'weather' => ['current', 'daily', 'summary'],
                    'climate' => ['months', 'selected_month'],
                    'recommendations' => [['name', 'score', 'rating', 'components', 'strengths', 'watchouts']],
                    'field_actions', 'confidence', 'methodology',
                ],
            ]);

        $scores = collect($response->json('data.recommendations'))->pluck('score')->all();
        $this->assertSame($scores, collect($scores)->sortDesc()->values()->all());
    }

    public function test_it_validates_a_missing_location(): void
    {
        $this->postJson('/api/advice', ['month' => 13])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['location', 'month']);
    }

    /** @return array<string, mixed> */
    private function forecastPayload(): array
    {
        $dates = collect(range(0, 13))->map(fn (int $offset) => now()->addDays($offset)->toDateString())->all();

        return [
            'timezone' => 'Africa/Lusaka',
            'current' => [
                'time' => now()->toIso8601String(),
                'temperature_2m' => 26.5,
                'relative_humidity_2m' => 68,
                'apparent_temperature' => 27.1,
                'is_day' => 1,
                'precipitation' => 0,
                'weather_code' => 2,
                'wind_speed_10m' => 8.2,
                'soil_temperature_6cm' => 25.1,
                'soil_moisture_9_to_27cm' => .31,
            ],
            'daily' => [
                'time' => $dates,
                'weather_code' => array_fill(0, 14, 61),
                'temperature_2m_max' => array_fill(0, 14, 29.5),
                'temperature_2m_min' => array_fill(0, 14, 19.2),
                'precipitation_sum' => array_fill(0, 14, 5.8),
                'precipitation_probability_max' => array_fill(0, 14, 72),
                'wind_speed_10m_max' => array_fill(0, 14, 17.2),
                'et0_fao_evapotranspiration' => array_fill(0, 14, 3.7),
                'sunshine_duration' => array_fill(0, 14, 25200),
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function archivePayload(): array
    {
        $time = [];
        $temperature = [];
        $maximum = [];
        $minimum = [];
        $rainfall = [];
        $humidity = [];
        $wind = [];
        $et0 = [];

        foreach (range(2021, 2025) as $year) {
            foreach (range(1, 12) as $month) {
                foreach ([5, 15, 25] as $day) {
                    $time[] = sprintf('%d-%02d-%02d', $year, $month, $day);
                    $wetSeason = in_array($month, [11, 12, 1, 2, 3], true);
                    $temperature[] = $wetSeason ? 25 : 20;
                    $maximum[] = $wetSeason ? 30 : 26;
                    $minimum[] = $wetSeason ? 20 : 14;
                    $rainfall[] = $wetSeason ? 42 : 2;
                    $humidity[] = $wetSeason ? 72 : 52;
                    $wind[] = 14;
                    $et0[] = 3.5;
                }
            }
        }

        return ['daily' => [
            'time' => $time,
            'temperature_2m_mean' => $temperature,
            'temperature_2m_max' => $maximum,
            'temperature_2m_min' => $minimum,
            'precipitation_sum' => $rainfall,
            'relative_humidity_2m_mean' => $humidity,
            'wind_speed_10m_max' => $wind,
            'et0_fao_evapotranspiration' => $et0,
        ]];
    }
}
