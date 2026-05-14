<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Votation;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MetricsControllerTest extends TestCase
{
    public function test_bundle_requires_admin(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $citizen = User::factory()->citizen()->create();
        Votation::create([
            'title' => 'V',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => now()->addDay(),
            'state' => 'active',
        ]);

        $this->actingAs($citizen, 'web');

        $this->getJson('/api/metrics/votation/1')->assertStatus(403);
    }

    public function test_admin_gets_bundle_with_votes_and_audit(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        DB::table('party')->insert([
            'name' => 'Test Party',
            'code' => 'TP',
            'description' => 'd',
            'image' => 'x.png',
            'color_background' => '#fff',
            'color_title' => '#000',
            'active' => 1,
        ]);

        Votation::create([
            'title' => 'V',
            'description' => '',
            'startDate' => now()->subHour(),
            'endDate' => now()->addDay(),
            'state' => 'active',
        ]);

        DB::table('block')->insert([
            'hash' => '0x'.str_repeat('b', 64),
            'blockNumber' => 1,
            'previousHash' => null,
            'transactions' => 1,
            'isValid' => 1,
        ]);

        DB::table('vote')->insert([
            'voteHash' => '0x'.str_repeat('c', 64),
            'votationId' => 1,
            'partyId' => 1,
            'municipalityId' => 1,
            'blockHash' => '0x'.str_repeat('b', 64),
            'txHash' => '0x'.str_repeat('d', 64),
        ]);

        User::factory()->citizen()->count(3)->create(['municipalityId' => 1]);

        $admin = User::factory()->admin()->create();

        DB::table('auditory')->insert([
            'userId' => $admin->id,
            'action' => 'VOTE',
            'description' => 'test',
            'txHash' => null,
            'blockHash' => null,
        ]);
        $this->actingAs($admin, 'web');

        $response = $this->getJson('/api/metrics/votation/1');

        $response->assertOk()
            ->assertJsonPath('votation.id', 1)
            ->assertJsonPath('metrics.totalVotes', 1)
            ->assertJsonPath('votes.0.partyName', 'Test Party')
            ->assertJsonPath('blocks.0.blockNumber', 1)
            ->assertJsonPath('audit.0.action', 'VOTE')
            ->assertJsonPath('metrics.registeredCitizens', 3);
    }

    public function test_bundle_404_when_missing_votation(): void
    {
        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();

        $admin = User::factory()->admin()->create();
        $this->actingAs($admin, 'web');

        $this->getJson('/api/metrics/votation/999')->assertStatus(404);
    }
}
