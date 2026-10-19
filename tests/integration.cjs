// Optional contract test against the sibling backend, using its isolated SQLite fixture.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {createRequire} = require('node:module');
const {randomUUID} = require('node:crypto');
const api = require('./load-api.cjs');
const backend = path.resolve(__dirname, '../../ani-ren-backend');
const backendRequire = createRequire(path.join(backend,'package.json'));
backendRequire('tsx/cjs');
const {fixture} = backendRequire('./tests/fixture.ts');
test('cliente frontend → HTTP backend → SQLite: recorrido completo con dos cuentas', async () => {
  const cwd=process.cwd(); process.chdir(backend);
  const f=await fixture();
  process.chdir(cwd);
  const realFetch=global.fetch;
  global.fetch=async(url,options={})=>{
    if(!String(url).startsWith(api.API_URL))return realFetch(url,options);
    const token=options.headers?.Authorization?.replace('Bearer ','');
    // fixture.request performs the real HTTP call; its base is a random isolated port.
    const result=await f.request(String(url).slice(api.API_URL.length),token?{token}:undefined,{
      method:options.method,body:options.body===undefined?undefined:JSON.parse(options.body),key:options.headers?.['Idempotency-Key']
    });
    return result.status===204?new Response(null,{status:204}):Response.json(result.body,{status:result.status});
  };
  const call=(route,token,method='GET',body,key)=>api.request(route,token,{method,body,key});
  try {
    await call('/auth/register',null,'POST',{handle:'acceptance_a',password:'OnlyLocal123'});
    await call('/auth/register',null,'POST',{handle:'acceptance_b',password:'OnlyLocal123'});
    const a=await call('/auth/login',null,'POST',{handle:'acceptance_a',password:'OnlyLocal123'});
    const b=await call('/auth/login',null,'POST',{handle:'acceptance_b',password:'OnlyLocal123'});
    const catalog=await call('/anime?q=anime',a.token);
    assert.equal(catalog.items[0].id,'mal:1');
    assert.equal(catalog.nextPage,2);
    const submission=new api.Submission();
    const body={animeId:'mal:1',rating:3.5,text:'Primera opinión completa #romance'};
    const key=submission.prepare('/reviews',body,randomUUID);
    const first=(await call('/reviews',a.token,'POST',body,key)).publication;
    assert.equal((await call('/reviews',a.token,'POST',body,submission.prepare('/reviews',body,randomUUID))).publication.id,first.id);
    submission.resolve();
    const second=(await call('/reviews',a.token,'POST',{...body,rating:4.5},randomUUID())).publication;
    assert.notEqual(first.id,second.id);
    const stats=(await call('/anime/mal:1',a.token)).anime.statistics;
    assert.equal(stats.averageRating,4.5);
    assert.equal(stats.reviewCount,2);
    assert.equal((await call('/me/anime/mal:1/activity',a.token)).currentRating.rating,4.5);
    await call('/publications/'+first.id+'/like',b.token,'PUT');
    await call('/publications/'+first.id+'/comments',b.token,'POST',{text:'Coincido con esta opinión'},randomUUID());
    const edited=(await call('/reviews/'+first.id,a.token,'PATCH',{text:'Opinión editada y ampliada #romance'})).publication;
    assert.equal(edited.createdAt,first.createdAt);
    assert.equal(edited.likeCount,1);
    assert.equal(edited.commentCount,1);
    await assert.rejects(call('/reviews/'+first.id,b.token,'PATCH',{text:'No debe poder editar'}),error=>error.status===403);
    const discovery=await call('/feed?type=for-you&limit=1',b.token);
    assert.equal(discovery.items.length,1);
    assert.ok(discovery.nextCursor);
    assert.notEqual((await call(api.query('/feed',{type:'for-you',cursor:discovery.nextCursor,limit:1}),b.token)).items[0].id,discovery.items[0].id);
    await call('/me/following/'+a.user.id,b.token,'PUT');
    assert.equal((await call('/feed?type=for-you',b.token)).total,2);
    assert.equal((await call('/feed?type=following',b.token)).total,2);
    await call('/me/library/mal:4',a.token,'PATCH',{watchlist:true});
    await call('/me/favorites',a.token,'PUT',{animeIds:['mal:4','mal:1']});
    assert.deepEqual((await call('/me/favorites',a.token)).items.map(x=>x.anime.id),['mal:4','mal:1']);
    assert.equal((await call('/me/favorites',b.token)).total,0);
    const list=(await call('/lists',a.token,'POST',{title:'Lista de aceptación',ordered:true,animeIds:['mal:4','mal:1']},randomUUID())).list;
    await call('/lists/'+list.id,a.token,'PATCH',{animeIds:['mal:1','mal:4']});
    assert.deepEqual((await call('/lists/'+list.id,b.token)).list.animeIds,['mal:1','mal:4']);
    const postsBefore=(await call('/publications?userId='+a.user.id,a.token)).total;
    await call('/ratings',a.token,'POST',{animeId:'mal:4',rating:4},randomUUID());
    assert.equal((await call('/publications?userId='+a.user.id,a.token)).total,postsBefore);
    await call('/posts',a.token,'POST',{text:'Conversación sin valoración #charla',animeIds:[]},randomUUID());
    assert.equal((await call('/me/aura',a.token)).statistics.watched,2);
    assert.equal((await call('/search?type=publications&q=%23charla',b.token)).total,1);
    await call('/me/missions/primera/claim',a.token,'PUT');
    await call('/me/missions/primera/claim',a.token,'PUT');
    assert.equal((await call('/me/aura',a.token)).rewards.length,1);
    assert.ok((await call('/ranking',a.token)).me.position);
    await f.restart();
    assert.equal((await call('/auth/me',a.token)).user.id,a.user.id);
    assert.equal((await call('/publications/'+first.id,b.token)).publication.commentCount,1);
    assert.equal(await call('/auth/logout',a.token,'POST'),undefined);
    await assert.rejects(call('/auth/me',a.token),error=>error.status===401);
    assert.equal((await call('/auth/me',b.token)).user.id,b.user.id);
  } finally {global.fetch=realFetch;await f.close();process.chdir(cwd);}
});

