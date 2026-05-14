<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\InsecureUserResolver;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class InsecureUserMiddleware
{
    public function __construct(
        private readonly InsecureUserResolver $resolver
    ) {
    }

    public function handle(Request $request, Closure $next, string $profile): mixed
    {
        if (!$this->resolver->enabled()) {
            return $next($request);
        }

        $user = match ($profile) {
            'admin' => $this->resolver->resolveAdmin(),
            'citizen' => $this->resolver->resolveCitizen(),
            default => null,
        };

        if ($user === null) {
            return $this->missingUserResponse($profile);
        }

        Auth::setUser($user);
        $request->setUserResolver(static fn () => $user);

        return $next($request);
    }

    private function missingUserResponse(string $profile): JsonResponse
    {
        return response()->json([
            'error' => $this->resolver->describeMissingUser($profile),
        ], 503, [], JSON_UNESCAPED_UNICODE);
    }
}
