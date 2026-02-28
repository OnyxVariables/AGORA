# QBFT Network: Infraestructura Hyperledger Besu
Este directorio contiene la configuración y orquestación para desplegar una red blockchain permisionada basada en **Hyperledger Besu** con consenso **QBFT (Quorum Byzantine Fault Tolerance)**.

## Configuración de la Red
El corazón de la red se define en el archivo `qbftConfigFile.json`. Este archivo es la "receta" que genera el genesis.json, el cual establece las reglas inmutables para todos los nodos:
- Protocolo de Consenso: QBFT.
- Chain ID: Identificador único de la red.
- Parámetros Técnicos: Tiempo entre bloques, dificultad inicial y asignación de gas.


## Generación de Artefactos (Genesis y Claves)
Para generar el bloque génesis y el par de claves (pública/privada) de cada nodo, utiliza la imagen oficial de Besu. Ejecuta el siguiente comando desde **PowerShell** estando en el directorio raíz `/QBFT-Network:`
``` text
docker run --rm -v ${PWD}:/data hyperledger/besu:latest `
  operator generate-blockchain-config `
  --config-file=/data/config/qbftConfigFile.json `
  --to=/data/networkFiles `
  --private-key-file-name=key
```


## Gestión de Archivos Generados
Tras la ejecución, distribuye los archivos de la siguiente manera:
1. **genesis.json**: Copiar a la raíz del proyecto (necesario para que todos los nodos inicien con el mismo estado).
2. **Claves** (**key** y **key.pub**): Mover cada par de claves a su carpeta Node-X correspondiente.
3. **static-nodes.json**: Este archivo contiene las claves públicas (enodes) y permite que los nodos se descubran y conecten entre sí automáticamente al arrancar.

> [!CAUTION]
> **SEGURIDAD DE CLAVES**: Las claves privadas (key) **NUNCA** deben subirse al repositorio. Son la identidad única de cada nodo; sin ellas, el nodo no puede firmar bloques ni ser validado por el consorcio.


## Opciones de Despliegue
Este proyecto está diseñado para evolucionar según las necesidades de infraestructura:
- **Opción A**: Despliegue manual (Docker Compose)  
Ideal para desarrollo y pruebas fáciles. Levanta los 4 nodos en máquinas distintas con **IP elastic**.
    - Manual: Ver [Guía de Despliegue Docker](docs/InstruccionesDocker.md)
- **Opción B**: Despliegue automatizado (Kubernetes / K3s)  
Arquitectura de producción sobre AWS EC2. Automatiza la resiliencia, el escalado y el monitoreo.
    - Manual: Ver [Manual de Kubernetes](besu-kubernetes/docs/InstruccionesDeploy.md)


## Monitoreo Avanzado
Independientemente del despliegue, la red está preparada para ser auditada mediante:
- RPC API: Consultas directas al puerto 30001 (o 8545 con Docker Compose).
- Grafana Dashboard (solo para despliegue con K3s): Visualización en tiempo real del estado de los nodos y consenso (Puerto 30000).
