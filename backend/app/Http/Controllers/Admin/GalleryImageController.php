<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GalleryImageRequest;
use App\Http\Resources\GalleryImageResource;
use App\Models\GalleryImage;
use App\Support\Audit;
use App\Support\ImageStorage;
use Illuminate\Http\Request;

class GalleryImageController extends Controller
{
    public function index(Request $request)
    {
        $galleryImages = GalleryImage::with('creator')
            ->orderBy('sort_order')
            ->orderBy('id')->paginate(10);

        if ($request->expectsJson()) {
            return response()->json([
                'gallery_images' => GalleryImageResource::collection(collect($galleryImages->items()))->resolve($request),
                'meta' => [
                    'current_page' => $galleryImages->currentPage(),
                    'last_page' => $galleryImages->lastPage(),
                    'per_page' => $galleryImages->perPage(),
                    'total' => $galleryImages->total(),
                ],
            ]);
        }

        return view('admin.gallery-images.index', compact('galleryImages'));
    }

    public function edit(Request $request, GalleryImage $galleryImage)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'gallery_image' => GalleryImageResource::make($galleryImage->loadMissing('creator'))->resolve($request),
            ]);
        }

        return view('admin.gallery-images.edit', compact('galleryImage'));
    }

    public function store(GalleryImageRequest $request)
    {
        $validated = $request->validated();
        $validated['created_by_user_id'] = $request->user()->id;
        $validated['is_active'] = $request->boolean('is_active');
        $validated = [
            ...$validated,
            ...$this->storeImage($request),
        ];

        $galleryImage = GalleryImage::create($validated);
        Audit::log($request, 'created gallery image', $galleryImage, $galleryImage->title);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Gallery image created successfully.',
                'gallery_image' => GalleryImageResource::make($galleryImage->loadMissing('creator'))->resolve($request),
            ], 201);
        }

        return redirect()->route('admin.gallery-images.index')->with('success', 'Gallery image created successfully.');
    }

    public function update(GalleryImageRequest $request, GalleryImage $galleryImage)
    {
        $validated = $request->validated();
        $validated['is_active'] = $request->boolean('is_active');

        $oldImagePath = $galleryImage->image_path;
        if ($request->hasFile('image')) {
            $validated = [
                ...$validated,
                ...$this->storeImage($request),
            ];
        }

        $galleryImage->update($validated);
        if ($request->hasFile('image')) {
            rescue(fn () => $this->deleteImage($oldImagePath), report: true);
        }
        Audit::log($request, 'updated gallery image', $galleryImage, $galleryImage->title);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Gallery image updated successfully.',
                'gallery_image' => GalleryImageResource::make($galleryImage->fresh()->loadMissing('creator'))->resolve($request),
            ]);
        }

        return redirect()->route('admin.gallery-images.index')->with('success', 'Gallery image updated successfully.');
    }

    public function destroy(Request $request, GalleryImage $galleryImage)
    {
        $title = $galleryImage->title;
        $this->deleteImage($galleryImage->image_path);
        $galleryImage->delete();
        Audit::log($request, 'deleted gallery image', $galleryImage, $title);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Gallery image deleted successfully.',
            ]);
        }

        return redirect()->route('admin.gallery-images.index')->with('success', 'Gallery image deleted successfully.');
    }

    public function image(GalleryImage $galleryImage)
    {
        abort_unless($galleryImage->image_path, 404);
        return ImageStorage::serve($galleryImage->image_path);
    }

    private function storeImage(GalleryImageRequest $request): array
    {
        $image = $request->file('image');
        $path = ImageStorage::store($image, 'gallery-images');

        return [
            'image_path' => $path,
            'image_filename' => $image->getClientOriginalName(),
            'image_size' => $image->getSize() ?: 0,
        ];
    }

    private function deleteImage(?string $path): void
    {
        ImageStorage::delete($path);
    }
}
