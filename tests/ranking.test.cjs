const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Render the screen with transport responses: points and tied positions must survive presentation.
function renderRanking(scope, currentId, page) {
  let requestedScope;
  const stubs = {
    '../../src/context/RemoteContext': {
      usePage: (route, query) => {
        assert.equal(route, '/ranking');
        requestedScope = query.scope;
        return page;
      },
    },
    '../../src/remote-ui': { QueryFooter: 'QueryFooter' },
    '../../src/api/remote': { adaptUser: (user) => ({ ...user, watched: 3 }) },
    '../../src/useCurrentUser': { useCurrentUser: () => ({ id: currentId }) },
    '@expo/vector-icons/Ionicons': { __esModule: true, default: 'Icon' },
    'expo-router': { router: { push() {} } },
    react: { useState: () => [scope, () => {}] },
    'react/jsx-runtime': {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    'react-native': {
      Pressable: 'Pressable',
      Text: 'Text',
      View: 'View',
      StyleSheet: { create: (styles) => styles },
    },
    '../../src/components': { Avatar: 'Avatar', Chips: 'Chips', Screen: 'Screen' },
    '../../src/theme': { theme: { colors: {} } },
  };
  const source = fs.readFileSync(path.join(__dirname, '../app/aura/ranking.tsx'), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, (name) => {
    assert.ok(name in stubs, `Unexpected import: ${name}`);
    return stubs[name];
  });
  return { tree: module.exports.default(), requestedScope };
}
function nodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('');
  if (tree == null || typeof tree === 'boolean') return '';
  return typeof tree === 'object' ? text(tree.props?.children) : String(tree);
}
for (const [filter, scope] of [
  ['Global', 'global'],
  ['Amigos', 'friends'],
]) {
  test(`ranking ${scope} shows server positions and Aura points for every account, including ties and later pages`, () => {
    const items = [
      {
        user: { id: 'a', name: 'Ana' },
        position: 3,
        points: 70,
        watched: 3,
        rank: { name: 'Novato' },
      },
      {
        user: { id: 'b', name: 'Bruno' },
        position: 3,
        points: 70,
        watched: 9,
        rank: { name: 'Novato' },
      },
      {
        user: { id: 'c', name: 'Carla' },
        position: 8,
        points: 0,
        watched: 5,
        rank: { name: 'Novato' },
      },
    ];
    for (const current of items) {
      const page = { items, data: { me: current }, loading: false, reload() {} };
      const { tree, requestedScope } = renderRanking(filter, current.user.id, page);
      assert.equal(requestedScope, scope);
      assert.ok(text(tree).includes(`Tu posición: #${current.position}`));
      assert.ok(text(tree).includes(`${current.points} puntos Aura`));
      const rows = nodes(tree, (node) => node.type === 'Pressable');
      rows.forEach((row, index) => {
        const texts = nodes(row, (node) => node.type === 'Text').map(text);
        assert.equal(texts[0], `#${items[index].position}`);
        assert.equal(texts.at(-2), String(items[index].points));
        assert.match(row.props.accessibilityLabel, /puntos Aura$/);
      });
      assert.equal(tree.props.onRefresh, page.reload);
    }
  });
}
