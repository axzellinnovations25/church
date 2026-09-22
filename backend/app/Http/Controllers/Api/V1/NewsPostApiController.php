<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsPostResource;
use App\Models\NewsPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsPostApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $newsPosts = NewsPost::query()
            ->where('status', 'published')
            ->where(fn ($query) => $query->whereNull('published_at')->orWhereDate('published_at', '<=', now()->toDateString()))
            ->latest('published_at')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => NewsPostResource::collection($newsPosts)->resolve($request),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $newsPost = NewsPost::query()
            ->where('id', $id)
            ->where('status', 'published')
            ->where(fn ($query) => $query->whereNull('published_at')->orWhereDate('published_at', '<=', now()->toDateString()))
            ->first();

        if (! $newsPost) {
            return response()->json([
                'success' => false,
                'message' => 'News post not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => NewsPostResource::make($newsPost)->resolve($request),
        ]);
    }

    public function image(Request $request, int $id)
    {
        $newsPost = NewsPost::query()->find($id);

        abort_unless($newsPost && ($newsPost->status === 'published' || $request->user()), 404);
        abort_unless($newsPost->image_path, 404);

        $path = storage_path("app/private/{$newsPost->image_path}");
        abort_unless(is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'jpg', 'jpeg' => 'image/jpeg',
                'webp' => 'image/webp',
                default => 'image/png',
            },
        ]);
    }
}
