<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ImageStorage;

class SiteImageApiController extends Controller
{
    public function show(string $path)
    {
        $allowed = config('site_images.paths', []);
        abort_unless(in_array($path, $allowed, true), 404);

        return ImageStorage::serve('site/'.$path, true);
    }
}
