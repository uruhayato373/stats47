#!/usr/bin/env tsx
/** Rebuild only referenced figures from each article's fixed chart-data.json; never fetch latest values or rewrite prose.
 * node --import tsx .claude/scripts/note/reference/render-reference-figures.ts --keys key1,key2 [--output-dir .local/<review>]
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { renderSavedReferenceFigure, writeReferenceFigure, type ReferenceFigureData } from './lib/figure-files';
const ROOT=path.resolve(__dirname,'../../../..');
const option=(name:string)=>{const index=process.argv.indexOf(name);return index<0?undefined:process.argv[index+1];};
const keys=option('--keys')?.split(',');
if(!keys?.length||keys.some(key=>!/^b-ref-[a-z0-9-]+$/.test(key)))throw Error('--keys b-ref-... is required');
const output=option('--output-dir');
async function main() {
  for(const key of keys!) {
    const directory=path.join(ROOT,'docs/31_note記事原稿',key);
    const draft=readFileSync(path.join(directory,'draft.md'),'utf8');
    const data:ReferenceFigureData=JSON.parse(readFileSync(path.join(directory,'chart-data.json'),'utf8'));
    const filenames=[...draft.matchAll(/!\[[^\]]*\]\(images\/([a-z0-9-]+\.png)\)/g)].map(match=>match[1]);
    if(new Set(filenames).size!==filenames.length)throw Error(`Repeated image reference: ${key}`);
    const target=output?path.resolve(ROOT,output,key,'images'):path.join(directory,'images');
    if(!target.startsWith(ROOT+path.sep))throw Error('Output outside project');
    mkdirSync(target,{recursive:true});
    for(const filename of filenames) {
      if(!existsSync(path.join(directory,'images',filename)))throw Error(`Missing original: ${key}/${filename}`);
      const result=await writeReferenceFigure(path.join(target,filename.replace(/\.png$/,'.svg')),path.join(target,filename),renderSavedReferenceFigure(data,filename));
      console.log(JSON.stringify({key,file:filename,...result}));
    }
    if(!filenames.length)console.log(JSON.stringify({key,figures:0}));
  }
}
main().catch((error:unknown)=>{console.error(error instanceof Error?error.message:String(error));process.exitCode=1;});
