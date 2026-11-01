<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All endpoints are versioned under /api/v1. Every endpoint added from this
| point on belongs to a version group; unversioned API routes must not exist.
|
| Authentication uses Laravel Sanctum bearer tokens. Conventions for request
| payloads, the response envelope, pagination and error handling are defined
| in docs/api/api-conventions.md.
|
*/

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('health', HealthController::class)->name('health');
});
