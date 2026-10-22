# Ani-Ren · frontend

Aplicación de Expo SDK 57, React Native y TypeScript conectada al repositorio hermano `ani-ren-backend`. Mantiene las cinco pestañas, el tema oscuro, los controles compartidos y la columna de hasta 480 px.

## Arrancar en Windows

En una terminal, desde `ani-ren-backend`:

```powershell
npm.cmd ci
# Solo la primera vez, si no existe .env:
Copy-Item .env.example .env
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run dev
```

No sobrescribas un `.env` existente ni borres `prisma/dev.db`. El backend debe responder en `http://localhost:3000/api/health`.

En otra terminal, desde `ani-ren-app`:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run web
```

El valor de `EXPO_PUBLIC_API_URL` incluye `/api`:

| Dispositivo | Valor |
| --- | --- |
| Navegador en esta PC | `http://localhost:3000/api` |
| Emulador Android | `http://10.0.2.2:3000/api` |
| Teléfono físico | `http://IP_LAN_DE_LA_PC:3000/api` |

Para teléfono, ejecutá `npm.cmd start`, usá la misma red y abrí el QR en Expo Go compatible. Reiniciá Expo si cambiás la URL. El túnel de Expo no publica el backend. Para web, su origen debe estar en `CORS_ORIGINS` del backend. No agregues credenciales a variables `EXPO_PUBLIC_*`.

## Sesión y datos

Creá una cuenta desde la pantalla de registro. Las cuentas demo anteriores ya no se usan y sus datos locales no se migran.

En móvil, la credencial se guarda en SecureStore. En web, la sesión vive en memoria: recargar la página requiere volver a entrar. Cerrar sesión revoca la credencial en el servidor; si falla la conexión, se puede reintentar. Un 401 cierra la sesión y desmonta todos sus datos privados. Un fallo de conexión durante la restauración permite reintentar.

La API confirma publicaciones, likes, biblioteca, seguimientos, listas y recompensas antes de mostrarlos como guardados. Los borradores permanecen en la pantalla si falla un envío. Un POST con respuesta incierta conserva cuerpo y clave de idempotencia y bloquea la edición hasta resolverlo con Reintentar. No hay sincronización offline ni persistencia de borradores entre cierres.

## Estructura

- `src/api.ts`: HTTP, errores, parámetros, deduplicación e idempotencia.
- `src/models.ts`: tipos de las respuestas.
- `src/context/SessionContext.tsx`: autenticación y almacenamiento seguro.
- `src/remote.tsx`: consultas cancelables, paginación y mutaciones; solo recarga pantallas activas.
- `src/components.tsx` y `src/remote-ui.tsx`: controles, tarjetas y estados de carga/error.
- `app/`: recorridos de cada pantalla; Expo Router conserva las rutas.
- `src/theme.ts`: diseño compartido.
- `assets/`: identidad visual y recursos. Ver `assets/FUENTES.md`.

El servidor calcula promedios, contadores, feeds, rangos y misiones. Las tarjetas usan los animes y autores incluidos en las publicaciones; no consultan el catálogo por tarjeta. Buscar animes exige dos letras y pagina con `nextPage`; las consultas locales usan `nextCursor` y el total remoto.

## Alcance

Conectados: registro/login/logout, catálogo y extras, reviews, valoraciones sin texto, posteos, edición propia, comentarios, likes, Para ti/Siguiendo, perfiles, comunidad, biblioteca, favoritos ordenados, listas, búsquedas por categoría, misiones y ranking.

Los filtros por género, temporada y año se aplican a publicaciones/listas. No se ofrecen para la búsqueda global de anime, porque esa API no los admite.

Pendientes en el backend: Tendencia, tops de anime, mapa por país, subida de avatares, equipamiento de decoradores, borrados, desmarcar visto y conversión entre valoración y review. Sus pantallas muestran un estado pendiente o sus acciones están retiradas. Los enlaces de streaming no garantizan disponibilidad en tu país.

## Verificar

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:integration
```

El último comando requiere el backend hermano con sus dependencias instaladas. Usa HTTP y una SQLite temporal creada por la fixture del backend; no modifica `prisma/dev.db`. Comprueba dos cuentas, publicaciones repetidas, reintentos, promedio, permisos, likes, comentarios, feeds, biblioteca, listas, búsqueda, Aura, revocación y persistencia tras reiniciar.

Las pruebas de catálogo de esa fixture son deterministas. La búsqueda real y los extras dependen de los proveedores del backend. La verificación en teléfono físico queda a cargo de una sesión con un dispositivo disponible.
