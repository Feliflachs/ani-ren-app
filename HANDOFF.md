# Ani-ren: funcionamiento actual y próximos pasos

Actualizado: 10 de octubre de 2026. Rama de trabajo: `context`.

## Dirección acordada el 10 de octubre: comunidad y descubrimiento

Base social implementada en el frontend local. Backend e imágenes siguen pendientes. Tienen prioridad sobre las propuestas anteriores cuando se contradigan. La devolución de la entrega orienta Ani-ren hacia una red social para recomendar y descubrir anime. Cámara y reconocimiento pasan a segundo plano. Se implementó la base de publicaciones y los feeds tras la autorización del usuario. No se creó un repositorio de backend.

### Siguiendo y Para ti

- **Siguiendo:** publicaciones y reviews de las cuentas seguidas, inicialmente por fecha.
- **Para ti:** descubrir personas y animes. En la primera versión se excluyen las cuentas seguidas y las publicaciones propias. Las señales acordadas son géneros que le gustan al usuario, etiquetas relacionadas con sus intereses y animes de su watchlist.
- Los animes ya vistos no son un requisito ni el filtro principal de Para ti; una publicación sobre uno puede aparecer si es relevante. Haber visto un anime tampoco obliga a recomendar contenido sobre él.
- Se busca variedad de autores y animes. No rellenar silenciosamente Para ti con Siguiendo cuando falte contenido. Regla inicial en `src/feed.ts`: +3 por anime de watchlist, +1 por género coincidente y +1 por etiqueta coincidente. Los géneros se infieren de favoritos y watchlist; las etiquetas, de publicaciones que gustaron. Se desempata por fecha y se alternan autores cuando es posible. Sin coincidencias se ofrece contenido de otras cuentas por fecha; nunca se incluyen seguidos ni el propio usuario. Son reglas simples ajustables, no IA.
- **Explorar** conserva la búsqueda intencional, catálogo, filtros y tops; Para ti es descubrimiento mediante publicaciones.

### Publicación común y review

Modelo en `src/publications.ts`: `PublicationBase` compartida y dos variantes `Review` y `Post`, identificadas por `kind`. Compartir autor, fecha, texto, aviso de spoilers, etiquetas, likes y comentarios. Las interacciones deben pertenecer al mismo sistema para ambos tipos.

| Tipo | Datos y comportamiento propios |
| --- | --- |
| Publicación común | Texto para conversar, preguntar o recomendar, sin puntuación obligatoria ni necesidad de valorar un anime concreto. Puede referenciar animes mediante etiquetas. Imagen opcional en el modelo; su implementación se pospone al apartado final de extras. |
| Review | Anime asociado, opinión, puntuación y opción de spoilers. Conserva los campos pertinentes del editor actual; el título sigue siendo opcional. |

No se usan clases ni un contexto nuevo. `PublicationsContext.tsx` reemplaza el nombre ReviewsContext y ofrece `publications` (ambos tipos) y `reviews` (solo reviews), para no contar posteos en las misiones ni en los totales de reviews. El editor exige puntuación al publicar una review; los logs sin texto y reviews antiguas sin puntuación siguen siendo compatibles.

Los hashtags sirven para referenciar temas/animes y como señales de Para ti. Ejemplo: «Busco algo parecido a #Frieren, ¿qué recomiendan?». Un hashtag convencional no contiene espacios. Implementado: hashtags libres extraídos del texto, normalizados sin mayúsculas ni tildes; los que coinciden con ID/título normalizado del catálogo se vinculan a ese anime. También hay un buscador para elegir animes mencionados y guardarlos por ID. No se resuelven sinónimos ni apodos arbitrarios. Las menciones abren la ficha y las etiquetas buscan publicaciones.

### Archivos y recorrido de la base social

- `src/publications.ts`: base compartida, variantes, extracción de hashtags e IDs relacionados.
- `src/feed.ts`: selección y orden de Para ti, Siguiendo y Tendencia.
- `src/context/PublicationsContext.tsx`: una sola fuente para posteos/reviews, likes y comentarios. Conserva la clave local `ani-ren:reviews:v1` para leer lo anterior; completa tipo, etiquetas y fecha faltantes al cargar. Fechas antiguas sin referencia conocida se ordenan al final, sin inventar la fecha original.
- `app/crear/posteo.tsx`: publicar/editar texto de 3 a 2000 caracteres, menciones y spoilers. Disponible desde Crear > Posteo. Guardar abre el detalle del posteo.
- `PublicationCard` y `PublicationContent` permanecen en components.tsx. Ambos tipos usan la ruta existente `/inicio/review/[id]` para el detalle; su título y botón de edición dependen del tipo.
- Perfil incorpora Posteos (también en perfiles públicos); Likes y Búsqueda > Publicaciones incluyen los dos tipos. Las fichas del anime y las misiones siguen consultando solo reviews.
- Se persiste el contenido de ambos tipos al publicar/editar. Likes, comentarios y seguimientos siguen siendo estado temporal de la demo; no se agregó persistencia para ellos.

Pruebas manuales pendientes en teléfono: publicar con/sin menciones y con spoilers; abrir desde Perfil, dar like/comentar desde otra cuenta y comprobar el detalle; editar y recargar para verificar texto y autor; seguir a un autor y comprobar su paso a Siguiendo; rechazar un formulario vacío; confirmar que un posteo no suma reviews ni animes vistos. Verificación local: TypeScript/lint y comprobaciones puntuales de filtros, orden, hashtags y migración, sin agregar infraestructura de tests.

