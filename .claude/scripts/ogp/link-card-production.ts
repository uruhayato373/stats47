/** Resumable external-card production. Image generation remains an explicit built-in tool call. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import type {ImageGenerationPublishPlan} from '@stats47/types';
import { LINK_CARD_DESIGN, MAGAZINE_CARD_DESIGNS, magazineCardPrompt } from '../../../apps/web/scripts/data/link-card-design';
import site from '../lib/site-config.cjs';
import {datasetDir,datasetPath} from '../../../config/datasets.mjs';

interface StoredImage {key:string;sha256:string;bytes:number}
interface Candidate {source:string;sourceSha256:string;file:string;sha256:string;input:string}
interface Publication {
  status:string;
  after:{cover:string;name:string;description:string};
  ogImage?:{url:string;originalUrl:string;sha256:string;width:number;height:number;meanDifference32:number;localFile:string;checkedAt:string};
  visualReview?:unknown;
}
interface Entry {
  id:string;key:string;kind:string;name?:string;pageUrl:string|null;priority:number;status:string;
  promptSha256?:string;candidate?:Candidate;
  revision?:{source:StoredImage;image:StoredImage;input:StoredImage;review:StoredImage};
  publication?:Publication;
  sitePublication?:{manifestKey:string;fingerprint:string;manifestSha256:string;imageKey:string;sha256:string;url:string;verifiedAt:string;runUrl:string};
}
interface Ledger {schemaVersion:number;policyVersion:string;updatedAt?:string;entries:Entry[];siteInventory?:unknown}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const ledgerFile = path.join(root, datasetDir('ogp.inventory'),'link-card-rollout.json');
const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex');
const read = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));
function save(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(`${file}.pending`, JSON.stringify(value, null, 2)+'\n');
  fs.renameSync(`${file}.pending`, file);
}
const args = process.argv.slice(2);
const value = (flag: string) => args[args.indexOf(flag)+1];
const required = (flag: string) => { if (!args.includes(flag) || !value(flag) || value(flag).startsWith('--')) throw Error(`${flag} required`); return value(flag); };
const command = args[0];
const ledger:Ledger = fs.existsSync(ledgerFile) ? read(ledgerFile) : {schemaVersion:1, policyVersion:LINK_CARD_DESIGN.version, entries:[]};
if(ledger.schemaVersion!==1||!Array.isArray(ledger.entries)||ledger.entries.some(e=>!e.id||!e.key||!e.status)||new Set(ledger.entries.map(e=>e.id)).size!==ledger.entries.length)throw Error('Invalid/duplicate rollout ledger');
if (ledger.policyVersion !== LINK_CARD_DESIGN.version) throw Error('Policy version changed; explicit migration required');
function storeLedger() { ledger.updatedAt=new Date().toISOString(); save(ledgerFile,ledger); }
function target(id: string) { const entry=ledger.entries.find((v:Entry)=>v.id===id); if(!entry)throw Error(`Unknown target ${id}`); return entry; }
function summary() { const counts:Record<string,number>={}; for(const e of ledger.entries)counts[e.status]=(counts[e.status]??0)+1; console.log(JSON.stringify({targets:ledger.entries.length,counts})); }

async function main() {
  const { createR2Store, fetchPublicMediaSource } = await import('../note/lib/cover-storage.mjs');
  if (command==='sync') {
    const magazines=read(path.join(root,datasetPath('note.magazines'))).magazines;
    for(const m of magazines) {
      if(!MAGAZINE_CARD_DESIGNS[m.key])throw Error(`Unmapped magazine ${m.key}`);
      const id=`magazine:${m.key}`;
      const old=ledger.entries.find((e:Entry)=>e.id===id);
      const prompt=magazineCardPrompt(m.key), promptSha256=hash(prompt);
      if(old && old.promptSha256!==promptSha256 && old.revision)throw Error(`Reviewed prompt changed: ${id}`);
      if(!old)ledger.entries.push({id,key:m.key,kind:'magazine',name:m.name,pageUrl:m.noteUrl,priority:m.key==='s47-climate'?0:10,status:m.noteUrl?'generation-pending':'not-published',promptSha256});
    }
    if(args.includes('--site')) {
      // All sitemap shards must succeed: never save a partial target inventory.
      const xml=(await fetchPublicMediaSource(`${site.SITE_ORIGIN}/sitemap.xml`)).toString('utf8');
      const locs=(text:string)=>[...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
      const pages:string[]=[];
      for(const shard of locs(xml)) {
        if(new URL(shard).origin!==site.SITE_ORIGIN)throw Error('Unexpected sitemap origin');
        pages.push(...locs((await fetchPublicMediaSource(shard)).toString('utf8')));
      }
      if(!pages.length)throw Error('Empty sitemap');
      const blogIndex=JSON.parse((await fetchPublicMediaSource(`${site.R2_PUBLIC_BASE_URL}/app/blog/all.json`)).toString('utf8'));
      const blogPages=blogIndex.articles.filter((a:{published?:boolean})=>a.published!==false).map((a:{slug:string})=>`${site.SITE_ORIGIN}/blog/${a.slug}`);
      const eligible=[...new Set([...blogPages,...pages])].filter(p=>/^\/(ranking|blog|themes|category|areas|products)\/[^/]+\/?$/.test(new URL(p).pathname));
      for(const pageUrl of [...new Set([site.SITE_ORIGIN,...eligible])].sort()) {
        const pathname=new URL(pageUrl).pathname.replace(/\/$/,'');
        const id=`site:${pathname||'/'}`;
        if(!ledger.entries.some((e:Entry)=>e.id===id)) ledger.entries.push({id,key:pathname.split('/').at(-1)||'home',kind:'site-ogp',pageUrl,priority:/sunshine/.test(pathname)?1:100,status:'input-pending'});
      }
      ledger.siteInventory={observedAt:new Date().toISOString(),source:`${site.SITE_ORIGIN}/sitemap.xml`,sitemapPages:pages.length,eligiblePages:eligible.length+1,complete:true};
    }
    storeLedger(); summary(); return;
  }
  if(command==='export') {
    const out=path.resolve(required('--out')); fs.mkdirSync(out,{recursive:true});
    const limit=Number(args.includes('--limit')?value('--limit'):5);
    if(!Number.isInteger(limit)||limit<1||limit>20)throw Error('limit must be 1..20');
    const selected=ledger.entries.filter((e:Entry)=>e.status==='generation-pending' && (!args.includes('--key')||e.key===value('--key'))).sort((a:Entry,b:Entry)=>a.priority-b.priority||a.id.localeCompare(b.id)).slice(0,limit);
    for(const e of selected) {
      const prompt=magazineCardPrompt(e.key);
      if(hash(prompt)!==e.promptSha256)throw Error('Prompt drift; sync first');
      save(path.join(out,`${e.key}.request.json`),{id:e.id,policyVersion:LINK_CARD_DESIGN.version,prompt,promptSha256:e.promptSha256,reference:{url:LINK_CARD_DESIGN.referenceUrl,sha256:LINK_CARD_DESIGN.referenceSha256},copy:MAGAZINE_CARD_DESIGNS[e.key],width:1200,height:630});
    }
    console.log(JSON.stringify(selected.map((e:Entry)=>({id:e.id,request:path.join(out,`${e.key}.request.json`)})))); return;
  }
  if(command==='ingest') {
    const request=read(required('--request')),e=target(request.id);
    if(!['generation-pending','review-pending'].includes(e.status))throw Error('Already reviewed/published or unavailable; do not regenerate');
    if(request.promptSha256!==e.promptSha256||hash(request.prompt)!==e.promptSha256)throw Error('Request hash mismatch');
    const source=path.resolve(required('--source')),out=path.resolve(required('--out'));
    fs.mkdirSync(out,{recursive:true});
    const sourceBytes=fs.readFileSync(source), sourceSha256=hash(sourceBytes);
    const metadata=await sharp(sourceBytes).metadata();
    if(!metadata.width||!metadata.height||Math.abs(metadata.width/metadata.height-1200/630)>0.06)throw Error('Source ratio is not 1.91:1');
    const normalized=await sharp(sourceBytes).resize(1200,630,{fit:'cover',position:'centre'}).png().toBuffer();
    const file=path.join(out,`${e.key}.png`); fs.writeFileSync(file,normalized);
    for(const [suffix,width,height] of [['note',220,150],['square',150,150],['mobile',320,168]] as const)
      await sharp(normalized).resize(width,height,{fit:'cover',position:'centre'}).png().toFile(path.join(out,`${e.key}-${suffix}.png`));
    const generation=read(required('--generation'));
    if(!generation.prompt || !Array.isArray(generation.references))throw Error('Actual generation prompt and reference hashes required');
    for(const ref of generation.references) {
      const sha256=hash(fs.readFileSync(ref.path));
      if(ref.sha256 && ref.sha256!==sha256)throw Error('Generation reference hash mismatch');
      ref.sha256=sha256;
    }
    save(path.join(out,`${e.key}.input.json`),{...request,generator:'codex-built-in-imagegen',generation,sourceSha256});
    e.status='review-pending';e.candidate={source,sourceSha256,file,sha256:hash(normalized),input:path.join(out,`${e.key}.input.json`)};storeLedger(); console.log(JSON.stringify({id:e.id,...e.candidate}));return;
  }
  if(command==='review') {
    const e=target(required('--id')),review=read(required('--review'));
    if(e.status!=='review-pending'||!e.candidate)throw Error('No candidate to review');
    if(review.sha256!==e.candidate.sha256||hash(fs.readFileSync(e.candidate.file))!==review.sha256)throw Error('Review SHA mismatch');
    for(const key of ['fullSize','note220x150','square150x150','mobile320','exactCopy','contrast','noInventedData'])if(review.checks?.[key]!==true)throw Error(`Missing visual check: ${key}`);
    if(!review.reviewer||!review.observedAt)throw Error('Reviewer and time required');
    const privateStore=createR2Store({bucket:site.R2_PRIVATE_BUCKET,writeOnce:true});
    const archive=async(bytes:Buffer,extension:string)=>{
      const sha256=hash(bytes),key=`media/link-cards/${LINK_CARD_DESIGN.version}/${sha256}.${extension}`;
      const previous=await privateStore.get(key);if(previous&&hash(previous)!==sha256)throw Error('Immutable archive conflict');
      if(!previous)await privateStore.put(key,bytes);
      const verified=await privateStore.get(key);if(!verified||hash(verified)!==sha256)throw Error('Archive read-back failed');
      return {key,sha256,bytes:bytes.length};
    };
    const input=read(e.candidate.input);
    for(const ref of input.generation.references) {
      const bytes=fs.readFileSync(ref.path);
      if(ref.sha256&&hash(bytes)!==ref.sha256)throw Error('Reference changed before archival');
      ref.archive=await archive(bytes,'png');ref.sha256=ref.archive.sha256;
    }
    e.revision={source:await archive(fs.readFileSync(e.candidate.source),'png'),image:await archive(fs.readFileSync(e.candidate.file),'png'),input:await archive(Buffer.from(JSON.stringify(input)),'json'),review:await archive(Buffer.from(JSON.stringify(review)),'json')};
    e.status='reviewed';storeLedger();summary();return;
  }

  if(command==='restore') {
    const e=target(required('--id')),out=path.resolve(required('--out'));
    if(!e.revision)throw Error('No archived revision');
    const privateStore=createR2Store({bucket:site.R2_PRIVATE_BUCKET,writeOnce:true});
    fs.mkdirSync(out,{recursive:true});
    const restored:Record<string,string>={};
    for(const [role,ref] of Object.entries(e.revision)){
      const bytes=await privateStore.get(ref.key);
      if(!bytes||hash(bytes)!==ref.sha256)throw Error('Archive integrity failure');
      const file=path.join(out,e.key+'-'+role+(role==='input'||role==='review'?'.json':'.png'));
      fs.writeFileSync(file,bytes);restored[role]=file;
    }
    e.candidate={source:restored.source,sourceSha256:e.revision.source.sha256,file:restored.image,sha256:e.revision.image.sha256,input:restored.input};
    storeLedger();summary();return;
  }
  if(command==='record-site') {
    const plan=read(required('--plan')) as ImageGenerationPublishPlan;
    const runUrl=required('--run-url');
    if(plan.kind!=='stats47-image-publish-plan'||plan.schemaVersion!==1||!Array.isArray(plan.items)||!/^https:\/\/github.com\/uruhayato373\/stats47\/actions\/runs\/\d+$/.test(runUrl))throw Error('Invalid publication evidence');
    let nextItem=0;
    async function verifyNext(){
    while(nextItem<plan.items.length){
      const item=plan.items[nextItem++];
      const asset=item.assets.find(a=>a.variant==='ogp');
      if(!asset||!/^app\/(ranking|blog|areas|products|themes|default)\/[a-z0-9-]+\/ogp\/ogp.png$/.test(asset.key))throw Error('Unexpected OGP key');
      const manifestBytes=await fetchPublicMediaSource(`${site.R2_PUBLIC_BASE_URL}/${item.manifestKey}?v=${item.manifestSha256}`);
      if(hash(manifestBytes)!==item.manifestSha256)throw Error('Published manifest SHA mismatch');
      const imageBytes=await fetchPublicMediaSource(`${site.R2_PUBLIC_BASE_URL}/${asset.key}?v=${asset.sha256}`);
      if(hash(imageBytes)!==asset.sha256)throw Error('Published image SHA mismatch');
      const dimensions=await sharp(imageBytes).metadata();
      if(dimensions.width!==1200||dimensions.height!==630)throw Error('Published OGP dimensions changed');
      const [,kind,key]=asset.key.split('/');
      const ids=kind==='default'?ledger.entries.filter(e=>e.id==='site:/'||e.id.startsWith('site:/category/')).map(e=>e.id):[`site:/${kind}/${key}`];
      if(!ids.length)throw Error('No matching site target');
      for(const id of ids){const e=target(id);e.sitePublication={manifestKey:item.manifestKey,fingerprint:item.fingerprint,manifestSha256:item.manifestSha256,imageKey:asset.key,sha256:asset.sha256,url:`${site.R2_PUBLIC_BASE_URL}/${asset.key}`,verifiedAt:new Date().toISOString(),runUrl};e.status='published';}
      storeLedger();console.log(`${asset.key}: public bytes verified`);
    }
    }
    const results=await Promise.allSettled(Array.from({length:Math.min(6,plan.items.length)},verifyNext));
    const failure=results.find((result):result is PromiseRejectedResult=>result.status==='rejected');
    if(failure)throw failure.reason;
    summary();return;
  }
  if(command==='status'){summary();return;}

  if(command==='verify-live') {
    const {launchContext}=await import('../note/lib/note-session.mjs');
    const {fetchCoverSource}=await import('../note/lib/cover-storage.mjs');
    const ctx=await launchContext({headless:true});
    try {
      const page=ctx.pages()[0]||await ctx.newPage();
      for(const e of ledger.entries.filter((e:Entry)=>e.status==='published-pending-visual')) {
        if(!e.pageUrl||!e.publication?.after?.cover||!e.candidate)throw Error('Incomplete publication record');
        await page.goto(e.pageUrl,{waitUntil:'domcontentloaded',timeout:30000});
        const url=await page.locator('meta[property="og:image"]').getAttribute('content');
        if(!url)throw Error(`No live og:image for ${e.id}`);
        const publicUrl=new URL(url);
        const expectedId=new URL(e.publication.after.cover).pathname.split('/').at(-2);
        if(!publicUrl.pathname.includes(`/images/${expectedId}/`))throw Error('Live og:image points to a different upload');
        // note keeps an original wide image as well as a separate square magazine_cover_large.
        publicUrl.search='';const bytes=await fetchCoverSource(publicUrl.toString());
        const meta=await sharp(bytes).metadata();
        if(!meta.width||!meta.height||Math.abs(meta.width/meta.height-1200/630)>0.02)throw Error('Published wide image aspect changed');
        const expected=await sharp(e.candidate.file).resize(32,17).removeAlpha().raw().toBuffer();
        const actual=await sharp(bytes).resize(32,17).removeAlpha().raw().toBuffer();
        const meanDifference=actual.reduce((sum:number,v:number,i:number)=>sum+Math.abs(v-expected[i]),0)/actual.length;
        // Coarse identity check only, not a text/readability guarantee. note quantizes and crops 2px.
        if(meanDifference>8)throw Error(`Published image differs from reviewed candidate: ${e.id}`);
        const liveFile=path.join(path.dirname(e.candidate.file),`${e.key}-live.png`);fs.writeFileSync(liveFile,bytes);
        e.publication.ogImage={url,originalUrl:publicUrl.toString(),sha256:hash(bytes),width:meta.width,height:meta.height,meanDifference32:meanDifference,localFile:liveFile,checkedAt:new Date().toISOString()};
        e.publication.status='delivery-verified-awaiting-visual';storeLedger();console.log(`${e.key}: public wide og:image verified, visual confirmation pending`);
      }
    } finally {await ctx.close();}
    return;
  }
  if(command==='confirm-live') {
    const review=read(required('--review'));
    if(!review.reviewer||!Number.isFinite(Date.parse(review.observedAt))||!Array.isArray(review.entries)||!review.entries.length||new Set(review.entries.map((item:{id:string})=>item.id)).size!==review.entries.length)throw Error('Invalid live review');
    for(const item of review.entries) {
      const e=target(item.id);
      if(e.status!=='published-pending-visual'||e.publication?.ogImage?.sha256!==item.sha256||item.wideReadable!==true||item.squareReadable!==true)throw Error('Live visual review missing/mismatched');
      if(!e.publication)throw Error('Publication missing');
      e.publication.visualReview={...item,reviewer:review.reviewer,observedAt:review.observedAt};
      e.publication.status='verified';e.status='published';
    }
    storeLedger();
    for(const item of review.entries){const e=target(item.id);save(path.join(root,datasetDir('note.operation-evidence'),`note-magazine-cover-${e.key}.json`),e.publication);}
    summary();return;
  }
  throw Error('Use sync [--site], export --out [--limit 5], ingest --request --source --out --generation, review --id --review, restore --id --out, verify-live, confirm-live --review, record-site --plan --run-url, status');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
