<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Votation;
use App\Services\BlockchainService;
use Tests\TestCase;

class VoteControllerTest extends TestCase
{
    private string $validHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    public function test_vote_requires_auth(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $this->postJson('/api/vote', [
            'partyId' => 1,
            'votationId' => 1,
            'municipalityId' => 1,
            'voteHash' => $this->validHash,
        ])->assertStatus(401);
    }

    public function test_inactive_user_cannot_vote(): void
    {
        $this->mock(BlockchainService::class, function ($mock) {
            $mock->shouldReceive('checkConnection')->never();
        });

        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $user = User::factory()->citizen()->inactive()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/vote', [
            'partyId' => 1,
            'votationId' => 1,
            'municipalityId' => 1,
            'voteHash' => $this->validHash,
        ])->assertStatus(403);
    }

    public function test_vote_succeeds_with_mock_blockchain(): void
    {
        $this->mock(BlockchainService::class, function ($mock) {
            $mock->shouldReceive('checkConnection')->andReturn(['success' => true]);
            $mock->shouldReceive('submitVote')->andReturn([
                'success' => true,
                'transactionHash' => '0x' . str_repeat('9', 64),
            ]);
        });

        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'V',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => now()->addDay(),
            'state' => 'active',
        ]);

        $user = User::factory()->citizen()->create(['municipalityId' => 1]);
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/vote', [
            'partyId' => 1,
            'votationId' => 1,
            'municipalityId' => 1,
            'voteHash' => $this->validHash,
        ]);

        $response->assertOk()->assertJsonStructure(['message', 'txHash']);

        $this->assertDatabaseHas('vote_intent', [
            'userId' => $user->id,
            'voteHash' => strtolower($this->validHash),
        ]);
    }

    public function test_vote_succeeds_when_end_date_is_null(): void
    {
        $this->mock(BlockchainService::class, function ($mock) {
            $mock->shouldReceive('checkConnection')->andReturn(['success' => true]);
            $mock->shouldReceive('submitVote')->andReturn([
                'success' => true,
                'transactionHash' => '0x' . str_repeat('8', 64),
            ]);
        });

        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'V sin fin',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => null,
            'state' => 'active',
        ]);

        $user = User::factory()->citizen()->create(['municipalityId' => 1]);
        $this->actingAs($user, 'web');

        $this->postJson('/api/vote', [
            'partyId' => 1,
            'votationId' => 1,
            'municipalityId' => 1,
            'voteHash' => $this->validHash,
        ])->assertOk();
    }

    public function test_vote_succeeds_when_state_pending_but_tx_confirmed(): void
    {
        $this->mock(BlockchainService::class, function ($mock) {
            $mock->shouldReceive('checkConnection')->andReturn(['success' => true]);
            $mock->shouldReceive('submitVote')->andReturn([
                'success' => true,
                'transactionHash' => '0x'.str_repeat('7', 64),
            ]);
        });

        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'V',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => now()->addDay(),
            'state' => 'pending',
            'txHash' => '0x'.str_repeat('b', 64),
        ]);

        $user = User::factory()->citizen()->create(['municipalityId' => 1]);
        $this->actingAs($user, 'web');

        $this->postJson('/api/vote', [
            'partyId' => 1,
            'votationId' => 1,
            'municipalityId' => 1,
            'voteHash' => $this->validHash,
        ])->assertOk();
    }

    public function test_invalid_vote_hash_validation(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->postJson('/api/vote', [
            'partyId' => 1,
            'votationId' => 1,
            'municipalityId' => 1,
            'voteHash' => 'not-a-hash',
        ])->assertStatus(422);
    }
}
