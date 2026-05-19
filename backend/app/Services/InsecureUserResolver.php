<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;

final class InsecureUserResolver
{
    public function enabled(): bool
    {
        return (bool) config('agora.insecure_mode', false);
    }

    public function resolveAdmin(): ?User
    {
        return $this->resolveForRole(
            roleId: 1,
            configuredUserId: config('agora.insecure_admin_user_id')
        );
    }

    public function resolveCitizen(): ?User
    {
        return $this->resolveForRole(
            roleId: 2,
            configuredUserId: config('agora.insecure_citizen_user_id')
        );
    }

    public function describeMissingUser(string $profile): string
    {
        return match ($profile) {
            'admin' => 'No se encontró un usuario administrador para AGORA_INSECURE_MODE.',
            'citizen' => 'No se encontró un usuario ciudadano para AGORA_INSECURE_MODE.',
            default => 'Perfil inseguro no soportado.',
        };
    }

    private function resolveForRole(int $roleId, mixed $configuredUserId): ?User
    {
        $query = User::query()->where('roleId', $roleId);

        if ($configuredUserId !== null) {
            return (clone $query)
                ->whereKey((int) $configuredUserId)
                ->first();
        }

        return $query
            ->orderBy('id')
            ->first();
    }
}
