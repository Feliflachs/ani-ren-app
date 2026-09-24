# Ani-ren — Guía para iniciar el frontend

## Estado de entrega

El 17 de septiembre de 2026 se inició la implementación autorizada por el usuario. Ya existe un frontend Expo ejecutable con las 24 pantallas del mapa y una apertura estática configurada.

El 20 de septiembre se revisó y simplificó el frontend: cards compartidas, una sola fuente para misiones/rangos/métricas, menos estados en formularios, eliminación de estilos sin uso y formato legible. Se mantienen 24 pantallas, dos layouts y solo cuatro archivos compartidos; no agregar capas ni fragmentar archivos sin una repetición concreta que lo justifique.

- ani-ren-app/ contiene el proyecto Expo, esta guía, [PANTALLAS.md](PANTALLAS.md) y [README.md](README.md) con ejecución y límites del prototipo.
- backend/ existe como carpeta hermana y está vacía.
- Expo SDK 57, React Native, TypeScript y Expo Router están configurados; las dependencias están instaladas y tienen package-lock.json.
- Las cinco tabs y las 19 pantallas secundarias usan IDs estables, mocks compartidos y estados locales. Los puntos para la API y el dispositivo tienen comentarios buscables.
- TypeScript, lint, compatibilidad de dependencias y exportación Android/iOS/web fueron comprobados. Se revisaron las rutas en navegador entre 320 y 430 px; falta la revisión nativa en teléfono del teclado, Safe Area y apertura.

Estructura actual:

```text
Ani-ren/
  ani-ren-app/
    app/
      (tabs)/
      anime/
      review/
      lista/
      usuario/
      aura/
      mapa/
      ...pantallas secundarias.tsx
    src/
      theme.ts
      mock.ts
      components.tsx
      WorldMap.tsx
    assets/
    package.json
    package-lock.json
    app.json
    README.md
    PANTALLAS.md
    INICIO_FRONTEND.md
  backend/
```

## Alcance acordado

Crear la parte visual de Ani-ren con Expo, React Native, TypeScript y Expo Router. El mapa aprobado comprende 24 pantallas navegables y una apertura estática; sus contenidos y conexiones están en PANTALLAS.md.

La barra inferior tiene exactamente cinco opciones, siempre en este orden: Inicio, Explorar, Social, Aura y Perfil. Las pantallas secundarias se abren sobre esa navegación y permiten volver al origen. Detalle de anime no es una sexta tab.

Usuarios, anime, reviews, publicaciones, listas, amigos, estadísticas, misiones, decoradores y países utilizan datos de ejemplo. Las acciones muestran respuestas locales y las confirmaciones simuladas se identifican como tales.

La idea de IA se representa con ejemplos predeterminados y una etiqueta clara de demostración. El opening es estático. Cámara y galería tienen selector y vista previa de ejemplo; la captura real no forma parte del primer trabajo visual.

La carpeta backend/ permanece vacía durante esta etapa. Autenticación, base de datos, APIs externas, persistencia, cálculo real de rangos, IA real, chat, notificaciones y animación del logo quedan para después.

## Fuentes para retomar

Antes de escribir las pantallas, revisar las referencias visuales directamente. No reconstruirlas solo a partir del resumen del chat.

Carpeta de modelos disponible en esta computadora:

```text
C:/Users/flach/Downloads/Ani-ren_mockups/Ani-ren pantallas (modelos)/
  Pantallas/
    Home.png
    Explorar.png
    Social.png
    AURA.png
    Perfil.png
    Busqueda Anime.png
  Referencias/
    paleta_colores_referencia.jpg
  Extras/
    logo_mascota_loto_sombrero.png
```

Los seis mockups son referencias visuales directas. Las pantallas secundarias nuevas deben conservar su identidad, jerarquía, márgenes, cards, radios y paleta.

Textos de contexto y requisitos:

- [Guía de programación de la materia](C:/Users/flach/.codex/attachments/c951b2e0-df54-40a7-97f4-b5845d31154f/pasted-text.txt).
- [Primer texto de Ani-ren](C:/Users/flach/.codex/attachments/4b9810b5-0aeb-4619-9c35-e08936b0ad9e/pasted-text.txt).
- [Segundo texto de Ani-ren](C:/Users/flach/.codex/attachments/d2d63fa9-705f-453e-94c6-e4082e87d6c5/pasted-text.txt).

Ejemplos representativos ya revisados:

