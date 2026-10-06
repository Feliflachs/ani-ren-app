# Assets de la etapa visual

`mascota.png` es una copia sin modificar de `logo_mascota_loto_sombrero.png`, suministrado en la carpeta de mockups. Se usa como icono y apertura estática.

Las portadas son placeholders locales para el prototipo, obtenidos del CDN de MyAnimeList el 17 de septiembre de 2026. No se llama a su API. Los avatares, personajes y novedades reutilizan recortes ilustrativos de esas portadas; no son imágenes definitivas de sus personajes.

| Archivo | Imagen original |
| --- | --- |
| frieren.jpg | https://cdn.myanimelist.net/images/anime/1015/138006.jpg |
| solo-leveling.jpg | https://cdn.myanimelist.net/images/anime/1801/142390.jpg |
| blue-lock.jpg | https://cdn.myanimelist.net/images/anime/1258/126929.jpg |
| vinland-saga.jpg | https://cdn.myanimelist.net/images/anime/1500/103005.jpg |
| mob-psycho.jpg | https://cdn.myanimelist.net/images/anime/1918/96303.jpg |
| haikyuu.jpg | https://cdn.myanimelist.net/images/anime/7/76014.jpg |
| demon-slayer.jpg | https://cdn.myanimelist.net/images/anime/1286/99889.jpg |
| spy-family.jpg | https://cdn.myanimelist.net/images/anime/1441/122795.jpg |

Para reemplazar una portada, cambiar el `image` del anime en `src/mock.ts`; las pantallas reutilizan esa referencia.

`mascota-transparente.png` es una variante de `mascota.png`, editada con generación de imágenes el 6 de octubre de 2026 para quitar el fondo y ajustar el encuadre del símbolo en el login. Conserva transparencia real; el original no se reemplazó.

`mascota-login.png` es una variante transparente con «Ani-ren» en la banda del sombrero, generada a partir de `mascota-transparente.png` el 6 de octubre de 2026. Se usa en el login; el símbolo pequeño de Inicio conserva la versión sin texto.

`paises.json` contiene siluetas SVG estáticas derivadas de [Natural Earth, Admin 0 Countries 1:110m](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson), sin Antártida. Se redondearon y proyectaron las coordenadas para un viewBox de 360 × 145. Natural Earth publica estos datos en [dominio público](https://www.naturalearthdata.com/about/terms-of-use/). El mapa no solicita ubicación ni consulta servidores. Solo los seis países del mock tienen métricas y controles; los colores representan datos ficticios.