### Backend y siguiente paso

Se hará en otro repositorio. La tecnología y requisitos se hablarán en clase la semana siguiente; por ahora se sabe que incluirá integración con usuarios y APIs. No elegir framework, proveedor, endpoints ni esquema definitivo todavía. Primero acordar los campos de las publicaciones y el comportamiento del feed; después coordinar esos contratos con autenticación, catálogo e interacciones. No crear el repositorio ni conectar servicios en esta etapa de planificación.

## Estado de la revisión del 8 de octubre

Se unificaron los datos personales y sus consumidores. Las secciones históricas describen el proceso; para datos, persistencia e integración futura rige este apartado.

Los seis contextos viven en `src/context/`, incluido `AppState.tsx`. Los hooks que combinan datos permanecen en `src/`. Esta reorganización cambia rutas de archivos, no funcionamiento.

### Método y responsabilidades

1. Separar el estado por responsabilidad, sin crear un contexto por pantalla.
2. Cargar los ejemplos de `mock.ts` una sola vez en los providers.
3. Hacer que todas las pantallas lean el mismo estado y calculen los totales a partir de él.
4. Reutilizar tarjetas y reglas visuales, y después eliminar estilos/imports sin uso.
5. Comprobar cambios de cuenta, edición, relaciones y spoilers con pruebas de lógica y una exportación.

| Archivo | Fuente que administra | Consumidores |
| --- | --- | --- |
| `SessionContext.tsx` | ID de la cuenta activa; ingreso, restauración y cierre | Login, layout, hooks de usuario |
| `ProfilesContext.tsx` | Nombre visible, biografía e imagen | Editor, avatares y directorio de perfiles |
| `AppState.tsx` | Vistos, favoritos ordenados, watchlist y recompensas por usuario | Biblioteca, ficha de anime, perfil y misiones |
| `SocialContext.tsx` | IDs seguidos; deriva seguidores y amistad mutua | Comunidad, perfiles, feed, amigos del anime y ranking |
| `PublicationsContext.tsx` | Reviews/logs, puntuación, fecha, spoilers, likes y comentarios | Inicio, detalle, editor, búsqueda, perfil, biblioteca, ficha de anime y mapa |
| `ListsContext.tsx` | Listas con su `animeIds` ordenado y likes | Editor, tarjetas, detalle, perfil, biblioteca, búsqueda y selector del anime |
| `useMissions.ts` | Hook sin contexto propio; calcula progreso y consulta recompensas en AppState | Aura y Misiones |
| `missions.ts` | Definición de objetivos y cálculo reutilizable por tipo de misión | Aura y Misiones |
| `useDirectory.ts` | No almacena estado: compone perfiles y totales actuales | Toda pantalla que muestra personas |
| `useCurrentUser.ts` | Resuelve el perfil actual a partir del ID de sesión | Pantallas de la cuenta activa |

`useAppState()` conserva una interfaz cómoda para la actividad del anime, pero no guarda otra copia de las reviews ni de las listas: consulta sus contextos. Los textos y puntuaciones se guardan únicamente en `PublicationsContext`; el contenido y orden de las listas, únicamente en `ListsContext`.

Hay seis contextos por responsabilidad. Se retiró el provider exclusivo de Aura: sus cálculos no necesitan otro contexto. Los hooks `useMissions`, `useDirectory` y `useCurrentUser` solo consultan/componen datos.

### Ubicación al guardar una review (8 de octubre)

`app/crear/review/escribir.tsx` contiene `obtenerPais()`, llamada desde `save` tras validar el formulario y solo si se escribe una review. Usa `expo-location`: permiso de primer plano, coordenadas actuales y `reverseGeocodeAsync`; toma solo `country`. El país se muestra temporalmente en la confirmación y no se agrega a la review, al almacenamiento ni al mapa. No conserva coordenadas/dirección ni realiza seguimiento continuo. Si se rechaza el permiso, faltan servicios, hay error, el guardado sigue sin país. En web se omite la consulta. Se simplificó al estilo del ejemplo de clase: `useState<string | null>` conserva solo el país y una función async dentro del componente lo actualiza. No usa `useEffect` porque se llama al tocar Listo. Se retiró el temporizador; la consulta puede demorar según el GPS y la red. La librería y el mensaje de permiso están configurados en package.json/app.json.

Prueba manual pendiente en teléfono: permitir ubicación y comprobar el país; denegar permiso o desactivar GPS y comprobar que se guarda igual. No se pide ubicación al abrir el editor ni al guardar solo una puntuación. Conectar ese país con los datos de la review y el mapa queda pendiente. Esta sección reemplaza las notas históricas que indicaban geolocalización totalmente pendiente.

### Comportamiento acordado

