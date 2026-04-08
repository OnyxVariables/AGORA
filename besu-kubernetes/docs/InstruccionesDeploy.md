# Manual oficial: Red QBFT Distribuida en Kubernetes (K3s)
Este documento detalla la automatización del despliegue de una red Hyperledger Besu con consenso QBFT sobre 4 instancias de AWS EC2 orquestadas por un cluster de Kubernetes (K3s).


## 1. Preparación de Infraestructura (AWS)
Antes de instalar software, las 4 instancias deben pertenecer al mismo Security Group con las siguientes reglas de entrada configuradas:
### Grupos de seguridad (Secutiry Groups)
| Protocolo | Puerto | Origen               | Propósito                                      |
|-----------|--------|----------------------|-----------------------------------------------|
| TCP       | 6443   | 0.0.0.0/0            | API Server de Kubernetes (Unión de nodos)    |
| UDP       | 8472   | 0.0.0.0/0            | Red interna del cluster (Flannel VXLAN)      |
| TCP       | 10250  | 0.0.0.0/0            | Métricas de Kubelet                          |
| TCP       | 30303  | 0.0.0.0/0            | Comunicación P2P de datos entre nodos        |
| UDP       | 30303  | 0.0.0.0/0            | Descrubrimiento de nodos de la red           |
| TCP       | 30001  | IP Pública del admin | Acceso JSON-RPC (API para PHP)               |
| TCP       | 22     | IP Pública del admin | Acceso SSH para administración               |
| TCP       | 80     | 0.0.0.0/0            | Accesi web AGORA                             |
| TCP       | 443    | 0.0.0.0/0            | Acceso Web Seguro AGORA                      |
| TCP       | 30000  | 0.0.0.0/0            | Interfaz Web de Grafana (Dashboards)         |
| TCP       | 25000  | 0.0.0.0/0            | Quorum Explorer (Blockchain Explorer)        |

> [!CAUTION]
> El despliegue puede fallar debido a que no hay recursos disponibles en la instancia. En ese caso o liberar espacio o crearse una nueva instancia y seguir los pasos descritos en este documento.


## 2. Configuración del Cluster K3s (Control Plane)
En la Máquina Principal (Por ejemplo: Master - IP: 172.31.90.224)
1. Instalar el servidor K3s:
    - `curl -sfL https://get.k3s.io/ | sh -`
2. Instalar helm:
    - `curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
    chmod 700 get_helm.sh
    ./get_helm.sh`
3. Obtener el Token de unión (esperar 30s):
    - `sudo cat /var/lib/rancher/k3s/server/node-token`
4. Configurar permisos de kubectl de forma permanente para el usuario actual:
    - `sudo chmod 644 /etc/rancher/k3s/k3s.yaml`
    - `echo "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml" >> ~/.bashrc`
    - `source ~/.bashrc`


## 3. Conexión de Nodos Trabajadores (Workers)
**En las otras 3 máquinas (Instancias 2, 3 y 4)**
ejecutar el comando de unión sustituyendo el token obtenido del Master:
- `curl -sfL https://get.k3s.io/ | K3S_URL=https://<IP_PRIVADA_DEL_MASTER>:6443 K3S_TOKEN=<TOKEN_DEL_MASTER> sh -`

<br>**Verificación (Desde el Master):**
`kubectl get nodes`  

> [!NOTE]
> Se verán las 4 máquinas con estado 'Ready'


## 4. Estructura del Proyecto
El proyecto se organiza de la siguiente manera en la máquina Master:
```text
besu-kubernetes/
├── k8s-manifests/
│   ├── besu-servicemonitor.yaml
│   ├── secrets.yaml
│   ├── service.yaml
│   ├── statefulset.yaml
│   └── quorum-explorer.yaml
│
├── network-config/
│   ├── genesis.json
│   └── static-nodes.json
│
└── scripts/
    └── deploy.sh
```

### k8s-manifests
| Archivo | Descripción |
|----------|-------------|
| `besu-servicemonitor.yaml` | Puente entre Besu y Grafana |
| `secrets.yaml` | Claves privadas codificadas en Base64 (`key-0` a `key-3`). |
| `service.yaml` | Servicio interno y exposición de RPC. |
| `statefulset.yaml` | Orquestación de las 4 réplicas de Besu. |
| `quorum-explorer.yaml` | Interfaz web para explorar la blockchain. |

