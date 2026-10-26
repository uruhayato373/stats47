/** Change external OGP only; retain verified thumbnail/background bytes in the exact bundle. */
import {writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {SITE,type ImageGenerationManifest} from '@stats47/types';
import {blogRendererSources} from './data/image-generator-registry';
import {blogImageKeys,createBlogImagePlan,publishedBlogSlugsFromIndex,stageBlogImagePath,type BlogImageMetadata,type BlogBackgroundInput} from './lib/blog-image-generation';
import {buildBlogOgpElement,deriveOgpFromFrontmatter,parseFrontmatter,loadFonts,renderToPng} from './lib/blog-thumbnail-render';
import {buildImageGenerationManifest,calculateRendererHash,createImageGenerationPublishPlan,isManifest,serializeImageGenerationManifest,sha256} from './lib/image-generation-manifest';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const base=process.env.R2_PUBLIC_FETCH_URL??SITE.r2PublicBaseUrl;
const args=process.argv.slice(2);
const arg=(name:string)=>args.includes(name)?args[args.indexOf(name)+1]:undefined;
const limit=Number(arg('--limit')??500);
const maxGenerate=Number(arg('--max-generate')??500);
if(!Number.isInteger(maxGenerate)||maxGenerate<1||maxGenerate>500)throw Error('max-generate must be 1..500');
if(!Number.isInteger(limit)||limit<1||limit>maxGenerate)throw Error(`limit must be 1..${maxGenerate}`);
async function get(key:string){
  for(let attempt=0;attempt<3;attempt++){
    try{
      const response=await fetch(`${base}/${key}`,{cache:'no-store',signal:AbortSignal.timeout(30000)});
      if(!response.ok){
        if(response.status>=500||response.status===429)throw Error(`temporary HTTP ${response.status}`);
        throw Object.assign(Error(`${key}: HTTP ${response.status}`),{permanent:true});
      }
      return Buffer.from(await response.arrayBuffer());
    }catch(error){
      if(attempt===2||(error as {permanent?:boolean}).permanent)throw error;
      await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
    }
  }
  throw Error('Unreachable');
}
async function main(){
  const known=publishedBlogSlugsFromIndex(JSON.parse((await get('app/blog/all.json')).toString()));
  const selected=arg('--slug')?.split(',')??known;
  if(selected.some(slug=>!known.includes(slug)))throw Error('Unknown published blog slug');
  const fonts=loadFonts(root),rendererHash=calculateRendererHash(root,blogRendererSources('ai'));
  const items:Parameters<typeof createImageGenerationPublishPlan>[0]['items']=[];
  let current=0;
  for(const slug of selected){
    const keys=blogImageKeys(slug),oldBytes=await get(keys.manifest);
    const raw:unknown=JSON.parse(oldBytes.toString());
    if(!isManifest(raw)||raw.generator!=='blog-ogp'||raw.entityId!==slug)throw Error(`${slug}: invalid existing manifest`);
    const old=raw as ImageGenerationManifest<BlogImageMetadata>;
    const bg=old.metadata.background;
    if(bg?.source!=='ai'||!bg.sha256||!bg.promptHash)throw Error(`${slug}: verified AI background metadata required`);
    const background:BlogBackgroundInput={source:'ai',sha256:bg.sha256,promptHash:bg.promptHash};
    const derived=deriveOgpFromFrontmatter(parseFrontmatter((await get(`app/blog/${slug}/article.md`)).toString()));
    if(!derived)throw Error(`${slug}: missing title`);
    const data={title:derived.title,subtitle:derived.subtitle??null};
    const plan=createBlogImagePlan({slug,data,background,rendererHash});
    if(old.fingerprint===plan.fingerprint){current++;continue;}
    const assetFiles=new Map<string,string>();
    for(const asset of plan.assets){
      const file=stageBlogImagePath(root,plan,asset.key);
      if(asset.variant==='ogp')await renderToPng(buildBlogOgpElement(data),fonts,file);
      else {
        const previous=old.assets.find(a=>a.key===asset.key);
        if(!previous)throw Error(`${slug}: missing preserved asset ${asset.key}`);
        const bytes=await get(asset.key);
        if(sha256(bytes)!==previous.sha256)throw Error(`${slug}: preserved asset SHA mismatch`);
        writeFileSync(file,bytes);
      }
      assetFiles.set(asset.key,file);
    }
    const manifest=buildImageGenerationManifest({plan,assetFiles,metadata:{...old.metadata,...data}});
    for(const asset of manifest.assets.filter(a=>a.variant!=='ogp'))if(asset.sha256!==old.assets.find(a=>a.key===asset.key)?.sha256)throw Error('Internal asset changed');
    writeFileSync(stageBlogImagePath(root,plan,keys.manifest),serializeImageGenerationManifest(manifest));
    items.push({plan,manifest,expectedRemoteFingerprint:old.fingerprint,expectedRemoteManifestSha256:sha256(oldBytes)});
    console.log(`${slug}: external OGP rendered; thumbnail/background SHA unchanged`);
    if(items.length>=limit)break;
  }
  const plan=createImageGenerationPublishPlan({generator:'blog-ogp',stageRoot:'.local/image-staging/blog',items});
  mkdirSync(join(root,'.local'),{recursive:true});
  writeFileSync(join(root,'.local/image-generation-publish-plan-blog.json'),JSON.stringify(plan,null,2)+'\n');
  console.log(JSON.stringify({selected:selected.length,generated:items.length,current}));
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
