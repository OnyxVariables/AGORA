#!/bin/bash

echo "Iniciando Hardhat Node y despliegue de contrato"

echo "Iniciando Hardhat Node"
npx hardhat node --hostname 0.0.0.0 --port 8545 &
HARDHAT_PID=$!

echo "Esperando a que Hardhat Node esté ready"
sleep 15

echo "Verificando conexión con Hardhat Node"
until curl -s http://localhost:8545 > /dev/null; do
    echo "Hardhat Node no está listo, esperando..."
    sleep 2
done
echo "Hardhat Node está listo!"

echo "Compilando contrato"
npx hardhat compile

mkdir -p /var/www/html/storage/app

echo "Desplegando contrato..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy-simple.js --network localhost)

# Extraigo dirección del contrato
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o 'SimpleVoting desplegado en: [^[:space:]]*' | cut -d' ' -f4)

if [ -z "$CONTRACT_ADDRESS" ]; then
    echo "Error: No se pudo obtener la dirección del contrato"
    kill $HARDHAT_PID
    exit 1
fi

echo "Contrato desplegado en: $CONTRACT_ADDRESS"

echo "Copiando ABI a storage"
cp artifacts/contracts/SimpleVoting.sol/SimpleVoting.json /var/www/html/storage/app/

echo "Actualizando .env"
if ! grep -q "SIMPLE_VOTING_ADDRESS=" /var/www/html/.env; then
    echo "SIMPLE_VOTING_ADDRESS=$CONTRACT_ADDRESS" >> /var/www/html/.env
else
    sed -i "s/SIMPLE_VOTING_ADDRESS=.*/SIMPLE_VOTING_ADDRESS=$CONTRACT_ADDRESS/" /var/www/html/.env
fi

echo "Configuración completada!!!"
echo "Contrato listo para usar en: $CONTRACT_ADDRESS"
echo "Laravel ya puede conectarse al contrato"
echo "Hardhat Node corriendo en PID: $HARDHAT_PID"

# Mantengo el contenedor corriendo con Hardhat Node, importante o falla
echo "Manteniendo Hardhat Node activo..."
wait $HARDHAT_PID