- El `@usuario` y el ID no se editan. El formulario muestra el usuario como solo lectura; las reglas de alta siguen en `src/login.ts`. No hay que renombrar autores en cada review: se relacionan por ID.
- Editar nombre/bio/avatar de ejemplo y favoritos actualiza las vistas locales. El selector de avatar sigue siendo una demostración, no acceso al dispositivo; cámara y galería reales están en Explorar.
- Los totales de perfil, Aura, comunidad y ranking salen de las colecciones. Se eliminaron los grandes números personales ficticios: ahora una biblioteca de cuatro animes indica cuatro. El catálogo y las métricas globales/por país siguen siendo muestras estáticas.
- Los likes y comentarios son compartidos. Las conversaciones empiezan vacías porque no había comentarios específicos por review; ya no se reutilizan los mismos dos comentarios para todas.
- Crear/editar una review actualiza Inicio, Perfil, Biblioteca, búsqueda y ficha. Un log sin texto no se publica como review. Si se abre el campo de review, requiere al menos diez caracteres.
- Las listas guardadas aparecen en todas sus vistas. Agregar un anime desde su ficha lo coloca al final; quitarlo conserva el orden del resto. No se reconstruyen según el catálogo.
- `PublicationCard` es la tarjeta común. Tocar su cuerpo abre el detalle; no hay botón "Ver review". Likes y otras acciones son independientes. `PublicationContent` y `SpoilerCover` ocultan título y texto con una cubierta gris hasta tocarla; también se usan en el detalle. El formulario ya tiene el interruptor «Contiene spoilers».
- Misiones: objetivos de demo alcanzables con el catálogo (2 romances, 3 de Acción, 4 géneros, 3 reviews y primer visto). No hay objetivo semanal porque todavía no existe un historial temporal completo. Recompensas solo reclamables con el objetivo completo; se conservan por usuario durante la ejecución. Los decoradores de Rangos siguen siendo una vista previa local.
- Los providers de datos no se desmontan al salir de la cuenta: permiten ver las mismas modificaciones al visitar ese perfil desde otra cuenta. Se reinician los formularios y la navegación al cambiar el ID activo.
- **Persistencia:** AsyncStorage recuerda el ID de sesión y las reviews/logs (clave `ani-ren:reviews:v1`), incluyendo texto, título, fecha, puntuación y spoilers. El editor confirma después de escribir y conserva el borrador si falla. La app espera la lectura inicial; si falla, muestra Reintentar sin sobrescribir los datos. Likes, comentarios, listas, perfiles editados, relaciones, recompensas y cambios de colecciones siguen siendo temporales. Los vistos iniciales incluyen los animes de las reviews restauradas. No se escriben archivos del proyecto.

### Mapa para conectar el backend después

No hay URLs ni esquema de base de datos definitivo. Estos son contratos de frontend para coordinar con el equipo; una API deberá validar autoría, reglas y errores del lado servidor. Adaptar respuestas en los providers evita reescribir cada tarjeta.

**Cómo encontrar los puntos de integración:** buscar `TODO BACKEND` en todo el proyecto (Ctrl+Shift+F), o ejecutar `rg -n "TODO BACKEND" src app`. Las marcas junto a las funciones de los contextos señalan dónde conectar lecturas y operaciones. Las marcas de pantallas explican el recorrido: no significan que haya que duplicar una llamada de API por cada tarjeta. Mantener los borradores y validaciones de presentación en los formularios.

Para la base social nueva, empezar en `src/context/PublicationsContext.tsx` (`PUBLICACIONES-CARGAR`, `PUBLICACION-ADAPTAR`, `REVIEW-GUARDAR`, `POSTEO-GUARDAR` e interacciones), `src/feed.ts` (`FEED-SELECCION`) y `src/publications.ts` (`PUBLICACION-CONTRATO`). La API debe aportar IDs/fechas y comprobar la identidad desde la sesión; no confiar en el userId enviado por el cliente. Definir caché e invalidación, respuestas de error y carga antes de sustituir AsyncStorage. Las validaciones contra el catálogo/usuarios del mock también deben reemplazarse.

| Dominio | Lecturas y operaciones a reemplazar | Atributos que usa la interfaz |
| --- | --- | --- |
| Sesión | `buscarCuenta`, `signIn`, `restore`, `signOut` | ID estable; mecanismo de sesión real por definir. El JSON de contraseñas públicas se retira al integrar autenticación |
| Registro | `app/login/crear-cuenta.tsx`, función `registrar`; reglas locales en `src/login.ts` | Usuario, contraseña y errores de disponibilidad/validación del servidor; no confirmar un registro real solo con validación local |
| Perfiles | Carga de `ProfilesContext`, `updateProfile` | `id`, `name`, `handle`, `bio`, imagen; las imágenes locales deberán adaptarse a URLs/archivos |
| Colecciones | Carga de `AppState`, `updateCollection`, `setFavorites` | `userId`, IDs de anime vistos, favoritos ordenados y watchlist |
| Relaciones | Carga de `SocialContext`, `toggleFollowing` | `userId`, `otherId`; seguidores y amistad se derivan de los seguimientos |
| Reviews/logs | Carga de `PublicationsContext`, `saveReview` | `id`, `userId`, `animeId`, `title`, `text`, `rating`, `spoiler`, `date`. Actualmente hay una entrada por usuario/anime; acordar si habrá varias y timestamps antes de integrar |
| Posteos | `PublicationsContext.savePost`, adaptación en `readEntry`; formulario `app/crear/posteo.tsx` | Base común `id`, `userId`, `kind`, `text`, `createdAt`, `tags`, `spoiler`; variante post con `animeIds`, sin rating. Persistencia remota y edición con autoría validada |
| Feeds | `src/feed.ts`, `selectFeed`; consumidor `app/(tabs)/inicio.tsx` | Tipo de feed, usuario autenticado, gustos, etiquetas y watchlist; orden/paginación y exclusión de seguidos/propios en Para ti |
| Interacciones | `toggleLike`, `addComment` de PublicationsContext; `toggleLike` de ListsContext | ID de publicación/lista, ID de usuario; comentarios con `id`, `userId`, `text`, fecha/hora; totales reales y estado propio |
| Listas | Carga de `ListsContext`, `saveList`, `toggleAnime` | `id`, `userId`, `title`, `description`, `ordered`, `animeIds` preservando el orden |
| Aura | Definiciones/progreso de misiones y reclamación de recompensas | ID de misión, criterio, objetivo, progreso y recompensa por usuario; rangos y decoradores requieren reglas acordadas |
| Catálogo y búsqueda | `anime`, `findAnime`, géneros, temporadas en `mock.ts`; filtros de Búsqueda y Crear | Metadatos del anime y resultados por categoría; paginación/carga/error al integrar |
| Rankings y mapa | `getCountryMetric`, `getCountryTop`, `countries`, `localReviewIds` en detalle de país; Tops | País, anime, período, métrica y agregados; no se deducen de la actividad personal actual |
| Reconocimiento | Selección de imagen en Explorar y futura función de reconocimiento | Imagen de entrada y coincidencias normalizadas; todavía no se consulta ninguna API |

