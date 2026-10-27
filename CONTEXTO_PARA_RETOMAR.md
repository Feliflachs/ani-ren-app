# Contexto para retomar Ani-Ren

Actualizado: 26/10/2026. Leer este archivo y PROXIMOS_BLOQUES.md antes de continuar.

## Actualización: auditoría social del segundo sprint
- Export web e iOS/Hermes del bloque social pasaron. Hermes requirió ejecución fuera del sandbox (código 6 dentro). Capturas de QA local en artifacts/social-discover.png y artifacts/social-replies.png. Falta teléfono real.
- **Actualización posterior:** ya implementados Descubrir (reemplaza Tendencia en Inicio), ranking sin afinidad con ventana 14 días/semivida 3 días, reviews destacadas por frescura/participantes únicos, likes sin reinicio del feed, respuestas paginadas/desplegables, DELETE de publicaciones solo autor y navegación directa al guardar reviews. Borrar review conserva estrellas/visto y lo explica en confirmación. Migración aditiva de respuestas aplicada a dev.db, sin reset. Reglas detalladas en backend docs/REGLAS_SOCIALES.md. Backend 74/74, app 31/31, tipos/lint y recorrido Chromium pasaron. Los puntos siguientes describen la auditoría inicial; mapa/tops, imágenes, compartir público y base pequeña siguen pendientes.
- Ver AUDITORIA_SOCIAL.md: auditoría terminada sin cambiar comportamiento. Prioridad actual: social, luego base pequeña accesible para pruebas; personalización/noticias quedan después.
- Hallazgos: Descubrir existe en API pero no en pantallas y usa afinidad; mapa/tops de actividad cuentan registros repetidos; cada mutación reinicia páginas del feed; comentarios carecen de paginación visible; no existe borrado de publicaciones; persisten confirmaciones y compartir de demo.
- Regla acordada: una contribución por usuario/anime, voto más reciente; repetir reviews/ratings no multiplica personas vistas. Porcentaje del mapa = participación de cada país en el total mundial del anime, no penetración local.
- Validación de esta auditoría: backend 21/21 pruebas seleccionadas y frontend 17/17. Reproducción aislada confirmó doble conteo regional. No QA visual/teléfono ni suite completa.
- Próximo bloque solicitado: base pequeña con cuentas que permitan login, actividad coherente y casos para reproducir los hallazgos. Aún no creada. No usar cuentas fixture-no-login como cuentas de demostración.

## Repositorios y reglas acordadas
- App: C:/Users/flach/Documents/GitHub/ani-ren-app, rama nueva-integracion-back.
- Backend: C:/Users/flach/Documents/GitHub/ani-ren-backend, rama implementacion-front.
- Mantener el diseño visual existente. Reglas, cálculos y proveedores externos en el backend; la app consume nuestra API.
- Hay cambios locales modificados y archivos nuevos sin commit en ambos repositorios. No descartarlos ni resetear bases. No se pidió commit ni publicación.
- Las credenciales TMDB ya están configuradas en el .env del backend. No copiarlas a documentación ni al frontend.

## Estado funcional acumulado
- Integración de autenticación, perfiles, feed, búsqueda, biblioteca, publicaciones, reviews, valoraciones, comentarios, likes, seguimientos, listas, Explorar y Aura.
- Para ti excluye cuentas seguidas y publicaciones propias (decisión del usuario).
- Misiones generales y por género: etapas 1/5/10/25/50/100 animes; puntos 10/25/50/125/250/500. Rangos Novato/Aprendiz/Experto/Maestro/Leyenda desde 0/100/500/1500/5000.
- Las recompensas se acreditan automáticamente una sola vez; las completadas dejan de figurar en destacadas. No volver a exigir reclamo manual.
- Mapa y tops tienen implementación: el usuario comprobó que una review apareció en Argentina. No decir que el mapa está enteramente pendiente. Falta validación amplia de países, fechas, tendencias y presentación.
- El país al valorar alimenta estadísticas; consultar la ficha o elegir país para streaming no crea vistos ni cambia el país de valoraciones previas.

## Último bloque implementado
### Ubicación y dónde verlo
- App: src/location/country.ts y useViewingCountry.ts. Ubicación nativa con permiso, caché breve, elección manual si se deniega/falla; en web se elige país. No se envían coordenadas al backend.
- GET /api/anime/:id/streaming?country=AR, autenticado. Implementación en backend src/modules/streaming/.
- TMDB reemplaza Watchmode (su cupo de tres países no servía). Credencial solo backend. AniList queda como respaldo de enlaces generales, sin afirmar disponibilidad por país.
- Coincidencia conservadora por título, año, animación y formato TV/MOVIE; no adivinar temporadas ni remakes. Caché TMDB compartida de seis horas y consultas concurrentes deduplicadas.
- Opciones TMDB abren su página de reproducción, no enlaces directos a cada plataforma.
- Se quitó la nota regional de éxito y el texto visible «Datos de TMDB y JustWatch». Quedó acceso discreto «Créditos» con logo/atribuciones requeridos.

