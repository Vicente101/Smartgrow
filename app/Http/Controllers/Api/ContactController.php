<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ContactRequest;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;

class ContactController extends Controller
{
    public function __invoke(ContactRequest $request): JsonResponse
    {
        ContactMessage::query()->create($request->safe()->except('website'));

        return response()->json([
            'message' => 'Thank you. Your message has been received and we will respond soon.',
        ], 201);
    }
}