- [Perfil del TP1 propio](<C:/Users/flach/Desktop/TP 1 - Felipe Flachsland/app/(tabs)/perfil.tsx>).
- [Galería del TP2 propio](<C:/Users/flach/Desktop/TP 2 - Felipe Flachsland/src/app/index.tsx>).
- [Catálogo de autos de clase](<C:/Users/flach/Downloads/Clase 3 - Ejercicio - Catalogo de Autos.tsx>).
- [Formulario modal de clase](<C:/Users/flach/Downloads/Clase 3 - Ejercicio - Formulario Modal.tsx>).

El proyecto TP1 KRENZ disponible en Descargas sirve únicamente como referencia del nivel de complejidad. No copiar sus implementaciones, textos, estilos ni colores.

Las instrucciones más recientes del usuario y este mapa completo prevalecen sobre los textos antiguos que limitaban la aplicación a seis pantallas. Los nombres antiguos Otakúmetro o Misiones como tab se reemplazan por Aura. Las temporadas se muestran para 2026.

## Forma de programar

- Una pantalla importante por archivo TSX.
- JSX, funciones, datos de ejemplo y StyleSheet.create dentro del archivo de la pantalla.
- Un único src/theme.ts para colores, espaciados, radios y tamaños comunes.
- Componentes funcionales, const, tipos sencillos, useState, map, filter y funciones claras.
- TextInput controlado, Pressable, Image, ScrollView, FlatList y Modal según corresponda.
- Extraer componentes solo cuando exista repetición real y ayude a entender el código.
- Mantener datos y tipos locales inicialmente; compartir únicamente lo que realmente se repita y cause incoherencias.
- Usar una sola familia de iconos de @expo/vector-icons si está disponible en la base elegida.
- No agregar any, @ts-ignore, hooks propios para lógica trivial, providers preventivos, capas de repositorios ni carpetas de servicios vacías.
- Evitar estados derivados duplicados, optimizaciones anticipadas y posiciones absolutas cuando Flexbox resuelva el layout.
- Usar `npm run format` para conservar el formato y `npm run format:check` para comprobarlo. La configuración está en package.json.
- Si un concepto no visto en los materiales resulta indispensable, explicar su necesidad antes de introducirlo, conforme a la guía de la materia.

La cantidad de pantallas responde al mapa aprobado. Cada archivo debe poder entenderse sin recorrer una arquitectura de capas.

## Computadora y ventanas grandes

La app usa una columna centrada de hasta 480 px y ocupa todo el ancho disponible en ventanas menores. `theme.layout.maxWidth` define el límite; `app/_layout.tsx` lo aplica a toda la navegación. Los diálogos comparten ese límite descontando sus márgenes. La barra inferior conserva iconos arriba y etiquetas abajo, con espacio suficiente para leerlas completas.

Cuando una pantalla calcula tamaños a partir de `useWindowDimensions`, limitar el ancho con `Math.min(windowWidth, theme.layout.maxWidth)`. También se puede medir el contenedor con `onLayout`, como hacen los perfiles. No calcular imágenes con el ancho completo del monitor. Los carruseles usan `showsHorizontalScrollIndicator={Platform.OS === 'web'}` para permitir su manejo con mouse.

Mantener estas reglas en los archivos existentes. No crear pantallas duplicadas, providers ni hooks propios solo para adaptar el ancho.

## Datos y navegación preparados para la conexión futura

Cada anime, usuario, review, publicación y lista utiliza un id estable. Los vínculos entre datos también utilizan esos identificadores, por ejemplo el animeId de una review y el usuarioId de su autor.

Una tarjeta navega al detalle mediante el id. La pantalla de destino obtiene el elemento correspondiente de sus datos mock. No abrir una ficha fija de Frieren al seleccionar un anime diferente ni copiar objetos completos en las rutas.

Mantener consistentes los datos base del usuario entre Inicio, Aura y Perfil. Favoritos son animes; Likes son reviews y publicaciones. Las listas ordenadas también representan tops personales.

Elegir una escala interna consistente de puntuación. Si una vista muestra sobre 10 y otra sobre 5, convertir para presentar el mismo valor: 9,6/10 equivale a 4,8/5.

Los estados locales permiten demostrar acciones mientras la app está abierta. No prometer que se sincronizan entre todas las pantallas o se conservan al reiniciar. Evitar soluciones globales anticipadas para simular un servidor.

## Comentarios para funciones que cambiarán con el backend