Los totales personales se calculan completos para esta demo pequeña. Con backend y paginación deberá recibirse el total real, no contar únicamente los elementos de una página. Añadir estados de carga/error y confirmar las mutaciones cuando responda el servidor.

### Validación de esta etapa

Ejecutar TypeScript, lint y exportación. El sistema anterior de tests con hooks simulados ya no está en el proyecto. Falta inspección interactiva en teléfono: spoilers, teclado, volver de editores, permisos y restaurar sesión. Los recorridos de publicaciones están en el apartado del 10 de octubre.

## 1. Objetivo y alcance

Aplicación educativa para descubrir anime, registrar actividad, compartir reviews y listas, seguir personas y explorar estadísticas por país. Frontend con Expo SDK 57, React Native, TypeScript y Expo Router.

Prioridad: código simple que el equipo pueda entender y explicar. Cada decisión debe tener una razón concreta. Evitar infraestructura y abstracciones innecesarias; no contratar servicios pagos.

Este documento separa lo implementado de las propuestas futuras. El 5 de octubre se reorganizaron las subpantallas por sección en la rama `trabajo/organizacion-frontend`. El 6 de octubre se agregaron login con cuentas JSON y registro de validación. En la rama `context` se conectó la cuenta elegida con las pantallas y se agregó sesión local persistente. No hay backend, ubicación ni traducciones. Acordar cada paso antes de programarlo.

## 2. Organización actual

Expo Router define las rutas a partir de archivos en `app/`. `[id]` permite mostrar distintos registros con una misma pantalla.

`app/_layout.tsx` es el contenedor general: carga iconos, controla la apertura, provee áreas seguras y estado compartido, configura el Stack y limita el ancho a 480 px. Cada pantalla define su propio contenido.

`app/(tabs)/_layout.tsx` configura las cinco pestañas inferiores: orden, iconos, colores y espacio para gestos del teléfono.

Solo existen esos dos layouts. Las subpantallas se agrupan en `app/inicio/`, `app/explorar/`, `app/crear/`, `app/aura/` y `app/perfil/`, fuera de `(tabs)`. El Stack general las abre sin barra inferior sobre la pantalla de origen. Por ejemplo, Perfil puede abrir `/explorar/anime/[id]` sin cambiar a la pestaña Explorar. Las rutas anteriores de archivos trasladados cambian; los enlaces internos se actualizaron y no se agregaron alias para enlaces externos antiguos. El escaneo sigue integrado en la pantalla principal de Explorar.

| Archivo | Función actual |
| --- | --- |
| `app/(tabs)/inicio.tsx` | Inicio con feed y filtros Para ti, Siguiendo y Tendencia. Aquí está integrado el feed social. |
| `app/(tabs)/explorar.tsx` | Búsqueda, géneros, temporadas, tendencias, acceso al mapa y selección real de imágenes. |
| `app/(tabs)/crear.tsx` | Elegir un anime para escribir una review o entrar a crear una lista. |
| `app/(tabs)/aura.tsx` | Rango, progreso y accesos a funciones de Aura. |
| `app/(tabs)/perfil.tsx` | Perfil propio, favoritos, actividad y accesos a edición y conexiones. |
| `app/explorar/busqueda.tsx` | Resultados de anime, reviews, usuarios y listas; filtros de género y temporada donde corresponde. |
| `app/perfil/biblioteca.tsx` | Watchlist, Vistos y Favoritos usando actividad compartida. |
| `app/perfil/editar.tsx` | Formulario con validaciones y confirmación simulada. Avatar de ejemplo. |
| `app/perfil/usuario/[id].tsx` | Perfil público y acción de seguir/dejar de seguir. |
| `app/perfil/comunidad.tsx` | Amigos, Seguidores y Siguiendo de un perfil; no es otro feed social. |
| `app/explorar/anime/[id].tsx` | Ficha del anime, actividad, puntuación, información, voces, plataformas y popularidad por país. |
| `app/crear/review/escribir.tsx` | Formulario de puntuación, review o log, fecha y spoiler. |
| `app/inicio/review/[id].tsx` | Detalle de publicación y conversación de ejemplo. |
| `app/perfil/listas/[id].tsx` | Detalle de lista, incluyendo pertenencias actualizadas desde la actividad compartida. |
| `app/perfil/listas/editar.tsx` | Formulario de creación/edición de listas de demostración. |
| `app/aura/misiones.tsx` | Objetivos y recompensas ilustrativos. |
| `app/aura/rangos.tsx` | Rangos, insignias y sufijos disponibles/bloqueados. |
| `app/aura/ranking.tsx` | Ranking de usuarios de ejemplo. |
| `app/explorar/mapa/index.tsx` | Mapa, selección de país, métricas y búsqueda de anime. |
| `app/explorar/mapa/[pais].tsx` | Estadísticas ilustrativas del país. |
| `app/explorar/tops.tsx` | Rankings de anime sobre 5 puntos. |

