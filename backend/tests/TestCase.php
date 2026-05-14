<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ensureBlockchainAbiFixture();
    }

    protected function ensureBlockchainAbiFixture(): void
    {
        $dir = storage_path('app');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $path = $dir.'/SimpleVoting.json';
        if (! file_exists($path)) {
            file_put_contents($path, json_encode(['abi' => []]));
        }
    }

    protected function refreshAgoraSchema(): void
    {
        $this->artisan('migrate:fresh', [
            '--path' => 'database/migrations/testing',
            '--force' => true,
        ]);
    }

    protected function seedMinimalLocation(): void
    {
        \DB::table('autonomousCommunity')->insert(['id' => 1, 'name' => 'Test CCAA']);
        \DB::table('province')->insert([
            'id' => 1,
            'ineId' => 1,
            'autonomousCommunityId' => 1,
            'name' => 'Test Province',
        ]);
        \DB::table('municipality')->insert([
            'id' => 1,
            'ineId' => 1,
            'provinceId' => 1,
            'name' => 'Test City',
        ]);
        \DB::table('role')->insert([
            ['id' => 1, 'name' => 'admin'],
            ['id' => 2, 'name' => 'citizen'],
        ]);
    }
}
