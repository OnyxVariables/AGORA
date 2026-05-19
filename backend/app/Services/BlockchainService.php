<?php

namespace App\Services;

use App\Models\Block;
use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
// use Web3p\EthereumTx\Transaction; // No funciona porque aún no funciona el composer require web3p/ethereum-tx
use Illuminate\Support\Facades\Log;

class BlockchainService
{
    private ?Web3 $web3 = null;

    private ?Contract $simpleVoting = null;

    // RPC siempre disponible sin artefacto ABI (útil para salud / blockNumber)
    private function getWeb3(): Web3
    {
        if ($this->web3 !== null) {
            return $this->web3;
        }

        $rpc = env('BESU_RPC_URL', 'http://localhost:8545');
        $provider = new HttpProvider($rpc, 5);
        $this->web3 = new Web3($provider);

        return $this->web3;
    }

    /**
     * Contrato SimpleVoting: requiere ABI en disco y SIMPLE_VOTING_ADDRESS.
     * Ruta por defecto: storage/app/SimpleVoting.json (copiar artefacto Hardhat).
     */
    private function getContract(): Contract
    {
        if ($this->simpleVoting !== null) {
            return $this->simpleVoting;
        }

        $path = env('SIMPLE_VOTING_ABI_PATH', storage_path('app/SimpleVoting.json'));
        if (!is_readable($path)) {
            throw new \RuntimeException(
                "ABI del contrato no encontrado: {$path}. "
                .'Copie blockchain/artifacts/.../SimpleVoting.json tras `npx hardhat compile` '
                .'o defina SIMPLE_VOTING_ABI_PATH.',
            );
        }

        $abiJson = json_decode(file_get_contents($path));
        if ($abiJson === null || !isset($abiJson->abi)) {
            throw new \RuntimeException("ABI inválido o vacío: {$path}");
        }

        $this->simpleVoting = new Contract($this->getWeb3()->provider, $abiJson->abi);

        $contractAddress = env('SIMPLE_VOTING_ADDRESS');
        if (!$contractAddress) {
            throw new \RuntimeException('SIMPLE_VOTING_ADDRESS no configurado');
        }

        $this->simpleVoting->at($contractAddress);

        return $this->simpleVoting;
    }

    // Obtengo dirección admin obligatoria
    private function getFromAddress()
    {
        $from = env('BLOCKCHAIN_ADMIN_ADDRESS');

        if (!$from) {
            throw new \Exception("BLOCKCHAIN_ADMIN_ADDRESS no configurado");
        }

        return $from;
    }

    // Obtener bloque completo por hash para extraer parentHash
    public function getBlockByHash($blockHash)
    {
        $block = null;
        $error = null;
        $completed = false;

        $callback = function ($err, $result) use (&$block, &$error, &$completed) {
            if ($err) {
                $error = $err;
            } else {
                $block = $result;
            }
            $completed = true;
        };

        $this->getWeb3()->eth->getBlockByHash($blockHash, false, $callback);

        $waitStart = time();
        while (!$completed && (time() - $waitStart) < 5) {
            usleep(100000);
        }

        if (!$completed || $error) {
            Log::warning("No se pudo obtener bloque por hash: {$blockHash}");
            return null;
        }

        // Formatear datos del bloque
        $blockNumber = $block->number ?? null;
        if (is_string($blockNumber) && str_starts_with($blockNumber, '0x')) {
            $blockNumber = hexdec(substr($blockNumber, 2));
        } elseif (is_object($blockNumber) && method_exists($blockNumber, 'toString')) {
            $blockNumber = (int) $blockNumber->toString();
        }

        return [
            'hash' => $block->hash ?? $blockHash,
            'blockNumber' => $blockNumber,
            'parentHash' => $block->parentHash ?? null,
            'timestamp' => $block->timestamp ?? null,
            'transactions' => count($block->transactions ?? [])
        ];
    }

    // Esperar receipt de la transaccion con timeout y reintentos
    private function waitForReceipt($txHash, $maxAttempts = 15, $sleepSeconds = 1)
    {
        $receipt = null;
        $attempts = 0;

        while ($receipt === null && $attempts < $maxAttempts) {
            $callbackCompleted = false;
            $callbackError = null;
            $callbackResult = null;

            try {
                $this->getWeb3()->eth->getTransactionReceipt($txHash, function ($err, $r) use (&$callbackCompleted, &$callbackError, &$callbackResult) {
                    if ($err !== null) {
                        $callbackError = $err;
                    } else {
                        $callbackResult = $r;
                    }
                    $callbackCompleted = true;
                });

                // Esperar a que el callback se ejecute
                $waitStart = time();
                while (!$callbackCompleted && (time() - $waitStart) < 5) {
                    usleep(100000); // 100ms
                }

                if ($callbackCompleted) {
                    if ($callbackError !== null) {
                        Log::warning("Error al obtener receipt: {$callbackError->getMessage()}");
                    } else {
                        $receipt = $callbackResult;
                    }
                }
            } catch (\Exception $e) {
                Log::warning("Intento $attempts fallido al obtener receipt: {$e->getMessage()}");
            }

            if ($receipt !== null) {
                return $receipt;
            }

            sleep($sleepSeconds);
            $attempts++;
        }

        throw new \Exception("Timeout esperando receipt de la transacción");
    }

