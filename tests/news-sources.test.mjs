import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES, classifyArticle } from '../src/data/article-topics.mjs';
import { canonicalUrlKey, normalizeSnapshot, makeArticle, selectArticles, validateSnapshot, emptySnapshot } from '../src/data/hacker-news.mjs';
import { parseInfoq, collectInfoq, INFOQ_FEEDS } from '../scripts/infoq.mjs';
import { collectDevto, DEV_TAGS } from '../scripts/devto.mjs';
import { requestText } from '../scripts/news-http.mjs';
import { collectArticles, refreshHackerNews } from '../scripts/update-hacker-news.mjs';
const date='2026-10-10T12:00:00.000Z',clock=Date.parse(date)/1000;
const article=(source,id,url=`https://example.com/${source}/${id}`,eventAt=date)=>makeArticle({source,sourceId:String(id),title:'LLM agent harness',url,eventAt},clock);
const rss=(item='',extras='')=>`<?xml version="1.0"?><rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel>${extras}${item}</channel></rss>`;
const item=(title='AI &amp; agents &#x1F916;',extra='')=>`<item><title>${title}</title><link>https://www.infoq.com/news/ai?utm_source=rss#section</link><pubDate>Sat, 10 Oct 2026 12:00:00 GMT</pubDate><guid>stable-guid</guid><category>ai</category>${extra}</item>`;

test('six editorial primaries and separate bounded evidence tags', () => {
 assert.deepEqual(CATEGORIES, ['AI Engineering','Software Architecture','Web Development','Automation Integrations','Cloud DevOps','Security']);
 assert.equal(classifyArticle('LLM agent harness').primaryCategory, 'AI Engineering');
 assert.deepEqual(classifyArticle('LLM agent harness').tags, ['AI','Harnesses','Agents']);
 assert.equal(classifyArticle('Release notes','https://ai.example.com/', ['webdev']).primaryCategory,'Web Development');
 assert.equal(classifyArticle('A chair in the rain','https://ai.example.com/?q=security'),null);
 for(const [title,expected] of [['Distributed systems design','Software Architecture'],['React 19 web components','Web Development'],['n8n OAuth workflow automation','Automation Integrations'],['Terraform CI/CD deployment','Cloud DevOps'],['API security audit','Security']])assert.equal(classifyArticle(title).primaryCategory,expected);
 assert.equal(classifyArticle('Release notes','https://example.com/', ['architecture']).primaryCategory,'Software Architecture');
 assert.equal(classifyArticle('OAuth for web development').primaryCategory,'Automation Integrations');
 assert.ok(classifyArticle('AI harness software architecture JavaScript OAuth Kubernetes security').categories.length<=5);
});
test('tracking comparison preserves destinations and schema2 migrates honestly', () => {
 assert.equal(canonicalUrlKey('https://example.com/a?utm_source=x&x=1#hi'), 'https://example.com/a?x=1');
 const date='2026-10-10T12:00:00.000Z';
 const old={schemaVersion:2,updatedAt:date,articles:[{id:1,title:'LLM agent harness',url:'https://example.com/a#hi',time:Date.parse(date)/1000,submittedAt:date}]};
 const migrated=normalizeSnapshot(old);
 assert.equal(migrated.schemaVersion,4); assert.equal(migrated.articles[0].id,'hn:1');
 assert.equal(migrated.articles[0].dateKind,'submitted'); assert.equal('publishedAt' in migrated.articles[0],false);
 const dropped=normalizeSnapshot({...old,articles:[...old.articles,...old.articles,{...old.articles[0],id:2,title:'Rain clouds',url:'https://example.com/rain'}]});
 assert.equal(dropped.articles.length,1);assert.equal(dropped.articles[0].url,'https://example.com/a#hi');
});

test('source title and evidence caps reject overlong shapes',()=>{
 const base={source:'devto',sourceId:'1',url:'https://example.com/',eventAt:date,title:'AI '+ 'x'.repeat(997)};
 assert.equal(makeArticle(base,clock).title.length,1000);
 assert.throws(()=>makeArticle({...base,title:base.title+'x'},clock));
 assert.throws(()=>makeArticle({...base,sourceTags:Array(51).fill('ai')},clock));
 assert.throws(()=>makeArticle({...base,source:'hn',sourceTags:['ai']},clock));
});

