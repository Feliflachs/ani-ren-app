const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
const ts=require('typescript');
module.exports=(relative,stubs={})=>{
  const file=path.resolve(__dirname,'..',relative);
  const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const loaded=new Module(file,module);
  loaded.filename=file;loaded.paths=module.paths;
  const original=loaded.require.bind(loaded);
  loaded.require=name=>Object.hasOwn(stubs,name)?stubs[name]:original(name);
  loaded._compile(source,file);return loaded.exports;
};
