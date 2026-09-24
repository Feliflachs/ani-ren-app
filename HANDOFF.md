# Ani-Ren - Contexto para continuar el proyecto

Última actualización: 24 de septiembre de 2026.

## Objetivo general

Ani-Ren es por ahora un frontend hecho con Expo, React Native y Expo Router. La prioridad es mantener el código simple, legible y preparado para conectar un backend más adelante, sin modificar innecesariamente el diseño existente.

No se busca poner toda la aplicación en un único archivo. Cada archivo dentro de `app/` representa una pantalla o ruta. Por ejemplo, `app/anime/[id].tsx` es una ruta dinámica que permite mostrar distintos animes usando el mismo componente.

## Decisiones de producto confirmadas

- Toda la aplicación usa puntuaciones de `0.5` a `5`.
- La puntuación se elige con cinco estrellas. La mitad izquierda vale media estrella y la derecha una estrella completa.
- En el detalle de un anime hay un botón principal llamado `Review` cerca de la parte superior.
- Review reúne las acciones `Visto`, `Me gusta`, `Watchlist`, puntuación, review o log, fecha y listas.
- `Visto`, `Me gusta` y `Watchlist` son controles compactos con iconos.
- `Me gusta` usa el color coral definido en el tema.
- Una puntuación por sí sola crea un log con fecha y agrega el anime a Vistos.
- Una review o log también agrega automáticamente el anime a Vistos.
- Es válido marcar solamente Visto sin escribir texto ni puntuar.
- El texto de la review es opcional. Si se escribe, debe tener al menos 10 caracteres.
- `Agregar a lista` admite más de una lista.
- En Explorar, `Ver todos` expande todos los géneros en la misma pantalla. Tocar un género abre la búsqueda filtrada.
- Las temporadas usan paisajes de primavera, verano, otoño e invierno sin personajes.
- El mapa permite escribir el nombre de un anime. Si todavía no está en el catálogo local, la interfaz explica que sus estadísticas llegarán con el backend.
- Cada rango Aura tiene una insignia visual diferente.
- Aura incluye sufijos e insignias disponibles y bloqueados para futuros desbloqueos.
- En el detalle del anime se eliminó la sección separada de personajes principales.
- Los actores de voz muestran el personaje correspondiente y el idioma japonés.
- `Dónde verlo legalmente` se cambió a `Dónde ver`.
- La sección de popularidad por país se mantiene.

## Implementación actual

### Estado local compartido

`src/AppState.tsx` contiene el estado temporal de actividad del usuario:

- animes vistos;
- me gusta;
- watchlist;
- puntuaciones;
- fecha del log;
- texto y spoilers;
- pertenencia a listas.

`AppStateProvider` envuelve la aplicación desde `app/_layout.tsx`. Este archivo es el punto principal que deberá reemplazarse o adaptarse cuando exista un backend.

Los cambios duran durante la sesión actual. Todavía no se guardan al cerrar o recargar la aplicación.

### Componentes compartidos

`src/components.tsx` incluye:

- `StarRating`, selector reutilizable de cinco estrellas con medias estrellas;
- `RankInsignia`, insignias distintas para Novato, Aprendiz, Experto, Maestro y Leyenda;
- los componentes visuales que ya existían, como `Screen`, `Action`, `AnimeCard` y `Dialog`.

### Datos de ejemplo

`src/mock.ts` sigue siendo el catálogo temporal. Todas las puntuaciones se migraron a una escala máxima de 5.

Los comentarios `TODO BACKEND` indican dónde deberán conectarse las consultas y escrituras reales.

## Pantallas modificadas

- `app/(tabs)/explorar.tsx`: géneros desplegables y paisajes estacionales.
- `app/mapa/index.tsx`: búsqueda escrita de anime.
- `app/anime/[id].tsx`: botón Review, escala de 5, Dónde ver y actores de voz.
- `app/review/escribir.tsx`: nuevo flujo de actividad inspirado en Letterboxd.
- `app/biblioteca.tsx`: usa el estado compartido para Watchlist, Vistos y Favoritos.
- `app/lista/[id].tsx`: refleja animes agregados desde Review.
- `app/(tabs)/perfil.tsx`: refleja vistos, favoritos y progreso local.
- `app/(tabs)/aura.tsx`: muestra las nuevas insignias y el progreso actualizado.
- `app/aura/rangos.tsx`: insignias por rango y más sufijos desbloqueables.
- `app/tops.tsx`: puntuaciones mostradas sobre 5.

## Assets generados

Los paisajes se generaron como ilustraciones digitales simples, sin personajes, texto, logos ni marcas de agua. Están optimizados para móvil:

- `assets/seasons/primavera.jpg`
- `assets/seasons/verano.jpg`
- `assets/seasons/otono.jpg`
- `assets/seasons/invierno.jpg`

## Cómo ejecutar el proyecto

Después de clonar el repositorio:

```bash
npm install
npm start
```

Opciones de Expo:

- presionar `w` para abrir web;
- presionar `a` para Android;
- escanear el QR con Expo Go.

También se puede abrir web directamente:

```bash
npm run web
```

## Verificaciones realizadas

Estas verificaciones pasan:

```bash
npm run typecheck
npm run lint
```

También se comprobó manualmente y con navegación automatizada que:

- aparecen todos los géneros al expandir;
- cargan las cuatro imágenes estacionales;
- las medias estrellas producen valores como `0.5` y `1.0` correctamente;
- puntuar agrega el anime a Vistos;
- agregar un anime a una lista se refleja en el detalle de esa lista;
- el mapa acepta texto libre y desactiva el detalle si todavía no existen datos;
- las pantallas no generan errores en web móvil.

`npm run format:check` todavía marca archivos antiguos que ya estaban sin formatear. Los archivos modificados en este trabajo sí pasan Prettier.

## Forma recomendada de continuar

Mantener los cambios pequeños y por pantalla. No reorganizar carpetas ni crear abstracciones nuevas salvo que eliminen duplicación real.

Próximos pasos razonables:

1. Revisar textos y detalles visuales en un teléfono real con Expo Go.
2. Definir el modelo del backend para usuarios, anime, actividades, reviews, logs y listas.
3. Reemplazar gradualmente las operaciones de `AppState.tsx` por llamadas al backend.
4. Mantener estados de carga, error y vacío en cada pantalla.
5. Agregar autenticación recién cuando esté definido el backend.

## Mensaje para otro asistente

> Leé `HANDOFF.md`, `src/AppState.tsx`, `src/mock.ts` y la pantalla que vayamos a modificar. Conservá el diseño actual y priorizá código simple y fácil de leer. Antes de cambios grandes, explicá brevemente qué vas a tocar. El frontend todavía usa datos de ejemplo y debe quedar preparado para conectar un backend más adelante.

## Commit sugerido

```bash
git add app src assets HANDOFF.md
git commit -m "Mejora exploración, reviews y actividad local"
git push
```
