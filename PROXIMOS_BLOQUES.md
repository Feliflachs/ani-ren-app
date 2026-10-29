# Próximos bloques de Ani-Ren

## Prioridades y aclaraciones del usuario (26/10/2026)

Este acuerdo actualiza el orden anterior: priorizar auditoría e integración social antes de personalización.
Auditoría y bloque de feeds/conversaciones completados: ver AUDITORIA_SOCIAL.md y ../ani-ren-backend/docs/REGLAS_SOCIALES.md. Descubrir temporal conectado, likes sin reinicio de feed, respuestas desplegables, borrado y navegación directa de reviews implementados. Próximo bloque: crear datos accesibles de prueba; mapa/tops, imágenes y compartir siguen pendientes.
- Para ti conserva personalización y excluye publicaciones propias y de cuentas seguidas. Descubrir busca novedades fuera del gusto personal, incluyendo animes con aumentos recientes de valoraciones positivas. Revisar reglas actuales antes de ajustar cálculos.
- Adelantar una base pequeña, reproducible, con cuentas ficticias accesibles mediante credenciales, actividad coherente, seguimientos, países y fechas variados. Ampliarla después; no borrar datos personales.
- Mapa: el porcentaje solicitado es la participación de cada país en el total mundial del anime elegido (ejemplo: Japón 60 %, Estados Unidos 10 %), no penetración dentro de cada país. Proponer escala continua de violeta y mostrar cantidad y porcentaje. Falta definir la métrica exacta (vistos/reviews) sin doble conteo.
- Imagen opcional solo en posteos, no en reviews. Al borrar un posteo debe eliminarse también su imagen almacenada; contemplar reemplazos y cargas abandonadas.
- Explorar: revisar filtros y paginación en backend. Aprobadas sugerencias al escribir, hasta cinco resultados con acceso directo a la ficha y opción de ver todos.
- Noticias editoriales y reviews profesionales quedan como extra para después.
- Evitar confirmaciones de éxito que exijan otro toque tras publicar/guardar. Mostrar el resultado mediante navegación o actualización de pantalla; conservar errores accionables y confirmaciones necesarias para acciones destructivas.
- Revisar el patrón de clase PanResponder + setState por movimiento; para futuros gestos continuos usar Gesture Handler/Reanimated según corresponda. Inspección del código propio actual: no se encontraron PanResponder ni manejadores de movimiento equivalentes; Reanimated figura como dependencia, sin uso directo encontrado.

## Orden anterior (referencia; sujeto a las prioridades anteriores)

1. En curso: ubicación al abrir la ficha y disponibilidad regional. Elegir país si no hay permiso; no registrar vistos al consultar. Proveedor regional: TMDB, credencial configurada y consulta real verificada. AniList como respaldo sin prometer disponibilidad local. Pendiente prueba de ubicación en teléfono.
2. Castellano: implementadas sinopsis TMDB para series/películas con identidad confirmada y géneros en español, incluyendo datos ya guardados. Trigun (1998) verificado con API real. Fuente original con aviso cuando falte traducción; OVA/ONA y correspondencias ambiguas permanecen sin traducción automática. Revisar cobertura del catálogo en la prueba final.
3. Perfil/personalización: avatar de cámara/galería, desbloqueo y equipamiento de decoradores, insignias. **Antes de implementar: recordar y revisar con el usuario puntos de misiones y umbrales de rangos; cinco animes permitieron subir demasiado rápido.** No cambiar valores sin acordarlos.
4. Compartir publicaciones, reviews, listas y fichas de anime. Definir presentación/enlaces e investigar una fuente o API de noticias de anime en castellano.
5. Base de demostración reproducible y separada de datos personales: usuarios ficticios, reviews, ratings, posts, comentarios, likes, seguimientos y listas coherentes; distintos países y fechas; Aura calculada por las reglas reales.
6. Pruebas en teléfono, permisos denegados/ubicación apagada, reintentos, revisión visual y entrega.
