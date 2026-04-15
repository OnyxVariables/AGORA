<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class CertAuthTest extends TestCase
{
    public function test_login_cert_dev_mode_returns_admin_payload(): void
    {
        Config::set('app.env', 'local');
        putenv('CERT_AUTH=false');

        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();
        User::factory()->admin()->create([
            'dni' => '38660052L',
            'isActive' => true,
        ]);

        $response = $this->get('/api/login-cert');

        $response->assertOk()
            ->assertJsonStructure(['roleId', 'dni'])
            ->assertJson(['roleId' => 1, 'dni' => '38660052L']);
    }

    public function test_unknown_dni_returns_403(): void
    {
        Config::set('app.env', 'local');
        putenv('CERT_AUTH=false');

        $this->refreshAgoraSchema();
        $this->seedMinimalLocation();
        // No user with 38660052L

        $response = $this->get('/api/login-cert');

        $response->assertStatus(403);
    }
}
