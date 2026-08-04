<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AgricultureNewsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsController extends Controller
{
    public function __invoke(Request $request, AgricultureNewsService $news): JsonResponse
    {
        $validated = $request->validate([
            'location' => ['nullable', 'string', 'min:2', 'max:100'],
            'country' => ['nullable', 'string', 'min:2', 'max:100'],
        ]);

        return response()->json([
            'data' => $news->forLocation($validated['location'] ?? 'Zambia', $validated['country'] ?? null),
        ]);
    }
}