El usuario pidió dejar identificado dónde habrá que reemplazar los mocks y conectar las funciones reales. Usar comentarios buscables con el prefijo TODO BACKEND y una etiqueta de operación.

Colocarlos inmediatamente junto a:

1. La fuente o función que obtiene datos mock que luego vendrán del servidor.
2. La función que hoy simula una acción de consulta, creación, edición o guardado.
3. El resultado de ejemplo de IA que posteriormente se obtendrá mediante una operación del backend.

Cada comentario explica qué hace hoy, qué deberá hacer después y qué identificador o datos necesita. No fijar endpoints ni un lenguaje de servidor antes de diseñar el backend.

Formato de comentarios utilizado en los mocks y acciones implementadas:

```ts
// TODO BACKEND [ANIME-DETALLE]: reemplazar el mock por la consulta del anime mediante su id.
// Mantener el formato que consume la pantalla y representar carga, error y dato no encontrado.

// TODO BACKEND [REVIEW-GUARDAR]: hoy se muestra una confirmación local.
// Después enviar animeId, puntuación, texto, fecha y spoilers; confirmar éxito tras la respuesta del servidor.

// TODO BACKEND [WATCHLIST-ACTUALIZAR]: hoy el botón cambia su estado local.
// Después guardar la relación del usuario con animeId y usar el estado confirmado por la API.
```

Puntos de integración que deben quedar marcados cuando se construya cada función:

| Operación | Lugar previsto | Reemplazo futuro |
| --- | --- | --- |
| Consultar anime, personajes, voces y puntuaciones | Ficha, Inicio y tops | Obtener datos y conteos reales por id |
| Buscar anime, reviews, usuarios y listas | Resultados de búsqueda | Consultar resultados con texto y filtros |
| Consultar publicaciones y reviews | Social y detalle de review | Cargar feed, contenido y comentarios |
| Publicar o editar una review | Escribir o editar review | Guardar puntuación, texto, fecha y spoilers |
| Dar like o comentar | Detalle de review y Social | Guardar la interacción y recuperar el resultado |
| Cambiar watchlist, visto o favorito | Ficha y biblioteca | Guardar pertenencia a la colección del usuario |
| Crear o editar listas | Formulario y detalle de lista | Guardar datos, animeIds y orden |
| Consultar o editar perfil | Perfiles y Editar perfil | Recuperar o guardar información y favoritos |
| Subir avatar | Editar perfil | Enviar la imagen seleccionada al servidor |
| Seguir o gestionar amistad | Comunidad y perfiles | Guardar relaciones y solicitudes |
| Consultar historial y estadísticas | Perfil y Aura | Recuperar actividad y conteos reales |
| Consultar misiones, rangos y decoradores | Aura y sus pantallas | Recuperar progreso y elementos desbloqueados |
| Aplicar un decorador | Personalización Aura | Guardar la selección validada |
| Consultar ranking | Ranking de usuarios | Obtener posiciones por cantidad vista |
| Analizar gustos con IA | Tu perfil anime | Sustituir el ejemplo por un resultado del backend |
| Consultar métricas y top 5 por país | Mapa y Detalle de país | Recuperar valores según métrica y anime |
| Consultar plataformas y novedades | Ficha de anime | Obtener información actualizada |
| Guardar preferencias de perfil | Ajustes | Guardar las opciones que requieran persistencia remota |
| Solicitar un anime | Formulario de solicitud | Enviar solicitud y mostrar la respuesta real |

Los filtros locales, textos controlados, abrir o cerrar modales, navegación, estilos y cálculos de presentación son lógica de interfaz. No marcar cada una de esas funciones con TODO BACKEND.

Para captura de cámara, galería o permisos del teléfono, usar TODO DISPOSITIVO cuando corresponda. Seleccionar una imagen es una integración del dispositivo; subirla al servidor es una integración del backend.

No crear funciones vacías ni archivos de servicios solo para colocar comentarios. Los marcadores se agregan al implementar los mocks y acciones concretas.

## Relación entre las dos carpetas

El frontend se comunicará con el backend mediante solicitudes a una API y respuestas JSON. La ubicación de ambas carpetas no crea por sí sola esa conexión.

Cuando exista el servidor, centralizar las consultas necesarias en un archivo pequeño como src/api.ts. La dirección puede configurarse con EXPO_PUBLIC_API_URL. Las credenciales privadas y el acceso a la base de datos pertenecen al backend.

