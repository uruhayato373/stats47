import { createR2Store,fetchPublicMediaSource } from '../../note/lib/cover-storage.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { publicUrlAllowed,MATERIAL_ROOTS } from './web-inventory.mjs';
import { R2_BUCKET, R2_PRIVATE_BUCKET } from '../../lib/site-config.cjs';
import { sha, WorkspaceError, safeName, storeVerified } from './workspace.mjs';
export const mediaStore = () => createR2Store({bucket:R2_PRIVATE_BUCKET,writeOnce:true});
export async function readMediaObject(root,reference) {
  let bytes;
  if(reference?.provider==='inline-svg'){
    if(reference.source?.provider==='inline-svg'||!Number.isSafeInteger(reference.start)||!Number.isSafeInteger(reference.end)||reference.start<0||reference.end<=reference.start)throw new WorkspaceError('埋込SVGの参照が不正です。');
    const source=(await readMediaObject(root,reference.source)).toString('utf8');
    if(reference.end>source.length)throw new WorkspaceError('埋込SVGの範囲が変わりました。');
    bytes=Buffer.from(source.slice(reference.start,reference.end));
  }else if(reference?.provider==='git'){
    if(!safeName(reference.path)||!MATERIAL_ROOTS.some(p=>reference.path.startsWith(p+'/')))throw new WorkspaceError('素材パスが不正です。');
    const base=fs.realpathSync(root),file=fs.realpathSync(path.join(base,reference.path)),rel=path.relative(base,file);
    if(rel.startsWith('..')||path.isAbsolute(rel)||!fs.statSync(file).isFile())throw new WorkspaceError('素材パスが不正です。');
    bytes=fs.readFileSync(file);
  }else if(reference?.url){
    if(!publicUrlAllowed(reference.url))throw new WorkspaceError('画像・入力の取得先が不正です。');
    bytes=await fetchPublicMediaSource(reference.url);
  }else return readVerified(reference);
  if(reference.sha256&&(sha(bytes)!==reference.sha256||bytes.length!==reference.bytes))throw new WorkspaceError('画像・入力が索引から変わりました。棚卸しを更新してください。',409);
  return bytes;
}
export async function readVerified(reference) {
  if (!reference?.bucket || ![R2_BUCKET,R2_PRIVATE_BUCKET].includes(reference.bucket) || !safeName(reference.key))
    throw new WorkspaceError('保存先が不正です。',400);
  const bytes=await createR2Store({bucket:reference.bucket}).get(reference.key);
  if(!bytes || bytes.length!==reference.bytes || sha(bytes)!==reference.sha256)throw new WorkspaceError('保存画像・入力の内容を照合できません。',502);
  return bytes;
}
export async function archiveSnsImage({platform,id,role,order,bytes,mime,source,drivePath},store=mediaStore()){
  if(!['x','instagram','threads','youtube','tiktok'].includes(platform)||!Number.isSafeInteger(id)||id<1||!['image','slide','thumbnail'].includes(role)||!Number.isSafeInteger(order)||order<1)throw Error('Invalid SNS identity');
  const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'}[mime];
  if(!ext)throw Error('Unsupported image MIME');
  const key='sns-assets/'+platform+'/'+id+'/'+role+'-'+order+'/'+sha(bytes)+'.'+ext;
  const stored=await storeVerified(store,key,bytes);
  return {role,order,state:'archived',r2:{bucket:stored.bucket,key:stored.key},sha256:stored.sha256,bytes:stored.bytes,mime,source:source??null,...(drivePath?{drive_path:drivePath}:{})};
}
/**
 * 投稿台帳の行の 1 枚目の画像がローカルに無ければ、保全済みの private R2 の版を照合つきで戻す (2026-11-08)。
 * .local/r2/sns は期限で消える作業領域で、画像の正本は private R2 の sns-assets/。戻せた・元からあった場合はその絶対パス、
 * 保全の記録が無ければ null を返す。書き先は repo の .local 配下に限る。
 * @param {Record<string, any>} row @param {string} root @returns {Promise<string|null>}
 */
export async function ensureSnsImageLocal(row, root) {
  const rel = row?.media_path ? String(row.media_path) : '';
  const saved = (Array.isArray(row?.assets) ? row.assets : []).find((a) => a?.state === 'archived' && a?.r2 && a?.order === 1 && ['image', 'slide'].includes(String(a?.role)));
  const target = rel && !/^https?:/.test(rel) ? path.resolve(root, rel) : saved ? path.join(root, '.local/r2/sns/_queue', `${row.platform}-${row.id}${path.extname(String(saved.r2.key))}`) : null;
  if (!target) return null;
  if (fs.existsSync(target)) return target;
  if (!saved || !target.startsWith(path.join(root, '.local') + path.sep)) return null;
  const bytes = await readVerified({ ...saved.r2, sha256: saved.sha256, bytes: saved.bytes });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes);
  return target;
}
