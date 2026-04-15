<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Votation;
use App\Services\BlockchainService;
use Tests\TestCase;

class VotationControllerTest extends TestCase
{
    private function mockBlockchainSuccess(): void
    {
        $genesis = '0x0000000000000000000000000000000000000000000000000000000000000000';

        $this->mock(BlockchainService::class, function ($mock) use ($genesis) {
            $mock->shouldReceive('checkConnection')->andReturn(['success' => true]);
            $mock->shouldReceive('createVotation')->andReturn([
                'success' => true,
                'transactionHash' => '0x' . str_repeat('a', 64),
                'blockNumber' => 1,
                'blockHash' => '0x' . str_repeat('b', 64),
                'parentHash' => $genesis,
            ]);
            $mock->shouldReceive('getBlockByHash')->andReturn([
                'hash' => '0x' . str_repeat('b', 64),
                'blockNumber' => 1,
                'parentHash' => $genesis,
            ]);
            $mock->shouldReceive('updateVotation')->andReturn([
                'success' => true,
                'transactionHash' => '0x' . str_repeat('c', 64),
                'blockNumber' => 2,
                'blockHash' => '0x' . str_repeat('d', 64),
                'parentHash' => '0x' . str_repeat('b', 64),
            ]);
            $mock->shouldReceive('cancelVotation')->andReturn([
                'success' => true,
                'transactionHash' => '0x' . str_repeat('e', 64),
                'blockNumber' => 3,
                'blockHash' => '0x' . str_repeat('f', 64),
                'parentHash' => '0x' . str_repeat('d', 64),
            ]);
        });
    }

    public function test_non_admin_cannot_list_votations(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->getJson('/api/votations')->assertStatus(403);
    }

    public function test_admin_can_create_votation(): void
    {
        $this->mockBlockchainSuccess();

        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'web');

        $response = $this->postJson('/api/votations', [
            'title' => 'Elecciones test',
            'description' => 'Desc',
            'startDate' => now()->subDay()->toDateTimeString(),
            'endDate' => now()->addDay()->toDateTimeString(),
        ]);

        $response->assertCreated();
        $this->assertSame('pending', $response->json('votation.state'));
    }

    public function test_active_returns_404_when_none(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->getJson('/api/votation/active')->assertStatus(404);
    }

    public function test_active_returns_votation(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'Activa',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => now()->addDay(),
            'state' => 'active',
        ]);

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->getJson('/api/votation/active')->assertOk()->assertJsonPath('state', 'active');
    }

    public function test_active_returns_votation_when_end_date_is_null(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'Activa sin fin',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => null,
            'state' => 'active',
        ]);

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->getJson('/api/votation/active')->assertOk()->assertJsonPath('state', 'active');
    }

    public function test_active_404_when_future_start_date(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'Futura',
            'description' => '',
            'startDate' => now()->addDay(),
            'endDate' => now()->addWeek(),
            'state' => 'active',
        ]);

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->getJson('/api/votation/active')->assertStatus(404);
    }

    public function test_active_returns_pending_when_tx_exists_but_spring_not_flipped_yet(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'On-chain pendiente en BD',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => now()->addDay(),
            'state' => 'pending',
            'txHash' => '0x'.str_repeat('a', 64),
        ]);

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->getJson('/api/votation/active')
            ->assertOk()
            ->assertJsonPath('state', 'pending');
    }

    public function test_active_404_when_pending_without_tx(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        Votation::create([
            'title' => 'Sin tx aún',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => now()->addDay(),
            'state' => 'pending',
            'txHash' => null,
        ]);

        $user = User::factory()->citizen()->create();
        $this->actingAs($user, 'web');

        $this->getJson('/api/votation/active')->assertStatus(404);
    }
}
