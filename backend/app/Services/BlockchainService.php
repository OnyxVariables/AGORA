<?php

namespace App\Services;

use Web3\Web3;
use Web3\Contract;
use Web3\Providers\HttpProvider;
use Illuminate\Support\Facades\Log;

class BlockchainService
{
    private $web3;
    private $simpleVoting;

    public function __construct()
    {
        $rpc = env('BESU_RPC_URL', 'http://localhost:8545');
        // Timeout de 5 segundos para requests HTTP
        $provider = new HttpProvider($rpc, 5);
        $this->web3 = new Web3($provider);

        $abiJson = json_decode(file_get_contents(storage_path('app/SimpleVoting.json')));
        $this->simpleVoting = new Contract($this->web3->provider, $abiJson->abi);

        $contractAddress = env('SIMPLE_VOTING_ADDRESS');
        if (!$contractAddress) {
            throw new \Exception("SIMPLE_VOTING_ADDRESS no configurado");
        }

        $this->simpleVoting->at($contractAddress);
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

        $this->web3->eth->getBlockByHash($blockHash, false, $callback);

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
                $this->web3->eth->getTransactionReceipt($txHash, function ($err, $r) use (&$callbackCompleted, &$callbackError, &$callbackResult) {
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
        $attempt = 0;

        do {
            try {
                $txHash = null;
                $error = null;

                // web3.php requiere callback como último parámetro
                // Los parámetros deben pasarse individuales, no como array
                $completed = false;
                $callback = function ($err, $result) use (&$txHash, &$error, &$completed) {
                    if ($err) {
                        $error = $err;
                    } else {
                        $txHash = $result;
                    }
                    $completed = true;
                };

                // Preparar argumentos: método, params individuales, opciones, callback
                $args = array_merge([$method], $params, [['from' => $from, 'gas' => '0x' . dechex($gas)], $callback]);
                call_user_func_array([$this->simpleVoting, 'send'], $args);

                // Esperar a que el callback se ejecute (max 10 segundos)
                $waitStart = time();
                while (!$completed && (time() - $waitStart) < 10) {
                    usleep(100000); // 100ms
                }

                if (!$completed) {
                    throw new \Exception("Timeout esperando respuesta del nodo");
                }

                if ($error !== null) {
                    throw new \Exception($error->getMessage());
                }

                if ($txHash === null) {
                    throw new \Exception("No se obtuvo hash de transacción");
                }

                $receipt = $this->waitForReceipt($txHash);

                // Convertir blockNumber a decimal si es hex, por ejemplo 0x1, 0x2, 0x3, etc.
                $blockNumber = $receipt->blockNumber;
                if (is_string($blockNumber) && str_starts_with($blockNumber, '0x')) {
                    $blockNumber = hexdec(substr($blockNumber, 2));
                } elseif (is_object($blockNumber) && method_exists($blockNumber, 'toString')) {
                    $blockNumber = (int) $blockNumber->toString();
                }

                // Obtengo bloque completo para extraer parentHash (previousHash)
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
                    'gasUsed' => $receipt->gasUsed ? (is_object($receipt->gasUsed) ? $receipt->gasUsed->toString() : $receipt->gasUsed) : null,
                    'receipt' => $receipt
                ];

            } catch (\Exception $e) {
                $attempt++;
                Log::warning("Intento $attempt para $method fallido: {$e->getMessage()}");
                sleep(1);

                if ($attempt >= $maxRetries) {
                    throw new \Exception("Error enviando la transacción tras $maxRetries intentos: " . $e->getMessage());
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

    // Verificar conexion (es como un ping a mis nodos de BESU)
    public function checkConnection()
    {
        try {
            $blockNumber = null;
            $this->web3->eth->blockNumber(function ($err, $bn) use (&$blockNumber) {
                if ($err !== null) throw $err;
                $blockNumber = $bn->toString();
            });

            return [
                'success' => true,
                'blockNumber' => $blockNumber,
                'message' => 'Conectado a blockchain'
            ];
        } catch (\Exception $e) {
            Log::error("checkConnection error: {$e->getMessage()}");
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Error de conexión'
            ];
        }
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