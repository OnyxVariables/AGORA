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
| **Primario** | Aporta valor directo al usuario o proceso. | Cuadrado de color azul claro |
| **Secundario** | Soporte técnico o requisito obligatorio. | Cuadrado de color gris |
| **Extendido** | Funcionalidad opcional dependiente de una condición. | Línea discontinua con etiqueta |

## 2. Arquitectura de Casos de Uso

```mermaid
graph TD
    %% Estilos
    classDef actor fill:#ffffff,stroke:#fff,stroke-width:2px,color:#000
    classDef primario fill:#e1f5fe,stroke:#01579b,stroke-width:2px,color:#000
    classDef soporte fill:#f5f5f5,stroke:#9e9e9e,stroke-width:2px,color:#000
    classDef extendido fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000

    %% Actores
    Ciudadano((Ciudadano)):::actor
    Administrador((Administrador)):::actor

    %% Casos de Uso: Ciudadano
    UC_Login(Iniciar sesión):::soporte
    UC_VerInfo(<b>Ver información del proyecto</b>):::primario
    UC_Desplegar(<b>Desplegar programas</b>):::primario
    UC_Votar(<b>Votar</b>):::primario
    UC_Enviar(Enviar voto):::soporte
    UC_Cancelar(Cancelar voto):::extendido
    UC_Resultados(<b>Ver resultados</b>):::primario

    %% Casos de Uso: Administrador
    UC_CRUD(<b>Gestión CRUD votaciones</b>):::primario
    UC_Metricas(<b>Visualizar métricas</b>):::primario
    UC_Exportar(Exportar datos):::extendido

    %% Relaciones Ciudadano
    Ciudadano --- UC_VerInfo
    Ciudadano --- UC_Desplegar
    Ciudadano --- UC_Votar
    Ciudadano --- UC_Resultados

    UC_VerInfo -.->|include| UC_Login
    UC_Desplegar -.->|include| UC_Login
    UC_Votar -.->|include| UC_Login
    UC_Votar -.->|include| UC_Enviar
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
- **Tipo**: Secundario (caso de soporte, incluido en todos los primarios)  
- **Descripción**: El ciudadano se autentica en el sistema mediante su certificado electrónico, requisito previo para realizar cualquier acción dentro del sistema.  
- **Actor principal**: Ciudadano  
- **Precondiciones**: El ciudadano dispone de un certificado electrónico válido.  
- **Postcondición**: El ciudadano queda autenticado y puede acceder al resto de funcionalidades.  
- **Flujo principal**:
  1. El usuario accede al sistema.  
  2. Selecciona o inserta su certificado electrónico.  
  3. El sistema verifica la validez.  
  4. Si es válido, se le concede acceso al entorno ciudadano.  

### Caso de uso: Desplegar programas electorales
- **Tipo**: Primario  
- **Incluye**: Iniciar sesión  
- **Descripción**: Permite visualizar los programas o propuestas electorales de los distintos candidatos o partidos disponibles.  
- **Flujo principal**:
  1. El ciudadano inicia sesión.  
  2. El ciudadano pincha sobre “Desplegar programas electorales”.  
  3. El sistema muestra los programas de los distintos candidatos o partidos.  

### Caso de uso: Votar
- **Tipo**: Primario  
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

### Caso de uso: Enviar voto
- **Tipo**: Secundario (incluido en “Votar”)  
- **Descripción**: Envía la transacción de voto firmada digitalmente a la blockchain. Incluye validaciones criptográficas, prevención de votos duplicados y registro de auditoría.  

### Caso de uso: Cancelar voto
- **Tipo**: Extendido (opcional, depende del flujo “Votar”)  
- **Descripción**: Permite anular el proceso antes de confirmar el envío del voto a la blockchain.  

### Caso de uso: Ver resultados
- **Tipo**: Primario  
- **Incluye**: Iniciar sesión  
- **Descripción**: Permite al ciudadano ver los resultados recogidos en la blockchain.  
- **Flujo principal**:
  1. El ciudadano inicia sesión.  
  2. Selecciona “Ver resultados”.  
  3. El sistema consulta la blockchain y la base de datos para mostrar los resultados.  


## 4. Actor: Administrador
### Caso de uso: Iniciar sesión
- **Tipo**: Secundario (requisito previo para todos los casos del administrador)  
- **Descripción**: El administrador se autentica mediante su certificado electrónico institucional.  

### Caso de uso: Gestionar votaciones
- **Tipo**: Primario  
- **Incluye**: Iniciar sesión  
- **Descripción**: Permite al administrador crear, leer, actualizar o eliminar votaciones desde el panel de gestión (CRUD).  

### Caso de uso: Visualizar métricas on-chain
- **Tipo**: Primario  
- **Incluye**: Iniciar sesión  
- **Extiende**: Exportar métricas  
- **Descripción**: El administrador puede ver estadísticas en tiempo real sobre los votos emitidos, nodos activos y bloques generados.  
- **Extensión (Exportar métricas)**:  
  - Permite exportar los datos a un archivo CSV o PDF para su análisis o auditoría externa.  

### Caso de uso: Exportar métricas
- **Tipo**: Extendido (opcional, depende de “Visualizar métricas”)  
- **Descripción**: Genera un informe descargable con las métricas actuales del sistema.