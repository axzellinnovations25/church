<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\GalleryImageResource;
use App\Models\GalleryImage;
use App\Support\ImageStorage;
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
        abort_unless($galleryImage->is_active || $request->user()?->is_main_admin, 404);
        abort_unless($galleryImage->image_path, 404);

        return ImageStorage::serve($galleryImage->image_path, $galleryImage->is_active);
    }
}