    // Validar formato bytes32 (es mandado desde el frontend)
    private function validateBytes32($value)
    {
        if (!preg_match('/^0x[a-fA-F0-9]{64}$/', $value)) {
            throw new \Exception("Formato inválido para bytes32 (voteHash)");
        }
    }

    // Enviar transacción con reintentos
    private function sendTransaction($method, $params, $gas = 300000, $maxRetries = 3)
    {
        $from = $this->getFromAddress();
        $privateKey = env('BESU_PRIVATE_KEY');

        if (!$privateKey) {
            throw new \Exception("BESU_PRIVATE_KEY no configurada");
        }

        $attempt = 0;

        do {
            try {

                // =========================================
                // 1. Obtener nonce
                // =========================================

                $nonce = null;
                $nonceError = null;
                $completed = false;

                $this->web3->eth->getTransactionCount(
                    $from,
                    'pending',
                    function ($err, $result) use (&$nonce, &$nonceError, &$completed) {
                        if ($err !== null) {
                            $nonceError = $err;
                        } else {
                            $nonce = $result;
                        }

                        $completed = true;
                    }
                );

                $waitStart = time();

                while (!$completed && (time() - $waitStart) < 10) {
                    usleep(100000);
                }

                if ($nonceError !== null) {
                    throw new \Exception($nonceError->getMessage());
                }

                if ($nonce === null) {
                    throw new \Exception("No se pudo obtener nonce");
                }

                // =========================================
                // 2. Codificar llamada al contrato
                // =========================================

                $data = call_user_func_array(
                    [$this->simpleVoting, 'getData'],
                    array_merge([$method], $params)
                );

                // =========================================
                // 3. Construir transacción
                // =========================================

                $txParams = [
                    'nonce' => $nonce,
                    'from' => $from,
                    'to' => env('SIMPLE_VOTING_ADDRESS'),
                    'gas' => '0x' . dechex($gas),
                    'gasPrice' => '0x0',
                    'value' => '0x0',
                    'data' => $data,
                    'chainId' => (int) env('CHAIN_ID', 1337)
                ];

                // =========================================
                // 4. Firmar
                // =========================================

                $transaction = new Transaction($txParams);

                $signedTx = '0x' . $transaction->sign($privateKey);

                // =========================================
                // 5. Enviar RAW transaction
                // =========================================

                $txHash = null;
                $sendError = null;
                $completed = false;

                $this->web3->eth->sendRawTransaction(
                    $signedTx,
                    function ($err, $result) use (&$txHash, &$sendError, &$completed) {

                        if ($err !== null) {
                            $sendError = $err;
                        } else {
                            $txHash = $result;
                        }

                        $completed = true;
                    }
                );

                $waitStart = time();

                while (!$completed && (time() - $waitStart) < 10) {
                    usleep(100000);
                }

                if ($sendError !== null) {
                    throw new \Exception($sendError->getMessage());
                }

                if ($txHash === null) {
                    throw new \Exception("No se obtuvo txHash");
                }

                // =========================================
                // 6. Esperar receipt
                // =========================================

                $receipt = $this->waitForReceipt($txHash);

                $blockNumber = $receipt->blockNumber;

                if (is_string($blockNumber) && str_starts_with($blockNumber, '0x')) {
                    $blockNumber = hexdec(substr($blockNumber, 2));
                } elseif (is_object($blockNumber) && method_exists($blockNumber, 'toString')) {
                    $blockNumber = (int) $blockNumber->toString();
                }

                $blockHash = $receipt->blockHash ?? null;

                $parentHash = null;

                if ($blockHash) {
                    $block = $this->getBlockByHash($blockHash);

                    if ($block && isset($block['parentHash'])) {
                        $parentHash = $block['parentHash'];
                    }
                }

                return [
                    'txHash' => $txHash,
                    'blockNumber' => $blockNumber,
                    'blockHash' => $blockHash,
                    'parentHash' => $parentHash,
                    'gasUsed' => $receipt->gasUsed
                    ? (is_object($receipt->gasUsed)
                    ? $receipt->gasUsed->toString()
                    : $receipt->gasUsed)
                    : null,
                    'receipt' => $receipt
                ];

            } catch (\Exception $e) {

                $attempt++;

                Log::warning("Intento $attempt para $method fallido: {$e->getMessage()}");

                sleep(1);

                if ($attempt >= $maxRetries) {
                    throw new \Exception(
                        "Error enviando la transacción tras $maxRetries intentos: " . $e->getMessage()
                    );
                }
            }

        } while ($attempt < $maxRetries);
    }

