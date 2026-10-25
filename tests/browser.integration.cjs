const path = require('node:path'),
  fs = require('node:fs'),
  http = require('node:http');
const { chromium, expect } = require('@playwright/test');
const backend = path.resolve(__dirname, '../../ani-ren-backend');
require(require.resolve('tsx/cjs', { paths: [backend] }));
const { fixture } = require(path.join(backend, 'tests/fixture.ts'));
const appRoot = path.resolve(__dirname, '..');
async function main() {
  process.chdir(backend);
  const fixtureServer = await fixture({
    get: async (id, page) => ({
      animeId: id,
      source: 'anilist',
      anilistId: 1,
      fetchedAt: new Date().toISOString(),
      nextPage: null,
      streamingLinks: [],
      characters: [],
      voiceActorLanguage: 'JAPANESE',
      page,
    }),
  });
  const other = await fixtureServer.account('otro_usuario');
  await fixtureServer.request('/reviews', other, {
    method: 'POST',
    key: 'browser-seed-review',
    body: {
      animeId: 'mal:1',
      rating: 4.5,
      text: 'Una historia que merece una buena review.',
      countryCode: 'AR',
    },
  });
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith('/api/')) {
        let data = '';
        for await (const chunk of req) data += chunk;
        const token = req.headers.authorization?.slice(7);
        const result = await fixtureServer.request(
          req.url.slice(4),
          token ? { id: '', token } : undefined,
          {
            method: req.method,
            body: data ? JSON.parse(data) : undefined,
            key: req.headers['idempotency-key'],
          },
        );
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(result.status === 204 ? undefined : JSON.stringify(result.body));
        return;
      }
      const root = path.join(appRoot, 'artifacts/integration-web');
      let target = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
      if (!target.startsWith(root + path.sep)) target = path.join(root, 'index.html');
      if (!fs.existsSync(target) || fs.statSync(target).isDirectory())
        target = path.join(root, 'index.html');
      const ext = path.extname(target);
      res.setHeader(
        'Content-Type',
        {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.ttf': 'font/ttf',
        }[ext] ?? 'application/octet-stream',
      );
      res.end(fs.readFileSync(target));
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });
  await new Promise((resolve) => server.listen(4173, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROMIUM_PATH ??
      'C:/Users/flach/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.url().includes('/api/') && r.status() >= 400) console.log('API', r.status(), r.url());
  });
  const go = async (route) => {
    await page.goto('http://127.0.0.1:4173' + route);
    await page.waitForTimeout(700);
    if (errors.length) throw Error(errors.join('\n'));
  };
  try {
    await go('/login/crear-cuenta');
    await page.getByLabel('Usuario', { exact: true }).fill('browser_user');
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123');
    await page.getByLabel('Repetir contraseña', { exact: true }).fill('Password123');
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
    await expect(page.getByText('Tu cuenta se creó correctamente.')).toBeVisible();
    await go('/login');
    await page.getByLabel('Usuario', { exact: true }).fill('browser_user');
    await page.getByLabel('Contraseña', { exact: true }).fill('Password123');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(page.getByText('Una historia que merece una buena review.')).toBeVisible();
    for (const route of [
      '/explorar',
      '/explorar/busqueda?q=Anime',
      '/explorar/anime/mal%3A1',
      '/explorar/tops',
      '/explorar/mapa',
      '/explorar/mapa/argentina',
      '/perfil',
      '/perfil/biblioteca',
      '/aura',
      '/aura/misiones',
      '/aura/ranking',
      '/aura/rangos',
    ]) {
      await go(route);
      await expect(page.getByText('No pudimos cargar esta pantalla', { exact: true })).toHaveCount(
        0,
      );
      console.log('PASS route', route);
    }
    await go('/crear/review/escribir?animeId=mal%3A1');
    await page.getByRole('button', { name: 'Puntuar 4 de 5', exact: true }).click();
    await page.getByRole('button', { name: 'Listo', exact: true }).click();
    await expect(page.getByText('Actividad guardada', { exact: true })).toBeVisible();
    const user = await fixtureServer.db.user.findUniqueOrThrow({
      where: { normalizedHandle: 'browser_user' },
    });
    const assertCount = await fixtureServer.db.ratingEntry.count({ where: { userId: user.id } });
    if (assertCount !== 1) throw Error('Rating count ' + assertCount);
    await go('/aura/misiones');
    await page.getByRole('button', { name: 'Ver Animes vistos · 1', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Reclamar puntos', exact: true })).toHaveCount(0);
    await expect(
      page.getByText('Los puntos se sumaron automáticamente a tu cuenta.'),
    ).toBeVisible();
    await go('/aura');
    await expect(page.getByText('Animes vistos · 5', { exact: true })).toBeVisible();
    await expect(page.getByText('Animes vistos · 1', { exact: true })).toHaveCount(0);
    console.log('PASS browser flows');
  } catch (e) {
    await page.screenshot({
      path: path.join(appRoot, 'artifacts/integration-error.png'),
      fullPage: true,
    });
    console.log((await page.locator('body').innerText()).slice(0, 2500));
    throw e;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    await fixtureServer.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
