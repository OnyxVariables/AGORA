<?php

namespace App\Console\Commands;

use App\Models\Municipality;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DemoSeedCitizens extends Command
{
    protected $signature = 'demo:seed-citizens
                            {count=50 : Número de ciudadanos de demostración}';

    protected $description = 'Crea ciudadanos (roleId=2) con DNI español válido y nickname agora_demo_* (solo APP_ENV=local)';

    public function handle(): int
    {
        if (!app()->environment('local')) {
            $this->error('Este comando solo puede ejecutarse con APP_ENV=local.');

            return self::FAILURE;
        }

        $count = max(1, (int) $this->argument('count'));

        $municipalityIds = Municipality::query()->pluck('id')->toArray();

        if (empty($municipalityIds)) {
            $this->error('No hay municipios en la BD. Crea datos base primero.');

            return self::FAILURE;
        }

        $roleCitizen = 2;
        $baseNumber = 40_000_000;

        // Busco el último número usado entre los usuarios demo existentes
        $lastUser = User::query()
            ->where('nicknamePassword', 'like', 'agora_demo_%')
            ->orderByRaw('CAST(SUBSTRING(nicknamePassword, 12) AS UNSIGNED) DESC')
            ->first();

        $startNumber = $baseNumber;
        $startIndex = 1;
        if ($lastUser) {
            $lastNumber = (int) str_replace('agora_demo_', '', $lastUser->nicknamePassword);
            $startNumber = $lastNumber;
            $startIndex = $lastNumber - $baseNumber + 1;
            $this->info("Continuando desde usuario {$startIndex} (número {$startNumber})");
        }

        $created = 0;
        $skipped = 0;
        DB::transaction(function () use ($count, $municipalityIds, $roleCitizen, $startNumber, $startIndex, &$created, &$skipped) {
            for ($i = 0; $i < $count; $i++) {
                $municipalityId = $municipalityIds[array_rand($municipalityIds)];
                $number = $startNumber + $i;
                $index = $startIndex + $i;
                $dni = $this->spanishDniFromNumber($number);
                if (User::query()->whereRaw('UPPER(dni) = ?', [strtoupper($dni)])->exists()) {
                    $skipped++;
                    continue;
                }

                User::query()->create([
                    'dni' => $dni,
                    'name' => "Agora demo votante {$index}",
                    'nicknamePassword' => 'agora_demo_'.$number,
                    'roleId' => $roleCitizen,
                    'municipalityId' => $municipalityId,
                    'isActive' => true,
                ]);
                $created++;
            }
        });

        if ($skipped > 0) {
            $this->warn("Omitidos {$skipped} DNIs duplicados.");
        }

        $municipalityCount = count($municipalityIds);
        $this->info("Creados {$created} usuarios demo (distribuidos en {$municipalityCount} municipios).");

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