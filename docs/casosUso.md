# Documentación de Casos de Uso – Ciudadano y Administrador

## Índice
1. [Introducción](#1-introducción)
2. [Arquitectura de Casos de Uso](#2-arquitectura-de-casos-de-uso)
3. [Actor: Ciudadano](#3-actor-ciudadano)
4. [Actor: Administrador](#4-actor-administrador) 


## 1. Introducción
Este documento detalla los casos de uso del sistema de votación electrónica. Se emplea tecnología **Blockchain** para garantizar la inmutabilidad y **Certificados Electrónicos** para la autenticación de los usuarios.

### Clasificación de CASOS DE USO
| Tipo | Descripción | Visualización en Diagrama |
| :--- | :--- | :--- |
| **Primario** | Aporta valor directo al usuario o proceso. | Cuadrado de color azul claro 🔵 |
| **Secundario** | Soporte técnico o requisito obligatorio. | Cuadrado de color blanco amarillento ⚪ |
| **Extendido** | Funcionalidad opcional dependiente de una condición. | Cuadrado de color naranja claro 🟠 |

## 2. Arquitectura de Casos de Uso

```mermaid
---
config:
  look: handDrawn
---
graph TD
    %% Estilos
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000
    classDef extendido fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000

    %% Actores
    Ciudadano((<b>Ciudadano</b>)):::actor
    Administrador((<b>Administrador</b>)):::actor

    %% Casos de Uso: Ciudadano
    UC_Login(Iniciar sesión):::soporte
    UC_VerInfo(Ver información del proyecto):::primario
    UC_Desplegar(Desplegar programas):::primario
    UC_Votar(Votar):::primario
    UC_Enviar(Enviar voto):::extendido
    UC_Cancelar(Cancelar voto):::extendido
    UC_Resultados(Ver resultados):::primario

    %% Casos de Uso: Administrador
    UC_CRUD(Gestión CRUD votaciones):::primario
    UC_Metricas(Visualizar métricas):::primario
    UC_Exportar(Exportar datos):::extendido

    %% Relaciones Ciudadano
    Ciudadano --- UC_VerInfo
    Ciudadano --- UC_Desplegar
    Ciudadano --- UC_Votar
    Ciudadano --- UC_Resultados

    UC_VerInfo -.->|include| UC_Login
    UC_Desplegar -.->|include| UC_Login
    UC_Votar -.->|include| UC_Login
    UC_Votar -.->|extend| UC_Enviar
    UC_Cancelar -.->|extend| UC_Votar
    UC_Resultados -.->|include| UC_Login

    %% Relaciones Administrador
    Administrador --- UC_CRUD
    Administrador --- UC_Metricas

    UC_CRUD -.->|include| UC_Login
    UC_Metricas -.->|include| UC_Login
    UC_Exportar -.->|extend| UC_Metricas
```


## 3. Actor: Ciudadano
### Caso de uso: Iniciar sesión
- **Tipo**: Secundario ⚪ (caso de soporte, incluido en todos los primarios)  
- **Descripción**: El ciudadano se autentica en el sistema mediante su certificado electrónico, requisito previo para realizar cualquier acción dentro del sistema.  
- **Actor principal**: Ciudadano  
- **Precondiciones**: El ciudadano dispone de un certificado electrónico válido.  
- **Postcondición**: El ciudadano queda autenticado y puede acceder al resto de funcionalidades.  
- **Flujo principal**:
  1. El usuario accede al sistema.  
  2. Selecciona o inserta su certificado electrónico.  
  3. El sistema verifica la validez.  
  4. Si es válido, se le concede acceso al entorno ciudadano.

```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000

    Ciudadano((<b>Ciudadano</b>)):::actor
    Ciudadano --> UC_Login[Iniciar sesión]:::soporte  
```

### Caso de uso: Desplegar programas electorales
- **Tipo**: Primario 🔵 
- **Incluye**: Iniciar sesión  
- **Descripción**: Permite visualizar los programas o propuestas electorales de los distintos candidatos o partidos disponibles.  
- **Flujo principal**:
  1. El ciudadano inicia sesión.  
  2. El ciudadano pincha sobre “Desplegar programas electorales”.  
  3. El sistema muestra los programas de los distintos candidatos o partidos. 
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000

    Ciudadano((<b>Ciudadano</b>)):::actor
    Ciudadano --> UC_Desplegar[Desplegar programas]:::primario
    UC_Desplegar -.->|include| UC_Login[Iniciar sesión]:::soporte  
``` 

### Caso de uso: Votar
- **Tipo**: Primario 🔵
- **Incluye**: Iniciar sesión, Enviar voto  
- **Extiende**: Cancelar voto  
- **Descripción**: Permite al ciudadano emitir su voto dentro de una votación activa y registrada en la blockchain.  
- **Flujo principal**:
  1. El ciudadano inicia sesión.  
  2. Selecciona “Votar”.  
  3. Marca su opción y confirma.  
  4. El sistema envía el voto a la Blockchain y ejecuta el caso **Enviar voto**.  
- **Extensión (Cancelar voto)**:  
  - Si el ciudadano decide no continuar, puede ejecutar el caso **Cancelar voto** antes de confirmar. 
```mermaid
---
config:
  look: handDrawn
---
flowchart LR
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000
    classDef extendido fill:#fff3e0, stroke:#e65100, stroke-width:2px, color:#000
    classDef actor fill:#fff8d9, stroke:#fff, stroke-width:2px, color:#000

    Ciudadano(("<b>Ciudadano</b>")) --> UC_Votar["Votar"]
    UC_Votar -. include .-> UC_Login["Iniciar sesión"]
    UC_Votar -. extend .-> UC_Enviar["Enviar voto"] & UC_Cancelar["Cancelar voto"]

     Ciudadano:::actor
     UC_Votar:::primario
     UC_Votar:::primario
     UC_Login:::soporte
     UC_Enviar:::extendido
     UC_Cancelar:::extendido
``` 

### Caso de uso: Enviar voto
- **Tipo**: Extendido 🟠 (opcional, depende del flujo “Votar”)  
- **Descripción**: Permite enviar la transacción de voto firmada digitalmente a la blockchain. Incluye validaciones criptográficas, prevención de votos duplicados y registro de auditoría.
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef extendido fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000

    Ciudadano((<b>Ciudadano</b>)):::actor
    Ciudadano --> UC_Votar[Votar]:::primario -.->|extend| UC_Enviar[Enviar voto]:::extendido 
``` 

### Caso de uso: Cancelar voto
- **Tipo**: Extendido 🟠 (opcional, depende del flujo “Votar”)  
- **Descripción**: Permite anular el proceso antes de confirmar el envío del voto a la blockchain.  
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef extendido fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    
    Ciudadano((<b>Ciudadano</b>)):::actor
    Ciudadano --> UC_Votar[Votar]:::primario -.-> |extend| UC_Cancelar[Cancelar voto]:::extendido
``` 

### Caso de uso: Ver resultados
- **Tipo**: Primario 🔵
- **Incluye**: Iniciar sesión  
- **Descripción**: Permite al ciudadano ver los resultados recogidos en la blockchain.  
- **Flujo principal**:
  1. El ciudadano inicia sesión.  
  2. Selecciona “Ver resultados”.  
  3. El sistema consulta la blockchain y la base de datos para mostrar los resultados.  
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000

    Ciudadano((<b>Ciudadano</b>)):::actor
    Ciudadano --> UC_Resultados[Ver resultados]:::primario
    UC_Resultados -.->|include| UC_Login[Iniciar sesión]:::soporte
``` 


## 4. Actor: Administrador
### Caso de uso: Iniciar sesión
- **Tipo**: Secundario ⚪ (requisito previo para todos los casos del administrador)  
- **Descripción**: El administrador se autentica mediante su certificado electrónico institucional.  
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000

    Administrador((<b>Administrador</b>)):::actor
    Administrador --> UC_Login[Iniciar sesión]:::soporte
``` 

### Caso de uso: Gestionar votaciones
- **Tipo**: Primario 🔵
- **Incluye**: Iniciar sesión  
- **Descripción**: Permite al administrador crear, leer, actualizar o eliminar votaciones desde el panel de gestión (CRUD).  
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000

    Administrador((<b>Administrador</b>)):::actor
    Administrador --> UC_CRUD[Gestión CRUD votaciones]:::primario
    UC_CRUD -.->|include| UC_Login[Iniciar sesión]:::soporte
``` 

### Caso de uso: Visualizar métricas on-chain
- **Tipo**: Primario 🔵
- **Incluye**: Iniciar sesión  
- **Extiende**: Exportar métricas  
- **Descripción**: El administrador puede ver estadísticas en tiempo real sobre los votos emitidos, nodos activos y bloques generados.  
- **Extensión (Exportar métricas)**:  
  - Permite exportar los datos a un archivo CSV o PDF para su análisis o auditoría externa.  
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000
    classDef extendido fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000

    Administrador((<b>Administrador</b>)):::actor
    Administrador --> UC_Metricas[Visualizar métricas]:::primario
    UC_Metricas -.->|include| UC_Login[Iniciar sesión]:::soporte
    UC_Exportar[Exportar métricas]:::extendido -.->|extend| UC_Metricas
``` 

### Caso de uso: Exportar métricas
- **Tipo**: Extendido 🟠 (opcional, depende de “Visualizar métricas”)  
- **Descripción**: Genera un informe descargable con las métricas actuales del sistema.
```mermaid
---
config:
  look: handDrawn
---
graph LR
    classDef actor fill:#fff8d9,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000
    classDef extendido fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000

    Administrador((<b>Administrador</b>)):::actor
    Administrador -->  UC_Metricas[Visualizar métricas]:::primario -.->|extend| UC_Exportar[Exportar métricas]:::extendido
``` 
