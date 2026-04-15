<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    public function test_me_requires_auth(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_me_returns_profile_fields(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $user = User::factory()->citizen()->create([
            'name' => 'Ana Maria Lopez',
            'municipalityId' => 1,
            'nicknamePassword' => 'nick1',
        ]);

        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/me');

        $response->assertOk()
            ->assertJsonPath('nombre', 'Ana')
            ->assertJsonPath('dni', $user->dni)
            ->assertJsonPath('nickname', 'nick1')
            ->assertJsonPath('municipalityId', 1);
    }

    public function test_nickname_duplicate_returns_400(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        User::factory()->citizen()->create(['nicknamePassword' => 'taken']);
        $user = User::factory()->citizen()->create(['nicknamePassword' => null]);

        $this->actingAs($user, 'web');

        $this->postJson('/api/nickname', ['nickname' => 'taken'])
            ->assertStatus(400);
    }
}
