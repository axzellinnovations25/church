<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsletterResource;
use App\Models\Newsletter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NewsletterApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        Newsletter::publishDueDrafts();

        $newsletters = Newsletter::publiclyPublished()
            ->select([
                'id', 'title', 'publication_date', 'description', 'file_path',
                'original_filename', 'file_size', 'status', 'created_at', 'updated_at',
            ])
            ->selectRaw('CASE WHEN file_contents IS NULL THEN 0 ELSE 1 END AS has_file_contents')
            ->orderBy('publication_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(fn (Newsletter $newsletter) => $newsletter->pdfExists())
            ->values();

        return response()->json([
            'success' => true,
            'data' => NewsletterResource::collection($newsletters)->resolve($request),
        ]);
    }
}