### network-config
| Archivo | Descripción |
|----------|-------------|
| `genesis.json` | Configuración del bloque génesis con validadores QBFT. |
| `static-nodes.json` | Lista de nodos estáticos (bootnodes opcionales). |

### scripts
| Archivo | Descripción |
|----------|-------------|
| `deploy.sh` | Script de despliegue automatizado del cluster. |


## 5. Despliegue de la Red Blockchain
1. Preparar Secretos: Las claves privadas deben estar en Base64 dentro de secrets.yaml. Para ello ejecutar con cada clave privada:
    - `echo -n "clave_sin_0x" | base64`

2. Ejecutar el script automatizado (script.sh):
    - `cd ~/besu-kubernetes/scripts`
    - `chmod +x deploy.sh`
    - `./deploy.sh`

### ¿Qué hace deploy.sh?
El script automatiza la creación del **ConfigMap** desde los archivos JSON, despliega el stack de monitoreo Kube-Prometheus-Stack mediante Helm para recolectar métricas de BESU y aplica los manifiestos en el orden correcto: **ConfigMap → Secrets → Service → StatefulSet → Besu-servicemonitor**


## 6. Comandos de Gestión y Monitoreo
| Acción                          | Comando                                                       |
|---------------------------------|---------------------------------------------------------------|
| Script de despliegue            | `./deploy.sh`                                                 |
| Ver estado de la red            | `kubectl get pods -n besu`                                    |
| Ver estado de la red (extendido)| `kubectl get pods -n besu -o wide`                            |
| Listar servicios del clúster    | `kubectl get svc -n besu`                                     |
| Ver logs en vivo (Nodo 0)       | `kubectl logs -n besu -f besu-0`                              |
| Entrar al contenedor            | `kubectl exec -it -n besu besu-0 -- /bin/bash`                |
| Reiniciar despliegue            | `kubectl delete statefulset besu -n besu`                     |
| Limpieza total de datos cache   | `kubectl delete pvc --all -n besu`                            |
| Obtener contraseña de Grafana   | `kubectl get secret -n besu monitoring-grafana -o jsonpath="{.data.admin-password}" \| base64 -d ; echo` |
| Verificar métricas en Prometheus| `curl -X GET http://<IP_NODO>:9545/metrics`                   |

### Consultas JSON-RPC (Desde una máquina cualquiera o Master)
- Ver cantidad de pares conectados (Resultado esperado: 0x3)
    - `curl -X POST --data "{\"jsonrpc\":\"2.0\",\"method\":\"net_peerCount\",\"params\":[],\"id\":1}" http://<IP_PUBLICA_MASTER>:30001`

- Ver altura de bloque actual
    - `curl -X POST --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}" http://<IP_PUBLICA_MASTER>:30001`

### Acceso al Panel de Monitoreo (Grafana)
Para visualizar el estado de los nodos, el consumo de CPU/RAM y las transacciones por segundo:
- **URL de acceso**: http://<IP_PUBLICA_MASTER>:30000

> [!IMPORTANT]
> Tener abierto el puerto 30000 en el security group de AWS

> [!TIP]
> Si al entrar sale **NO DATA**, mirar que el ServiceMonitor esté activo ejecutando: `kubectl get servicemonitor -n besu`

### Acceso al Quorum Explorer
Para explorar la blockchain de forma visual:
- **URL de acceso**: http://<IP_PUBLICA_MASTER>:25000
- Ver bloques, transacciones, cuentas y estadísticas en tiempo real

> [!IMPORTANT]
> Tener abierto el puerto 25000 en el security group de AWS


## Solución de Problemas (Troubleshooting)
1. Error **Permission Denied** en **k3s.yaml**:  
Si tras reiniciar pierdes acceso, ejecutar `source ~/.bashrc` o verificar que el export del KUBECONFIG apunta a **/etc/rancher/k3s/k3s.yaml**.

2. Pods en estado **Error** o **CrashLoopBackOff**:  
Generalmente causado por un error de sintaxis en el **StatefulSet** o IPs mal resueltas. Revisar con `kubectl logs besu-0`.

3. **peerCount** en **0x0**:  
Revisar que el puerto **UDP 30303** esté abierto en AWS. 

> [!IMPORTANT]
> Sin UDP no hay descubrimiento de nodos entre diferentes instancias.