<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryImageResource;
use App\Models\GalleryImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GalleryImageApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $galleryImages = GalleryImage::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => GalleryImageResource::collection($galleryImages)->resolve($request),
        ]);
    }

    public function image(Request $request, GalleryImage $galleryImage)
    {
        abort_unless($galleryImage->is_active || $request->user(), 404);
        abort_unless($galleryImage->image_path, 404);

        $path = storage_path("app/private/{$galleryImage->image_path}");
        abort_unless(is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
                'jpg', 'jpeg', 'jfif' => 'image/jpeg',
                'webp' => 'image/webp',
                default => 'image/png',
            },
        ]);
    }
}