### Archivos compartidos

| Archivo | Responsabilidad y motivo |
| --- | --- |
| `src/theme.ts` | Colores, espacios, tipografía, radios y ancho máximo. Centraliza valores; hoy el tema es fijo. |
| `src/components.tsx` | Screen, Action, SearchBar, Avatar, tarjetas, Chips, Dialog, EmptyState, Progress, StarRating y RankInsignia. Evita duplicar controles. |
| `src/mock.ts` | Tipos, catálogo, usuarios, reviews, listas, países, misiones, relaciones y funciones de ejemplo. Permite presentar sin servidor. |
| `src/context/AppState.tsx` | Actividad y seguimientos temporales compartidos entre pantallas. |
| `src/context/SessionContext.tsx` | Cuenta activa, carga inicial, ingreso y cierre de sesión; recuerda solo su ID con AsyncStorage. |
| `src/PerfilView.tsx` | Vista común del perfil propio y público; recibe el usuario y adapta las acciones según corresponda. |
| `src/WorldMap.tsx` | Siluetas SVG locales y países seleccionables, coloreados por métricas de ejemplo. |

`assets/` contiene imágenes y siluetas; `assets/FUENTES.md` documenta procedencias. Los paisajes de temporadas están en `assets/seasons/`. `node_modules/`, `.expo/`, `dist/` y `artifacts/` son dependencias o resultados generados.

## 3. Funcionamiento y límites actuales

### Estado y actividad

`AppStateProvider` conserva vistos, favoritos y watchlist por usuario. `useAppState` combina esas colecciones con la puntuación/texto de Reviews, la pertenencia de Lists y las relaciones de Social, sin almacenarlas por duplicado. Ver el mapa de contextos del apartado inicial.

La sesión y las reviews/logs se recuerdan al cerrar/recargar; el resto de la actividad modificada sigue siendo temporal. `useCurrentUser()` combina el ID de `SessionContext` con el directorio actualizado; ya no se exporta un usuario fijo de `mock.ts`. El ID del JSON se corresponde con un perfil de `mock.ts`, donde siguen los datos de ejemplo. Biblioteca, favoritos, listas, reviews, relaciones y Aura parten de esa persona. Desde la revisión del 7 de octubre, los datos se mantienen separados por ID durante la ejecución; cambiar de cuenta reinicia las pantallas, no las colecciones. Recargar recupera las reviews guardadas y los ejemplos iniciales para los otros datos.

No hay autenticación real ni backend conectado. Los borradores permanecen en los formularios; al guardar, los contextos comparten los cambios. Las previews de decoradores siguen siendo locales.

Reglas existentes:

- Puntuación de 0.5 a 5, en medias estrellas, o sin puntuación.
- Visto, Me gusta y Watchlist registran distintas relaciones con un anime.
- Una puntuación o un log agrega el anime a Vistos.
- Se puede guardar un log sin abrir el editor de texto. Al abrirlo para publicar una review, requiere mínimo 10 caracteres.
- Fecha del log real y no futura.
- Una actividad puede asociarse a varias listas.
- Amigos significa seguimiento mutuo.
- Aura tiene reglas y recompensas ilustrativas, no reglas definitivas de servidor.

### Cámara y galería: implementadas en Explorar

Se usa `expo-image-picker`. Sacar foto solicita permiso en móvil y abre la cámara del sistema. Elegir imagen abre el selector del sistema sin solicitar acceso general a toda la fototeca para este recorrido. Muestra la foto seleccionada, maneja cancelación, errores y permiso rechazado. `app.json` configura los permisos y desactiva el de micrófono para esta función. En web el comportamiento depende del navegador/dispositivo.

Reconocer anime muestra un aviso de función pendiente: no envía la imagen a una API ni devuelve resultados ficticios. Editar perfil todavía tiene un selector de avatar simulado.

Justificación: cámara para capturar una imagen y fototeca para seleccionar una captura existente. Son accesos reales al dispositivo; reconocer su contenido es otra función. Falta registrar la prueba en teléfono antes de afirmar que fue verificado en hardware.

### Mapa

Usa `assets/paises.json`, seis países seleccionables y métricas locales de `mock.ts`. Los rankings no agregan reviews reales. Las coordenadas del dibujo no son ubicaciones de usuarios.

No hay GPS, país detectado ni ubicación en reviews. Detectar un país no calcula sus estadísticas: habrá que guardar publicaciones con país y agrupar datos.

## 4. Próximos pasos: definidos o en discusión

La organización, los perfiles comunes, login, los contextos de datos y las misiones locales están implementados. Idiomas, temas, geolocalización, reconocimiento y persistencia de actividad siguen pendientes; las propuestas no son autorización para programarlo todo.

### 4.1. Carpetas por sección

Implementado el 5 de octubre: las cinco pantallas principales permanecen en `(tabs)`. Biblioteca, edición, conexiones, usuarios y listas están bajo `perfil/`; mapa, búsqueda, tops y ficha de anime bajo `explorar/`; escritura de reviews bajo `crear/`; detalle de reviews bajo `inicio/`; misiones, rangos y ranking permanecen bajo `aura/`.

