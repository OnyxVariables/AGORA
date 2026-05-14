<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PartyControllerTest extends TestCase
{
    public function test_parties_returns_active_only(): void
    {
        $this->refreshAgoraSchema();

        DB::table('party')->insert([
            [
                'name' => 'Active Party',
                'code' => 'AP',
                'description' => 'd',
                'image' => 'x.png',
                'color_background' => '#fff',
                'color_title' => '#000',
                'active' => 1,
            ],
            [
                'name' => 'Inactive',
                'code' => 'IN',
                'description' => 'd',
                'image' => 'y.png',
                'color_background' => '#fff',
                'color_title' => '#000',
                'active' => 0,
            ],
        ]);

        $response = $this->getJson('/api/parties');

        $response->assertOk();
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertSame('Active Party', $data[0]['name']);
    }
}