    // Enviar voto
    public function submitVote($partyId, $votationId, $municipalityId, $voteHash)
    {
        try {
            $this->validateBytes32($voteHash);

            $result = $this->sendTransaction('submitVote', [
                $partyId,
                $votationId,
                $municipalityId,
                $voteHash
            ]);

            return [
                'success' => true,
                'transactionHash' => $result['txHash'],
                'blockNumber' => $result['blockNumber'],
                'blockHash' => $result['blockHash'] ?? null,
                'parentHash' => $result['parentHash'] ?? null,
                'gasUsed' => $result['gasUsed'],
                'message' => 'Voto registrado en blockchain'
            ];

        } catch (\Exception $e) {
            Log::error("submitVote error: {$e->getMessage()}");
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Error enviando voto'
            ];
        }
    }

    //Crear votacion
    public function createVotation($votationId, $title, $description, $startDate, $endDate)
    {
        try {
            $result = $this->sendTransaction('createVotation', [
                $votationId,
                $title,
                $description,
                $startDate,
                $endDate
            ]);

            return [
                'success' => true,
                'transactionHash' => $result['txHash'],
                'blockNumber' => $result['blockNumber'],
                'blockHash' => $result['blockHash'],
                'parentHash' => $result['parentHash'],
                'votationId' => $votationId,
                'message' => 'Votación creada en blockchain'
            ];

        } catch (\Exception $e) {
            return $this->handleError($e, 'Error creando votación');
        }
    }

    // Actualizar
    public function updateVotation($votationId, $title, $description, $startDate, $endDate, $state)
    {
        try {
            // Convertir state string a uint8 para enum de Solidity
            $stateMap = ['pending' => 0, 'active' => 1, 'completed' => 2, 'cancelled' => 3];
            $stateInt = $stateMap[strtolower($state)] ?? 0;

            $result = $this->sendTransaction('updateVotation', [
                $votationId,
                $title,
                $description,
                $startDate,
                $endDate,
                $stateInt
            ]);

            return [
                'success' => true,
                'transactionHash' => $result['txHash'],
                'blockNumber' => $result['blockNumber'],
                'blockHash' => $result['blockHash'],
                'parentHash' => $result['parentHash'],
                'message' => 'Votación actualizada en blockchain'
            ];

        } catch (\Exception $e) {
            return $this->handleError($e, 'Error actualizando votación');
        }
    }

    // Cancelar (repito que en blockchain no se puede eliminar)
    public function cancelVotation($votationId, $reason)
    {
        try {
            $result = $this->sendTransaction('cancelVotation', [
                $votationId,
                $reason
            ]);

            return [
                'success' => true,
                'transactionHash' => $result['txHash'],
                'blockNumber' => $result['blockNumber'],
                'blockHash' => $result['blockHash'],
                'parentHash' => $result['parentHash'],
                'message' => 'Votación cancelada'
            ];

        } catch (\Exception $e) {
            return $this->handleError($e, 'Error cancelando votación');
        }
    }

    // Finalizar
    public function finishVotation($votationId)
    {
        try {
            $result = $this->sendTransaction('finishVotation', [
                $votationId
            ]);

            return [
                'success' => true,
                'transactionHash' => $result['txHash'],
                'blockNumber' => $result['blockNumber'],
                'blockHash' => $result['blockHash'],
                'parentHash' => $result['parentHash'],
                'message' => 'Votación finalizada'
            ];

        } catch (\Exception $e) {
            return $this->handleError($e, 'Error finalizando votación');
        }
    }

    /**
     * web3.php usa callbacks asíncronos: hay que esperar al callback
     * o devuelvo directamente success antes de tener respuesta del nodo.
     *
     * Devuelve además la versión del cliente RPC para que el monitor
     * pueda distinguir Hardhat (dev) de Besu (producción).
     */
    public function checkConnection()
    {
        try {
            $blockNumber = null;
            $rpcError = null;
            $completed = false;

            $this->getWeb3()->eth->blockNumber(function ($err, $bn) use (&$blockNumber, &$rpcError, &$completed) {
                if ($err !== null) {
                    $rpcError = $err;
                } elseif ($bn !== null) {
                    $blockNumber = $bn->toString();
                }
                $completed = true;
            });

            $waitMs = 0;
            while (!$completed && $waitMs < 5000) {
                usleep(100000);
                $waitMs += 100;
            }

            if (!$completed) {
                return [
                    'success' => false,
                    'error' => 'Timeout esperando respuesta RPC (blockNumber)',
                    'message' => 'Error de conexión',
                ];
            }

            if ($rpcError !== null) {
                $msg = is_object($rpcError) && method_exists($rpcError, 'getMessage')
                    ? $rpcError->getMessage()
                    : (string) $rpcError;

                return [
                    'success' => false,
                    'error' => $msg,
                    'message' => 'Error de conexión',
                ];
            }

            $clientVersion = $this->fetchClientVersion();
            $expectedClient = env('BLOCKCHAIN_EXPECTED_CLIENT'); // ej. "besu" en producción
            $clientMatches = ($expectedClient && $clientVersion !== null)
                ? str_contains(strtolower($clientVersion), strtolower($expectedClient))
                : null;

            return [
                'success' => true,
                'blockNumber' => $blockNumber,
                'clientVersion' => $clientVersion,
                'expectedClient' => $expectedClient,
                'clientMatches' => $clientMatches,
                'message' => 'Conectado a blockchain',
            ];
        } catch (\Exception $e) {
            Log::error("checkConnection error: {$e->getMessage()}");
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Error de conexión',
            ];
        }
    }

    /**
     * Lectura best-effort de web3_clientVersion. Si el nodo no responde a
     * tiempo o devuelve un error, devolvemos null para no bloquear la salud.
     */
    private function fetchClientVersion(): ?string
    {
        $version = null;
        $completed = false;

        try {
            $this->getWeb3()->clientVersion(function ($err, $result) use (&$version, &$completed) {
                if ($err === null && $result !== null) {
                    $version = is_string($result) ? $result : (string) $result;
                }
                $completed = true;
            });
        } catch (\Throwable $e) {
            Log::warning("clientVersion error: {$e->getMessage()}");
            return null;
        }

        $waitMs = 0;
        while (!$completed && $waitMs < 2000) {
            usleep(100000);
            $waitMs += 100;
        }

        return $version;
    }

    // Verificación extra para asegurar que el bloque (y ancestros necesarios) existan en BD antes de referenciarlos
    public function ensureBlockExists($blockHash, $blockNumber, $previousHash = null): void
    {
        if (!$blockHash) {
            return;
        }

        $existing = Block::where('hash', $blockHash)->first();
        if ($existing !== null) {
            if ($existing->chain_timestamp === null || (int) $existing->chain_timestamp === 0) {
                $meta = $this->getBlockByHash($blockHash);
                $chainTs = $this->normalizeBlockChainTimestamp($meta['timestamp'] ?? null);
                if ($chainTs !== null) {
                    $existing->chain_timestamp = $chainTs;
                    $existing->save();
                }
            }

            return;
        }

        $isGenesis = !$previousHash || $previousHash === '0x0000000000000000000000000000000000000000000000000000000000000000';
        if (!$isGenesis && !Block::where('hash', $previousHash)->exists()) {
            $parentBlock = $this->getBlockByHash($previousHash);
            if ($parentBlock) {
                $parentNumber = $parentBlock['blockNumber'];
                $parentHash = $parentBlock['parentHash'] ?? null;
                $this->ensureBlockExists($previousHash, $parentNumber, $parentHash);
            }
        }

        $meta = $this->getBlockByHash($blockHash);
        $chainTs = $this->normalizeBlockChainTimestamp($meta['timestamp'] ?? null);

        Block::create([
            'hash' => $blockHash,
            'blockNumber' => $blockNumber ?? 0,
            'previousHash' => $previousHash,
            'transactions' => 1,
            'isValid' => true,
            'chain_timestamp' => $chainTs,
        ]);
        Log::info("Bloque insertado: {$blockHash}", ['parentHash' => $previousHash, 'chain_timestamp' => $chainTs]);
    }

    // Unix seconds del bloque en cadena (Ethereum quantity hex o decimal)
    private function normalizeBlockChainTimestamp(mixed $raw): ?int
    {
        if ($raw === null) {
            return null;
        }
        if (is_int($raw)) {
            return $raw > 0 ? $raw : null;
        }
        if (is_string($raw)) {
            $raw = trim($raw);
            if ($raw === '') {
                return null;
            }
            if (str_starts_with(strtolower($raw), '0x')) {
                return (int) hexdec(substr($raw, 2));
            }
            if (ctype_digit($raw)) {
                return (int) $raw;
            }
        }
        if (is_object($raw) && method_exists($raw, 'toString')) {
            return $this->normalizeBlockChainTimestamp($raw->toString());
        }

        return null;
    }

    // Manejo de errores
    private function handleError($e, $message)
    {
        return [
            'success' => false,
            'error' => $e->getMessage(),
            'message' => $message
        ];
    }
}