Cada subpantalla tiene una sola ubicación y sigue siendo accesible desde otras secciones. No se agregaron layouts hijos ni se extendió la barra inferior a las subpantallas. Justificación: encontrar el código por sección conservando el Stack general y los recorridos existentes. No se unificaron todavía los perfiles ni se agregaron funciones.

### 4.2. Perfil común

Implementado: `src/PerfilView.tsx` concentra el diseño basado en el perfil propio: identidad, estadísticas, insignia Aura, favoritos, actividad reciente, reviews destacadas y pestañas subrayadas Posteos/Reviews/Listas/Likes. `app/(tabs)/perfil.tsx` pasa la cuenta activa; `app/perfil/usuario/[id].tsx` resuelve el ID, maneja usuario inexistente y usa esa misma vista en modo público. Justificación: mantener el diseño común una sola vez.

Actividad reciente y Reviews destacadas son resúmenes sin enlace «Ver todo». Las destacadas muestran hasta dos reviews, ordenadas por la suma de likes y comentarios. Se eliminó la pestaña Historial. La pestaña Reviews muestra las dos más recientes y, si hay más, «Ver todas» abre `app/perfil/reviews.tsx` con el ID del perfil. El contador y el acceso rápido de Reviews también abren esa pantalla. Listas muestra todas; Vistos conserva su acceso a Biblioteca.

Los accesos a biblioteca personal y edición solo se ofrecen en el perfil propio. El perfil ajeno permite seguir/dejar de seguir y ver conexiones de esa persona; no abre la biblioteca o Aura del usuario actual como si fueran ajenas. Actividad, listas, reviews y likes consultan los datos del perfil recibido.

Se reemplazó Iniciar sesión por Cerrar sesión en la fila de Editar perfil y Amigos; la fila puede envolver los botones en pantallas angostas. Ahora elimina el ID guardado y la cuenta activa. El layout vuelve al acceso; la actividad permanece separada por usuario hasta recargar la app. Si falla el almacenamiento, muestra un error para reintentar.

Verificación: TypeScript, lint de los tres archivos y exportación web/Android/iOS. Se comprobó con render de prueba (componentes nativos y router simulados) la separación de datos/acciones de todos los perfiles de ejemplo, el subrayado, seguir, conexiones y retorno al login. Pendiente inspección visual y navegación real en teléfono.

### 4.3. Login con JSON y registro que solo valida

Implementado el 6 de octubre:

- `app/login/index.tsx`: usuario y contraseña, errores y acceso directo a Inicio al validar credenciales.
- `app/login/crear-cuenta.tsx`: validación y confirmación de registro simulado, con regreso al login tras 3 segundos. El temporizador se limpia al desmontar la pantalla.
- `src/usuarios-demo.json`: cuentas `felipeanime`, `sofi_23` y `nicochan`, todas con contraseña ficticia `Anime2026`.
- `src/login.ts`: búsqueda de cuenta y validación de registro, compartidas y separadas de la interfaz para comprobarlas fácilmente.
- `app/index.tsx` dirige a Login sin sesión o a `/inicio` con cuenta activa. El layout espera la lectura local antes de mostrar pantallas y usa `Stack.Protected` para separar acceso/registro de las rutas de la app. Login no tiene flecha de regreso ni diálogo intermedio. Se conservan los dos layouts.

Reglas iniciales: usuario de 3 a 20 caracteres (letras ASCII, números o guion bajo); se ignoran mayúsculas y espacios en los extremos al comparar nombres. No se permite un nombre ocupado en el JSON. Contraseña de al menos 8 caracteres con una letra y un número, y confirmación idéntica. La contraseña sí distingue mayúsculas y no se recorta. Estas reglas pueden ajustarse si el equipo define otras.

El registro no guarda cuentas y lo aclara en pantalla. Un registro válido no permite entrar después con esos datos. El ingreso sí conecta una cuenta del JSON con `SessionContext`, sin servidor.

Definido por el usuario:

1. JSON local con pocas cuentas ficticias hardcodeadas para probar inicio de sesión.
2. Validar las credenciales contra ese JSON y mostrar errores claros.
3. Crear usuario valida requisitos de usuario, contraseña y confirmación.
4. Si los datos son válidos, mostrar éxito y volver al login después de unos segundos.
5. No crear ni guardar esa cuenta en JSON, almacenamiento local o nube. Solo podrán entrar las cuentas de ejemplo.
6. Actualizado el 6 de octubre: abrir en `/login` y pasar a `/inicio` con credenciales válidas. Se deja atrás la propuesta de abrir directamente en Inicio.

La confirmación implementada dice: «Datos válidos. Registro simulado correctamente; no se creó una cuenta real».

Implementado en `context`: recordar el ID con la clave `ani-ren:sesion`, restaurar solo cuentas reconocidas y borrarlo al cerrar sesión. Un ID desconocido se descarta; si falla la lectura se permite volver a ingresar. La contraseña no se copia a AsyncStorage. Justificación: separar la identidad de la actividad y permitir demostrar distintas cuentas sin servidor.

El JSON contiene ejemplos públicos; no constituye autenticación segura. Backend real queda para después. Verificación de esta etapa: TypeScript, lint y exportación web/Android/iOS; pruebas de lógica con hooks y almacenamiento simulados para las tres cuentas, credenciales inválidas, restauración, cierre, errores de almacenamiento y separación de actividad. Falta verificar navegación y persistencia en un teléfono real.

### 4.4. Context y almacenamiento

