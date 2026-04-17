<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = App\Models\User::where('nicknamePassword', 'like', 'agora_demo_%')->count();
echo "Total usuarios demo: $count\n\n";

$rows = App\Models\User::where('nicknamePassword', 'like', 'agora_demo_%')
    ->orderBy('id', 'desc')
    ->take(5)
    ->get(['id', 'dni', 'name', 'nicknamePassword', 'isActive']);

foreach ($rows as $u) {
    echo sprintf("ID: %d | DNI: %s | Name: %s | Nick: %s | Active: %s\n", 
        $u->id, $u->dni, $u->name, $u->nicknamePassword, $u->isActive ? 'Sí' : 'No');
}