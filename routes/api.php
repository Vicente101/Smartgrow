<?php

use App\Http\Controllers\Api\AdviceController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\NewsController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:90,1')->group(function () {
    Route::get('/locations', LocationController::class);
    Route::post('/advice', AdviceController::class)->middleware('throttle:20,1');
    Route::get('/news', NewsController::class)->middleware('throttle:30,1');
});

Route::post('/contact', ContactController::class)->middleware('throttle:5,1');