| Mecanismo | Uso |
| --- | --- |
| Estado de pantalla | Campos, filtros o diálogos de esa pantalla. |
| Context | Compartir sesión, idioma o apariencia durante el uso. |
| AsyncStorage | Recordar preferencias no sensibles en el teléfono al cerrar la app. |
| Backend/base remota | Datos compartidos entre dispositivos, publicaciones y cuentas reales. |

Context no persiste por sí solo ni recibe información del servidor automáticamente. Los providers generales pueden seguir en el layout principal. Crear contextos pequeños por responsabilidad cuando se necesiten; no colocar todo en un contexto gigante ni convertir cada estado local en contexto.

Al persistir ajustes: leer al montar, validar JSON, manejar errores y recién después guardar cambios. Un indicador de carga evita sobrescribir lo guardado con valores iniciales. Si falla la lectura, usar valores por defecto sin bloquear la app.

### 4.5. Idioma y apariencia

Intención: recordar el idioma preferido de la interfaz y conservar cada review en su idioma original. Todavía no se eligieron los idiomas soportados ni las paletas.

Propuesta simple: diccionarios de interfaz en archivos locales y preferencia en AsyncStorage. Sin Wi-Fi se conservan idioma y textos locales; no hay motivo para volver al idioma inicial. Eso no hace que todos los servicios externos o el entorno de Expo Go funcionen sin red.

Guardar también la preferencia en la nube permitiría recuperarla en otro dispositivo. Complementa al almacenamiento local; sincronización y conflictos quedan para el backend.

Traducir una review es una función distinta: necesita un servicio o solución de traducción, revisar disponibilidad/costo y conservar el original. Queda a futuro para mantener esta etapa entendible.

`theme.ts` puede conservar paletas; Context elegiría la activa y AsyncStorage recordaría esa elección. `useColorScheme` consulta claro/oscuro del sistema; rosa/violeta sería otra preferencia. No implementar temas sin definir cuáles.

Justificación: preferencias sin conexión, responsabilidades separadas y complejidad controlada.

### 4.6. País del perfil y país de publicación

Intención discutida con el profesor: conservar el país del usuario y, por separado, el país donde escribe/publica una review. Ejemplo: perfil de Argentina, review publicada en Brasil. No cambiar el país del perfil por esa publicación.

Consultar automáticamente mientras se usa la pantalla puede ser una operación puntual asíncrona; no requiere seguimiento con la app cerrada. Necesita permiso e información sobre la finalidad. Propuesta: informar que se asocia el país a estadísticas y mostrar el país obtenido, sin pedir confirmación repetida si ya hay permiso. No recolectarlo de forma oculta.

Flujo propuesto:

1. Solicitar permiso de ubicación en primer plano.
2. Obtener coordenadas con `getCurrentPositionAsync`.
3. Resolver el lugar con `reverseGeocodeAsync` (no obtiene coordenadas por sí sola; algunos campos pueden faltar).
4. Conservar solo país/código de país, preferentemente `isoCountryCode` como AR o BR. Descartar dirección y coordenadas después de resolverlo.
5. Asociar ese país al guardar la review y no recalcularlo al consultarla después.

Pendientes: consulta al abrir el formulario o al publicar, respuesta ante permiso rechazado/sin señal y país inicial del mapa. Propuesta ante fallos: permitir continuar sin país o elegirlo manualmente, distinguiendo datos manuales de detectados. No inventar una detección.

El registro de esta etapa no crea usuarios: no habrá una cuenta nueva donde guardar el país. Acordar una demostración separada o posponer esa parte hasta el registro real.

El mapa debe permitir cambiar de país. Ampliar de seis países a todos necesita ampliar la selección y los datos; no lo resuelve el GPS. Justificación: separar residencia/perfil del lugar de publicación y guardar únicamente el dato necesario.

Fuente: [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/).

### 4.7. Reconocimiento gratuito y fanarts

Dirección inicial: probar trace.moe para capturas de escenas en la demo educativa. No está integrado.

Según documentación revisada el 2 de octubre de 2026, tiene 100 búsquedas gratuitas por IP en una ventana de 24 horas, sin cuenta ni clave, con una búsqueda simultánea. Es razonable para una demostración pequeña; dispositivos en el mismo Wi-Fi pueden compartir cuota. Manejar falta de red, cuota agotada y resultados insuficientes.

