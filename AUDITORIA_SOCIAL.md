# Auditoría social — 26/10/2026

## Actualización posterior: bloque de feeds y conversaciones implementado

Los hallazgos siguientes son la foto inicial, no una lista íntegra de pendientes actuales. Ya se conectó Descubrir con ranking temporal no personalizado; likes conservan páginas del feed; se agregaron paginación de comentarios y respuestas desplegables, borrado de publicaciones por autor y navegación directa al guardar review. Las respuestas conservan el hilo abierto al actualizar. Para ti/Siguiendo mantienen sus reglas verificadas. Ver `../ani-ren-backend/docs/REGLAS_SOCIALES.md` para contratos, fórmulas y límites.

Validación posterior: backend completo 74/74; app 31/31, tipos/lint y prueba Chromium de los recorridos nuevos. El mapa/tops, imágenes y compartir de demostración siguen pendientes; la base pequeña aún no se creó.

Alcance: inspección del frontend y backend actuales, pruebas automatizadas sociales existentes y reproducción aislada de los cálculos del mapa. No se modificó comportamiento ni se pobló la base personal. No incluye QA visual/en teléfono ni prueba de carga.

## Resultado

La base social está integrada con la API, pero hay diferencias funcionales con las reglas acordadas. Prioridades: P1 afecta una función central o un cálculo; P2 completa experiencia o capacidades faltantes. Son hallazgos pendientes, no correcciones realizadas.

### 1. P1 — Descubrir no está conectado a la interfaz y su algoritmo sigue siendo personalizado

- `app/(tabs)/inicio.tsx:12,33` ofrece Para ti, Siguiendo y Tendencia. No hay consumidor de `/discover` en `app` ni `src`; solo en una prueba de integración.
- `backend/src/modules/discovery/anime-discovery.ts:35-41` puntúa por géneros de vistos/watchlist/favoritos y desempata por ID externo. No mide crecimiento reciente de valoraciones positivas.
- `/discover` sí agrupa por anime, excluye vistos y adjunta hasta dos reviews de autores diferentes, pero el orden no cumple el Descubrir acordado.
- Corrección: conectar Descubrir con tarjetas por anime y selección no personalizada, con variedad y señales recientes de la comunidad. Conservar exclusión de vistos si se mantiene como criterio de novedad, diferenciándola de afinidad personal. Definir ventana, muestra mínima y señal de crecimiento antes de fijar pesos.

### 2. P1 — Mapa y tops por actividad cuentan registros repetidos

- `backend/src/modules/explore/explore.service.ts:27,43` utiliza `rows.length`/`local.length` como vistos; reviews cuenta publicaciones. Los tops por vistas/tendencia ordenan por ese total. El promedio regional también usa todas las valoraciones históricas.
- Reproducción ejecutada directamente sobre las funciones: A valora el mismo anime dos veces en AR (1 y 5 estrellas) y B una vez en JP (3 estrellas). Resultado actual: 3 vistas, AR 2, JP 1, promedio AR 3. Resultado acordado: 2 personas, AR 1, JP 1, promedio AR 5; reparto 50 %/50 %.
- El promedio global sí usa el voto vigente: en ese ejemplo da 4 y dos votantes. `viewers` también deduplica, pero `views` y el ranking no lo usan.
- `countryTotals` normaliza contra el país con más actividad, no contra el total mundial. El mapa SVG ya usa intensidad continua; no hay que atribuir el problema a bandas numéricas fijas. El backend además devuelve `colorLevel` de 0 a 5.
- Corrección: seleccionar una contribución por usuario/anime antes de agregar países y calcular porcentajes. Separar historial de publicaciones de personas únicas; conservar reviews antiguas no debe multiplicar votos ni vistos.
- Resolver explícitamente país al volver a valorar desde otro país, fechas de períodos y actividad sin país: una persona no debe sumarse en dos países para el mismo total mundial. No inventar país para usuarios sin ubicación.
- Marcar visto sin valorar solo modifica LibraryEntry; el mapa consulta RatingEntry. Por eso ese visto no entra en el mapa. LibraryEntry no almacena país/fecha del visto; contemplarlo al definir la métrica y el modelo.

### 3. P1 — Dar like reinicia las páginas cargadas del feed

- `src/api/remote.ts:259-260`: toda mutación borra toda la caché y aumenta `revision`.
- `src/context/RemoteContext.tsx:84-113`: usePage incorpora revision en su clave, pasa a items vacíos y vuelve a cargar la primera página.
- Caso derivado del código: cargar dos páginas, dar like a una tarjeta de la segunda; se descartan las páginas acumuladas y se solicita de nuevo el inicio. En Para ti también se regenera la selección.
- Corrección: actualizar la entidad/contador afectado conservando páginas; invalidar únicamente consultas dependientes. Seguir a un autor sí debe retirarlo de Para ti y actualizar Siguiendo, sin tratar todos los likes como un refresco completo.
- Validar posición visual y pulsaciones rápidas en teléfono después de corregir; esta auditoría no afirma haber reproducido el salto de scroll visualmente.

### 4. P1 — Comentarios posteriores a la primera página inaccesibles

- `app/inicio/review/[id].tsx:42` usa usePage, pero su único QueryFooter está en la rama donde no existe la publicación (`:60`). La pantalla normal no expone more ni el error de carga de comentarios.
- La API pagina de a 20 por defecto. Con 21 comentarios, el más antiguo no se puede cargar desde esa pantalla.
- Corrección: controles de paginación/carga/error en la sección visible de comentarios y prueba con más de 20.

### 5. P2 — Tendencia es popularidad acumulada, no crecimiento reciente

