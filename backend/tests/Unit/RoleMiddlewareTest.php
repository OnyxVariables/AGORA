<?php

namespace Tests\Unit;

use App\Http\Middleware\RoleMiddleware;
use App\Models\User;
use Illuminate\Http\Request;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    public function test_unauthenticated_returns_401(): void
    {
        $middleware = new RoleMiddleware;
        $request = Request::create('/test', 'GET');
        $response = $middleware->handle($request, fn () => response('ok'), '1');

        $this->assertSame(401, $response->getStatusCode());
    }

    public function test_wrong_role_returns_403(): void
    {
        $user = new User;
        $user->roleId = 2;
        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new RoleMiddleware;
        $response = $middleware->handle($request, fn () => response('ok'), '1');

        $this->assertSame(403, $response->getStatusCode());
    }

    public function test_correct_role_proceeds(): void
    {
        $user = new User;
        $user->roleId = 1;
        $request = Request::create('/test', 'GET');
        $request->setUserResolver(fn () => $user);

        $middleware = new RoleMiddleware;
        $called = false;
        $middleware->handle($request, function () use (&$called) {
            $called = true;

            return response('ok');
        }, '1');

        $this->assertTrue($called);
    }
}
