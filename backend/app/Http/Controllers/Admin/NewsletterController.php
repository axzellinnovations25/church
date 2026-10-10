<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterRequest;
use App\Http\Resources\NewsletterResource;
use App\Models\Newsletter;
use App\Support\SupabaseStorage;
use Illuminate\Http\Request;
use App\Support\Audit;
use Illuminate\Support\Facades\DB;
use Throwable;

class NewsletterController extends Controller
{
    public function index(Request $request)
    {
        Newsletter::publishDueDrafts();

        $newsletters = Newsletter::select([
            'id', 'title', 'publication_date', 'description', 'file_path',
            'original_filename', 'file_size', 'status', 'created_at', 'updated_at',
        ])->orderBy('publication_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->orderBy('id')->paginate(10);

        if ($request->expectsJson()) {
            return response()->json([
                'newsletters' => NewsletterResource::collection(collect($newsletters->items()))->resolve($request),
                'meta' => [
                    'current_page' => $newsletters->currentPage(),
                    'last_page' => $newsletters->lastPage(),
                    'per_page' => $newsletters->perPage(),
                    'total' => $newsletters->total(),
                ],
            ]);
        }

        return view('dashboard');
    }

    public function store(NewsletterRequest $request)
    {
        $validated = $request->validated();
        $fileData = $this->storePdf($request);

        try {
            $newsletter = DB::transaction(function () use ($request, $validated, $fileData) {
                $newsletter = Newsletter::create([
                    'title' => $validated['title'],
                    'publication_date' => $validated['publication_date'],
                    'description' => $validated['description'] ?? null,
                    'status' => $validated['status'],
                    ...$fileData,
                ]);

                Audit::log($request, 'created newsletter', $newsletter, $newsletter->title);

                return $newsletter;
            });
        } catch (Throwable $exception) {
            $this->deletePdf($fileData['file_path']);
            throw $exception;
        }

        return response()->json([
            'message' => 'Newsletter saved successfully.',
            'newsletter' => NewsletterResource::make($newsletter)->resolve($request),
        ], 201);
    }

    public function edit(Request $request, Newsletter $newsletter)
    {
        return response()->json([
            'newsletter' => NewsletterResource::make($newsletter)->resolve($request),
        ]);
    }

    public function update(NewsletterRequest $request, Newsletter $newsletter)
    {
        $validated = $request->validated();

        $data = [
            'title' => $validated['title'],
            'publication_date' => $validated['publication_date'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
        ];

        $oldPath = $newsletter->file_path;
        $replacementPath = null;

        if ($request->hasFile('pdf')) {
            $fileData = $this->storePdf($request);
            $replacementPath = $fileData['file_path'];
            $data = [
                ...$data,
                ...$fileData,
            ];
        }

        try {
            DB::transaction(function () use ($request, $newsletter, $data): void {
                $newsletter->update($data);
                Audit::log($request, 'updated newsletter', $newsletter, $newsletter->title);
            });
        } catch (Throwable $exception) {
            if ($replacementPath) {
                $this->deletePdf($replacementPath);
            }
            throw $exception;
        }

        if ($replacementPath && $oldPath !== $replacementPath) {
            $this->deletePdf($oldPath);
        }

        return response()->json([
            'message' => 'Newsletter updated successfully.',
            'newsletter' => NewsletterResource::make($newsletter->fresh())->resolve($request),
        ]);
    }

    public function destroy(Request $request, Newsletter $newsletter)
    {
        $filePath = $newsletter->file_path;
        DB::transaction(function () use ($request, $newsletter): void {
            $newsletter->delete();
            Audit::log($request, 'deleted newsletter', $newsletter, $newsletter->title);
        });
        $this->deletePdf($filePath);

        return response()->json([
            'message' => 'Newsletter deleted successfully.',
        ]);
    }

    private function storePdf(NewsletterRequest $request): array
    {
        $file = $request->file('pdf');
        $path = SupabaseStorage::store($file, 'newsletters');

        return [
            'file_path' => $path,
            'file_contents' => null,
            'original_filename' => $file->getClientOriginalName(),
            'file_size' => $file->getSize() ?: 0,
        ];
    }

    private function deletePdf(?string $path): void
    {
        if (! $path) {
            return;
        }

        SupabaseStorage::delete($path);
    }
}
