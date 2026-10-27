import assert from 'node:assert/strict';
import test from 'node:test';
import { createCardImageRefresh } from '../lib/card-image-refresh.mjs';
import { cardEntries, registerMissingCards } from '../lib/native-cards.mjs';

const magazine='https://note.com/stats47/m/mabc';
const site='https://stats47.jp/ranking/sunshine';
const image='https://storage.stats47.jp/app/ranking/sunshine/ogp/ogp.png';
const cover='https://assets.st-note.com/production/uploads/images/123/new.png';
const rollout={siteMetadataVerification:{failed:0,passed:1,version:'20261026-pop'},entries:[
  {kind:'magazine',pageUrl:magazine,status:'published',publication:{ogImage:{originalUrl:cover,sha256:'a'.repeat(64)}}},
  {kind:'site',pageUrl:site,status:'published',sitePublication:{url:image,sha256:'b'.repeat(64)}},
]};
const refresh=createCardImageRefresh(rollout);
const native=(url)=>({html_for_embed:`<a class="external-article-widget-image" style="background-image:url('${url.replaceAll('&','&amp;')}')"></a>`});
const figure=(url,service='external-article')=>`<figure id="boundary" data-src="${url}" data-identifier="${url}" embedded-service="${service}" embedded-content-key="embOld"></figure>`;

test('metadata must be verified before card publication',()=>{
  assert.throws(()=>createCardImageRefresh({...rollout,siteMetadataVerification:null}),/Verify deployed/);
  assert.throws(()=>createCardImageRefresh({...rollout,siteMetadataVerification:{...rollout.siteMetadataVerification,failed:1}}),/Verify deployed/);
});
test('versioning preserves authored text, boundary, destination, tracking and fragment',()=>{
  const url=site+'?utm_source=note&utm_campaign=sunshine#results';
  const body='<p>Author text</p>'+figure(url.replaceAll('&','&amp;'))+'<p>Paid text</p>';
  const after=refresh.rewriteBody(body);const card=cardEntries(after)[0];const revised=new URL(card.url);
  assert.match(revised.searchParams.get('s47_ogp'),/^[a-f0-9]{12}$/);revised.searchParams.delete('s47_ogp');assert.equal(revised.href,url);
  assert.ok(after.startsWith('<p>Author text</p><figure id="boundary"'));assert.ok(after.endsWith('<p>Paid text</p>'));
  assert.equal(refresh.rewriteBody(after),after);
});
test('paid note cards and other sites are unchanged',()=>{
  const body=figure('https://note.com/stats47/n/n123','note')+figure('https://example.org/article');
  assert.equal(refresh.rewriteBody(body),body);
});
test('a new embed key with the old magazine cover must fail',()=>{
  assert.throws(()=>refresh.assertFresh(native('https://assets.st-note.com/old.png'),magazine),/stale/);
  assert.equal(refresh.assertFresh(native(cover+'?width=1024&format=jpeg'),magazine).imageUrl,cover+'?width=1024&format=jpeg');
});
test('site images require both the correct target and the deployed version',()=>{
  assert.throws(()=>refresh.assertFresh(native(image),site),/stale/);
  assert.throws(()=>refresh.assertFresh(native(image+'?v=old'),site),/stale/);
  assert.throws(()=>refresh.assertFresh(native(image.replace('sunshine','other')+'?v=20261026-pop'),site),/stale/);
  assert.ok(refresh.assertFresh(native(image+'?v=20261026-pop'),site));
});
test('shared site pages can use only a known verified image',()=>{
  assert.ok(refresh.assertFresh(native(image+'?v=20261026-pop'),'https://stats47.jp/other'));
  assert.throws(()=>refresh.assertFresh(native('https://example.org/old.png?v=20261026-pop'),'https://stats47.jp/other'),/stale/);
});
test('stale native metadata is rejected before accepting a registration',async()=>{
  const saved=[];const page={evaluate:async()=>({key:'embNew',...native('https://assets.st-note.com/old.png')})};
  await assert.rejects(registerMissingCards(page,'nf962c6702b93',figure(magazine),[],row=>saved.push(row),(entry,card)=>refresh.assertFresh(entry,card.url)),/stale/);
  assert.equal(saved.length,0);
});
