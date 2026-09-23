# Ani-ren — Frontend

Prototipo visual con Expo SDK 57, React Native y TypeScript. Incluye las 24 pantallas de [PANTALLAS.md](PANTALLAS.md), cinco tabs y una apertura estática. La carpeta hermana `backend/` sigue vacía.

## Ejecutar

Las dependencias ya están instaladas en esta computadora. Desde la raíz Ani-ren:

```powershell
cd frontend
npm start
```

Abrir el QR en Expo Go compatible con SDK 57. Pulsar `w` para el navegador. También se puede ejecutar `npm run web`. Si se copia el proyecto a otra computadora, ejecutar primero `npm ci` dentro de `frontend/`. iOS en simulador requiere macOS; desde Windows se puede usar un iPhone físico con Expo Go.

En computadora la app queda centrada en una columna de hasta 480 px, con espacio a los costados. En ventanas más angostas ocupa el ancho disponible. La barra inferior permanece dentro de la columna; los diálogos también tienen un ancho limitado. Los carruseles muestran barras de desplazamiento en web para poder recorrerlos con mouse.

## Estructura

- `app/_layout.tsx`: Stack, Safe Area, carga de iconos y apertura.
- `app/(tabs)/`: Inicio, Explorar, Social, Aura y Perfil, en ese orden.
- El resto de `app/`: pantallas secundarias y formularios, con vuelta al origen.
- `src/theme.ts`: paleta común tomada de los mockups.
- `src/components.tsx`: controles y cards que se repiten.
- `src/mock.ts`: tipos sencillos y datos compartidos con IDs estables.
- `src/WorldMap.tsx`: mapa SVG local con colores por métrica y país.
- `assets/`: logo, portadas y siluetas. [Procedencia](assets/FUENTES.md).

Cada pantalla contiene su JSX, estado local, funciones y `StyleSheet.create`. La navegación usa identificadores y la puntuación base es sobre 10; la ficha convierte a 5 estrellas.

Son 30 archivos de código propios: 24 pantallas, dos layouts y cuatro archivos compartidos. Expo Router obtiene las rutas de los archivos, por eso se conserva uno por pantalla. `node_modules/`, `.expo/`, `dist/` y `artifacts/` son dependencias o resultados generados; no forman parte del código que hay que mantener.

Las cards de reviews y listas se reutilizan desde `components.tsx`. Misiones, rangos y métricas del mapa se definen una sola vez en `mock.ts`. El mapa prepara su geometría estática fuera del componente y dibuja siete trazados SVG, conservando las siluetas y los seis países seleccionables.

El ancho máximo está definido en `theme.layout.maxWidth` y se aplica al Stack desde `app/_layout.tsx`. Las cinco pantallas que calculan tamaños usan `Math.min(windowWidth, theme.layout.maxWidth)`; los perfiles miden su contenedor con `onLayout`. Así, las imágenes se adaptan a la columna incluso al redimensionar el navegador. No hay una segunda versión de las pantallas para computadora.

## Qué se puede recorrer

Búsqueda de anime, reviews, usuarios y listas; ficha con puntuación, sinopsis, información, personajes, voces de ejemplo, plataformas, amigos y reviews; biblioteca; crear/editar reviews y listas; feed y comentarios; perfiles, edición y comunidad; Aura con misiones, rangos, ranking y análisis predeterminado; mapa y detalle de país; ajustes y solicitud de anime.

Likes, colecciones, seguimiento, solicitudes, comentarios, filtros y previews responden en la pantalla. Los formularios validan campos y muestran confirmaciones identificadas como simulaciones. Los cambios no se sincronizan entre pantallas ni persisten al salir; no hay cuentas, base de datos ni API.

La cámara y la galería muestran un selector simulado. La IA presenta tres ejemplos fijos. Las cifras, umbrales, fechas de temporada, actores de voz y disponibilidad de plataformas son datos ilustrativos. Los enlaces de plataformas abren sus sitios oficiales para comprobar disponibilidad.

Los puntos para conectar el servidor están marcados con `TODO BACKEND [OPERACIÓN]`, junto a datos y acciones concretas. La integración de cámara/galería está marcada con `TODO DISPOSITIVO`. No se fijaron endpoints ni tecnología de backend.

## Comprobar

```powershell
npm run typecheck
npm run lint
npm run format:check
npx expo install --check
npx expo export --platform all
```

`npm run format` ordena automáticamente el código de `app/` y `src/`. Prettier está configurado en `package.json`, sin otro archivo de configuración.

La revisión inicial incluye estados vacíos, IDs inválidos y recorridos de interacción. La revisión de escritorio cubre las 24 pantallas a 320, 390, 480, 768, 1366 y 1920 px, además de navegación, scroll con mouse, búsqueda con teclado, formularios, diálogos y redimensionado sin recargar. Las capturas y resultados están en `artifacts/`, ignorada por Git. La exportación comprueba los bundles Android/iOS/web; queda la revisión en un teléfono físico del teclado, Safe Area y apertura nativa. Expo Go no reproduce exactamente la apertura de una app compilada.
