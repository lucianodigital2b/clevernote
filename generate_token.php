<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = App\Models\User::first();
if ($user) {
    $token = $user->createToken('test-token')->plainTextToken;
    echo $token;
} else {
    echo 'No user found';
}