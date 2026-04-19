# Demostración local: muchos votos y opciones disponibles
Esta guía describe **todas las formas** de simular votación en local (sembrar ciudadanos, emitir votos por Artisan, login HTTP con DNI de prueba y script Python). Sigue el orden de las secciones para reducir errores.

> [!CAUTION]
> **Uso permitido:** solo entornos de desarrollo / demos en tu máquina. **No** habilitar opciones de demo en producción.


## Índice
1. [Requisitos previos (checklist)](#1-requisitos-previos-checklist)
2. [Variables de entorno](#2-variables-de-entorno)
3. [Qué camino elegir](#3-qué-camino-elegir)
4. [Opción A — `demo:seed-citizens`](#4-opción-a--demoseed-citizens)
5. [Opción B — `demo:cast-votes`](#5-opción-b--democast-votes)
6. [Opción C — Login HTTP con cabecera `X-Demo-DNI`](#6-opción-c--login-http-con-cabecera-x-demo-dni)
7. [Opción D — Script Python `tools/demo_vote_http.py`](#7-opción-d--script-python-toolsdemo_vote_httppy)
8. [Criterios que debe cumplir la votación](#8-criterios-que-debe-cumplir-la-votación)
9. [Fallos frecuentes y cómo resolverlos](#9-fallos-frecuentes-y-cómo-resolverlos)

## 1. Requisitos previos (checklist)
Antes de nada, confirma cada punto:
| # | Requisito | Cómo comprobarlo |
|---|-----------|------------------|
| 1 | Backend Laravel funcionando | Puedes abrir la app o llamar a un endpoint público (por ejemplo `GET /api/parties`). |
| 2 | `APP_ENV=local` en el `.env` del backend | Obligatorio para `demo:seed-citizens` y `demo:cast-votes`. Si usas `production`, los comandos **no** se ejecutan. |
| 3 | Base de datos cargada con al menos un **municipio** | `demo:seed-citizens` necesita un `municipalityId` válido (por defecto toma el primero de la tabla). |
| 4 | Votación creada y **votable** por ciudadanos | Ver [sección 8](#8-criterios-que-debe-cumplir-la-votación). |
| 5 | Partidos en BD con `active = true` (si vas a votar) | Necesario para reparto automático de partidos o para `--party=`. |
| 6 | Para votos reales (no `--dry-run`) | Blockchain accesible: `BESU_RPC_URL`, `SIMPLE_VOTING_ADDRESS`, `BLOCKCHAIN_ADMIN_ADDRESS` correctos en `.env`. |
| 7 | PHP y Composer instalados donde ejecutas Artisan | Comandos: `php artisan demo:...`. |
| 8 | Script Python (opcional) | Python 3.10+ y `pip install requests eth-hash`. |

## 2. Variables de entorno
Archivo **`.env` del backend** (ruta típica: `backend/.env`).
| Variable | Valor típico (demo local) | Efecto |
|----------|---------------------------|--------|
| `APP_ENV` | `local` | Activa los comandos Artisan `demo:*`. |
| `APP_URL` | `http://localhost:8000` (o el puerto que uses) | Debe coincidir con la URL que uses en navegador o en `--base-url` del script Python. |
| `AGORA_DEMO_AUTH` | `true` solo si quieres login por cabecera `X-Demo-DNI` | Si es `false`, `/api/login-cert` exige el flujo de certificado / cabeceras SSL como siempre. **Nunca `true` en producción.** |
| `BESU_RPC_URL` | URL del nodo (ej. `http://localhost:8545`) | Necesaria para enviar transacciones de voto. |
| `SIMPLE_VOTING_ADDRESS` | Dirección del contrato | Obligatoria para `BlockchainService`. |
| `BLOCKCHAIN_ADMIN_ADDRESS` | Cuenta que firma transacciones | Obligatoria para enviar votos. |

Tras cambiar `.env`, reinicia el servidor PHP (o el contenedor Docker) para que cargue los valores.

> [!NOTE]
>**Caché de configuración:** si usas `php artisan config:cache` en local, los cambios en `.env` no se reflejan hasta que ejecutes `php artisan config:clear`.


## 3. Qué camino elegir
```
¿Quieres la forma más simple para muchos votos sin pelear con cookies ni CSRF?
  → Sí: [Opción A](#4-opción-a--demoseed-citizens) + [Opción B](#5-opción-b--democast-votes) (recomendado).

¿Necesitas demostrar el flujo HTTP real (login + POST /api/vote) como en el navegador?
  → [Opción C](#6-opción-c--login-http-con-cabecera-x-demo-dni) + [Opción D](#7-opción-d--script-python-toolsdemo_vote_httppy).

¿Prefieres no tocar AGORA_DEMO_AUTH y usar cabeceras SSL falsas?
  → Usa `X-SSL-Verified: SUCCESS` y `X-SSL-Client-S-DN` con `serialNumber=IDCES-<DNI>` en herramientas como curl/Postman (no está detallado en este documento; el backend ya lo soporta en `CertAuthController`).
```


## 4. Opción A — `demo:seed-citizens`
Crea usuarios **ciudadanos** (`roleId = 2`) pensados para demo, con DNI con formato español (8 dígitos + letra) y nickname fijo `agora_demo_<número>`.

### Cuándo usarlo
- Necesitas muchos usuarios distintos en BD para votar después con `demo:cast-votes` o para exportar sus DNIs al script Python.

### Comando
```bash
cd backend
php artisan demo:seed-citizens [count]
```

### Argumentos
| Parámetro | Obligatorio | Valor por defecto | Descripción |
|-----------|-------------|-------------------|-------------|
| `count` | No | `50` | Número de ciudadanos a crear. Debe ser ≥ 1 (internamente se fuerza a mínimo 1). |

### Asignación de municipios
Cada usuario se asigna a un **municipio aleatorio** de entre todos los disponibles en la BD. Esto permite distribuir los votos geográficamente para probar el heatmap del mapa.

### Qué se inserta en BD
- **dni:** generado a partir de una base numérica; letra de control algoritmo DNI español.
- **name:** `Agora demo votante 1`, `Agora demo votante 2`, …
- **nicknamePassword:** `agora_demo_40000001`, `agora_demo_40000002`, … (coincide con el número interno usado para el DNI).
- **isActive:** `true`.
- **roleId:** `2` (ciudadano).

Si un DNI ya existe, esa fila se omite y verás un aviso `Omitido DNI duplicado ...`.

### Errores que puedes ver
| Mensaje | Causa | Qué hacer |
|---------|-------|-----------|
| `Este comando solo puede ejecutarse con APP_ENV=local` | `APP_ENV` no es `local` | Pon `APP_ENV=local` en `.env` y reinicia. |
| `No hay municipio válido` | No hay municipios o `--municipality` no existe | Importa datos base (`db/*.sql`) o pasa un `--municipality` válido. |

### Ejemplos
```bash
# 50 ciudadanos, distribuidos en municipios aleatorios
php artisan demo:seed-citizens

# 5000 ciudadanos para prueba de carga y heatmap
php artisan demo:seed-citizens 5000

# 200 ciudadanos
php artisan demo:seed-citizens 200
```


## 5. Opción B — `demo:cast-votes`
Recorre **todos los usuarios demo activos** (nickname `agora_demo_%`), calcula el mismo `voteHash` que el frontend (Keccak-256 de `nickname + código_hex_64 + votationId`) y envía el voto a la blockchain vía `BlockchainService`, con la misma lógica que `VoteController` (incluye `vote_intent` y reintentos).

### Cuándo usarlo
- Ya tienes usuarios creados con `demo:seed-citizens` (u otros con `nicknamePassword` como `agora_demo_*`).
- Quieres muchos votos sin usar el navegador ni el script Python.

### Comando
```bash
cd backend
php artisan demo:cast-votes {votationId} [--party=ID] [--dry-run]
```

### Argumentos y opciones
| Parámetro | Obligatorio | Descripción |
|-----------|-------------|-------------|
| `votationId` | **Sí** | ID numérico de la fila `votation` en BD. |
| `--party` | No | ID de partido. Puedes repetir la opción varias veces: `--party=1 --party=2 --party=3`. Si **no** indicas ningún `--party`, se usan **todos** los partidos con `active = true`, y se asigna un partido **aleatorio** a cada usuario. |
| `--dry-run` | No | No llama a la blockchain. Solo imprime por consola qué haría (DNI, partido, hash). Útil para validar DNIs y reparto sin `BESU_RPC_URL`. |

### Requisitos para que el comando no falle al inicio
1. `APP_ENV=local`.
2. La votación existe y cumple el scope `votableForCitizens` (ver [sección 8](#8-criterios-que-debe-cumplir-la-votación)).
3. Hay al menos un partido válido: o bien activos en BD, o los que pasas en `--party`.
4. Existe al menos un usuario con `roleId = 2`, `isActive = true` y `nicknamePassword LIKE 'agora_demo_%'`.
5. Sin `--dry-run`: la blockchain responde correctamente al chequeo de conexión.

### Código de salida
- `0` (éxito): todos los envíos han ido bien (en `--dry-run`, cuenta como éxito cada línea simulada).
- distinto de `0`: si **algún** voto falla tras reintentos, el comando termina con fallo (aunque otros hayan ido bien). Revisa el resumen `X enviados, Y fallidos`.

### Ejemplos
```bash
# Reparto aleatorio entre todos los partidos activos
php artisan demo:cast-votes 1

# Solo partidos 1 y 2, asignación aleatoria entre ellos
php artisan demo:cast-votes 1 --party=1 --party=2

# Probar sin blockchain
php artisan demo:cast-votes 1 --dry-run
```

### Nota sobre usuarios tras votar
El flujo real puede marcar al usuario como **no activo** cuando el backend Spring confirma el voto en cadena. Si repites el comando y ya no quedan usuarios `agora_demo_*` activos, verás el error de “no hay usuarios demo”. En ese caso vuelve a ejecutar `demo:seed-citizens` o restaura datos.


## 6. Opción C — Login HTTP con cabecera `X-Demo-DNI`
Sirve para **Postman**, **curl** o el **script Python**: autenticar como un usuario existente sin certificado.

### Condiciones
- `APP_ENV=local`
- `AGORA_DEMO_AUTH=true` en `.env`
- `php artisan config:clear` si tenías config cacheada

### Petición
- Método y ruta: `GET /api/login-cert` (misma ruta que el frontend).
- Cabecera: `X-Demo-DNI: <DNI exactamente como en la columna user.dni>` (se compara en mayúsculas en BD).
- El usuario debe existir y tener **`isActive = 1`** en BD.

Si `AGORA_DEMO_AUTH` es `false`, esta cabecera se ignora y se aplica el flujo normal de certificado (`X-SSL-Verified`, `X-SSL-Client-S-DN`, etc.).


## 7. Opción D — Script Python `tools/demo_vote_http.py`
Automatiza, para **cada DNI** de un fichero: cookie CSRF → login con `X-Demo-DNI` → `GET /api/me` → `POST /api/vote`.

### Dependencias
```bash
pip install requests eth-hash
```

### Invocación
```bash
python tools/demo_vote_http.py --base-url <URL_BACKEND> --votation-id <ID> --party-id <ID> --dni-file <RUTA>
```
| Argumento | Obligatorio | Descripción |
|-----------|-------------|-------------|
| `--base-url` | Sí | URL base del backend **sin** barra final. Ejemplo: `http://localhost:8000`. Debe ser la misma base que `APP_URL` / donde sirves Laravel. |
| `--votation-id` | Sí | ID de la votación. |
| `--party-id` | Sí | Un solo partido para **todos** los DNIs del fichero (el script no reparte en circular; eso solo lo hace `demo:cast-votes`). |
| `--dni-file` | Sí | Fichero de texto: **un DNI por línea**. Usuarios deben existir, estar activos y tener **nickname** en BD (`nicknamePassword` no vacío). |

### Fichero de DNIs
- Codificación recomendada: UTF-8.
- Los DNIs se normalizan a mayúsculas al leer.
- Puedes generar la lista exportando desde la BD los usuarios creados con `demo:seed-citizens` (columna `dni`).

### Cookie CSRF
El script llama a:
`GET {base-url}/sanctum/csrf-cookie`

Esa es la ruta estándar de Laravel Sanctum. El frontend del proyecto usa en configuración ` /api/sanctum/csrf-cookie`; si en tu instalación **solo** existe la ruta bajo `/sanctum/...`, usa este script tal cual. Si tu app solo expone el CSRF bajo `/api/...`, tendrás que cambiar esa línea en el script o añadir en Laravel una ruta equivalente (coherente con CORS y `SANCTUM_STATEFUL_DOMAINS`).

### Cabeceras y sesión
- Tras el CSRF, el script envía `X-XSRF-TOKEN` (valor decodificado de la cookie `XSRF-TOKEN`) en las peticiones siguientes.
- Cada DNI hace un nuevo “login”; la sesión de `requests` mantiene cookies entre peticiones del **mismo** DNI (login → me → vote).

### Código de salida
- `0` si **todos** los DNIs del fichero completan el voto con éxito.
- `1` si el fichero está vacío, falla el CSRF, o **algún** DNI falla.

### Requisitos por usuario (si no, el script avisa y sigue con el siguiente)
- Login 200.
- `GET /api/me` con `nickname` no vacío (si falta nickname, debes usar antes `POST /api/nickname` desde el frontend o insertarlo en BD).

### Ejemplo (PowerShell)
```powershell
cd C:\ruta\AGORA
$env:PYTHONUTF8 = "1"
python tools/demo_vote_http.py --base-url http://localhost:8000 --votation-id 1 --party-id 1 --dni-file dnis.txt
```


## 8. Criterios que debe cumplir la votación
El modelo aplica el scope `votableForCitizens`. Resumen práctico:
- **Estado:** `active` **o** (`pending` con `txHash` no nulo y no vacío).
- **Fecha de inicio:** `startDate <= ahora`.
- **Fecha de fin:** `endDate` es `NULL` **o** `endDate > ahora`.

Si `demo:cast-votes` dice que la votación no está abierta, revisa en BD la fila `votation` (fechas, estado, `txHash`) y el scheduler que activa votaciones en cadena si aplica.


## 9. Fallos frecuentes y cómo resolverlos
| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Comandos `demo:*` “solo local” | `APP_ENV` no es `local` | `APP_ENV=local` en `.env`. |
| `Blockchain no disponible` | Besu caído o URL mal | Comprueba `BESU_RPC_URL` y que el nodo escuche. |
| `SIMPLE_VOTING_ADDRESS` / excepción al construir `BlockchainService` | Variables faltantes | Completa `.env` y `config:clear`. |
| `No hay usuarios demo activos` | No hay filas con `agora_demo_%` o todos inactivos | Ejecuta `demo:seed-citizens` o reactiva usuarios en BD (solo demo). |
| `Usuario no autorizado` con `X-Demo-DNI` | DNI no existe o `isActive = 0` | Crea el usuario o activa `isActive`. |
| Script Python: CSRF 404 | Ruta distinta | Prueba en el navegador `GET /sanctum/csrf-cookie` vs `GET /api/sanctum/csrf-cookie` y alinea el script o rutas Laravel. |
| Script Python: `sin nickname` | `nicknamePassword` NULL/vacío | Asigna nickname (API o BD). |
| `403 Ya has votado` / usuario inactivo al votar | Ese usuario ya votó | Usa otro DNI o nuevos usuarios `demo:seed-citizens`. |
| CORS / cookies desde otro origen | Dominio del front no está en `SANCTUM_STATEFUL_DOMAINS` | Añade el host:puerto del cliente en `config/sanctum.php` / `.env`. |


## Resumen rápido (orden recomendado)
1. Levantar BD, backend y blockchain local.
2. `.env`: `APP_ENV=local`, variables de cadena, y si quieres login HTTP demo: `AGORA_DEMO_AUTH=true`.
3. `php artisan demo:seed-citizens N` (usuarios con municipios aleatorios)
4. `php artisan demo:cast-votes V --dry-run` → luego sin `--dry-run`.
5. Opcional: script Python con `dnis.txt` y `--base-url` correcto.

Si algo de esta guía no coincide con tu rama (rutas o `.env`), revisa el código citado en el repositorio: `CertAuthController`, comandos `DemoSeedCitizens`, `DemoCastVotes` y `tools/demo_vote_http.py`.