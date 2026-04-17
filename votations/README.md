# AGORA — Spring Boot (`votations`)
Servicio que:
- Escucha eventos del contrato **SimpleVoting** vía Web3j (`BlockchainListenerService`).
- Persiste votos y actualiza estados de votación en **MariaDB** (misma base que Laravel).
- Tras el evento de votación **finalizada**, ejecuta la **Ley D’Hondt** y escribe en la tabla `seat` (`DHondtCalculationService`).
- Expone **WebSocket STOMP** en `/ws` para difundir métricas de votación al frontend de administración.

> [!IMPORTANT]
>**No** envía transacciones de creación de votación ni de voto: eso lo hace la API Laravel.

Configuración: `src/main/resources/application.properties`. 

Documentación del repositorio: 
- [../docs/Arquitectura_Runtime.md](../docs/Arquitectura_Runtime.md).