test('RSS2 safe decoding, CDATA, stable GUID/hash, dates and fixed feeds',async()=>{
 const parsed=parseInfoq(rss(item()),clock);assert.equal(parsed[0].title,'AI & agents 🤖');assert.equal(parsed[0].id,'infoq:stable-guid');assert.equal(parsed[0].dateKind,'published');assert.equal('submittedAt' in parsed[0],false);
 assert.equal(parseInfoq(rss(item('<![CDATA[AI &custom; &#65;]]>')),clock)[0].title,'AI &custom; &#65;');
 assert.equal(parseInfoq(rss(item('AI &#65; &#x42; &lt; &gt; &quot; &apos;')),clock)[0].title,`AI A B < > " '`);
 assert.equal(parseInfoq(rss(item('AI','<dc:date>2026-10-10T12:00:00Z</dc:date>')),clock).length,1);
 const hashed=rss(item().replace('<guid>stable-guid</guid>',''));assert.equal(parseInfoq(hashed,clock)[0].id,parseInfoq(hashed.replace('#section','#other'),clock)[0].id);
 const seen=[];await collectInfoq({fetchImpl:async url=>{seen.push(url);return new Response(rss());}},clock);assert.deepEqual(seen,INFOQ_FEEDS);
});
test('hostile XML, duplicate structure, dates, depth, item, text and byte caps fail closed',()=>{
 const hostile=[rss(item('&custom;')),rss(item('AI &#0;')),rss(item('AI &bare')),rss(item('AI','<dc:date>2026-10-10T11:00:00Z</dc:date>')),rss(item('AI','<title>AI duplicate</title>')),rss(item()).replace('</channel>','</channel><channel/>'),'<rss><channel><item></channel></rss>',rss(item()).replace('<rss ','<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///forbidden">]><rss '),rss(item()).replace('<rss ','<!ENTITY x "AI"><rss '),rss('<nested>'.repeat(25)+'</nested>'.repeat(25)),rss(item().repeat(501)),rss(item('AI '+ 'x'.repeat(65536))),rss('x'.repeat(1024*1024)),rss('<item><title>AI</title></item>'),rss(item('AI','<link>https://example.com/duplicate</link>')),rss(item()).replace('version="2.0"','version="1.0"'),rss(item('AI','<dc:date>Sat, 10 Oct 2026 12:00:00 GMT</dc:date>')),rss(item()).replace('</item>','</itemx>')];
 for(const xml of hostile)assert.throws(()=>parseInfoq(xml,clock));
});
test('DEV bounded pagination, nonchronological dates, safe canonical publisher and source tags',async()=>{
 const row={id:1,title:'Release notes',url:'https://dev.to/author/release-notes-123',canonical_url:'https://publisher.example/a?utm_source=dev#x',published_at:'2026-10-10T11:59:59.123Z',tag_list:['webdev']};let calls=0;
 const rows=await collectDevto({fetchImpl:async(url,options)=>{calls++;const u=new URL(url);assert.equal(u.hostname,'dev.to');assert.equal(u.searchParams.get('per_page'),'100');assert.equal(u.searchParams.get('top'),'7');assert.equal(options.headers.Accept,'application/vnd.forem.api-v1+json');return new Response(JSON.stringify([ {...row,id:2,published_at:'2026-01-01T00:00:00Z'},row,{...row,id:3,published_at:'2027-01-01T00:00:00Z'}]));}},clock);
 assert.equal(calls,DEV_TAGS.length);assert.equal(rows.length,DEV_TAGS.length);assert.equal(rows[0].url,row.canonical_url);assert.equal(rows[0].eventAt,row.published_at);assert.equal(rows[0].primaryCategory,'Web Development');
 let pages=0;await collectDevto({fetchImpl:async(url)=>{const u=new URL(url);assert.equal(u.searchParams.get('top'),'7');assert.equal(u.searchParams.get('page'),String(pages%2+1));assert.equal(u.searchParams.get('tag'),DEV_TAGS[Math.floor(pages/2)]);pages++;return new Response(JSON.stringify(Array(100).fill(row)));}},clock);assert.equal(pages,DEV_TAGS.length*2);
 await assert.rejects(collectDevto({fetchImpl:async()=>new Response('{}')},clock));
 const fallback=await collectDevto({fetchImpl:async()=>new Response(JSON.stringify([{...row,canonical_url:'https://user:pass@example.com/'}]))},clock);assert.equal(fallback[0].url,row.url);
 const noBodyEvidence=await collectDevto({fetchImpl:async()=>new Response(JSON.stringify([{...row,canonical_url:null,tag_list:[],description:'AI harness',body_markdown:'Kubernetes security'}]))},clock);assert.equal(noBodyEvidence.length,0);
 await assert.rejects(collectDevto({fetchImpl:async()=>new Response(JSON.stringify([{...row,published_at:'0'}]))},clock));
});
test('DEV canonical destinations require article eligibility and a recognized post fallback', async()=>{
 const row={id:1,title:'Show HN: AI coding tool',url:'https://dev.to/author/ai-coding-tool-123',canonical_url:'https://github.com/a/tool',published_at:date,tag_list:['ai']};
 const collect=patch=>collectDevto({fetchImpl:async()=>new Response(JSON.stringify([{...row,...patch}]))},clock);
 for(const canonical_url of ['https://github.com/a/tool','https://huggingface.co/spaces/a/tool','https://a.github.io/tool/']) {
   assert.equal((await collect({canonical_url}))[0].url,row.url);
 }
 const original='https://publisher.example/blog/tool?utm_source=dev#details';
 assert.equal((await collect({canonical_url:original}))[0].url,original);
 for(const url of ['https://dev.to/author','https://dev.to/','https://dev.to/t/ai','https://dev.to/author/post/extra','https://dev.to.evil.example/author/post','https://unknown.example/author/post']) {
   assert.equal((await collect({url})).length,0,url);
 }
 assert.equal((await collect({url:'https://dev.to/author',canonical_url:'https://dev.to/author'})).length,0);
});

