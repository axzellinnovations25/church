<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ParishCouncilMemberResource;
use App\Models\ParishCouncilMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ParishCouncilMemberApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $members = ParishCouncilMember::where('is_active', true)
            ->orderByRaw('CASE WHEN sort_order <= 0 THEN 1 ELSE 0 END')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ParishCouncilMemberResource::collection($members)->resolve($request),
        ]);
    }

    public function photo(ParishCouncilMember $parishCouncilMember)
    {
        abort_unless($parishCouncilMember->is_active, 404);

        $path = storage_path("app/private/{$parishCouncilMember->photo_path}");
        abort_unless($parishCouncilMember->photo_path && is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                default => 'image/png',
            },
        ]);
    }
}