Fuente: [límites de trace.moe](https://raw.githubusercontent.com/soruly/trace.moe-api/master/docs/limits.md).

Fanarts sigue siendo deseado para después. trace.moe busca coincidencias de escenas; no garantiza reconocer dibujos originales de personajes ni fotos de pantallas. Un dibujo que reproduce casi exactamente una escena es distinto de fanart genérico. La FAQ menciona herramientas de búsqueda de ilustraciones, pero ninguna está seleccionada ni evaluada para esta app.

Fuente: [FAQ de trace.moe](https://trace.moe/faq).

Propuesta técnica simple: una función separada que reciba una imagen y devuelva el resultado que necesita la pantalla. Un cambio de API puede requerir adaptar autenticación, archivos, IDs, respuestas, límites y errores; no siempre alcanza con cambiar la URL. La interfaz puede conservarse si recibe un formato común. Probar cada opción con imágenes representativas.

Google Cloud Vision no está seleccionado. Mantener cero gastos y no activar servicios facturables sin una nueva decisión explícita. Justificación: alcance viable para presentar y posibilidad de ampliar sin reescribir toda la pantalla.

### 4.8. Rendimiento

`useMemo` reutiliza cálculos mientras no cambian dependencias; no persiste datos ni evita todas las actualizaciones. `AppState.tsx` ya usa `useMemo` y `useCallback`. Usarlos con una razón concreta, no en cada variable por costumbre.

La información en vivo necesita una fuente de actualizaciones del backend. Context comparte su resultado. Priorizar nombres claros, funciones pequeñas y responsabilidades concretas.

## 5. Orden propuesto y pendientes

1. Recibir los ejemplos del usuario y cerrar dudas de login, idioma, país y navegación.
2. Rama `trabajo/organizacion-frontend` creada; guardar avances con commits cuando corresponda.
3. Rutas reorganizadas. Comprobar también manualmente botón atrás y barra inferior en los recorridos de presentación.
4. Vista de perfil unificada; revisar visualmente ambos modos en teléfono.
5. Login conectado con cuenta activa y sesión recordada en la rama `context`. Probar en teléfono: entrar con Felipe, cerrar sesión, entrar con Sofi y comprobar perfil/biblioteca; cerrar y abrir la app para comprobar restauración. Persistir actividad por cuenta queda para otra etapa.
6. Preferencias locales y contextos necesarios.
7. Ubicación puntual y país de publicación con recorrido acordado.
8. Reconocimiento de capturas con trace.moe.
9. Fanarts, traducción de reviews y backend/sincronización en etapas futuras.

El orden puede cambiar según los ejemplos. La referencia «Nico rocks» sigue pendiente de enlace o aclaración. No avanzar automáticamente con todas estas tareas.

## 6. Ejecutar y verificar

Desde la raíz en PowerShell:

```powershell
npm.cmd ci
npm.cmd start
```

`ci` instala las versiones del lockfile cuando haga falta instalar dependencias. Para web: `npm.cmd run web`. En teléfono, abrir el QR con Expo Go compatible. `npm.cmd` evita el bloqueo de scripts de PowerShell observado en esta computadora.

Controles según el cambio:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run format:check
npx.cmd expo export --platform web
```

La reorganización del 5 de octubre pasó TypeScript, lint global y exportación web/Android/iOS. Se compararon los 28 archivos de código con su versión anterior: únicamente cambiaron ubicación, imports relativos y rutas de navegación. Se verificó que los destinos internos existan y que permanezcan los dos layouts. No se realizó prueba interactiva en teléfono. El handoff anterior registraba problemas de formato preexistentes; no se reformateó código ajeno al cambio.

En teléfono comprobar permiso aceptado/rechazado, cancelación, cámara, galería, vista previa, Probar otra y aviso de reconocimiento pendiente.

## 7. Trabajar en una rama

La reorganización se realizó en `trabajo/organizacion-frontend`, sin modificar `main`, crear commits ni hacer push. El HANDOFF ya tenía cambios preparados antes de comenzar; se conservaron. No volver a crear la rama si ya existe: comprobar la actual con `git branch --show-current`.

Crear una rama desde el commit actual también lleva la edición sin confirmar:

```powershell
git switch -c trabajo/organizacion-frontend
git status
git add HANDOFF.md
git commit -m "Documentar estado actual y próximos pasos"
git push -u origin trabajo/organizacion-frontend
```

Los commits en esa rama no modifican `main`. Una rama no aísla cambios sin confirmar: guardar el trabajo en commits antes de alternar entre ramas. Después se puede volver con `git switch main`. Integrar mediante revisión/PR cuando corresponda.

## 8. Entrega y continuidad

Sprint 1 pide propuesta, sostenibilidad, branding, prototipo público navegable, justificación de al menos dos componentes nativos y frontend con Expo/router. Entrega: un PDF con enlaces públicos al prototipo y repositorio, el 15/10/2026 a las 18:00 UTC-3.

Documentar pruebas de cámara/fototeca y distinguir selección de imágenes de reconocimiento. No presentar datos de ejemplo, login simulado o métricas locales como servicios reales.

Se actualizaron README, PANTALLAS e INICIO_FRONTEND para indicar escala de 5, cámara/galería reales en Explorar, reconocimiento pendiente, sesión persistente y datos locales compartidos. Las previews de avatar y decoradores siguen identificadas como demostraciones.

Para continuar: leer este documento, el código afectado y los ejemplos del usuario. Explicar qué se cambia y por qué. Hacer cambios pequeños y no confundir propuestas futuras con funciones terminadas ni con autorización para implementarlas ahora.

## Implementaciones extra

Se retiró la función de marcar publicaciones como «Guardadas»: no existe botón, estado ni operación para eso. Esto no cambia el guardado local del contenido al crear/editar. El detalle de posteos/reviews tiene like compacto y Compartir, como el feed. Compartir todavía muestra un aviso de demostración.

- **Enlaces para compartir:** definir enlaces públicos a posteos, reviews y fichas de anime, cómo se abren en web/app y qué puede ver una persona sin sesión. Luego conectar los botones Compartir; no generar ahora enlaces que no tengan un destino público funcional.

Ideas para después del núcleo social; no implementarlas automáticamente:

- **Imagen opcional en publicaciones comunes:** compartir una foto para preguntar «¿A qué anime pertenece?» y recibir respuestas de otras personas. Resolver selección/subida y almacenamiento de imágenes cuando se aborde esta función; no requiere reconocimiento automático ni sensores nuevos.
- **Openings y endings:** permitir recomendaciones y referencias a estas piezas; formato, fuente de metadatos y reproducción quedan por definir.
- **Reconocimiento automático de imágenes:** retomar cámara/galería y evaluar trace.moe después de consolidar publicaciones, reviews y feeds. No es la prioridad de la próxima etapa.
