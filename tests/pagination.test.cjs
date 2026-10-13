const {test}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {create,act}=require('react-test-renderer');
const load=require('./load-ts.cjs');
const api=require('./load-api.cjs');
global.IS_REACT_ACT_ENVIRONMENT=true;
test('cambiar filtros cancela la página anterior y descarta su respuesta tardía',async()=>{
  const requests=[];
  const remote=load('src/remote.tsx',{'expo-crypto':{randomUUID:()=> 'uuid-test'},'expo-router':{useFocusEffect:callback=>React.useEffect(callback,[callback])},'./api':api,'./context/SessionContext':{useSession:()=>({api:fetchPage})}});
  function fetchPage(path,options){return new Promise((resolve,reject)=>requests.push({path,options,resolve,reject}));}
  let value,tree;
  function Consumer({path}){value=remote.usePage(path);return null;}
  await act(async()=>{tree=create(React.createElement(remote.RemoteProvider,null,React.createElement(Consumer,{path:'/search?q=old'})));});
  await act(async()=>requests[0].resolve({items:[{id:'old'}],nextCursor:'cursor-old',total:2}));
  let pending;
  await act(async()=>{pending=value.more();});
  assert.ok(requests[1].path.includes('cursor-old'));
  await act(async()=>tree.update(React.createElement(remote.RemoteProvider,null,React.createElement(Consumer,{path:'/search?q=new'}))));
  assert.equal(requests[1].options.signal.aborted,true);
  await act(async()=>{requests[1].resolve({items:[{id:'stale'}],nextCursor:null,total:2});await pending;requests[2].resolve({items:[{id:'new'}],nextCursor:null,total:1});});
  assert.deepEqual(value.items,[{id:'new'}]);assert.equal(value.data.total,1);
  await act(async()=>tree.unmount());
});
test('410 reinicia Para ti sin reutilizar el cursor vencido',async()=>{
  const requests=[];
  const remote=load('src/remote.tsx',{'expo-crypto':{randomUUID:()=> 'uuid-test'},'expo-router':{useFocusEffect:callback=>React.useEffect(callback,[callback])},'./api':api,'./context/SessionContext':{useSession:()=>({api:fetchPage})}});
  function fetchPage(path){requests.push(path);if(path.includes('cursor='))return Promise.reject(new api.ApiError(410,'FEED_EXPIRED','expired'));return Promise.resolve({items:[{id:String(requests.length)}],nextCursor:requests.length===1?'expired':null,total:1});}
  let value,tree;
  function Consumer(){value=remote.usePage('/feed?type=for-you');return null;}
  await act(async()=>{tree=create(React.createElement(remote.RemoteProvider,null,React.createElement(Consumer)));});
  await act(async()=>{await value.more();});
  assert.deepEqual(requests,['/feed?type=for-you','/feed?type=for-you&cursor=expired','/feed?type=for-you']);
  assert.deepEqual(value.items,[{id:'3'}]);assert.equal(value.error,'');
  await act(async()=>tree.unmount());
});
