import { StringDecoder } from 'node:string_decoder';
import type { Readable } from 'node:stream';

/** Frame features from a verified source archive without materializing coordinate tokens. */
export async function readFeatureJson(source: Readable, visit: (json:string)=>void):Promise<number> {
  const decoder=new StringDecoder('utf8');let header='';let started=false;let finished=false;let depth=0;let quoted=false;let escaped=false;let parts:string[]=[];let count=0;
  for await(const chunk of source) {
    let text=decoder.write(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk));
    if(!started){header+=text;const match=/"features"\s*:\s*\[/.exec(header);if(!match){if(header.length>1_000_000)throw Error('Feature array header not found');continue;}text=header.slice(match.index+match[0].length);header='';started=true;}
    let segmentStart=depth>0?0:-1;
    for(let index=0;index<text.length;index++){
      const char=text[index];if(finished)continue;
      if(depth===0){if(char==='{' ){depth=1;segmentStart=index;}else if(char===']')finished=true;else if(!/[\s,]/.test(char))throw Error('Invalid feature array');continue;}
      if(quoted){if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')quoted=false;continue;}
      if(char==='"')quoted=true;else if(char==='{')depth++;else if(char==='}'){
        depth--;if(depth===0){parts.push(text.slice(segmentStart,index+1));const json=parts.join('');const value=JSON.parse(json);if(value.type!=='Feature'||!['Polygon','MultiPolygon'].includes(value.geometry?.type)||!Array.isArray(value.geometry.coordinates))throw Error('Invalid flood feature');visit(json);count++;parts=[];segmentStart=-1;}
      }
    }
    if(segmentStart>=0)parts.push(text.slice(segmentStart));
  }
  if(decoder.end() || !started || !finished || depth || !count)throw Error('Incomplete feature collection');
  return count;
}
