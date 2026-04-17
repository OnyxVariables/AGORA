<?php

namespace App\Console\Commands;

use App\Models\Municipality;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DemoSeedCitizens extends Command
{
    protected $signature = 'demo:seed-citizens
                            {count=50 : Número de ciudadanos de demostración}
                            {--municipality= : ID de municipio (por defecto el primero de la BD)}';

    protected $description = 'Crea ciudadanos (roleId=2) con DNI español válido y nickname agora_demo_* (solo APP_ENV=local)';

    public function handle(): int
    {
        if (!app()->environment('local')) {
            $this->error('Este comando solo puede ejecutarse con APP_ENV=local.');

            return self::FAILURE;
        }

        $count = max(1, (int) $this->argument('count'));
        $municipalityId = $this->option('municipality');

        if ($municipalityId === null) {
            $municipalityId = Municipality::query()->orderBy('id')->value('id');
        } else {
            $municipalityId = (int) $municipalityId;
        }

        if ($municipalityId === null || !Municipality::query()->whereKey($municipalityId)->exists()) {
            $this->error('No hay municipio válido. Crea datos base o pasa --municipality=');

            return self::FAILURE;
        }

        $roleCitizen = 2;
        $baseNumber = 40_000_000;

        $created = 0;
        DB::transaction(function () use ($count, $municipalityId, $roleCitizen, $baseNumber, &$created) {
            for ($i = 1; $i <= $count; $i++) {
                $number = $baseNumber + $i;
                $dni = $this->spanishDniFromNumber($number);
                if (User::query()->whereRaw('UPPER(dni) = ?', [strtoupper($dni)])->exists()) {
                    $this->warn("Omitido DNI duplicado {$dni}");

                    continue;
                }

                User::query()->create([
                    'dni' => $dni,
                    'name' => "Agora demo votante {$i}",
                    'nicknamePassword' => 'agora_demo_'.$number,
                    'roleId' => $roleCitizen,
                    'municipalityId' => $municipalityId,
                    'isActive' => true,
                ]);
                $created++;
            }
        });

        $this->info("Creados {$created} usuarios demo (municipio {$municipalityId}).");

        return self::SUCCESS;
    }

    private function spanishDniFromNumber(int $number): string
    {
        $letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
        $normalized = $number % 100_000_000;
        $letter = $letters[$normalized % 23];

        return sprintf('%08d', $normalized).$letter;
    }
}