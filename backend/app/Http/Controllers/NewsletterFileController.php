<?php

namespace App\Http\Controllers;

use App\Models\Newsletter;
use Illuminate\Support\Facades\Auth;

class NewsletterFileController extends Controller
{
    public function view(Newsletter $newsletter)
    {
        Newsletter::publishDueDrafts();
        $newsletter->refresh();

        abort_unless(($newsletter->status === 'published' && ! $newsletter->is_future) || Auth::user()?->is_main_admin, 404);
        $path = storage_path("app/private/{$newsletter->file_path}");

        if (is_file($path)) {
            return response()->file($path, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$newsletter->original_filename.'"',
            ]);
        }

        $contents = $newsletter->pdfContents();
        abort_unless($contents !== null, 404);

        return response($contents, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$newsletter->original_filename.'"',
        ]);
    }

    public function download(Newsletter $newsletter)
    {
        Newsletter::publishDueDrafts();
        $newsletter->refresh();

        abort_unless(($newsletter->status === 'published' && ! $newsletter->is_future) || Auth::user()?->is_main_admin, 404);
        $path = storage_path("app/private/{$newsletter->file_path}");

        if (is_file($path)) {
            return response()->download($path, $newsletter->original_filename, [
                'Content-Type' => 'application/pdf',
            ]);
        }

        $contents = $newsletter->pdfContents();
        abort_unless($contents !== null, 404);

        return response()->streamDownload(static function () use ($contents): void {
            echo $contents;
        }, $newsletter->original_filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
