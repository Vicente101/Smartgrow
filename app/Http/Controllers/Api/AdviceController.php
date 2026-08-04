<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdviceRequest;
use App\Services\CropRecommendationService;
use App\Services\LocationService;
use App\Services\WeatherService;
use Illuminate\Http\JsonResponse;

class AdviceController extends Controller
{
    public function __invoke(
        AdviceRequest $request,
        LocationService $locations,
        WeatherService $weather,
        CropRecommendationService $recommendations,
    ): JsonResponse {
        $input = $request->validated();

        try {
            $location = $locations->resolve(
                $input['location'] ?? null,
                isset($input['latitude']) ? (float) $input['latitude'] : null,
                isset($input['longitude']) ? (float) $input['longitude'] : null,
            );
        } catch (\Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $forecast = null;
        try {
            $forecast = $weather->forecast($location['latitude'], $location['longitude']);
        } catch (\Throwable) {
            // Historical climate can still produce a useful, lower-confidence result.
        }

        try {
            $climate = $weather->climate($location['latitude'], $location['longitude']);
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Climate services are temporarily unavailable. Please try again shortly.',
            ], 503);
        }

        $analysis = $recommendations->analyse(
            $location,
            $forecast,
            $climate,
            (int) ($input['month'] ?? now()->month),
            $input['soil_type'] ?? 'unknown',
            $input['irrigation'] ?? 'none',
        );

        return response()->json(['data' => $analysis]);
    }
}
