# Ani-ren: funcionamiento actual y próximos pasos

Actualizado: 6 de octubre de 2026.

## 1. Objetivo y alcance

Aplicación educativa para descubrir anime, registrar actividad, compartir reviews y listas, seguir personas y explorar estadísticas por país. Frontend con Expo SDK 57, React Native, TypeScript y Expo Router.

Prioridad: código simple que el equipo pueda entender y explicar. Cada decisión debe tener una razón concreta. Evitar infraestructura y abstracciones innecesarias; no contratar servicios pagos.

Este documento separa lo implementado de las propuestas futuras. El 5 de octubre se reorganizaron las subpantallas por sección en la rama `trabajo/organizacion-frontend`. El 6 de octubre se agregaron login con cuentas JSON y registro de validación. Todavía no se cambia el usuario de la app al ingresar, ni hay autenticación persistente, ubicación o traducciones. Acordar cada paso antes de programarlo.

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
| `src/AppState.tsx` | Actividad y seguimientos temporales compartidos entre pantallas. |
| `src/PerfilView.tsx` | Vista común del perfil propio y público; recibe el usuario y adapta las acciones según corresponda. |
| `src/WorldMap.tsx` | Siluetas SVG locales y países seleccionables, coloreados por métricas de ejemplo. |

`assets/` contiene imágenes y siluetas; `assets/FUENTES.md` documenta procedencias. Los paisajes de temporadas están en `assets/seasons/`. `node_modules/`, `.expo/`, `dist/` y `artifacts/` son dependencias o resultados generados.

## 3. Funcionamiento y límites actuales

### Estado y actividad

`AppStateProvider` envuelve la app desde el layout principal. Conserva por anime: visto, favorito, watchlist, puntuación, fecha, título/texto, spoiler y pertenencia a listas. Conserva seguimientos y deriva amistades del seguimiento mutuo. Las pantallas consumen estos datos con `useAppState`.

No hay persistencia al cerrar/recargar, autenticación real ni backend conectado. `currentUser` sigue siendo un usuario fijo de `mock.ts`. No todas las acciones pasan por el contexto: varios formularios, likes y comentarios tienen estado local. Guardar actividad no equivale a publicar una nueva review en todos los arrays del feed.

Reglas existentes:

- Puntuación de 0.5 a 5, en medias estrellas, o sin puntuación.
- Visto, Me gusta y Watchlist registran distintas relaciones con un anime.
- Una puntuación o un log agrega el anime a Vistos.
- Texto opcional; si se escribe, mínimo 10 caracteres.
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

La organización (4.1), la vista común de perfil (4.2) y los formularios de login/registro (4.3) están implementados. El resto sigue pendiente; las propuestas no son autorización para programarlo todo.

### 4.1. Carpetas por sección

Implementado el 5 de octubre: las cinco pantallas principales permanecen en `(tabs)`. Biblioteca, edición, conexiones, usuarios y listas están bajo `perfil/`; mapa, búsqueda, tops y ficha de anime bajo `explorar/`; escritura de reviews bajo `crear/`; detalle de reviews bajo `inicio/`; misiones, rangos y ranking permanecen bajo `aura/`.

Cada subpantalla tiene una sola ubicación y sigue siendo accesible desde otras secciones. No se agregaron layouts hijos ni se extendió la barra inferior a las subpantallas. Justificación: encontrar el código por sección conservando el Stack general y los recorridos existentes. No se unificaron todavía los perfiles ni se agregaron funciones.

### 4.2. Perfil común

Implementado: `src/PerfilView.tsx` concentra el diseño basado en el perfil propio: identidad, estadísticas, insignia Aura, favoritos, actividad reciente, reviews destacadas y pestañas subrayadas Reviews/Listas/Historial/Likes. `app/(tabs)/perfil.tsx` pasa el usuario de ejemplo; `app/perfil/usuario/[id].tsx` resuelve el ID, maneja usuario inexistente y usa esa misma vista en modo público. Justificación: mantener el diseño común una sola vez.

Los accesos a biblioteca personal y edición solo se ofrecen en el perfil propio. El perfil ajeno permite seguir/dejar de seguir y ver conexiones de esa persona; no abre la biblioteca o Aura del usuario actual como si fueran ajenas. Actividad, listas y reviews se derivan del perfil recibido. Likes e historial ajenos siguen usando ejemplos, no datos reales.