### Sinopsis y géneros en castellano
- Backend src/modules/catalog/localization.ts; TmdbStreaming.spanishSynopsis consulta translations solo luego de confirmar identidad. Prioridad es-AR, es-MX, es-ES y luego otras variantes españolas.
- GET /anime/:id agrega synopsisEs (string/null), también si el anime ya estaba en la base. No se destruye la sinopsis original. Espera máxima de localización: ocho segundos; si falta traducción o falla proveedor se usa original con aviso.
- Se verificó Trigun (mal:6, TV 1998) con AniList/TMDB reales: sinopsis española disponible. No era simplemente caché vieja: la consulta de traducciones aún no estaba implementada.
- Traducción de géneros en el límite de serialización JSON y etiquetas de misiones, conservando IDs y nombres internos para recomendaciones/hashtags. No traducir textos escritos por usuarios.
- IMPORTANTE: traducir dentro de genresOf rompía la afinidad con #Sci-Fi. Se revirtió ese cambio funcional y la prueba correspondiente volvió a pasar.
- App src/api/remote.ts y src/data.ts conservan synopsisEs frente a respuestas parciales posteriores del feed.
- Se elimina únicamente la firma final [Written by MAL Rewrite] del texto mostrado; reconocimiento dentro de Créditos.
- Sinopsis expandible existente: unos 300 caracteres, Ver más/Ver menos.
- Limitación: sin traducción automática para OVA/ONA, coincidencias ambiguas o títulos sin versión española. No prometer cobertura completa.

## Validación
- Tipos de app y backend, y lint de app: pasan tras los cambios finales.
- App: 28 pruebas originales pasaron; se agregó prueba de conservación de sinopsis española y las siete pruebas de remote.test.cjs pasaron.
- Backend: localización + streaming, diez pruebas pasaron. Suite completa: 70/71 inicialmente; detectó regresión de géneros/hashtags, corregida después. Tras corregir, doce pruebas de discovery + Aura pasaron. No afirmar que se rerunearon las 71 después de la corrección.
- Consultas reales: disponibilidad TMDB por país y Trigun en español verificadas sin exponer claves.
- Bloque anterior: export web, export iOS/Hermes y prueba de integración web pasaron. No se repitió export/QA visual completo después del último cambio de castellano.
- Pendiente: prueba en teléfono real de permisos, geolocalización y revisión visual. Para ver cambios, reiniciar backend y recargar app.
- Algunas pruebas necesitan permisos de conexiones localhost fuera del sandbox (EACCES en sandbox); eso no fue un fallo del producto.

## Próximo trabajo acordado
1. Verificar en teléfono ubicación, cambio manual de país, dónde verlo y ficha en castellano. Revisar cobertura del catálogo.
2. Perfil y personalización: avatar desde cámara/galería, reglas de desbloqueo y equipamiento de decoradores, insignias.
   ANTES de implementar, recordar al usuario que pidió rebalancear puntos/umbrales de Aura: ver cinco animes le permitió subir demasiado rápido. Los números anteriores eran iniciales; no inventar el nuevo balance sin acordarlo.
3. Compartir publicaciones, reviews, listas y fichas de anime; definir presentación. Investigar API/fuente de noticias de anime en castellano.
4. Cerca del final, base de demostración reproducible y separada de datos personales: usuarios ficticios, reviews, puntuaciones, publicaciones, comentarios, likes, seguimientos, listas; países y fechas variados para demostrar mapa, tendencias, feed y Aura. No está hecha todavía.
5. QA final y entrega.

## Referencias locales
- App: PROXIMOS_BLOQUES.md e INTEGRACION_BACKEND.md.
- Backend: docs/GUIA_INTEGRACION_FRONTEND.md.
- Ficha: app/explorar/anime/[id].tsx.
- Configuración Expo apunta a la API terminada en /api. Si cambia la IP LAN, revisar EXPO_PUBLIC_API_URL sin alterar estilos ni reglas.

## Cómo retomar
Pedido sugerido: «Leé CONTEXTO_PARA_RETOMAR.md y sigamos con el próximo bloque». Primero revisar cambios locales actuales; este resumen es una foto del estado, no reemplaza inspeccionar el código si hubo cambios posteriores.
