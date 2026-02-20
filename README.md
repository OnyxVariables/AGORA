<table align="center">
  <tr>
    <td>
      <img src="frontend/img/LogoAgora.jpg" alt="Logo" width="80">
    </td>
    <td>
      <h1>AGORA</h1>
    </td>
  </tr>
</table>

<p align="center">
  <img src="https://img.shields.io/badge/estado-en%20desarrollo-blue" />
  <img src="https://img.shields.io/badge/seguridad-TLS%20%2B%20Certificado%20electr%C3%B3nico-green" />
  <img src="https://img.shields.io/badge/blockchain-Hyperledger%20Besu-purple" />
  <img src="https://img.shields.io/badge/infraestructura-Docker%20%2B%20Nginx-orange" />
  <img src="https://img.shields.io/badge/enfoque-Administraci%C3%B3n%20P%C3%BAblica-black" />
</p>

## Plataforma de votación digital segura y descentralizada
Agora es un proyecto de votación electrónica diseñado con un enfoque **profesional, seguro y escalable**, orientado a entornos donde la **fiabilidad, la trazabilidad y la protección de datos** son requisitos críticos (administraciones públicas, instituciones educativas, organizaciones privadas o procesos internos de alto impacto).
El sistema combina **autenticación mediante certificado electrónico**, una **arquitectura web moderna** y el uso de **tecnologías blockchain** para garantizar la integridad de los votos y la transparencia del proceso.

---

## 🎯 Objetivos del proyecto
* Garantizar que **solo usuarios autenticados y válidos** puedan votar.
* Asegurar que cada voto sea **íntegro, inmutable y verificable**.
* Proteger la identidad del votante y cumplir con los principios de **seguridad y protección de datos**.
* Ofrecer una plataforma **escalable**, preparada para miles de usuarios concurrentes.
* Mantener una arquitectura clara, documentada y mantenible.

---

## 🏗️ Arquitectura general
Agora está diseñado siguiendo una arquitectura distribuida y modular:

* **Frontend**
  * Interfaz web moderna y responsive.
  * Visualización de resultados mediante gráficos (Chart.js).
  * Comunicación segura con el backend.

* **Backend**
  * API responsable de la lógica de negocio.
  * Validación de certificados electrónicos.
  * Gestión de usuarios, votaciones y resultados.

* **Base de datos relacional**
  * Almacenamiento de usuarios, elecciones y metadatos.
  * Control de accesos y trazabilidad.

* **Blockchain privada (Hyperledger Besu)**
  * Registro inmutable de los votos.
  * Generación del bloque génesis.
  * Red privada con múltiples nodos.

* **Infraestructura**
  * Contenedores Docker.
  * Servidor web Nginx.
  * Despligue en AWS con dominio propio (agorachain.es).
  * Preparado para balanceador de carga y alta disponibilidad.

---

## 🔐 Seguridad
La seguridad es un pilar fundamental del proyecto:
* Autenticación mediante **certificado electrónico**.
* Comunicación cifrada mediante **TLS/HTTPS**.
* Separación clara de responsabilidades entre frontend y backend.
* Registro de operaciones para **auditoría y trazabilidad**.
* Diseño alineado con principios de **protección de datos (RGPD)**.

---

## ⛓️ Blockchain y votaciones
Los votos no se almacenan como simples registros modificables:
* Cada voto se registra como una **transacción**.
* Las transacciones se agrupan en **bloques**.
* Cada bloque incluye:
  * Número de bloque.
  * Timestamp UTC.
  * Hash SHA-256 del bloque anterior.
* Esto garantiza:
  * Inmutabilidad.
  * Transparencia.
  * Imposibilidad de alteración posterior.

---

## 📊 Visualización de resultados
El sistema permite mostrar los resultados de forma clara y comprensible:
* Gráficos de barras.
* Gráficos pastel.
* Gráficos temporales.
* Preparado para incluir mapas de calor por nación.

---

## Escalabilidad y disponibilidad
Agora está preparado para crecer:
* Despliegue mediante Docker.
* Posibilidad de duplicar instancias del backend.
* Integración con **balanceador de carga**.
* Alta disponibilidad ante caídas de nodos.

---

## 🛠️ Tecnologías utilizadas
| Área | Tecnología |
|------|------------|
| Frontend | React, HTML, CSS, JavaScript, Chart.js |
| Backend | Java / Laravel |
| Blockchain | Hyperledger Besu |
| Base de datos | MySQL / MariaDB |
| Infraestructura | Docker, Nginx, AWS |
| Seguridad | TLS, Certificados electrónicos, SSL generado con let's encrypt |

---

## 📁 Estructura del proyecto (simplificada)

```
agora/
├── backend/
├── frontend/
├── blockchain/
│   ├── genesis/
│   ├── nodes/
├── docker/
├── database/
└── docs/
```

---

## 📚 Documentación
El proyecto incluirá documentación detallada sobre:
* Instalación y despliegue.
* Configuración de certificados electrónicos.
* Creación de la red blockchain privada.
* Estructura de la base de datos.
* Casos de uso y diagramas.

---

## Estado del proyecto
Agora se encuentra en **desarrollo activo**, con un enfoque académico-profesional y una clara orientación a entornos reales de producción.

---

## 👤 Autor
Proyecto desarrollado por Oliver Gamboa Mesa y Rojohn Ibana Ibañares, con especial atención en la **seguridad, robustez y calidad del software**.

---

> Agora no es solo una aplicación de votación: es una propuesta de **confianza digital**, donde cada voto cuenta y queda protegido.
