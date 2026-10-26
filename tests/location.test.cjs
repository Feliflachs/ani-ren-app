const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function detector(location, platform = 'ios') {
  const { outputText } = ts.transpileModule(fs.readFileSync('src/location/country.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, (name) =>
    name === 'expo-location' ? location : { Platform: { OS: platform } },
  );
  return module.exports.detectCountry;
}
test('sin permiso no consulta coordenadas ni insiste automáticamente', async () => {
  let asks = 0;
  const detect = detector({
    getForegroundPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
    requestForegroundPermissionsAsync: async () => {
      asks++;
      return { granted: false };
    },
    getCurrentPositionAsync: async () => {
      throw Error('No debe leer coordenadas');
    },
  });
  assert.equal((await detect()).code, null);
  assert.equal((await detect()).code, null);
  assert.equal(asks, 1);
  await detect(true);
  assert.equal(asks, 2);
});
test('consultas simultáneas usan una ubicación, devuelven solo país y reutilizan el resultado brevemente', async () => {
  let reads = 0;
  const detect = detector({
    getForegroundPermissionsAsync: async () => ({ granted: true }),
    hasServicesEnabledAsync: async () => true,
    Accuracy: { Low: 1 },
    getCurrentPositionAsync: async () => {
      reads++;
      return { coords: { latitude: -34, longitude: -58 } };
    },
    reverseGeocodeAsync: async () => [{ isoCountryCode: 'ar', city: 'Privado' }],
  });
  const result = await Promise.all([detect(), detect()]);
  assert.deepEqual(result[0], { code: 'AR', message: '' });
  assert.equal(reads, 1);
  await detect();
  assert.equal(reads, 1);
  await detect(true);
  assert.equal(reads, 2);
});
test('GPS desactivado, fallo de geocodificación y web permiten elegir país', async () => {
  const off = detector({
    getForegroundPermissionsAsync: async () => ({ granted: true }),
    hasServicesEnabledAsync: async () => false,
  });
  assert.equal((await off()).code, null);
  const failure = detector({
    getForegroundPermissionsAsync: async () => {
      throw Error('GPS');
    },
  });
  assert.equal((await failure()).code, null);
  assert.equal((await detector({}, 'web')()).code, null);
});
