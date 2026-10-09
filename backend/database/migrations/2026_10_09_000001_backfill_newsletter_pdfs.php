<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('newsletters')
            ->whereNull('file_contents')
            ->orderBy('id')
            ->chunkById(100, function ($newsletters): void {
                foreach ($newsletters as $newsletter) {
                    $pdf = $this->samplePdf(
                        (string) $newsletter->title,
                        (string) $newsletter->publication_date,
                    );

                    DB::table('newsletters')
                        ->where('id', $newsletter->id)
                        ->update([
                            'file_contents' => base64_encode($pdf),
                            'file_size' => strlen($pdf),
                        ]);
                }
            });
    }

    public function down(): void
    {
        // The original missing files cannot be restored, so this data backfill is irreversible.
    }

    private function samplePdf(string $title, string $publicationDate): string
    {
        $safeTitle = $this->escapePdfText($title);
        $safeDate = $this->escapePdfText($publicationDate);
        $stream = "BT /F1 18 Tf 72 720 Td ({$safeTitle}) Tj 0 -32 Td /F1 12 Tf (Publication date: {$safeDate}) Tj 0 -28 Td (Sample parish newsletter. Please contact the Parish Office for the original edition.) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($stream).">> stream\n{$stream}\nendstream",
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $index => $object) {
            $number = $index + 1;
            $offsets[$number] = strlen($pdf);
            $pdf .= "{$number} 0 obj\n{$object}\nendobj\n";
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 6\n0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf('%010d 00000 n ', $offset)."\n";
        }

        return $pdf."trailer << /Root 1 0 R /Size 6 >>\nstartxref\n{$xrefOffset}\n%%EOF\n";
    }

    private function escapePdfText(string $value): string
    {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $ascii ?: $value);
    }
};
