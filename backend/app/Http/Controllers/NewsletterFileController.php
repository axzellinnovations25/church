<?php

namespace App\Http\Controllers;

use App\Models\Newsletter;

class NewsletterFileController extends Controller
{
    public function view(Newsletter $newsletter)
    {
        Newsletter::publishDueDrafts();
        $newsletter->refresh();

        abort_unless(($newsletter->status === 'published' && ! $newsletter->is_future) || auth()->check(), 404);
        $path = storage_path("app/private/{$newsletter->file_path}");
        abort_unless(is_file($path), 404);

        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$newsletter->original_filename.'"',
        ]);
    }

    public function download(Newsletter $newsletter)
    {
        Newsletter::publishDueDrafts();
        $newsletter->refresh();

        abort_unless(($newsletter->status === 'published' && ! $newsletter->is_future) || auth()->check(), 404);
        $path = storage_path("app/private/{$newsletter->file_path}");
        abort_unless(is_file($path), 404);

        return response()->download($path, $newsletter->original_filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
