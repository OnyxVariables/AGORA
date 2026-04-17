# Arquitectura en tiempo de ejecución (AGORA)
Este documento describe **cómo está montado el sistema en el código actual**: servicios, puertos, flujos de datos y responsabilidades. Complementa [Diagrama_Arquitectura.md](Diagrama_Arquitectura.md) (visión de despliegue) corrigiendo detalles que deben alinearse con la implementación.

## Componentes principales
| Componente | Rol |
|------------|-----|
| **Frontend (React + Vite)** | UI ciudadano y administración; consume API Laravel; métricas en tiempo real vía WebSocket contra Spring Boot. |
| **API Laravel (PHP)** | CRUD de votaciones, usuarios, votos, métricas agregadas; **envía transacciones** al nodo EVM (Hardhat/Besu) con cuenta admin; autenticación Sanctum; **scheduler** que activa/finaliza votaciones en cadena. |
| **Spring Boot (Java)** | Escucha **eventos** del contrato vía Web3j; persiste estado en MariaDB; **no envía** transacciones de creación de votación/voto (eso lo hace Laravel). Tras evento de votación finalizada, ejecuta **Ley D’Hondt** leyendo votos desde **MariaDB** y escribe la tabla `seat`. Expone **WebSocket STOMP** para difundir métricas de votos. |
| **MariaDB** | Fuente de verdad relacional: usuarios, votaciones, votos, provincias/municipios, escaños calculados, bloques referenciados. |
| **Nodo EVM (Hardhat en dev / Besu en prod)** | Contrato `SimpleVoting.sol`: registro auditable de votos y ciclo de vida de votaciones (`createVotation`, `finishVotation`, etc.). |
| **Nginx (compose `server`)** | En desarrollo suele exponer **8080** como entrada única a frontend estático y API PHP. |

## Puertos habituales (desarrollo, `compose.dev.yml`)
| Puerto | Servicio |
|--------|----------|
| 8080 | Nginx (frontend + proxy a PHP) |
| 8000 | Laravel (directo al contenedor `backend`, si se usa sin Nginx) |
| 5173 | Vite (desarrollo con hot reload) |
| 8081 | Spring Boot (HTTP + WebSocket `/ws`) |
| 8545 | Hardhat JSON-RPC |
| 33306 | MariaDB (mapeado desde 3306 del contenedor) |

Variables relevantes: `VITE_API_URL`, `VITE_SPRING_WS_URL` (p. ej. `ws://localhost:8081/ws`), ver [.env.example](../.env.example).

## Flujo de una votación (alto nivel)
1. **Alta (admin)** — `POST /api/votations`: solo **MariaDB** (`state = pending`, `endDate = startDate + 12 h`). No se llama aún al contrato.
2. **Activación programada** — Comando Artisan `votations:process-lifecycle` (registrado en el **scheduler** de Laravel, cada minuto). Cuando llega `startDate` y aún no hay `txHash`, Laravel llama `createVotation` en cadena y, **tras receipt confirmado**, guarda `txHash`, bloque de inicio y **`state = active`**. En el contrato, `createVotation` ya deja la votación en `Active`; la BD debe alinearse aquí **sin depender** de que Spring Boot haya procesado el evento (si el listener va retrasado o caído, antes la fila podía quedar en `pending` y el scheduler no encontraba filas para finalizar).
3. **Sincronía de estado (Spring)** — Spring Boot sigue escuchando `VotationCreated` y puede marcar **active** (idempotente si Laravel ya actualizó). No es la única fuente de verdad para ese paso.
4. **Votación** — El ciudadano vota vía Laravel; Laravel envía `submitVote` al contrato; Spring procesa el evento `VoteSubmitted` y persiste el voto en MariaDB.
5. **Cierre** — El scheduler llama `finishVotation` cuando `endDate <= now()` y la votación está **activa en BD** o en transición antigua (`pending` con `txHash` ya guardado). Tras receipt, Laravel pone **`state = finished`** y `endBlockHash`. Spring recibe `VotationFinished`, puede reconfirmar **finished** y ejecuta **D’Hondt** sobre votos en BD → tabla `seat`.
6. **Resultados** — Endpoints públicos Laravel `GET /api/votations/{id}/results` (y `/results/summary`) sirven datos cuando `state = finished`. El frontend `/resultados` consume estos datos.

## Operación en desarrollo
- **Scheduler Laravel**: la agenda **no se ejecuta sola** con solo levantar PHP-FPM o `artisan serve`. Hace falta `php artisan schedule:work` (o cron con `schedule:run` cada minuto), o en Docker dev el servicio **`scheduler`** de `compose.dev.yml`. Sin esto, las votaciones se quedan en `pending` aunque haya pasado `startDate`.
- **Contrato desplegado**: el stack dev espera a Hardhat saludable y al artefacto del contrato en el backend (véase healthcheck en `compose.dev.yml`).

## Contraste con documentación genérica
- El **cálculo D’Hondt no lee la cadena bloque a bloque** para sumar votos: usa los registros de la tabla `vote` y la configuración de escaños por provincia (`province.totalSeats`), tras la finalización on-chain.
- **Laravel y Spring comparten la misma base MariaDB**; no hay “microservicio de cálculo” que sea la única fuente de votos: la persistencia del voto tras el evento la hace Spring, pero la API de negocio principal sigue siendo Laravel.

## Referencias de código (orientativas)
- Scheduler: `backend/app/Console/Commands/ProcessVotationLifecycle.php`, `bootstrap/app.php` (`withSchedule`).
- API votaciones: `backend/app/Http/Controllers/VotationController.php`.
- Envío a cadena: `backend/app/Services/BlockchainService.php`.
- Listener y D’Hondt: `votations/.../BlockchainListenerService.java`, `DHondtCalculationService.java`.
- Contrato: `blockchain/contracts/SimpleVoting.sol`.