Se reemplazó Iniciar sesión por Cerrar sesión en la fila de Editar perfil y Amigos; la fila puede envolver los botones en pantallas angostas. Por ahora limpia el recorrido de navegación y vuelve a Login; no hay sesión persistida que borrar ni se reinicia la actividad local. La autenticación por usuario sigue pendiente.

Verificación: TypeScript, lint de los tres archivos y exportación web/Android/iOS. Se comprobó con render de prueba (componentes nativos y router simulados) la separación de datos/acciones de todos los perfiles de ejemplo, el subrayado, seguir, conexiones y retorno al login. Pendiente inspección visual y navegación real en teléfono.

### 4.3. Login con JSON y registro que solo valida

Implementado el 6 de octubre:

- `app/login/index.tsx`: usuario y contraseña, errores y acceso directo a Inicio al validar credenciales.
- `app/login/crear-cuenta.tsx`: validación y confirmación de registro simulado, con regreso al login tras 3 segundos. El temporizador se limpia al desmontar la pantalla.
- `src/usuarios-demo.json`: cuentas `felipeanime`, `sofi_23` y `nicochan`, todas con contraseña ficticia `Anime2026`.
- `src/login.ts`: búsqueda de cuenta y validación de registro, compartidas y separadas de la interfaz para comprobarlas fácilmente.
- La app abre Login desde `app/index.tsx`. Al validar credenciales reemplaza Login por `/inicio`, cuya pantalla es `app/(tabs)/inicio.tsx`. Login no tiene flecha de regreso ni diálogo intermedio. Se conservan los dos layouts y todavía no se persiste sesión ni se protegen rutas por autenticación.

Reglas iniciales: usuario de 3 a 20 caracteres (letras ASCII, números o guion bajo); se ignoran mayúsculas y espacios en los extremos al comparar nombres. No se permite un nombre ocupado en el JSON. Contraseña de al menos 8 caracteres con una letra y un número, y confirmación idéntica. La contraseña sí distingue mayúsculas y no se recorta. Estas reglas pueden ajustarse si el equipo define otras.

El registro no guarda cuentas y lo aclara en pantalla. Un registro válido no permite entrar después con esos datos. No se persiste sesión ni se conecta un contexto de autenticación: el usuario pidió abordar el cambio de perfil por cuenta en otra etapa. Justificación: completar primero los formularios sin mezclar la migración de `currentUser` y de la actividad compartida.

Definido por el usuario:

1. JSON local con pocas cuentas ficticias hardcodeadas para probar inicio de sesión.
2. Validar las credenciales contra ese JSON y mostrar errores claros.
3. Crear usuario valida requisitos de usuario, contraseña y confirmación.
4. Si los datos son válidos, mostrar éxito y volver al login después de unos segundos.
5. No crear ni guardar esa cuenta en JSON, almacenamiento local o nube. Solo podrán entrar las cuentas de ejemplo.
6. Actualizado el 6 de octubre: abrir en `/login` y pasar a `/inicio` con credenciales válidas. Se deja atrás la propuesta de abrir directamente en Inicio.

La confirmación implementada dice: «Datos válidos. Registro simulado correctamente; no se creó una cuenta real».

Pendientes: recordar sesión o no y qué información cambiará con cada cuenta. Cambiar de cuenta requiere adaptar `currentUser` y aislar la actividad, no solo aceptar una contraseña.

Si se recuerda sesión, guardar la referencia al usuario ficticio, no una contraseña real. El JSON contiene ejemplos públicos; no constituye autenticación segura. Backend real queda para después. Justificación: demostrar formularios y navegación sin necesitar servidor.

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
5. Formularios de login y registro implementados. Siguiente etapa de autenticación: conectar la cuenta elegida con el estado y los perfiles.
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

README contiene textos antiguos sobre escala de 10 puntos y reconocimiento simulado. El código actual usa escala de 5 y selección real con reconocimiento pendiente. En esta reorganización se actualizaron referencias a archivos en HANDOFF y PANTALLAS; la revisión general de los textos antiguos queda pendiente.

Para continuar: leer este documento, el código afectado y los ejemplos del usuario. Explicar qué se cambia y por qué. Hacer cambios pequeños y no confundir propuestas futuras con funciones terminadas ni con autorización para implementarlas ahora.
