const {test, afterEach} = require('node:test');
const assert = require('node:assert/strict');
const {request, query, ApiError, Submission, appendUnique} = require('./load-api.cjs');
const originalFetch = global.fetch;
afterEach(() => {global.fetch = originalFetch;});
test('el cliente adjunta sesión, JSON e idempotencia y acepta 204 sin JSON', async () => {
  let observed;
  global.fetch = async (url, options) => {observed = {url, options}; return new Response(null, {status:204});};
  assert.equal(await request('/auth/logout','session-A',{method:'POST'}),undefined);
  assert.equal(observed.options.headers.Authorization, 'Bearer session-A');
  assert.equal(observed.options.body, undefined);
  global.fetch = async (url,options)=>{observed={url,options};return Response.json({publication:{id:'2'}});};
  await request('/reviews','session-B',{method:'POST',body:{animeId:'mal:20',rating:3.5,text:'Una buena historia'},key:'logical-operation-1'});
  assert.equal(observed.options.headers.Authorization,'Bearer session-B');
  assert.equal(observed.options.headers['Idempotency-Key'],'logical-operation-1');
  assert.equal(JSON.parse(observed.options.body).rating,3.5);
});
test('distingue sesión vencida, validación y desconexión', async () => {
  global.fetch = async()=>Response.json({error:{code:'SESSION_EXPIRED',message:'Sesión vencida'}},{status:401});
  await assert.rejects(request('/auth/me','invalid'),error=>error instanceof ApiError && error.status===401);
  global.fetch = async()=>Response.json({error:{code:'VALIDATION_ERROR',message:'Inválido',fields:[{field:'text',message:'Texto demasiado corto'}]}},{status:400});
  await assert.rejects(request('/reviews','a'),/Texto demasiado corto/);
  global.fetch = async()=>{throw new TypeError('offline');};
  await assert.rejects(request('/auth/me','a'),error=>error.status===0 && error.code==='CONNECTION');
});
test('cancelar una búsqueda aborta la solicitud y no produce error de sesión', async () => {
  const controller = new AbortController();
  let signal;
  global.fetch = (_url,options)=>new Promise((_resolve,reject)=>{signal=options.signal;signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')));});
  const pending=request('/anime?q=naruto','a',{signal:controller.signal});
  controller.abort();
  await assert.rejects(pending,error=>error.name==='AbortError');
  assert.equal(signal.aborted,true);
});
test('una respuesta perdida se reintenta con la misma clave y otro envío obtiene otra', () => {
  const submission = new Submission();
  let counter=0;
  const key=()=>String(++counter);
  const body={animeId:'mal:20',rating:4,text:'Una review completa'};
  assert.equal(submission.prepare('/reviews',body,key),'1');
  assert.equal(submission.prepare('/reviews',body,key),'1');
  assert.throws(()=>submission.prepare('/reviews',{...body,rating:5},key),/pendiente/);
  assert.equal(submission.prepare('/reviews',body,key),'1');
  submission.resolve();
  assert.equal(submission.prepare('/reviews',body,key),'2');
});
test('paginación deduplica conservando orden y no inventa totales', () => {
  assert.deepEqual(appendUnique([{id:'1',value:1},{id:'2',value:2}],[{id:'2',value:3},{id:'3',value:4}],x=>x.id),[{id:'1',value:1},{id:'2',value:3},{id:'3',value:4}]);
  assert.equal(query('/search',{type:'publications',q:'#acción',cursor:'a+b/=',year:''}),'/search?type=publications&q=%23acci%C3%B3n&cursor=a%2Bb%2F%3D');
});