Los contratos de respuesta deben acordarse a partir de los datos que necesitan las pantallas. La integración también reemplazará las confirmaciones simuladas por respuestas reales; no consiste únicamente en cambiar la dirección de la API.

## Preparación inicial del proyecto — completada

1. Inspeccionar ani-ren-app/, leer ambos documentos y comprobar si el usuario agregó archivos o cambios.
2. Revisar los mockups y los ejemplos de clase necesarios para el bloque a implementar.
3. Comprobar Node.js, npm y documentación vigente de Expo. Elegir una plantilla con TypeScript y Expo Router; usar las versiones compatibles de esa base.
4. Inicializar el proyecto dentro de ani-ren-app/, preservando estos documentos. Como la carpeta ya contiene archivos, si el generador exige una carpeta vacía, crear la plantilla en una carpeta temporal verificada dentro de Ani-ren y trasladar sus archivos sin sobrescribir la documentación. No inicializar Expo en la raíz que también contiene backend/.
5. Revisar package.json, rutas y dependencias antes de instalar extras. Si la plantilla usa src/app en lugar de app, elegir una sola ubicación de rutas y actualizar el inventario del plan para reflejarla.
6. Configurar src/theme.ts, el Stack principal y las cinco tabs con Safe Area.
7. Validar en teléfono o emulador y continuar con los bloques siguientes.

Referencias técnicas:

- [Crear un proyecto Expo](https://docs.expo.dev/get-started/create-a-project/).
- [Layouts y navegación de Expo Router](https://docs.expo.dev/router/basics/navigation-layouts/).
- [Variables de entorno de Expo](https://docs.expo.dev/guides/environment-variables/).
- [Solicitudes de red en React Native](https://reactnative.dev/docs/network).

## Orden para desarrollar las pantallas

Todo el mapa sigue dentro del alcance. El orden organiza el trabajo y permite revisar cada grupo antes de continuar.

1. Base: tema, Stack y cinco tabs; completar Inicio como referencia visual común.
2. Primer recorrido: búsqueda, ficha de anime, escribir review, biblioteca y volver al origen.
3. Social y Perfil completos; lectura de reviews, perfiles ajenos y amigos/conexiones.
4. Tops de anime, detalle de lista y crear o editar lista.
5. Aura, misiones y logros, rangos y personalización, ranking y ejemplo de análisis.
6. Mapa mundial y detalle de país con métricas y datos simulados.
7. Editar perfil, ajustes, solicitud de anime y apertura estática.

Usar placeholders o imágenes temporales cuando falten assets independientes. Anotar su procedencia y dejar su reemplazo sencillo. No cambiar la paleta para compensar imágenes faltantes.

## Verificación durante la implementación

- Navegación de las cinco tabs y de las secundarias, incluido Volver hacia el origen.
- Detalle correcto para cada id y manejo de identificador inexistente.
- Safe Area, scroll y contenido visible en teléfonos verticales de 320 a 430 px.
- Formularios con teclado, controles seleccionados y estados vacíos, de carga y error.
- Coherencia de usuario, anime, puntuaciones y colecciones en los mocks.
- Confirmaciones simuladas y ejemplo de IA identificados con claridad.
- TypeScript, lint si está configurado e imports sin uso.
- Revisión visual contra los mockups en teléfono o emulador; los checks de código no sustituyen esa revisión.

Cuando exista el proyecto, arrancar desde ani-ren-app/:

```powershell
cd C:\Users\flach\Documents\GitHub\ani-ren-app
npx expo start
```

Al entregar un bloque, resumir cambios, dependencias agregadas, comprobaciones realizadas, partes mock y limitaciones concretas. Mantener ambos documentos actualizados con la estructura realmente implementada.

## Mensaje para retomar la próxima sesión

```text
Retomá el frontend visual de Ani-ren ya implementado.
Leé ani-ren-app/INICIO_FRONTEND.md y ani-ren-app/PANTALLAS.md, y revisá los mockups indicados.
Trabajá dentro de ani-ren-app/ con Expo, React Native, TypeScript y Expo Router.
Ejecutá el proyecto y revisá las 24 pantallas con los mockups en un teléfono,
prestando atención al teclado, Safe Area, scroll y apertura estática.
Corregí los detalles visuales y de interacción que encontremos.
Mantené el estilo simple de los TPs, los datos mock y los comentarios TODO BACKEND
junto a las fuentes de datos y funciones que luego conectaremos al servidor.
Dejá backend/ vacía durante esta etapa.
```
