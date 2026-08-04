<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function __invoke(Request $request, LocationService $locations): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        try {
            return response()->json(['data' => $locations->search($validated['q'])]);
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Location search is temporarily unavailable. You can still use your device location.',
                'data' => [],
            ], 503);
        }
    }
}
