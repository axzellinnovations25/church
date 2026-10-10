<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\HeaderUtils;

class SupabaseStorage
{
    private static function configured(): bool
    {
        return filled(config('services.supabase_storage.url'))
            && filled(config('services.supabase_storage.key'));
    }

    private static function requireConfiguration(): void
    {
        if (! self::configured()) {
            throw new RuntimeException('Supabase storage is not configured.');
        }
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
        $path = 'remote/'.$folder.'/'.now()->format('YmdHis').'-'.Str::uuid().'.'.$extension;
        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            throw new RuntimeException('The uploaded file could not be read.');
        }

        self::storeBytes($path, $contents, $file->getMimeType() ?: self::mimeType($path));

        return $path;
    }

    public static function storeBytes(string $path, string $contents, string $contentType): void
    {
        self::requireConfiguration();

        $response = Http::withHeaders(self::headers())
            ->withBody($contents, $contentType)
            ->timeout(60)
            ->post(self::objectUrl($path));

        if (! $response->successful()) {
            throw new RuntimeException('The file could not be uploaded to Supabase storage (HTTP '.$response->status().').');
        }

        Cache::forget('supabase-storage-exists:'.sha1($path));
    }

    public static function exists(?string $path): bool
    {
        if (! $path || ! self::configured()) {
            return false;
        }

        return Cache::remember('supabase-storage-exists:'.sha1($path), 300, function () use ($path) {
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
        return null;
    }

    public static function delete(?string $path): void
    {
        if (! $path) {
            return;
        }

        self::requireConfiguration();

        $url = rtrim(config('services.supabase_storage.url'), '/')
            .'/storage/v1/object/'.rawurlencode(config('services.supabase_storage.bucket'));
        $response = Http::withHeaders(self::headers())
            ->timeout(30)
            ->delete($url, ['prefixes' => [$path]]);

        if (! $response->successful() && $response->status() !== 404) {
            throw new RuntimeException('The file could not be deleted from Supabase storage.');
        }

        Cache::forget('supabase-storage-exists:'.sha1($path));
    }

    public static function serve(string $path, bool $public = false, ?string $filename = null, bool $download = false)
    {
        if (! self::configured()) {
            abort(503, 'Supabase storage is not configured.');
        }

        $result = Http::withHeaders(self::headers())
            ->timeout(60)
            ->get(self::objectUrl($path, true));

        if (in_array($result->status(), [400, 404], true)) {
            abort(404);
        }

        if (! $result->successful()) {
            abort(502, 'File storage is temporarily unavailable.');
        }

        $headers = [
            'Content-Type' => $result->header('Content-Type') ?: self::mimeType($path),
            'Cache-Control' => $public ? 'public, max-age=86400' : 'private, no-store',
        ];

        if ($filename !== null) {
            $filename = basename(str_replace('\\', '/', $filename));
            $fallback = preg_replace('/[^A-Za-z0-9._ -]/', '_', Str::ascii($filename)) ?: 'download';
            $headers['Content-Disposition'] = HeaderUtils::makeDisposition(
                $download ? HeaderUtils::DISPOSITION_ATTACHMENT : HeaderUtils::DISPOSITION_INLINE,
                $filename,
                $fallback
            );
        }

        return response($result->body(), 200, $headers);
    }

    private static function mimeType(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg', 'jfif' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'pdf' => 'application/pdf',
            default => 'image/png',
        };
    }
}
