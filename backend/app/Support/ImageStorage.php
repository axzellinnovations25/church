<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;

class ImageStorage
{
    private static function configured(): bool
    {
        return filled(config('services.supabase_storage.url'))
            && filled(config('services.supabase_storage.key'));
    }

    private static function objectUrl(string $path, bool $authenticated = false): string
    {
        $segments = array_map('rawurlencode', explode('/', $path));
        $prefix = $authenticated ? 'object/authenticated' : 'object';

        return rtrim(config('services.supabase_storage.url'), '/')
            .'/storage/v1/'.$prefix.'/'.rawurlencode(config('services.supabase_storage.bucket'))
            .'/'.implode('/', $segments);
    }

    private static function headers(): array
    {
        $key = config('services.supabase_storage.key');

        return ['apikey' => $key, 'Authorization' => 'Bearer '.$key];
    }

    public static function store(UploadedFile $file, string $folder): string
    {
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = now()->format('YmdHis').'-'.Str::uuid().'.'.$extension;
        $path = $folder.'/'.$filename;

        if (! self::configured()) {
            if (app()->environment('production')) {
                throw new RuntimeException('Image storage is not configured.');
            }

            $file->storeAs($folder, $filename, 'local');

            return $path;
        }

        $path = 'remote/'.$path;
        $response = Http::withHeaders(self::headers())
            ->withBody(file_get_contents($file->getRealPath()), $file->getMimeType() ?: 'image/jpeg')
            ->timeout(30)
            ->post(self::objectUrl($path));

        if (! $response->successful()) {
            throw new RuntimeException('The image could not be uploaded to storage.');
        }

        return $path;
    }

    public static function exists(?string $path): bool
    {
        if (! $path) {
            return false;
        }

        if (str_starts_with($path, 'remote/') || str_starts_with($path, 'site/')) {
            return self::configured();
        }

        if (is_file(storage_path('app/private/'.$path))) {
            return true;
        }

        if (! self::configured()) {
            return false;
        }

        return Cache::remember('image-storage-exists:'.sha1($path), 300, function () use ($path) {
            try {
                return Http::withHeaders(self::headers())
                    ->timeout(10)
                    ->head(self::objectUrl($path, true))
                    ->successful();
            } catch (\Throwable) {
                return false;
            }
        });
    }

    public static function size(?string $path): ?int
    {
        if (! $path || str_starts_with($path, 'remote/')) {
            return null;
        }

        $file = storage_path('app/private/'.$path);

        return is_file($file) ? filesize($file) : null;
    }

    public static function delete(?string $path): void
    {
        if (! $path) {
            return;
        }

        if (self::configured()) {
            $url = rtrim(config('services.supabase_storage.url'), '/')
                .'/storage/v1/object/'.rawurlencode(config('services.supabase_storage.bucket'));
            $response = Http::withHeaders(self::headers())
                ->timeout(30)
                ->delete($url, ['prefixes' => [$path]]);
            if (! $response->successful() && $response->status() !== 404) {
                throw new RuntimeException('The image could not be deleted from storage.');
            }
        } elseif (str_starts_with($path, 'remote/')) {
            throw new RuntimeException('Image storage is not configured.');
        }

        $file = storage_path('app/private/'.$path);
        if (is_file($file)) {
            unlink($file);
        }
    }

    public static function serve(string $path, bool $public = false)
    {
        abort_unless(self::exists($path), 404);

        if (self::configured()) {
            $result = Http::withHeaders(self::headers())->timeout(30)->get(self::objectUrl($path, true));
            if ($result->successful()) {
                return response($result->body(), 200, [
                    'Content-Type' => $result->header('Content-Type') ?: self::mimeType($path),
                    'Cache-Control' => $public ? 'public, max-age=86400' : 'private, no-store',
                ]);
            }

            if (! in_array($result->status(), [400, 404], true)) {
                abort(502, 'Image storage is temporarily unavailable.');
            }
        }

        abort_if(str_starts_with($path, 'remote/') || str_starts_with($path, 'site/'), 404);
        abort_unless(is_file(storage_path('app/private/'.$path)), 404);

        return response()->file(storage_path('app/private/'.$path), [
            'Content-Type' => self::mimeType($path),
            'Cache-Control' => $public ? 'public, max-age=86400' : 'private, no-store',
        ]);
    }

    private static function mimeType(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg', 'jfif' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'image/png',
        };
    }
}
