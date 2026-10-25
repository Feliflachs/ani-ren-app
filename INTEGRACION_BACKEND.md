# Integración del frontend

Ramas: app `nueva-integracion-back`; backend `implementacion-front`.

## Implementado

- Registro, login, restauración, expiración y logout. Token en SecureStore nativo o sessionStorage web; sin contraseñas persistidas.
- Perfil propio/público, estadísticas del servidor, nombre/bio y cuatro favoritos ordenados.
- Feed Para ti/Siguiendo/Tendencia, consultas y paginación del servidor. Para ti excluye cuentas seguidas.
- Búsqueda por categoría, género y temporada; catálogo y ficha del anime, distribución real de votos, elenco y enlaces del proveedor.
- Biblioteca, likes, listas y edición de listas. Mutaciones confirmadas antes del mensaje de éxito.
- Posts, reviews, ratings, comentarios, likes y seguimientos. El ID de publicación distingue edición de creación.
- Misiones con recompensas automáticas y únicas, puntos, progreso y ranking de Aura desde el backend. Las destacadas excluyen las completadas; la pantalla de misiones conserva el historial y los filtros.
- Tops y mapa, detalle por país, comparaciones por anime y escala violeta con intensidad del servidor.
- País ISO opcional al crear ratings/reviews en teléfono, con permiso contextual. No se envían coordenadas. Ediciones conservan el país original.

Las pantallas ya no importan el catálogo, cuentas, relaciones ni publicaciones de `src/mock.ts`. Ese archivo y las antiguas funciones de demo permanecen como referencia sin uso en la app.
`/discover` sigue disponible para sugeridos; no se agregó una sección visual nueva que no existía.

## Mapa del código

- `src/api/client.ts`: HTTP, errores, cancelación y timeout.
- `src/api/session.ts`: sesión y almacenamiento; `tokenStorage.*`: implementación por plataforma.
- `src/api/remote.ts`: adaptación de respuestas, caché de entidades, invalidación después de escrituras y claves de idempotencia conservadas durante reintentos.
- `src/data.ts`: modelos de presentación y entidades recibidas; no contiene actividad inventada.
- `src/context/RemoteContext.tsx`: consultas/páginas, aislamiento de respuestas al cambiar de cuenta y errores.
- `src/remote-ui.tsx`: carga de pantallas con enlaces directos, buscador paginado y controles de carga/reintento.
- `src/context/*`: compatibilidad de los componentes actuales con las operaciones del backend.
- `src/map-data.ts`: códigos ISO y posiciones visuales; `WorldMap.tsx` conserva las siluetas y colores existentes.

La guía contractual está en `../ani-ren-backend/docs/GUIA_INTEGRACION_FRONTEND.md`.
Los endpoints de listas y publicaciones por usuario aceptan ahora `q`, aplicado antes de paginar, para la búsqueda dentro de Biblioteca.

## Preparar el entorno real

1. Copiar `.env.example` a `.env.local` y configurar `EXPO_PUBLIC_API_URL` terminada en `/api`.
2. En teléfono usar la IP de la computadora en la misma red; localhost solo corresponde al navegador de esa computadora. En el emulador Android se puede usar `10.0.2.2`.
3. Configurar `CORS_ORIGINS` del backend para Expo web y aplicar sus migraciones pendientes con copia de seguridad, sin resetear datos.
4. Iniciar el backend y reiniciar Expo tras cambiar la URL. Un build nativo propio debe incluir el nuevo módulo SecureStore.

Entorno local actualizado el 25/10/2026: `.env.local` apunta a `http://192.168.0.32:3000/api`; las cuatro migraciones pendientes se aplicaron a desarrollo, con copia previa en `../ani-ren-backend/backups/`. Se verificaron registro (201), login (200) y perfil (200) contra el backend local mediante una cuenta temporal eliminada al terminar. La cuenta existente se conservó. No se desplegó la app. Las demás verificaciones HTTP usaron bases temporales aisladas.

## Verificación y límites

- 25 pruebas unitarias pasan: `npm test`.
- TypeScript comprobado en ambos repositorios; lint y exportación web pasan.
- Se compararon por AST los 25 bloques StyleSheet con Git: sin cambios. No equivale a una comparación visual exhaustiva en teléfono.
- `node tests/session.integration.cjs`: recorrido de sesión/perfil con backend real, verificado en el bloque anterior.
- `node tests/browser.integration.cjs`: pasa registro/login, navegación principal, rating y recompensas automáticas; verifica que las completadas permanecen en Misiones y desaparecen de destacadas.
- `node tests/remote.integration.cjs`: pasan contratos de todos los módulos, reintento tras pérdida de respuesta sin duplicado, puntos automáticos y agregados por país.
- El test de navegador requiere exportar antes con `EXPO_PUBLIC_API_URL=http://127.0.0.1:4173/api` hacia `artifacts/integration-web` y tener Chromium instalado. `CHROMIUM_PATH` permite indicar su ejecutable.

Los recorridos integrales web y de contratos pasan. Falta probar permisos de ubicación/reintentos en un teléfono. La exportación para pruebas no debe usarse como build de producción.

## Fuera del alcance confirmado

- Decoradores: vista previa explícita; faltan reglas de desbloqueo y equipamiento.
- Cámara/galería y subida binaria de avatar: falta proveedor. No se simula un avatar remoto guardado.
- Noticias editoriales: el backend no ofrece una fuente; la tarjeta informa que está pendiente.
- Compartir conserva el comportamiento de presentación existente; no envía mensajes automáticamente.

Las claves de idempotencia se conservan mientras vive la sesión de la app; no se implementó una cola offline persistente. Si falla una operación de un guardado compuesto (perfil/favoritos), no se anuncia éxito global y el borrador permanece disponible.

## Próximo bloque acordado: dónde verlo

Toda la integración de proveedores queda en el backend. AniList será respaldo si el proveedor principal no responde, sin afirmar disponibilidad regional cuando solo haya enlaces generales. Al entrar a la ficha se solicitará ubicación para consultar streaming en el país actual; si no hay permiso, se ofrecerá elegir país. Ese país de consulta no genera vistos ni reemplaza el país histórico de una valoración. Este bloque todavía no está implementado; falta configurar el proveedor regional.

Verificación del cambio de recompensas automáticas: 61 pruebas backend, TypeScript de ambos proyectos, lint, exportación web y recorridos de navegador/contratos aprobados. No se modificaron estilos.
