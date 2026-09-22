<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsPostRequest;
use App\Http\Resources\NewsPostResource;
use App\Models\NewsPost;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NewsPostController extends Controller
{
    public function index(Request $request)
    {
        $newsPosts = NewsPost::with('creator')
            ->latest('published_at')
            ->latest()
            ->paginate(10);

        if ($request->expectsJson()) {
            return response()->json([
                'news_posts' => NewsPostResource::collection(collect($newsPosts->items()))->resolve($request),
                'meta' => [
                    'current_page' => $newsPosts->currentPage(),
                    'last_page' => $newsPosts->lastPage(),
                    'per_page' => $newsPosts->perPage(),
                    'total' => $newsPosts->total(),
                ],
            ]);
        }

        return view('admin.news.index', compact('newsPosts'));
    }

    public function edit(Request $request, NewsPost $newsPost)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'news_post' => NewsPostResource::make($newsPost->loadMissing('creator'))->resolve($request),
            ]);
        }

        return view('admin.news.edit', compact('newsPost'));
    }

    public function store(NewsPostRequest $request)
    {
        $validated = $request->validated();
        $validated['created_by_user_id'] = $request->user()->id;
        $validated['image_path'] = $request->hasFile('image') ? $this->storeImage($request) : null;

        $newsPost = NewsPost::create($validated);
        Audit::log($request, 'created news post', $newsPost, $newsPost->title);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'News post created successfully.',
                'news_post' => NewsPostResource::make($newsPost->loadMissing('creator'))->resolve($request),
            ], 201);
        }

        return redirect()->route('admin.news.index')->with('success', 'News post created successfully.');
    }

    public function update(NewsPostRequest $request, NewsPost $newsPost)
    {
        $validated = $request->validated();

        if ($request->boolean('remove_image') && $newsPost->image_path) {
            $this->deleteImage($newsPost->image_path);
            $validated['image_path'] = null;
        }

        if ($request->hasFile('image')) {
            $this->deleteImage($newsPost->image_path);
            $validated['image_path'] = $this->storeImage($request);
        }

        $newsPost->update($validated);
        Audit::log($request, 'updated news post', $newsPost, $newsPost->title);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'News post updated successfully.',
                'news_post' => NewsPostResource::make($newsPost->fresh()->loadMissing('creator'))->resolve($request),
            ]);
        }

        return redirect()->route('admin.news.index')->with('success', 'News post updated successfully.');
    }

    public function destroy(Request $request, NewsPost $newsPost)
    {
        $newsTitle = $newsPost->title;
        $this->deleteImage($newsPost->image_path);
        $newsPost->delete();
        Audit::log($request, 'deleted news post', $newsPost, $newsTitle);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'News post deleted successfully.',
            ]);
        }

        return redirect()->route('admin.news.index')->with('success', 'News post deleted successfully.');
    }

    private function storeImage(NewsPostRequest $request): string
    {
        $image = $request->file('image');
        $extension = strtolower($image->getClientOriginalExtension() ?: 'jpg');
        $filename = now()->format('YmdHis').'-'.Str::uuid().'.'.$extension;
        $path = "news/{$filename}";
        $directory = storage_path('app/private/news');

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        copy($image->getRealPath(), storage_path("app/private/{$path}"));

        return $path;
    }

    private function deleteImage(?string $path): void
    {
        if (! $path) {
            return;
        }

        $fullPath = storage_path("app/private/{$path}");

        if (is_file($fullPath)) {
            unlink($fullPath);
        }
    }
}
