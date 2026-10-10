<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

abstract class TestCase extends BaseTestCase
{
    protected array $supabaseObjects = [];

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.supabase_storage.url', 'https://storage.example.test');
        config()->set('services.supabase_storage.key', 'test-service-key');
        config()->set('services.supabase_storage.bucket', 'cathedral-images');

        Http::fake(function (Request $request) {
            $urlPath = rawurldecode((string) parse_url($request->url(), PHP_URL_PATH));
            $path = preg_replace('~^/storage/v1/object/(?:authenticated/)?cathedral-images/~', '', $urlPath);

            if ($request->method() === 'POST') {
                $this->supabaseObjects[$path] = $request->body();
                return Http::response(['Key' => $path], 200);
            }

            if ($request->method() === 'DELETE') {
                foreach ($request->data()['prefixes'] ?? [] as $prefix) {
                    unset($this->supabaseObjects[$prefix]);
                }
                return Http::response([], 200);
            }

            if (! array_key_exists($path, $this->supabaseObjects)) {
                return Http::response([], 404);
            }

            return Http::response($request->method() === 'HEAD' ? '' : $this->supabaseObjects[$path], 200, [
                'Content-Type' => str_ends_with($path, '.pdf') ? 'application/pdf' : 'image/png',
            ]);
        });
    }

    protected function putSupabaseObject(string $path, string $contents): void
    {
        $this->supabaseObjects[$path] = $contents;
    }

    protected function hasSupabaseObject(string $path): bool
    {
        return array_key_exists($path, $this->supabaseObjects);
    }
}
