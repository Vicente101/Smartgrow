<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class LocationService
{
    /** @return array<int, array<string, mixed>> */
    public function search(string $query, int $limit = 6): array
    {
        $query = trim($query);
        $cacheKey = 'locations:'.sha1(mb_strtolower($query)).':'.$limit;

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($query, $limit) {
            $response = Http::acceptJson()
                ->timeout(10)
                ->retry(2, 200)
                ->get(config('services.crop_intelligence.open_meteo_geocoding_url').'/search', [
                    'name' => $query,
                    'count' => $limit,
                    'language' => 'en',
                    'format' => 'json',
                ])
                ->throw();

            return collect($response->json('results', []))
                ->map(fn (array $item) => $this->normalise($item))
                ->values()
                ->all();
        });
    }

    /** @return array<string, mixed> */
    public function reverse(float $latitude, float $longitude): array
    {
        $cacheKey = 'reverse:'.$this->coordinateKey($latitude, $longitude);

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($latitude, $longitude) {
            $response = Http::acceptJson()
                ->withHeaders(['User-Agent' => config('app.name').'/1.0 ('.config('app.url').')'])
                ->timeout(10)
                ->retry(2, 250)
                ->get(config('services.crop_intelligence.nominatim_url').'/reverse', [
                    'lat' => $latitude,
                    'lon' => $longitude,
                    'format' => 'jsonv2',
                    'zoom' => 10,
                    'addressdetails' => 1,
                ])
                ->throw();

            $address = $response->json('address', []);
            $name = $address['city'] ?? $address['town'] ?? $address['village'] ?? $address['county'] ?? 'Current location';

            return [
                'name' => $name,
                'admin1' => $address['state'] ?? $address['region'] ?? null,
                'country' => $address['country'] ?? null,
                'country_code' => strtoupper($address['country_code'] ?? ''),
                'latitude' => round($latitude, 5),
                'longitude' => round($longitude, 5),
                'timezone' => null,
                'label' => implode(', ', array_filter([$name, $address['state'] ?? null, $address['country'] ?? null])),
            ];
        });
    }

    /** @return array<string, mixed> */
    public function resolve(?string $query, ?float $latitude, ?float $longitude): array
    {
        if ($latitude !== null && $longitude !== null) {
            try {
                return $this->reverse($latitude, $longitude);
            } catch (\Throwable) {
                return [
                    'name' => $query ?: 'Current location',
                    'admin1' => null,
                    'country' => null,
                    'country_code' => null,
                    'latitude' => round($latitude, 5),
                    'longitude' => round($longitude, 5),
                    'timezone' => null,
                    'label' => $query ?: 'Current location',
                ];
            }
        }

        $result = $this->search((string) $query, 1)[0] ?? null;

        if (! $result) {
            throw new RuntimeException('We could not find that location. Try a nearby town or district.');
        }

        return $result;
    }

    /** @return array<string, mixed> */
    private function normalise(array $item): array
    {
        $label = implode(', ', array_unique(array_filter([
            $item['name'] ?? null,
            $item['admin1'] ?? null,
            $item['country'] ?? null,
        ])));

        return [
            'name' => $item['name'] ?? 'Unknown location',
            'admin1' => $item['admin1'] ?? null,
            'country' => $item['country'] ?? null,
            'country_code' => strtoupper($item['country_code'] ?? ''),
            'latitude' => (float) ($item['latitude'] ?? 0),
            'longitude' => (float) ($item['longitude'] ?? 0),
            'timezone' => $item['timezone'] ?? null,
            'label' => $label,
        ];
    }

    private function coordinateKey(float $latitude, float $longitude): string
    {
        return number_format($latitude, 2, '.', '').':'.number_format($longitude, 2, '.', '');
    }
}