test('global newest selection no quotas, namespaced ties and cross-source tracking dedup',async()=>{
 const providers={hn:async()=>[article('hn',1,'https://example.com/same?utm_source=hn#x')],devto:async()=>[article('devto',1,'https://example.com/same?gclid=x#y'),...Array.from({length:12},(_,i)=>article('devto',i+2))],infoq:async()=>[article('infoq',1)]};
 const rows=await collectArticles({now:date,providers});assert.equal(rows.length,14);assert.deepEqual(new Set(rows.map(a=>a.source)),new Set(['devto','infoq']));assert.equal(rows.filter(a=>canonicalUrlKey(a.url)==='https://example.com/same').length,1);
 assert.equal(selectArticles([article('hn',1),article('devto',1),article('infoq',1)]).length,3);
 const precise=article('devto',42,undefined,'2026-10-10T11:59:59.123Z');assert.equal(precise.time,clock-0.877);
 const snapshot={...emptySnapshot(),updatedAt:date,articles:[precise]};assert.deepEqual(validateSnapshot(snapshot),snapshot);
 assert.throws(()=>validateSnapshot({...snapshot,articles:[{...precise,submittedAt:date}]}));
 const {id,...rest}=precise;assert.deepEqual(validateSnapshot({...snapshot,articles:[{...rest,id}]}),snapshot);
 assert.throws(()=>makeArticle({source:'hn',sourceId:'42',title:'AI',url:'https://example.com/',eventAt:precise.eventAt},clock));
});
test('all 35 mixed-source six-category candidates survive except canonical duplicates in schema4',async()=>{
 const titles=['LLM agent harness','Distributed systems design','JavaScript web development','n8n OAuth workflow automation','Terraform CI/CD deployment','API security audit'];
 const candidates=Array.from({length:35},(_,i)=>makeArticle({source:['hn','devto','infoq'][i%3],sourceId:String(i+1),title:titles[i%6],url:`https://publisher.example/posts/${i+1}?utm_source=original#details`,eventAt:new Date((clock-i)*1000).toISOString()},clock));
 candidates[34]={...candidates[34],url:candidates[0].url.replace('original','duplicate')};
 const providers=Object.fromEntries(['hn','devto','infoq'].map(source=>[source,async()=>candidates.filter(a=>a.source===source)]));
 const rows=await collectArticles({now:date,providers});
 assert.deepEqual(rows,candidates.slice(0,34));
 assert.deepEqual(await collectArticles({now:date,providers:Object.fromEntries(Object.entries(providers).map(([source,provider])=>[source,async()=> (await provider()).reverse()]))}),rows);
 assert.equal(new Set(rows.map(a=>a.source)).size,3);
 assert.equal(new Set(rows.map(a=>a.primaryCategory)).size,6);
 assert.ok(rows.filter(a=>a.source==='hn').length>10);
 const snapshot={...emptySnapshot(),updatedAt:date,articles:rows};
 assert.equal(snapshot.schemaVersion,4); assert.equal('maxArticles' in snapshot.selection,false);
 assert.deepEqual(validateSnapshot(snapshot),snapshot);
 assert.deepEqual(normalizeSnapshot(snapshot),snapshot);
 assert.throws(()=>validateSnapshot({...snapshot,selection:{...snapshot.selection,maxArticles:10}}));
 let stored;
 assert.deepEqual(await refreshHackerNews({now:()=>new Date(date),providers,fileSystem:{writeFile:async(_path,bytes)=>{stored=bytes;},rename:async()=>{}}}),snapshot);
 assert.deepEqual(JSON.parse(stored),snapshot);
});

