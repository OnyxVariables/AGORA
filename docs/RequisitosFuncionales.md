# Requisitos Funcionales  
**Proyecto AGORA – Plataforma de Votación Electrónica con Blockchain**

1. [Introducción](#1-introducción)
2. [Alcance del Sistema](#2-alcance-del-sistema)
3. [Actores del Sistema](#3-actores-del-sistema)
4. [Requisitos Funcionales del Ciudadano](#4-requisitos-funcionales-del-ciudadano) 
5. [Requisitos Funcionales del Administrador](#5-requisitos-funcionales-del-administrador) 
6. [Requisitos Funcionales de la Blockchain](#6-requisitos-funcionales-de-la-blockchain) 
7. [Servicio de Cálculo Electoral](#7-servicio-de-cálculo-electoral) 
8. [Requisitos de Auditoría](#8-requisitos-de-auditoría) 
9. [Reglas de Negocio](#9-reglas-de-negocio) 
10. [Trazabilidad de requisitos](#10-trazabilidad-de-requisitos) 
11. [Consideraciones Finales](#11-consideraciones-finales) 


## 1. Introducción
Este documento describe los **requisitos funcionales** del sistema **AGORA**, una plataforma de votación electrónica segura que combina:
- Infraestructura cloud
- Arquitectura de microservicios
- Blockchain permisionada (Hyperledger Besu)
- Cálculo electoral automatizado mediante la **Ley D’Hondt**

> [!NOTE]
> El objetivo principal del sistema es garantizar **seguridad, trazabilidad, transparencia y auditabilidad** en todo el proceso electoral.


## 2. Alcance del Sistema
El sistema AGORA permite:
- Autenticación segura de ciudadanos mediante certificado electrónico
- Emisión de votos de forma anónima y verificable
- Registro inmutable de votos en blockchain
- Cálculo automático de resultados electorales
- Consulta pública de resultados
- Auditoría completa del proceso
- Administración del sistema por personal autorizado


## 3. Actores del Sistema
| Actor | Descripción |
|------|-------------|
| Ciudadano | Usuario que participa en procesos electorales |
| Administrador | Usuario con permisos de gestión del sistema |
| Sistema Blockchain | Garantiza la inmutabilidad y trazabilidad |
| Servicio de Cálculo Electoral | Aplica la Ley D’Hondt |
| Sistema de Auditoría | Registra acciones relevantes |


## 4. Requisitos Funcionales del Ciudadano
### RF-01 Autenticación mediante certificado electrónico
El sistema debe permitir al ciudadano autenticarse utilizando un **certificado electrónico válido**.

**Condiciones:**
- El certificado debe ser verificado
- Se deben extraer datos identificativos mínimos
- No se permite acceso sin autenticación válida

### RF-02 Consulta de votaciones disponibles
El ciudadano debe poder visualizar las votaciones activas en las que puede participar y las finalizadas para ver los resultados.

### RF-03 Emisión de voto
El ciudadano debe poder emitir **un único voto por votación**.

**Restricciones:**
- El voto debe ser anónimo
- Debe registrarse en la blockchain
- No puede modificarse una vez emitido

### RF-04 Confirmación de participación
El sistema debe registrar la participación del ciudadano sin vincular su identidad al voto.


### RF-05 Consulta de resultados
El ciudadano debe poder consultar los resultados una vez finalizada la votación.


## 5. Requisitos Funcionales del Administrador
### RF-06 Gestión de votaciones
El administrador debe poder:
- Crear votaciones
- Definir fechas de inicio y fin
- Cambiar el estado de una votación

### RF-07 Gestión de partidos políticos
El sistema debe permitir la creación y gestión de partidos participantes.

### RF-08 Supervisión del sistema
El administrador debe poder consultar:
- Estado de los servicios
- Estado de los nodos blockchain
- Registros de auditoría


## 6. Requisitos Funcionales de la Blockchain
### RF-09 Registro inmutable de votos
Cada voto debe registrarse como una transacción en la blockchain.

### RF-10 Integridad del proceso
La blockchain debe garantizar:
- Inmutabilidad
- Orden cronológico
- Verificación distribuida

### RF-11 Referencia entre bloques y votaciones
Cada votación debe estar asociada a bloques de la blockchain.


## 7. Servicio de Cálculo Electoral  
**Spring Boot – Ley D’Hondt**

### RF-12 Extracción de votos
El servicio debe calcular resultados a partir de los votos persistidos en base de datos relacional tras la sincronización de eventos blockchain.

### RF-13 Cálculo automático de escaños
El sistema debe aplicar la **Ley D’Hondt** automáticamente tras finalizar una votación.

### RF-14 Almacenamiento de resultados
Los resultados deben persistirse en base de datos relacional.

### RF-15 Publicación de resultados
Los resultados deben ser accesibles desde el frontend.

> [!NOTE]
> En la arquitectura actual, Laravel envía transacciones (`createVotation`, `submitVote`, `finishVotation`) y Spring Boot escucha eventos para sincronizar estado y ejecutar D’Hondt sobre la tabla `vote`.


## 8. Requisitos de Auditoría
### RF-16 Registro de acciones
El sistema debe registrar acciones relevantes como:
- Inicio de sesión
- Emisión de voto
- Cálculo de resultados
- Operaciones administrativas

### RF-17 Consulta de auditoría
El administrador debe poder consultar los registros de auditoría.


## 9. Reglas de Negocio
- Un ciudadano solo puede votar **una vez por votación**
- Un voto no puede eliminarse ni modificarse
- Una votación cerrada no puede reabrirse
- El cálculo electoral solo se ejecuta cuando la votación finaliza


## 10. Trazabilidad de Requisitos
| Requisito | Módulo |
|----------|--------|
| RF-01 – RF-05 | Frontend / Backend |
| RF-06 – RF-08 | Backend |
| RF-09 – RF-11 | Blockchain |
| RF-12 – RF-15 | Spring Boot |
| RF-16 – RF-17 | Auditoría |


## 11. Consideraciones Finales
El sistema AGORA prioriza:
- Seguridad
- Transparencia
- Escalabilidad
- Cumplimiento legal
- Confianza ciudadana
