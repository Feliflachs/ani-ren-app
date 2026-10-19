# Ani-Ren: acuerdos e implementación del rediseño

Actualizado: 18/10/2026.

## Base

Trabajar en `feature/integracion-backend`; usar `context` como memoria visual. Conservar la integración remota y la identidad oscura, violeta/rosa y mascota.

## Reglas confirmadas

- Un voto vigente por persona/anime en el promedio global, calculado como media simple. Se conserva el historial de valoraciones y reviews.
- Crear una valoración o cambiar efectivamente estrellas actualiza el voto vigente. Cambiar solamente texto, título, spoilers o fecha no lo actualiza; reenviar estrellas sin cambios tampoco.
- Las ediciones conservan la fecha original; no vuelven a publicar la review como nueva.
- Para ti reúne conversaciones según gustos, incluidos animes vistos y cuentas seguidas. Siguiendo mantiene orden cronológico.
- Descubrir reemplaza Tendencia en Inicio: una tarjeta por anime no visto, portada, título, puntaje Ani-Ren y una o dos reviews de autores distintos. Incluye animes reseñados por cuentas seguidas; spoilers ocultos. Watchlist sigue siendo el nombre de la colección en la interfaz.
- Explorar permite buscar y consultar cualquier anime, incluidos vistos. Tops globales continúan pendientes de backend.
- Crear es central y visible: valorar, escribir review, publicar y listas.
- Perfil expresa identidad y gustos; Biblioteca reúne colecciones. Evitar bloques repetidos sin propósito.
- Extras de la ficha con carga/error/reintento independiente.

## Alcance de esta implementación

Voto vigente con migración conservadora, Para ti ampliado, endpoint Descubrir, tarjetas de descubrimiento, rediseño de Perfil y Crear y jerarquía de ficha. La migración elige inicialmente la última entrada creada para datos previos; no inventa qué cambios de estrellas hubo en ediciones antiguas.

Descubrir usa el catálogo ya guardado. Selección estable por 20 minutos, independiente de Para ti. Reviews por likes y luego fecha, sin exigir puntuación positiva y con autores distintos. Sin reviews conserva la tarjeta.

Aura mantiene reglas actuales: su diseño diferencial, misiones, recompensas y umbrales se trabajarán en otra etapa. La recuperación visual puede seguir iterándose con uso real; no se restauraron mocks.

## Ajuste de Perfil tras revisión visual

Conservar la fila Seguidores / Siguiendo / Reviews / Watchlist con totales remotos. Editar mediante un lápiz sin recuadro dentro del bloque de identidad; Compartir en el encabezado. Composición compacta, menos tarjetas y títulos descriptivos simples. Compartir permite enviar/copiar el usuario; no hay todavía URL pública del perfil. Referencias: captura del usuario y prototipo Sprint 1, sin volver a datos demo.