test('all source failures preserve exact lastgood bytes, no leaked upstream messages',async()=>{
 for(const failed of ['hn','devto','infoq']){let writes=0;const fs={writeFile:async()=>{writes++;},rename:async()=>{writes++;}};const providers=Object.fromEntries(['hn','devto','infoq'].map(s=>[s,async()=>{if(s===failed)throw Error('secret upstream URL');return [];} ]));await assert.rejects(refreshHackerNews({now:()=>new Date(date),providers,fileSystem:fs}),new RegExp(`^Error: Source ${failed} failed$`));assert.equal(writes,0);}
 let stored;const snapshot=await refreshHackerNews({now:()=>new Date(date),providers:{hn:async()=>[],devto:async()=>[],infoq:async()=>[]},fileSystem:{writeFile:async(_p,b)=>{stored=b;},rename:async()=>{}}});assert.equal(snapshot.articles.length,0);assert.equal(JSON.parse(stored).schemaVersion,4);
});
test('stream byte cap, pinned hosts, permanent failures, retries and body timeout',async()=>{
 let reads=0;await assert.rejects(requestText('https://dev.to/api/articles',{attempts:3,maxBytes:3,fetchImpl:async()=>({ok:true,body:{getReader:()=>({read:async()=>{reads++;return {done:false,value:new Uint8Array(4)};},cancel:async()=>{}})}})}),/byte limit/);assert.equal(reads,1);
 await assert.rejects(requestText('https://example.com/',{fetchImpl:()=>assert.fail()}),/Unpinned/);
 let requests=0;await assert.rejects(requestText('https://dev.to/api/articles',{fetchImpl:async()=>{requests++;return {ok:false,status:404};}}),/404/);assert.equal(requests,1);
 requests=0;assert.equal(await requestText('https://dev.to/api/articles',{retryDelayMs:0,fetchImpl:async()=>{if(++requests<3)return {ok:false,status:503};return new Response('ok');}}),'ok');assert.equal(requests,3);
 let signal;await assert.rejects(requestText('https://dev.to/api/articles',{attempts:1,timeoutMs:5,fetchImpl:async(_u,o)=>{signal=o.signal;return {ok:true,body:{getReader:()=>({read:()=>new Promise(()=>{}),cancel:async()=>{}})}};}}),/timeout/);assert.equal(signal.aborted,true);
});
