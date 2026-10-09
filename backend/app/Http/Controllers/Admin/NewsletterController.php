<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\NewsletterRequest;
use App\Http\Resources\NewsletterResource;
use App\Models\Newsletter;
use Illuminate\Http\Request;
use App\Support\Audit;
use Illuminate\Support\Str;

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

        $newsletter = Newsletter::create([
            'title' => $validated['title'],
            'publication_date' => $validated['publication_date'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            ...$fileData,
        ]);

        Audit::log($request, 'created newsletter', $newsletter, $newsletter->title);

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

        if ($request->hasFile('pdf')) {
            $this->deletePdf($newsletter->file_path);
            $data = [
                ...$data,
                ...$this->storePdf($request),
            ];
        }

        $newsletter->update($data);

        Audit::log($request, 'updated newsletter', $newsletter, $newsletter->title);

        return response()->json([
            'message' => 'Newsletter updated successfully.',
            'newsletter' => NewsletterResource::make($newsletter->fresh())->resolve($request),
        ]);
    }

    public function destroy(Request $request, Newsletter $newsletter)
    {
        $this->deletePdf($newsletter->file_path);
        $newsletter->delete();

        Audit::log($request, 'deleted newsletter', $newsletter, $newsletter->title);

        return response()->json([
            'message' => 'Newsletter deleted successfully.',
        ]);
    }

    private function storePdf(NewsletterRequest $request): array
    {
        $file = $request->file('pdf');
        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            abort(422, 'The newsletter PDF could not be read.');
        }

        $filename = now()->format('YmdHis').'-'.Str::uuid().'.pdf';
        $path = "newsletters/{$filename}";
        $directory = storage_path('app/private/newsletters');

        if (! is_dir($directory)) {
            @mkdir($directory, 0755, true);
        }

        if (is_dir($directory) && is_writable($directory)) {
            @copy($file->getRealPath(), storage_path("app/private/{$path}"));
        }

        return [
            'file_path' => $path,
            'file_contents' => base64_encode($contents),
            'original_filename' => $file->getClientOriginalName(),
            'file_size' => $file->getSize() ?: 0,
        ];
    }

    private function deletePdf(?string $path): void
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
