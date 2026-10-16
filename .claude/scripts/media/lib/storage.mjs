import { createR2Store } from '../../note/lib/cover-storage.mjs';
import { R2_BUCKET, R2_PRIVATE_BUCKET } from '../../lib/site-config.cjs';
import { sha, WorkspaceError, safeName, storeVerified } from './workspace.mjs';
export const mediaStore = () => createR2Store({bucket:R2_PRIVATE_BUCKET,writeOnce:true});
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
