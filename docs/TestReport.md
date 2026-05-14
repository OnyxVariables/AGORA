# Informe de pruebas – AGORA
Este documento resume el **proceso** seguido para implementar el plan maestro de pruebas, las **correcciones** aplicadas al código, y cómo **ejecutar** cada capa de tests.


## 1. Proceso seguido
1. **Análisis del repositorio**: revisión de Laravel (`VoteController`, `VotationController`, `BlockchainService`), React (`Partidos`, CRUD, auth), Spring Boot (`BlockchainListenerService`, `VotationService`), contrato `SimpleVoting.sol`, `compose.dev.yml` y esquema SQL.
2. **Corrección de bugs bloqueantes** (antes de validar el flujo end-to-end):
   - Alineación del **payload del voto** (JSON plano + `municipalityId` + `municipalityId` en `/api/me`).
   - Tabla puente **`vote_intent`** para correlacionar `voteHash` ↔ `userId` cuando Spring procesa `VoteSubmitted`.
   - **Spring Boot**: entidades JPA (`AppUser`, `VoteIntentEntity`, `VoteEntity`, `BlockEntity`), `VoteProcessingService`, listener actualizado; `BlockchainListenerService` condicionado por `agora.blockchain-listener.enabled` para tests.
   - **Modelo `Vote`**: claves foráneas correctas en relaciones Eloquent.
   - Scripts **Hardhat** `interact-simple.js` / `test-simple.js`: `createVotation` con 5 argumentos.
3. **Implementación de tests automatizados** en el orden: PHPUnit → JUnit → Vitest → Hardhat; Postman (colección estática); Cypress (esqueleto E2E).
4. **Ejecución en Docker** donde el entorno local no tenía Java/Node global (Maven, Node 22).


## 2. Bugs corregidos (resumen)
| ID | Descripción |
|----|-------------|
| BUG-1 | Frontend enviaba `vote: { municipality, ... }`; backend esperaba campos raíz + `municipalityId`. |
| BUG-2 | `Vote` model `belongsTo` con FK incorrecta. |
| BUG-3 | Scripts JS llamaban `createVotation` con 4 args; contrato exige `votationId` explícito. |


## 3. Cómo ejecutar las pruebas
### 3.1 Laravel (PHPUnit)
```bash
cd backend
php artisan test
```

Esquema mínimo de test: `database/migrations/testing/`. Fixture ABI: `tests/TestCase::ensureBlockchainAbiFixture()`. Variables: `.env.testing`, `phpunit.xml` (`APP_KEY`, sqlite in-memory).

> [!NOTE]
> **Última ejecución verificada:** 21 tests, todos pasando (Docker `composer:2`).

### 3.2 Spring Boot (JUnit)
```bash
cd votations
./mvnw test
```

Perfil `test`: H2 en memoria, `agora.blockchain-listener.enabled=false` para no levantar Web3 en contexto de test.

> [!NOTE]
> **Última ejecución verificada:** tests pasando (Docker `maven:3.9-eclipse-temurin-21`).

### 3.3 Frontend (Vitest)
```bash
cd frontend
npm install
npm test
```

### 3.4 Contrato (Hardhat)
```bash
cd blockchain
npm install
npx hardhat test
```

### 3.5 Postman / Newman
Ver [docs/postman/README.md](postman/README.md).

### 3.6 Cypress (E2E)
Requiere aplicación servida (p. ej. nginx `8080` en `compose.dev.yml`).
```bash
cd frontend
npm install
npx cypress run
```

> [!IMPORTANT]
> En modo desarrollo, `CertAuthController` usa un DNI fijo (admin). Los escenarios “ciudadano” en Cypress asumen que el backend devuelve `roleId=2` para ese flujo; si no, ajustar DNI de desarrollo o usar certificado real.


## 4. Resultados por categoría (implementación)
| Capa | Estado | Ubicación principal |
|------|--------|---------------------|
| PHPUnit | Implementado | `backend/tests/` |
| JUnit | Implementado | `votations/src/test/java/` |
| Vitest | Implementado | `frontend/src/__tests__/` |
| Hardhat | Implementado | `blockchain/test/SimpleVoting.test.js` |
| Postman | Colección + entorno | `docs/postman/` |
| Cypress | Specs base | `frontend/cypress/e2e/` |

*Documento generado como parte de la implementación del plan de pruebas AGORA.*