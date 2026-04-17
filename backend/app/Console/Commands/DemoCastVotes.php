<?php

namespace App\Console\Commands;

use App\Models\Party;
use App\Models\User;
use App\Models\VoteIntent;
use App\Models\Votation;
use App\Services\BlockchainService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use kornrunner\Keccak;

class DemoCastVotes extends Command
{
    protected $signature = 'demo:cast-votes
                            {votationId : ID de la votación}
                            {--party=* : IDs de partido (varias opciones; si se omite, reparto circular entre partidos activos)}
                            {--dry-run : Calcula hashes y valida sin enviar a blockchain}';

    protected $description = 'Emite un voto por cada usuario demo activo (nickname agora_demo_*) — solo APP_ENV=local';

    public function handle(BlockchainService $blockchainService): int
    {
        if (!app()->environment('local')) {
            $this->error('Este comando solo puede ejecutarse con APP_ENV=local.');

            return self::FAILURE;
        }

        $votationId = (int) $this->argument('votationId');
        $dryRun = (bool) $this->option('dry-run');

        $votation = Votation::query()
            ->whereKey($votationId)
            ->votableForCitizens()
            ->first();

        if (!$votation) {
            $this->error('La votación no existe o no está abierta a votación ciudadana (activa/pending con tx, fechas).');

            return self::FAILURE;
        }

        $partyOption = $this->option('party');
        $partyIds = array_map('intval', array_filter((array) $partyOption, fn ($id) => $id !== ''));
        if ($partyIds === []) {
            $partyIds = Party::query()
                ->where('active', true)
                ->orderBy('id')
                ->pluck('id')
                ->all();
        }

        if ($partyIds === []) {
            $this->error('No hay partidos activos. Indica --party=1 --party=2 ...');

            return self::FAILURE;
        }

        $missing = array_diff($partyIds, Party::query()->whereIn('id', $partyIds)->pluck('id')->all());
        if ($missing !== []) {
            $this->error('Partido inexistente: '.implode(', ', $missing));

            return self::FAILURE;
        }

        if (!$dryRun) {
            $connection = $blockchainService->checkConnection();
            if (empty($connection['success'])) {
                $this->error('Blockchain no disponible: '.($connection['error'] ?? 'desconocido'));

                return self::FAILURE;
            }
        }

        $users = User::query()
            ->where('roleId', 2)
            ->where('isActive', true)
            ->where('nicknamePassword', 'like', 'agora_demo_%')
            ->orderBy('id')
            ->get();

        if ($users->isEmpty()) {
            $this->error('No hay usuarios demo activos. Ejecuta php artisan demo:seed-citizens primero.');

            return self::FAILURE;
        }

        $maxRetries = 3;
        $ok = 0;
        $fail = 0;
        $partyCount = count($partyIds);

        foreach ($users->values() as $index => $user) {
            $partyId = $partyIds[$index % $partyCount];
            $codigo = bin2hex(random_bytes(32));
            $nickname = (string) $user->nicknamePassword;
            $payload = $nickname.$codigo.(string) $votationId;
            $voteHash = '0x'.strtolower(Keccak::hash($payload, 256));

            if ($dryRun) {
                $this->line("[dry-run] user {$user->id} DNI {$user->dni} -> party {$partyId} hash {$voteHash}");
                $ok++;

                continue;
            }

            VoteIntent::where('userId', $user->id)->delete();

            $intent = VoteIntent::create([
                'userId' => $user->id,
                'voteHash' => $voteHash,
                'votationId' => $votationId,
            ]);

            $attempt = 0;
            $tx = null;

            try {
                do {
                    $tx = $blockchainService->submitVote(
                        $partyId,
                        $votationId,
                        (int) $user->municipalityId,
                        $voteHash
                    );
                    $attempt++;
                    if (!empty($tx['success'])) {
                        break;
                    }
                    sleep(1);
                } while ($attempt < $maxRetries);

                if (empty($tx['success'])) {
                    $intent->delete();
                    $this->warn("Fallo user {$user->id}: ".($tx['error'] ?? 'sin detalle'));
                    $fail++;
                    continue;
                }

                $this->info("OK user {$user->id} -> party {$partyId} tx ".($tx['transactionHash'] ?? ''));
                $ok++;
            } catch (\Throwable $e) {
                Log::error('demo:cast-votes: '.$e->getMessage());
                $intent->delete();
                $this->warn("Excepción user {$user->id}: ".$e->getMessage());
                $fail++;
            }
        }

        $this->info("Resumen: {$ok} enviados, {$fail} fallidos.");

        return $fail > 0 ? self::FAILURE : self::SUCCESS;
    }
}