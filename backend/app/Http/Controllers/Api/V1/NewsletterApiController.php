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
