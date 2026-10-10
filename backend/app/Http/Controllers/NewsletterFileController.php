<?php

namespace App\Http\Controllers;

use App\Models\Newsletter;
use App\Support\SupabaseStorage;
use Illuminate\Support\Facades\Auth;

class NewsletterFileController extends Controller
{
    public function view(Newsletter $newsletter)
    {
        Newsletter::publishDueDrafts();
        $newsletter->refresh();

        $isPublic = $newsletter->status === 'published' && ! $newsletter->is_future;
        abort_unless($isPublic || Auth::user()?->is_main_admin, 404);
        abort_unless($newsletter->file_path, 404);

        return SupabaseStorage::serve($newsletter->file_path, $isPublic, $newsletter->original_filename);
    }

    public function download(Newsletter $newsletter)
    {
        Newsletter::publishDueDrafts();
        $newsletter->refresh();

        $isPublic = $newsletter->status === 'published' && ! $newsletter->is_future;
        abort_unless($isPublic || Auth::user()?->is_main_admin, 404);
        abort_unless($newsletter->file_path, 404);

        return SupabaseStorage::serve($newsletter->file_path, $isPublic, $newsletter->original_filename, true);
    }
}
