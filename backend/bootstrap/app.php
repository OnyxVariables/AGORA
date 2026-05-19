<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
//Para ello tengo que instalar Sanctum de la siguiente forma:
    // composer require laravel/sanctum
    // php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
    // php artisan migrate (Sanctum necesita sus tablas)

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )

    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'insecure.user' => \App\Http\Middleware\InsecureUserMiddleware::class,
        ]);

        if (!filter_var(env('AGORA_INSECURE_MODE', false), FILTER_VALIDATE_BOOL)) {
            $middleware->api(prepend: [
                \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            ]);
        }
    })

    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('votations:process-lifecycle')->everyMinute();
    })
    ->create();