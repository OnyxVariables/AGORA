# Plan de pruebas manual — AGORA

Checklist E2E para validar la aplicación antes de un despliegue. **Pre-requisitos:** backend Laravel accesible, frontend Vite, base de datos con esquema `db/*.sql`, nodo blockchain si se prueban transacciones, y (opcional) `php artisan schedule:work` o contenedor scheduler para el ciclo de vida de votaciones.

---

## 1. Autenticación

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1.1 | Abrir `/` | Pantalla de login con certificado |
| 1.2 | Pulsar INGRESAR (modo dev: DNI fijo en `CertAuthController`) | JSON `roleId` y redirección: admin → `/CRUDVotations`, ciudadano → `/Home` |
| 1.3 | Desde sesión, cerrar sesión (si existe control) | Vuelta a `/` sin acceso a rutas privadas |

---

## 2. CRUD votaciones (admin)

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 2.1 | Crear votación pending con título, descripción, fecha inicio | Toast “Votación creada” + modal “Votación programada” con fecha/hora de activación |
| 2.2 | Listado muestra estado `pending` | Fechas formateadas DD-MM-YYYY HH:mm |
| 2.3 | Editar votación pending (título/fechas) | Toast “Votación actualizada”; no permite editar si `active` |
| 2.4 | Intentar solapar fechas con otra votación | Error 422 coherente |
| 2.5 | Cancelar votación sin tx en cadena | Estado `cancelled` |
| 2.6 | Tras `votations:process-lifecycle` con blockchain OK | Pending sin tx y `startDate` pasada → `active`, aparecen `txHash` / `startBlockHash` |

---

## 3. Votación activa y voto (ciudadano)

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 3.1 | Entrar con rol ciudadano tras activar votación | Toast: votación activa “ya puedes votar” (una vez por id en `localStorage`) |
| 3.2 | `/Votar` con votación activa | Flujo de voto completo |
| 3.3 | Segundo intento de voto | Rechazo si `isActive` ya es false |

---

## 4. Métricas (`/metrics`, admin)

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 4.1 | Seleccionar votación | Carga bundle; WebSocket conecta o muestra error |
| 4.2 | Participación y desglose | Dos tablas en paralelo (grid); tabla partidos con columnas Partido, Votos, **Escaños** (`—` si no hay reparto) |
| 4.3 | Detalle de votos | Municipio: nombre + provincia + CCAA en la misma celda |
| 4.4 | Bloques | Columna **Creado** con fecha/hora formateada |
| 4.5 | Auditoría | Usuario muestra **nickname** (`nicknamePassword`) o nombre; tras activar voto/scheduler, **Tx Hash** y **Block Hash** cuando aplica |
| 4.6 | Copiar hash | Toast estilo pill oscuro (clase `cmc-toast`) con check verde |
| 4.7 | Gráficos | Cuadrícula ~90% ancho viewport, cuatro gráficos tamaño similar |
| 4.8 | Mapa de calor | Provincias con color según votos; comprobar Galicia/Coruña si hay datos |
| 4.9 | Exportar métricas (si hay acción en UI) | CSV/HTML con escaños, geo en votos, creado en bloques |

---

## 5. Resultados (`/Resultados`, ciudadano)

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 5.1 | Elegir votación **finished** | Carga resultados sin error |
| 5.2 | Cambiar nivel Nación / CCAA / Provincia | Estilos del mapa coherentes |
| 5.3 | Clic en región | Diálogo con tarjetas totales (escaños del Estado, votos totales) y **tabla** Partido / Votos / Escaños |
| 5.4 | Pie y barras en el diálogo | Visibles, tamaño razonable (no desbordadas) |
| 5.5 | Verificación de voto con código | Modal con partido y nickname |

---

## 6. Auditoría y blockchain (BD)

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 6.1 | Tras `ACTIVATE_VOTATION` (scheduler) | Fila en `auditory` con `txHash` y `blockHash` |
| 6.2 | Tras `FINISH_VOTATION` | Igual |
| 6.3 | Tras `SUBMIT_VOTE` | Auditory con hashes; fila en `block` vía `ensureBlockExists` |

---

## 7. Pruebas automatizadas E2E (Playwright)

Desde `frontend/`:

```bash
npm run dev
# En otra terminal, con API y DB listos:
npm run test:e2e
```

Variable opcional: `PLAYWRIGHT_BASE_URL=http://localhost:5173`.

Los tests asumen el DNI de desarrollo configurado en Laravel (`CertAuthController`). Algunos se omiten (`skip`) si el rol no coincide o no hay datos.

---

## 8. Regresión rápida

- [ ] Sin errores en consola al cargar `/metrics` y `/Resultados`
- [ ] Sin 403 inesperados en rutas según rol
- [ ] Scheduler documentado en README si no está en Docker
