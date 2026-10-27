import fs from 'node:fs';
import path from 'node:path';

export const materialKey = m => `${m.platform}/${m.domain}/${m.content_key}`;
const segment = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;
export function materialDirectory(root, m) {
  if (!['x', 'instagram'].includes(m.platform) || !segment.test(m.domain) || !segment.test(m.content_key))
    throw new Error(`不正な素材キー: ${materialKey(m)}`);
  const base = path.resolve(root, '.local/r2/sns');
  const dir = path.join(base, m.domain, m.content_key, m.platform);
  if (!fs.realpathSync(dir).startsWith(fs.realpathSync(base) + path.sep)) throw new Error('素材がSNSディレクトリ外を指しています');
  return dir;
}
export function mediaFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return mediaFiles(file);
    return entry.isFile() && /\.(png|jpe?g|webp|mp4)$/i.test(file) ? [file] : [];
  }).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}
function normalizeSource(source) {
  // Only the known SNS mirror / public origin is an alias. Arbitrary hosts are not equivalent.
  return String(source ?? '').replace(/^.*?\.local\/r2\//, '').replace(/^https:\/\/storage\.stats47\.jp\//, '');
}
export function findMaterialPost(posts, material, files = []) {
  const key = materialKey(material);
  const sources = new Set(files.map(normalizeSource));
  const aliases = [material.content_key];
  if (material.domain === 'area') aliases.push(`area-${material.content_key}-profile`);
  const matches = posts.filter(p => p.platform === material.platform && (
    p.material_keys?.includes(key) ||
    (p.domain === material.domain && aliases.includes(p.content_key)) ||
    sources.has(normalizeSource(p.media_path)) ||
    (p.assets ?? []).some(a => sources.has(normalizeSource(a.source)))
  ));
  if (matches.length > 1) throw new Error(`複数IDに一致: ${key}: ${matches.map(p => p.id).join(',')}`);
  // Deleted records also own their material: never resurrect leftover files.
  return matches[0] ?? null;
}
function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}
export function prepareMaterial(root, material) {
  const dir = materialDirectory(root, material);
  const base = path.dirname(dir);
  // 台帳のパスは "/" 区切り (Windows の path.relative は "\\" を返すため揃える。2026-10-27)
  const files = mediaFiles(dir).map(file => path.relative(root, file).split(path.sep).join('/'));
  const props = readJson(path.join(base, 'props.json')) ?? readJson(path.join(dir, 'props.json'));
  const card = props?.card;
  const meta = readJson(path.join(base, 'ranking_items.json'));
  const copy = readJson(path.join(dir, 'caption.json'));
  const draft = readJson(path.join(dir, 'draft.json'))?.[0];
  const captionFile = path.join(dir, 'caption.txt');
  let caption = material.caption ?? (fs.existsSync(captionFile) ? fs.readFileSync(captionFile, 'utf8').trim() : copy?.caption ?? copy?.text ?? '');
  if (caption.includes('{{url}}')) caption = caption.replaceAll('{{url}}', draft?.canonicalUrl ?? '');
  const title = material.title ?? card?.title?.replaceAll('\n', '') ?? props?.coverHook ?? props?.hook ?? meta?.title ?? copy?.displayTitle ?? (caption.split('\n')[0].trim() || material.content_key);
  const previewOnly = files.length > 0 && files.every(file => file.endsWith('/candidate-preview.png'));
  const selected = material.platform === 'x'
    ? files.filter(file => !file.endsWith('-ig.png')) : files;
  const mainFiles = selected.length ? selected : files;
  return { ...material, files: mainFiles, record: {
    platform: material.platform, domain: material.domain, content_key: material.content_key,
    post_type: material.platform === 'x' ? 'original' : mainFiles.some(file => file.endsWith('.mp4')) ? 'reel' : material.platform === 'instagram' && mainFiles.length > 1 ? 'carousel' : 'image',
    status: 'draft', caption, scheduled_at: null,
    media_path: previewOnly ? null : mainFiles[0] ?? null,
    template: draft?.template ?? material.domain,
    metric_keys: JSON.stringify(draft?.metricKeys ?? card?.metricKeys ?? (material.domain === 'ranking' ? [material.content_key] : [])),
    approval: { state: 'pending' }, material_keys: [materialKey(material)],
    planning: {
      origin: material.origin ?? 'material-import', batch: material.batch,
      title, preview_only: previewOnly,
      note: material.note ?? (previewOnly
        ? '保存済みデータから確認用の表紙を生成。投稿用画像一式・本文・出典と対象地域を公開前に確認。'
        : '既存素材から整理した候補。本文・出典・対象期間と地域を公開前に確認。'),
    },
  }};
}
