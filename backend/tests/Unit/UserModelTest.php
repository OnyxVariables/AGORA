<?php

namespace Tests\Unit;

use App\Models\User;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    public function test_set_inactive_persists(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $user = User::factory()->create(['isActive' => true]);
        $user->setInactive();

        $this->assertFalse((bool) User::query()->find($user->id)->isActive);
    }
}
