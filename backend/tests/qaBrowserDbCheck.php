<?php

// Read-only check for the disposable SQLite database used by qaBrowserSmoke.mjs.
// Usage from backend/: php tests/qaBrowserDbCheck.php storage/qa-browser-isolated/browser.sqlite browser.qa+RUN@example.test

$database = $argv[1] ?? '';
$email = $argv[2] ?? '';
if (! is_file($database) || ! preg_match('#/qa-(?:browser|reconcile-browser)[^/]*/[^/]+\.sqlite$#', str_replace('\\', '/', $database))) {
    fwrite(STDERR, "Expected the isolated QA browser SQLite file.\n");
    exit(2);
}
if (! preg_match('/^browser\.qa\+[0-9]+@example\.test$/', $email)) {
    fwrite(STDERR, "Expected synthetic browser QA email.\n");
    exit(2);
}

$pdo = new PDO('sqlite:'.$database);
$statement = $pdo->prepare('SELECT id, name, email, subject, category, is_member, status FROM contact_messages WHERE email = ? ORDER BY id DESC');
$statement->execute([$email]);
$matches = $statement->fetchAll(PDO::FETCH_ASSOC);
$synthetic = $pdo->query("SELECT id, email, is_member, status FROM contact_messages WHERE email LIKE 'browser.%@example.test' ORDER BY id")
    ->fetchAll(PDO::FETCH_ASSOC);
echo json_encode(['matches' => $matches, 'synthetic_rows' => $synthetic], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), PHP_EOL;
