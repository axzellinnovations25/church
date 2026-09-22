<?php

declare(strict_types=1);

$dbPath = __DIR__ . '/../database/database.sqlite';
$pdo = new PDO('sqlite:' . $dbPath);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$tables = [
    'users',
    'groups',
    'group_members',
    'events',
    'contact_messages',
    'mass_times',
    'parish_council_members',
    'parish_registrations',
    'parish_children',
    'news_posts',
    'newsletters',
];

foreach ($tables as $t) {
    $stmt = $pdo->query('select count(1) as c from ' . $t);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo $t . '=' . ((int) ($row['c'] ?? 0)) . PHP_EOL;
}

$main = (int) $pdo->query('select count(1) as c from users where is_main_admin=1')->fetch(PDO::FETCH_ASSOC)['c'];
$assigned = (int) $pdo->query('select count(1) as c from users where is_main_admin=0 and group_id is not null')->fetch(PDO::FETCH_ASSOC)['c'];

echo 'main_admins=' . $main . PHP_EOL;
echo 'group_assigned_admins=' . $assigned . PHP_EOL;

