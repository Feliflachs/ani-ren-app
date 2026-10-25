const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function loadFile(file) {
  if (cache.has(file)) return cache.get(file);
  const source = fs.readFileSync(file, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  cache.set(file, module.exports);
  new Function('module', 'exports', 'require', outputText)(module, module.exports, (name) => {
    if (/\.(png|jpg)$/.test(name)) return 'asset';
    if (name.startsWith('.')) return loadFile(path.resolve(path.dirname(file), name + '.ts'));
    return require(name);
  });
  cache.set(file, module.exports);
  return module.exports;
}
module.exports = (name) => loadFile(path.resolve(__dirname, '../src/api', name + '.ts'));
