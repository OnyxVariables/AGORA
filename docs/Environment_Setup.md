# Guía de Configuración de Entorno
Este documento explica cómo configurar y ejecutar el proyecto AGORA en diferentes entornos (desarrollo y producción).


## Introducción
El proyecto admite configuraciones separadas para entornos de desarrollo y producción, eliminando la necesidad de cambiar manualmente las URLs al cambiar entre entornos.


## Archivos de Entorno
### Desarrollo
- **Archivo Compose**: `compose.dev.yml`
- **Archivo de entorno**: `.env.dev`
- **URLs** (según cómo accedas; en Docker suele usarse Nginx como puerta única):
  - Frontend (Vite directo): `http://localhost:5173`
  - Nginx (frontend + API): `http://localhost:8080`
  - Backend Laravel (directo al contenedor): `http://localhost:8000`
  - Spring Boot (WebSocket y actuator): `http://localhost:8081` — WebSocket métricas: `ws://localhost:8081/ws` (`VITE_SPRING_WS_URL`)
  - Base de datos: `agora_dev` (MariaDB en `localhost:33306` si está mapeada en `compose.dev.yml`)

### Producción
- **Archivo Compose**: `compose.prod.yml`
- **Archivo de entorno**: `.env.prod`
- **URLs**:
  - Frontend: `https://agorachain.es`
  - Backend API: `https://agorachain.es`
  - Base de datos: `agora`


## ¿Cómo ponerlo a funcionar?
### Entorno de Desarrollo
1. **Copiar el archivo de entorno de desarrollo:**
   ```bash
   cp .env.dev .env
   ```

2. **Iniciar los contenedores de desarrollo:**
   ```bash
   docker compose -f compose.dev.yml up --build
   ```

3. **Acceder a la aplicación:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Base de datos: localhost:3306

### Entorno de Producción
1. **Copiar el archivo de entorno de producción:**
   ```bash
   cp .env.prod .env
   ```

2. **Iniciar los contenedores de producción:**
   ```bash
   docker compose -f compose.prod.yml up --build -d
   ```

3. **Acceder a la aplicación:**
   - Frontend: https://agorachain.es
   - Backend API: https://agorachain.es

> [!NOTE]
> También se pueden usar los scripts `switch-env.bat` (Windows), `switch-env.sh` (Linux/Mac) o `switch-env.ps1` (PowerShell) para cambiar entre entornos o hacerlo manualmente.


## Variables de Entorno
### Variables de Entorno del Backend
| Variable | Descripción | Desarrollo | Producción |
|----------|-------------|-------------|------------|
| `APP_ENV` | Entorno de la aplicación | `local` | `production` |
| `APP_DEBUG` | Modo depuración | `true` | `false` |
| `APP_URL` | URL del backend | `http://localhost:8000` | `https://agorachain.es` |
| `SESSION_DOMAIN` | Dominio de la cookie de sesión | `localhost` | `agorachain.es` |
| `SANCTUM_STATEFUL_DOMAINS` | Dominios stateful de Sanctum | `localhost:5173` | `agorachain.es` |
| `DB_DATABASE` | Nombre de la base de datos | `agora_dev` | `agora` |
| `FRONTEND_URL` | URL del frontend para CORS | `http://localhost:5173` | `https://agorachain.es` |

### Variables de Entorno del Frontend
| Variable | Descripción | Desarrollo | Producción |
|----------|-------------|-------------|------------|
| `VITE_API_URL` | URL del API del backend (en dev con Nginx suele ser el mismo host/puerto que el front) | `http://localhost:8080` | `https://agorachain.es` |
| `VITE_APP_URL` | URL del frontend | `http://localhost:5173` | `https://agorachain.es` |
| `VITE_SPRING_WS_URL` | WebSocket Spring (métricas tiempo real) | `ws://localhost:8081/ws` | Ajustar a tu dominio/puerto TLS |

### Scheduler Laravel (votaciones programadas)
El comando `votations:process-lifecycle` está registrado para ejecutarse **cada minuto**. **Si nadie ejecuta la agenda de Laravel, el estado en BD no pasará a `active` ni se llamará a `createVotation`**, aunque la hora de inicio ya haya llegado.

**Docker (`compose.dev.yml`):** existe el servicio **`scheduler`**, que arranca `php artisan schedule:work` con el mismo código y `.env` que el backend. Debe estar levantado (`docker compose -f compose.dev.yml up -d` incluye el scheduler). Si solo corres el contenedor `backend` sin el scheduler, el fallo es el esperado.

**Sin Docker:** en una terminal aparte:
```bash
cd backend
php artisan schedule:work
```

(o un cron del sistema que ejecute `php artisan schedule:run` cada minuto).

**RPC desde contenedores:** en `BESU_RPC_URL` usa el hostname del nodo en la red Docker (p. ej. `http://hardhat:8545`), no `localhost`, si Laravel corre dentro de Compose.

Ver [Arquitectura_Runtime.md](Arquitectura_Runtime.md).


## Diferencias Clave entre Entornos
### Desarrollo (`compose.dev.yml`)
- **Puertos expuestos**: Todos los servicios exponen puertos para acceso directo
- **Montajes de volumen**: El código fuente está montado para desarrollo en vivo
- **Modo depuración**: Habilitado
- **Base de datos**: Base de datos de desarrollo separada
- **SSL**: No configurado (solo HTTP)
- **Recarga en caliente**: El frontend admite recarga en caliente

### Producción (`compose.prod.yml`)
- **Puertos expuestos**: Solo el servidor web (80, 443) expuesto
- **Montajes de volumen**: Solo datos persistentes, sin código fuente
- **Modo depuración**: Deshabilitado
- **Base de datos**: Base de datos de producción
- **SSL**: Configurado con certificados
- **Certbot**: Gestión de certificados SSL incluida
- **Optimización**: Optimizaciones de compilación habilitadas


## Posibles problemas y su solución
### Problemas Comunes
1. **Conflictos de puertos en desarrollo**
   - Asegurarse de que los puertos 5173, 8000 y 3306 estén disponibles
   - Verificar con: `netstat -an | grep :5173`

2. **Variables de entorno no cargando**
   - Asegurarse de que el archivo `.env` exista en la raíz del proyecto
   - Verificar los permisos del archivo: `ls -la .env`

3. **Problemas de CORS**
   - Verificar que `FRONTEND_URL` coincida con su URL del frontend
   - Verificar la configuración CORS del backend

4. **Problemas de conexión a la base de datos**
   - Asegurarse de que el contenedor de la base de datos esté en ejecución
   - Verificar las credenciales de la base de datos en el archivo de entorno

### Limpieza
**Eliminar todos los contenedores y volúmenes:**
```bash
docker compose -f compose.dev.yml down -v
docker compose -f compose.prod.yml down -v
```

**Eliminar todas las imágenes de Docker:**
```bash
docker system prune -a
```