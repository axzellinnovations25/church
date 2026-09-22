<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$sourcePath = database_path('database.sqlite');
$target = DB::connection()->getPdo();

if (! is_file($sourcePath)) {
    throw new RuntimeException("SQLite source not found at {$sourcePath}");
}

if ($target->getAttribute(PDO::ATTR_DRIVER_NAME) !== 'pgsql') {
    throw new RuntimeException('The Laravel target connection must use PostgreSQL.');
}

$source = new PDO('sqlite:'.$sourcePath, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$quoteIdentifier = static fn (string $name): string => '"'.str_replace('"', '""', $name).'"';

$sourceTables = $source->query(<<<'SQL'
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name <> 'migrations'
    ORDER BY name
    SQL)->fetchAll(PDO::FETCH_COLUMN);

$targetTables = $target->query(<<<'SQL'
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    SQL)->fetchAll(PDO::FETCH_COLUMN);

$tables = array_values(array_intersect($sourceTables, $targetTables));

if ($tables === []) {
    throw new RuntimeException('No matching application tables were found to migrate.');
}

$target->beginTransaction();

try {
    $target->exec('SET LOCAL session_replication_role = replica');

    $quotedTables = implode(', ', array_map($quoteIdentifier, $tables));
    $target->exec("TRUNCATE TABLE {$quotedTables} RESTART IDENTITY CASCADE");

    $migratedCounts = [];

    foreach ($tables as $table) {
        $quotedTable = $quoteIdentifier($table);
        $sourceColumns = $source->query("PRAGMA table_info({$quotedTable})")->fetchAll(PDO::FETCH_ASSOC);

        $columnStatement = $target->prepare(<<<'SQL'
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :table
            ORDER BY ordinal_position
            SQL);
        $columnStatement->execute(['table' => $table]);
        $targetColumnRows = $columnStatement->fetchAll(PDO::FETCH_ASSOC);
        $targetColumnTypes = array_column($targetColumnRows, 'data_type', 'column_name');

        $columns = array_values(array_filter(
            array_column($sourceColumns, 'name'),
            static fn (string $column): bool => array_key_exists($column, $targetColumnTypes)
        ));

        if ($columns === []) {
            continue;
        }

        $quotedColumns = implode(', ', array_map($quoteIdentifier, $columns));
        $placeholders = implode(', ', array_map(static fn (string $column): string => ':'.$column, $columns));
        $insert = $target->prepare("INSERT INTO {$quotedTable} ({$quotedColumns}) VALUES ({$placeholders})");
        $rows = $source->query("SELECT {$quotedColumns} FROM {$quotedTable}");
        $count = 0;

        while ($row = $rows->fetch(PDO::FETCH_ASSOC)) {
            foreach ($columns as $column) {
                if ($row[$column] !== null && $targetColumnTypes[$column] === 'boolean') {
                    $row[$column] = ((int) $row[$column]) === 1 ? 'true' : 'false';
                }
            }

            $insert->execute($row);
            $count++;
        }

        if (in_array('id', $columns, true)) {
            $sequence = $target->prepare("SELECT pg_get_serial_sequence(:table_name, 'id')");
            $sequence->execute(['table_name' => 'public.'.$table]);
            $sequenceName = $sequence->fetchColumn();

            if ($sequenceName) {
                $maximumId = (int) $target->query("SELECT COALESCE(MAX(id), 0) FROM {$quotedTable}")->fetchColumn();
                $setValue = $target->prepare('SELECT setval(:sequence_name, :sequence_value, :is_called)');
                $setValue->execute([
                    'sequence_name' => $sequenceName,
                    'sequence_value' => max($maximumId, 1),
                    'is_called' => $maximumId > 0 ? 'true' : 'false',
                ]);
            }
        }

        $migratedCounts[$table] = $count;
    }

    $target->commit();

    foreach ($migratedCounts as $table => $sourceCount) {
        $quotedTable = $quoteIdentifier($table);
        $targetCount = (int) $target->query("SELECT COUNT(*) FROM {$quotedTable}")->fetchColumn();

        if ($sourceCount !== $targetCount) {
            throw new RuntimeException("Count mismatch for {$table}: source={$sourceCount}, target={$targetCount}");
        }

        echo "{$table}={$targetCount}", PHP_EOL;
    }
} catch (Throwable $exception) {
    if ($target->inTransaction()) {
        $target->rollBack();
    }

    throw $exception;
}
