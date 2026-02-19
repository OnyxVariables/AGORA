# Cumplimiento Legal y Normativo  
**Proyecto AGORA – Plataforma de Votación Electrónica con Blockchain**

1. [Introducción](#1-introducción)
2. [Marco Legal Aplicable](#2-marco-legal-aplicable)
3. [Protección de Datos Personales](#3-protección-de-datos-personales)
4. [Seguridad de la Información](#4-seguridad-de-la-información)
5. [Control de Accesos y Roles](#5-control-de-accesos-y-roles)
6. [Auditoría y Trazabilidad](#6-auditoría-y-trazabilidad)
7. [Transparencia y Verificabilidad](#7-transparencia-y-verificabilidad)
8. [Responsabilidad Proactiva](#8-responsabilidad-proactiva)
9. [Limitaciones y Alcance Legal](#9-limitaciones-y-alcance-legal)
10. [Conclusión](#10-conclusión)
11. [Referencias Normativas](#11-referencias-normativas)


## 1. Introducción
El presente documento describe el **marco de cumplimiento legal, normativo y técnico** del proyecto **AGORA**, una plataforma de votación electrónica basada en tecnología **Blockchain (Hyperledger Besu)** y desplegada sobre infraestructura cloud.

> [!IMPORTANT]
> Dado que el sistema gestiona **datos personales**, **procesos electorales** y **resultados con impacto público**, el cumplimiento normativo es un **pilar fundamental del diseño**, tanto desde el punto de vista legal como técnico.

Este documento tiene como objetivo:
- Garantizar el respeto a la **legislación vigente**
- Justificar las **decisiones técnicas** adoptadas
- Asegurar **transparencia, seguridad y trazabilidad**


## 2. Marco Legal Aplicable
### 2.1 Reglamento General de Protección de Datos (RGPD – UE 2016/679)
AGORA cumple con el Reglamento General de Protección de Datos (RGPD), aplicable a cualquier sistema que trate datos personales de ciudadanos de la Unión Europea.

#### Principios RGPD aplicados:
- Licitud, lealtad y transparencia  
- Limitación de la finalidad  
- Minimización de datos  
- Exactitud  
- Limitación del plazo de conservación  
- Integridad y confidencialidad  
- Responsabilidad proactiva  

### 2.2 Ley Orgánica 3/2018 (LOPDGDD – España)
AGORA se adecua a la Ley Orgánica de Protección de Datos Personales y garantía de los derechos digitales, que complementa el RGPD en el ámbito español.

Se presta especial atención a:
- Derechos digitales del ciudadano  
- Seguridad de los sistemas de información  
- Tratamiento de datos en entornos electrónicos  

### 2.3 Legislación Electoral Española (Referencia Conceptual)
Aunque AGORA **no sustituye un sistema electoral oficial**, su diseño toma como referencia conceptual:

- LOREG (Ley Orgánica del Régimen Electoral General)
- Principios de:
  - Universalidad
  - Igualdad del voto
  - Secreto
  - Transparencia
  - Auditabilidad


## 3. Protección de Datos Personales
### 3.1 Datos Tratados
AGORA trata únicamente los datos **estrictamente necesarios**:

| Tipo de Dato | Uso |
|-------------|-----|
| Identificador de usuario | Control de acceso |
| Nickname cifrado | Anonimización |
| Municipio / provincia | Cómputo electoral |
| Rol del usuario | Control de permisos |
| Registro de acciones | Auditoría |

> [!NOTE] 
> Nunca se almacena el voto en claro asociado a un ciudadano.

### 3.2 Anonimización y Seudonimización
- El voto se almacena como **hash criptográfico**
- La identidad real del votante **no se vincula** al voto
- Se emplea:
  - Hashes
  - Identificadores intermedios
  - Separación lógica de datos

> [!IMPORTANT] 
> Esto garantiza el **secreto del voto** y evita la reidentificación.


## 4. Seguridad de la Información
### 4.1 Seguridad en las Comunicaciones
- Todo el tráfico se realiza mediante **HTTPS (TLS)**
- Certificados gestionados con **Certbot / Let’s Encrypt** (si el proyecto se lleva a cabo usariamos uno de la FNMT)
- Protección frente a ataques Man-In-The-Middle (MITM)

### 4.2 Seguridad en Infraestructura
- Despliegue mediante **Docker** y **Docker Compose**
- Segmentación por red bridge
- Acceso restringido por roles
- Servicios desacoplados

### 4.3 Seguridad Blockchain
- Red **permissioned** (Hyperledger Besu)
- Nodos desplegados en instancias **EC2 independientes**
- Orquestación mediante **Kubernetes**
- Consenso tolerante a fallos bizantinos (QBFT)

La información registrada en la blockchain es:
- Inmutable  
- Trazable  
- Verificable  


## 5. Control de Accesos y Roles
### 5.1 Roles Definidos
| Rol | Permisos |
|----|---------|
| Ciudadano | Votar, consultar resultados |
| Administrador | Crear votaciones, auditar |
| Sistema | Procesos automáticos |

### 5.2 Principio de Mínimo Privilegio
Cada rol dispone únicamente de los permisos necesarios para su función, reduciendo el riesgo de abuso o error.


## 6. Auditoría y Trazabilidad
AGORA implementa un sistema de auditoría completo:
- Registro de:
  - Acciones del usuario
  - Eventos críticos
  - Cambios de estado
- Los logs:
  - No son modificables
  - Están separados del voto
  - Son auditables

> [!TIP]
> La blockchain actúa como **registro de evidencias**.


## 7. Transparencia y Verificabilidad
AGORA garantiza:
- Resultados reproducibles
- Cálculo electoral verificable (Ley D’Hondt)
- Acceso público a resultados agregados
- Imposibilidad de manipulación a posteriori

> [!NOTE]
> Esto refuerza la **confianza ciudadana**.


## 8. Responsabilidad Proactiva
El proyecto demuestra cumplimiento mediante:
- Documentación técnica completa
- Diagramas (arquitectura, ER, estados, secuencia, flujo, casos de uso, radar)
- Registro de decisiones técnicas
- Separación clara de responsabilidades


## 9. Limitaciones y Alcance Legal
> [!WARNING]  
> AGORA no es un sistema electoral oficial ni sustituye procesos legales reales.

El proyecto constituye:
- Un prototipo académico y técnico
- Un sistema funcional demostrativo
- Una implementación basada en buenas prácticas reales

> [!IMPORTANT]
> Copyright (c) [2026] [AGORA]. Todos los derechos reservados. Queda estrictamente prohibida la reproducción, copia, distribución o comercialización, total o parcial, del código fuente o del software sin la autorización expresa y por escrito del autor. Este proyecto no es de código abierto (Open Source).


## 10. Conclusión
AGORA ha sido diseñado bajo los principios de **legal-by-design** y **security-by-design**, cumpliendo con:
- RGPD  
- LOPDGDD  
- Principios electorales fundamentales  
- Buenas prácticas de seguridad, auditoría y trazabilidad  

> [!IMPORTANT]
> El sistema demuestra que es **técnicamente viable**, **legalmente consciente** y **documentalmente sólido**.


## 11. Referencias Normativas
- [Reglamento (UE) 2016/679 – RGPD](https://www.boe.es/doue/2016/119/L00001-00088.pdf)
- [Ley Orgánica 3/2018 – LOPDGDD](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673)
- [ISO/IEC 27001 – Sistemas de Gestión de Seguridad de la Información](https://www.ursspain.com/certificaciones-iso/?gad_source=1&gad_campaignid=23147920219&gbraid=0AAAAAC59XbhmXckGM9GsV8ghvIxqkNnRA&gclid=CjwKCAiAwNDMBhBfEiwAd7ti1I3NTakkSH1euGf2wg8UetPj4le44jZ3gnGFdZPACHGVqH4OMa3JdBoCbDUQAvD_BwE)
- [LOREG – Ley Orgánica del Régimen Electoral General](https://www.juntaelectoralcentral.es/cs/jec/loreg/contenido)