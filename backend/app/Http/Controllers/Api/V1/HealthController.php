<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    /**
     * Unauthenticated liveness probe for the API.
     *
     * Both the web and mobile clients call this to verify connectivity before
     * rendering any authenticated screen.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Request successful',
            'data' => [
                'status' => 'ok',
            ],
        ]);
    }
}