- `backend/src/modules/community/publication-queries.ts:17-19`: suma todos los likes y comentarios históricos, desempata por creación. Una publicación antigua popular puede permanecer arriba aunque ya no tenga actividad.
- Es distinto de `/explore`, que sí usa siete días, aunque allí se ordena por cantidad de registros y no por crecimiento/recepción positiva.
- Al integrar Descubrir, no reutilizar esta suma como si detectara animes que empiezan a recibir buenas valoraciones. Los comentarios repetidos de una persona también incrementan la suma actual.

### 6. P2 — No existe eliminación de publicaciones

- Posts y reviews tienen POST/PATCH; no se encontró DELETE de posts/reviews ni acción visible de eliminación. Comentarios tienen lectura/creación, sin edición/eliminación.
- La edición verifica autoría en el servidor. No confundir esta protección existente con un circuito de borrado terminado.
- Completar eliminación de posteos al implementar imágenes, con borrado del archivo y relaciones. Para reviews, definir cómo recuperar el voto vigente anterior si se borra el actual, sin destruir historial o recompensas accidentalmente.

### 7. P2 — Confirmaciones y botones de demostración

- Guardar review abre `confirmed` (`app/crear/review/escribir.tsx:116,273`); listas y perfil también muestran confirmaciones de guardado.
- Publicar un post ya navega al detalle. `saveReview` y `saveActivity` no devuelven actualmente el ID de publicación al formulario: propagar el resultado para navegar a la review. Una valoración sin texto no crea publicación; debe volver a la ficha/actividad, no inventar una review.
- Compartir en tarjeta/detalle/perfil abre un diálogo de demostración. Implementar enlaces/compartir o retirar el acceso hasta que tenga función real.

## Lo que sí está implementado y validado

- Para ti se calcula en backend: excluye propios y seguidos; suma 3 por anime en watchlist, 1 por género coincidente y 1 por hashtag coincidente con intereses o hashtags de publicaciones con like; alterna autores. Sin afinidad, desempata por ID descendente. Los vistos por sí solos no aportan afinidad en este feed; favoritos y watchlist sí. No hay decaimiento por antigüedad: la recencia desempata, no reduce la afinidad.
- Siguiendo consulta únicamente publicaciones de cuentas seguidas, por ID descendente, con cursor. Para datos creados normalmente equivale al orden de inserción reciente; al preparar fechas de prueba hay que contemplar que no ordena por createdAt.
- Seguimientos y likes tienen unicidad en BD y PUT/DELETE idempotentes; no se permite seguirse a uno mismo. Amistad significa seguimiento recíproco.
- Comentarios/posts/reviews tienen claves de idempotencia para reintentos. Likes y comentarios pertenecen a la publicación y se conservan al editar.
- El backend controla autoría para editar posts/reviews y perfil. No acepta identidad del autor desde el front.
- Biblioteca tiene unicidad por usuario/anime. El voto global vigente está representado por currentRatingId. Crear una valoración lo actualiza; cambiar estrellas de una entrada antigua la vuelve vigente; editar solo texto o reenviar un valor sin cambio no lo hace. Esta semántica está cubierta por pruebas; aclararla como «última opinión actualizada» al implementar estadísticas regionales.
- Las reglas activas de selección y agregación están en backend. `src/feed.ts` conserva un selector de demo, pero no tiene consumidores encontrados. Retirarlo en limpieza evitaría confusión; no es evidencia de que Inicio calcule el feed localmente.
- Límite de escala: Para ti carga y ordena todos los candidatos y alterna autores en memoria; Tendencia carga todo y guarda DTOs completos en snapshots. Sirve para la base pequeña, no constituye validación para una comunidad grande. Los snapshots de DTO pueden mostrar contadores antiguos durante su vigencia. Optimización posterior, sin frenar las pruebas iniciales.

## Validación realizada

- Backend: 21/21 pruebas de social, discovery, current-rating-discover, explore e integration-contracts.
- Frontend: 17/17 pruebas de remote y api.
- Primer intento backend bloqueado por EACCES en conexiones localhost del sandbox; repetido fuera del sandbox con éxito usando bases temporales de los fixtures.
- Reproducción aislada de duplicación en mapa descrita arriba, sin escribir en ninguna BD.
- No se ejecutó suite completa, QA visual, export ni prueba en teléfono. Las pruebas existentes validan varios contratos anteriores y no prueban todos los acuerdos nuevos.

## Próximo bloque: base pequeña de prueba (propuesta, aún no creada)

- Aproximadamente 8 cuentas ficticias con contraseña real y credenciales documentadas para uso local, 6–8 animes y 4 países; una cuenta nueva sin gustos ni actividad.
- Seguimientos recíprocos, unilaterales y grupos separados; autores seguidos/no seguidos y publicaciones propias para comparar feeds.
- Más de 20 publicaciones elegibles para probar paginación, y un post con 25 comentarios.
- Una persona con varias reviews/ratings del mismo anime, incluyendo cambio de estrellas de una review antigua. Un caso de cambio de país y otro sin país.
- Actividad reciente positiva frente a popularidad histórica, gustos diferentes y animes fuera de afinidad; fechas variadas.
- Bibliotecas, listas, favoritos y likes coherentes. Crear mediante reglas reales; no usar las cuentas de fixture (passwordHash fixture-no-login), porque esas no permiten login con contraseña.
- Generación reproducible y separada de datos personales, sin resetear la base actual. Preparar expectativas conocidas para cada cuenta y estadística.
- Usar esta base para reproducir los hallazgos antes de corregirlos y comprobar después el comportamiento nuevo. No hace falta resolver imágenes/noticias para crearla.
