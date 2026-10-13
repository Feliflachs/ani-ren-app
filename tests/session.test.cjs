const {test,afterEach}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {create,act}=require('react-test-renderer');
const load=require('./load-ts.cjs');
const api=require('./load-api.cjs');
global.IS_REACT_ACT_ENVIRONMENT=true;
const realFetch=global.fetch;
afterEach(()=>{global.fetch=realFetch;});
function setup(platform,stored=null){
  const storage={value:stored};
  const session=load('src/context/SessionContext.tsx',{'react-native':{Platform:{OS:platform}},'expo-secure-store':{
    getItemAsync:async()=>storage.value,setItemAsync:async(_key,value)=>{storage.value=value;},deleteItemAsync:async()=>{storage.value=null;}
  },'../api':api});
  let value,tree;
  function Consumer(){value=session.useSession();return null;}
  return {storage,get value(){return value;},async mount(){await act(async()=>{tree=create(React.createElement(session.SessionProvider,null,React.createElement(Consumer)));});},async close(){await act(async()=>tree.unmount());}};
}
test('web conserva la sesión solo en memoria y descarta respuestas de la cuenta anterior',async()=>{
  const app=setup('web');let finish;
  global.fetch=async(url,options)=>{
    if(url.endsWith('/auth/login')){const {handle}=JSON.parse(options.body);return Response.json({user:{id:handle,name:handle},token:'token-'+handle});}
    if(url.endsWith('/auth/logout'))return new Response(null,{status:204});
    if(url.endsWith('/slow'))return new Promise(resolve=>{finish=resolve;});
    throw new Error('unexpected URL');
  };
  await app.mount();assert.equal(app.value.ready,true);
  await act(async()=>{await app.value.signIn('a','Password1');});
  const oldApi=app.value.api;
  const oldResponse=oldApi('/slow').catch(error=>error);
  await act(async()=>{await app.value.signOut();});
  await act(async()=>{await app.value.signIn('b','Password1');});
  await act(async()=>{finish(Response.json({error:{code:'SESSION_EXPIRED',message:'expired'}},{status:401}));await oldResponse;});
  assert.equal(app.value.user.id,'b');
  assert.equal(app.storage.value,null);
  await assert.rejects(oldApi('/anything'),/sesión cambió/);
  assert.equal(app.value.user.id,'b');
  await app.close();
});
test('restauración móvil: desconexión ofrece reintento sin borrar la credencial; 401 la borra',async()=>{
  const app=setup('android','saved-token');
  global.fetch=async()=>{throw new TypeError('offline');};
  await app.mount();
  assert.ok(app.value.restoreError);assert.equal(app.storage.value,'saved-token');
  global.fetch=async()=>Response.json({user:{id:'a',name:'A'}});
  await act(async()=>app.value.retry());
  assert.equal(app.value.user.id,'a');assert.equal(app.value.restoreError,'');
  global.fetch=async()=>Response.json({error:{code:'SESSION_EXPIRED',message:'expired'}},{status:401});
  await act(async()=>{await assert.rejects(app.value.api('/me/aura'),error=>error.status===401);});
  assert.equal(app.value.user,null);assert.equal(app.storage.value,null);
  await app.close();
});

