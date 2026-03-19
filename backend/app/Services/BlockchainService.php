<?php

namespace App\Services;

use Web3\Web3;
use Web3\Contract;
use Web3Providers\HttpProvider;

class BlockchainService
{
    private $web3;
    private $simpleVoting;

    public function __construct()
    {
        $rpc = env('BESU_RPC_URL', 'http://localhost:8545');
        $this->web3 = new Web3(new HttpProvider($rpc));

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

    // Esperar receipt de la transacción
    private function waitForReceipt($txHash, $maxAttempts = 15, $sleepSeconds = 1)
    {
        $receipt = null;
        $attempts = 0;

        while ($receipt === null && $attempts < $maxAttempts) {
            $receipt = $this->web3->eth->getTransactionReceipt($txHash);
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
    
    // Enviar transacción genérica
    private function sendTransaction($method, $params, $gas = 300000)
    {
        $from = $this->getFromAddress();

        $txHash = $this->simpleVoting->send($method, $params, [
            'from' => $from,
            'gas' => '0x' . dechex($gas)
        ]);

        $receipt = $this->waitForReceipt($txHash);

        return [
            'txHash' => $txHash,
            'blockNumber' => $receipt->blockNumber ? $receipt->blockNumber->toString() : null,
            'gasUsed' => $receipt->gasUsed ? $receipt->gasUsed->toString() : null,
            'receipt' => $receipt
        ];
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
            return $this->handleError($e, 'Error enviando voto');
        }
    }

    //Crear votacion
    public function createVotation($title, $description, $startDate, $endDate)
    {
        try {
            $result = $this->sendTransaction('createVotation', [
                $title,
                $description,
                strtotime($startDate),
                strtotime($endDate)
            ]);

            return [
                'success' => true,
                'transactionHash' => $result['txHash'],
                'blockNumber' => $result['blockNumber'],
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
            $result = $this->sendTransaction('updateVotation', [
                $votationId,
                $title,
                $description,
                strtotime($startDate),
                strtotime($endDate),
                $state
            ]);

            return [
                'success' => true,
                'transactionHash' => $result['txHash'],
                'blockNumber' => $result['blockNumber'],
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
            $blockNumber = $this->web3->eth->blockNumber();

            return [
                'success' => true,
                'blockNumber' => $blockNumber->toString(),
                'message' => 'Conectado a blockchain'
            ];

        } catch (\Exception $e) {
            return $this->handleError($e, 'Error de conexión');
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