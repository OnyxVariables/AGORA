# Documentación del proyecto AGORA
Índice de los documentos en esta carpeta y propósito de cada uno.

| Documento | Contenido |
|-----------|-----------|
| [**Arquitectura_Runtime.md**](Arquitectura_Runtime.md) | **Arquitectura real** (Laravel vs Spring, puertos, flujo votación, scheduler, D’Hondt). Leer primero para desarrollo. |
| [**Demo-Votacion-Local.md**](Demo-Votacion-Local.md) | **Demo local:** sembrar ciudadanos (`demo:seed-citizens`), votos masivos (`demo:cast-votes`), login `X-Demo-DNI`, script Python `tools/demo_vote_http.py`, troubleshooting. |
| [Diagrama_Arquitectura.md](Diagrama_Arquitectura.md) | Visión de arquitectura y despliegue (diagrama, objetivos). Actualizado con nota cruzada al runtime. |
| [Environment_Setup.md](Environment_Setup.md) | Entornos dev/prod, Docker, variables `.env`. |
| [Diagrama_Flujo.md](Diagrama_Flujo.md) | Flujos ciudadano/administrador (diagrama Mermaid). |
| [Diagrama_Secuencia.md](Diagrama_Secuencia.md) | Secuencias UML (Mermaid). |
| [Diagrama_CasosdeUso.md](Diagrama_CasosdeUso.md) | Casos de uso. |
| [Diagrama_EntidadRelacion.md](Diagrama_EntidadRelacion.md) | Modelo de datos. |
| [Diagrama_Estado.md](Diagrama_Estado.md) | Estados del sistema. |
| [Diagrama_Radar.md](Diagrama_Radar.md) | Radar de requisitos/capacidades. |
| [RequisitosFuncionales.md](RequisitosFuncionales.md) | Requisitos funcionales. |
| [CumplimientoLegal.md](CumplimientoLegal.md) | Marco legal / RGPD (orientativo). |

## Documentación en otros directorios
| Ruta | Tema |
|------|------|
| [../README.md](../README.md) | Descripción general del producto y enlaces. |
| [../blockchain/docs/Local_Testing_Guide.md](../blockchain/docs/Local_Testing_Guide.md) | Pruebas locales del contrato. |
| [../QBFT-Network/docs/](../QBFT-Network/docs/) | Red Besu QBFT (topología, Docker). |
| [../besu-kubernetes/docs/](../besu-kubernetes/docs/) | Despliegue Kubernetes. |