<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$rows = App\Models\Votation::orderBy('id', 'desc')->take(5)->get();
foreach ($rows as $v) {
    echo sprintf(
        "ID: %d | Title: %s | State: %s | Start: %s | End: %s | Tx: %s\n",
        $v->id,
        $v->title,
        $v->state,
        $v->startDate,
        $v->endDate,
        $v->txHash ?? 'NULL'
    );
}
echo "Total votations: " . App\Models\Votation::count() . "\n";