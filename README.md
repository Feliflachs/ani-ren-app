# Ani-ren — Frontend

Prototipo visual con Expo SDK 57, React Native y TypeScript. Incluye 21 pantallas navegables, cinco tabs y una apertura estática. La carpeta hermana `backend/` sigue vacía.

## Ejecutar

Las dependencias ya están instaladas en esta computadora. Desde la raíz Ani-ren:

```powershell
cd ani-ren-app
npm start
```

Abrir el QR en Expo Go compatible con SDK 57. Pulsar `w` para el navegador. También se puede ejecutar `npm run web`. Si se copia el proyecto a otra computadora, ejecutar primero `npm ci` dentro de `ani-ren-app/`. iOS en simulador requiere macOS; desde Windows se puede usar un iPhone físico con Expo Go.

En computadora la app queda centrada en una columna de hasta 480 px, con espacio a los costados. En ventanas más angostas ocupa el ancho disponible. La barra inferior permanece dentro de la columna; los diálogos también tienen un ancho limitado. Los carruseles muestran barras de desplazamiento en web para poder recorrerlos con mouse.

## Estructura

- `app/_layout.tsx`: Stack, Safe Area, carga de iconos y apertura.
- `app/(tabs)/`: Inicio, Explorar, Crear, Aura y Perfil, en ese orden.
- El resto de `app/`: pantallas secundarias y formularios, con vuelta al origen.
- `src/theme.ts`: paleta común tomada de los mockups.
- `src/components.tsx`: controles y cards que se repiten.
- `src/mock.ts`: tipos sencillos y datos compartidos con IDs estables.
- `src/WorldMap.tsx`: mapa SVG local con colores por métrica y país.
- `assets/`: logo, portadas y siluetas. [Procedencia](assets/FUENTES.md).

Cada pantalla contiene su JSX, borradores locales y estilos. Los datos compartidos viven en contextos por responsabilidad. La navegación usa identificadores y la puntuación va de 0,5 a 5 estrellas.

Expo Router obtiene las rutas de los archivos, por eso se conserva uno por pantalla. `node_modules/`, `.expo/`, `dist/` y `artifacts/` son dependencias o resultados generados; no forman parte del código que hay que mantener.

Las cards de reviews y listas se reutilizan desde `components.tsx`. Misiones, rangos y métricas del mapa se definen una sola vez en `mock.ts`. El mapa prepara su geometría estática fuera del componente y dibuja siete trazados SVG, conservando las siluetas y los seis países seleccionables.

El ancho máximo está definido en `theme.layout.maxWidth` y se aplica al Stack desde `app/_layout.tsx`. Las cinco pantallas que calculan tamaños usan `Math.min(windowWidth, theme.layout.maxWidth)`; los perfiles miden su contenedor con `onLayout`. Así, las imágenes se adaptan a la columna incluso al redimensionar el navegador. No hay una segunda versión de las pantallas para computadora.

## Qué se puede recorrer

Búsqueda de anime, publicaciones, usuarios y listas; selección real de imágenes desde cámara o galería (reconocimiento pendiente); ficha de anime; biblioteca; creación y edición local de posteos de texto, reviews y listas; feed y comentarios; perfiles, edición y comunidad; Aura con misiones calculadas desde la actividad; mapa y detalle de país con métricas ilustrativas.

Login usa cuentas públicas de `src/usuarios-demo.json` y recuerda solo el ID mediante AsyncStorage. El registro valida pero no crea cuentas. El nombre de usuario no se edita. Perfiles, colecciones, reviews, listas, likes, comentarios y relaciones usan contextos separados; los totales personales se derivan de sus datos. Los cambios se comparten entre pantallas y cuentas. Los posteos y reviews/logs también se guardan en AsyncStorage y sobreviven a recargar/cerrar; el resto de la actividad se reinicia. No hay backend ni API.

`npm run typecheck` y `npm run lint` revisan el código. `HANDOFF.md` documenta las responsabilidades, contratos de datos y puntos a conectar con el backend. Falta probar los recorridos interactivos en teléfono.

En Explorar, «Reconocer anime» permite tomar una foto con permiso de cámara o elegir una imagen con el selector del sistema, y muestra la imagen real. El reconocimiento está pendiente y se informa al pulsar «Reconocer anime». Para comprobarlo en un teléfono, probar cámara, permiso rechazado, galería y cancelación. El selector de avatar de Editar perfil sigue simulado. Las cifras, umbrales, fechas de temporada, actores de voz y disponibilidad de plataformas son datos ilustrativos. Los enlaces de plataformas abren sus sitios oficiales para comprobar disponibilidad.

Los puntos para conectar el servidor están marcados con `TODO BACKEND [OPERACIÓN]`, junto a datos y acciones concretas. La integración pendiente de cámara/galería para el avatar está marcada con `TODO DISPOSITIVO`. No se fijaron endpoints ni tecnología de backend.

## Comprobar

```powershell
npm run typecheck
npm run lint
npm run format:check
npx expo install --check
npx expo export --platform all
```

`npm run format` ordena automáticamente el código de `app/` y `src/`. Prettier está configurado en `package.json`, sin otro archivo de configuración.

La revisión inicial incluye estados vacíos, IDs inválidos y recorridos de interacción. La revisión de escritorio cubre las rutas principales a distintos anchos, además de navegación, scroll con mouse, búsqueda con teclado, formularios, diálogos y redimensionado sin recargar. Las capturas y resultados están en `artifacts/`, ignorada por Git. La exportación comprueba los bundles Android/iOS/web; queda la revisión en un teléfono físico del teclado, Safe Area y apertura nativa. Expo Go no reproduce exactamente la apertura de una app compilada.

Base social: Crear ofrece Posteo, Review y Lista. Posteos y reviews comparten tarjetas, detalle, likes, comentarios y spoilers. Para ti excluye seguidos y publicaciones propias y prioriza gustos, etiquetas y watchlist; Siguiendo ordena por fecha. La imagen opcional en posteos y el backend quedan pendientes.
