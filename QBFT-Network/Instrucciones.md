# Guía Oficial: Despliegue de Red Blockchain QBFT con Hyperledger Besu
Esta documentación detalla los pasos para configurar una red permisionada de 4 nodos utilizando el consenso QBFT en instancias de AWS EC2.

> [!IMPORTANT]
> **ESTADO ACTUAL DEL PROYECTO (MANUAL):**
> Todos los pasos descritos en esta guía se ejecutan **manualmente en cada una de las 4 máquinas** (nodos). Esto implica configurar la red, instalar dependencias, sincronizar relojes y gestionar archivos de configuración de forma individual.
> 
> **PRÓXIMA EVOLUCIÓN (AUTOMATIZACIÓN):**
> Para entornos de producción y escalabilidad, el objetivo final es migrar esta arquitectura a **Kubernetes (K8s)**. Mediante el uso de **StatefulSets**, **ConfigMaps** y **Persistent Volume Claims (PVC)**, se podrá levantar, conectar y auditar toda la red con un solo comando, eliminando el error humano y la configuración artesanal.


## 1. Instalación del Entorno (Docker & Engine)
Antes de arrancar los nodos, necesitamos preparar el sistema operativo (Ubuntu) para soportar contenedores.

### Actualizar repositorios e instalar dependencias básicas
- `sudo apt update`
- `sudo apt install ca-certificates curl gnupg -y`

### Configurar el llavero de seguridad para Docker
- `sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg`

### Añadir el repositorio oficial de Docker a las fuentes de APT
- `echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`

### Instalar Docker Engine y Docker Compose Plugin
- `sudo apt update`
- `sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y`

### Verificación de versiones
- `docker --version`
- `docker compose version`

### Configurar permisos para ejecutar docker sin 'sudo'
- `sudo usermod -aG docker $USER`
- `exit`

> [!IMPORTANT]
> Debes cerrar sesión y volver a entrar tras ejecutar la configuración de permisos

### Tras re-loguear, verificar grupo y activar servicio
- `groups`
- `sudo systemctl start docker`
- `sudo systemctl enable docker`
- `sudo systemctl status docker`

> [!TIP]
> Puedes ahorrarte estos paso usando `newgrp docker`


## 2. Sincronización Crítica de Tiempo (NTP)
En redes de consenso BFT (QBFT/IBFT2), si los relojes de las máquinas tienen un desfase superior a 5 segundo, los nodos rechazarán los bloques de los demás ("Clock Drift").

Ejecutar en las 4 instancias casi a la vez:
- Forzar sincronización inmediata con el pool de Ubuntu
    - `sudo service chrony stop`
    - `sudo chronyd -q 'pool ntp.ubuntu.com iburst'`
    - `sudo service chrony start`

- Verificar precisión (debe casi idéntica en todos los nodos)
    - `date +"%T.%3N"`

> [!CAUTION]
> Usa el código con precaución.


## 3. Comandos de Verificación de la Red
Una vez levantados los contenedores con `docker compose up -d`, utilizamos la interfaz JSON-RPC para auditar el estado de la cadena.

### Consultar número de Pares (Peers)
Indica a cuántos otros nodos está conectado el nodo actual. Por ejemplo, en una red de 4, el resultado esperado es 0x3.
- `curl -X POST --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}" http://localhost:8545`

> [!WARNING]
> Revisa que el puerto 8545 (TCP) esté abierto en el Security Group de AWS.

### Consultar Altura de Bloque
Muestra el bloque actual. Si la red funciona, este número debe subir cada X segundos (según el blockperiodseconds).
- `curl -X POST --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://localhost:8545`

> [!WARNING]
> Revisa que el puerto 8545 (TCP) esté abierto en el Security Group de AWS.

## 4. Diagnóstico de Problemas Comunes
### Revisar logs de minería
Para confirmar que el consenso QBFT está importando bloques correctamente, meterse en la primera máquina donde se lanza el nodo-1 y ejecutar:
- `docker logs besu-node1 | grep "Imported"`

> [!TIP]
> Log esperado: 2026-02-27 00:30:04.024+0000 | BftProcessorExecutor-QBFT-0 | INFO  | QbftBesuControllerBuilder | Imported empty block #10 / 0 tx / 0 pending / 0 (0.0%) gas / (0x37a2a124f2e164a059691adff8fe2e3c3e7b7d6d36eb378e0a3923c98eeda1d7)

> [!WARNING]
> Si no aparece: Revisa que el puerto 30303 (TCP/UDP) esté abierto en el Security Group de AWS.

### El error del RLP (ExtraData)
Si el contenedor se detiene inmediatamente con el error `RLP item at offset 66...` , significa que el campo **extraData** del **genesis.json** está mal formateado.

**Solución**: Asegurarse de que el extraData sea una cadena hexadecimal continua sin saltos de línea ni caracteres invisibles.

### Error de Parseo en Windows
Si ejecutas los comandos curl desde el CMD de Windows, recuerda escapar las comillas dobles:
- **Mal**: `"{ "jsonrpc"..." }"`
- **Bien**: `"{\"jsonrpc\":\"2.0\"...}"`
