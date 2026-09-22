<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\GroupResource;
use App\Models\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groups = Group::where('is_active', true)->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => GroupResource::collection($groups)->resolve($request),
        ]);
    }
}
