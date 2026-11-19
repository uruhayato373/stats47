import { createElement as h } from 'react';
import satori from 'satori';
import sharp from 'sharp';
import { loadFonts } from '../../../../apps/web/scripts/lib/satori-image-render';
import { COVER_ROOT, coverSha } from './cover-assets.mjs';
import type { CoverPlan } from './cover-production.mjs';

/** Generated art is decorative. Copy is drawn from the saved production request. */
export async function renderPopCover(plan: CoverPlan, background: Buffer) {
  const { headline, subline, accent } = plan.composition;
  if (headline.split('\n').length > 3) throw Error('見出しは3行以内に編集してください。');
  if (background.length > 16 * 1024 * 1024 || (await sharp(background).metadata()).format !== 'png') throw Error('背景は16MiB以内のPNGを指定してください。');
  const image = await sharp(background).rotate().resize(1280, 670, { fit: 'cover' }).png().toBuffer();
  const fonts = loadFonts(COVER_ROOT);
  const text = (value: string, style: Record<string, string | number>) => h('div', { style: { display: 'flex', whiteSpace: 'pre-wrap', ...style } }, value);
  const element = h('div', { style: { display: 'flex', width: 1280, height: 670, position: 'relative', background: '#fffdf7', color: '#142754', fontFamily: 'Noto Sans JP' } },
    h('img', { src: `data:image/png;base64,${image.toString('base64')}`, width: 1280, height: 670, style: { position: 'absolute', left: 0, top: 0 } }),
    h('div', { style: { display: 'flex', position: 'absolute', left: 32, top: 32, width: 682, height: 606, borderRadius: 28, background: 'rgba(255,253,247,0.94)' } }),
    text(plan.policySnapshot.label, { position: 'absolute', left: 64, top: 66, fontSize: 36, fontWeight: 700, color: accent }),
    text(headline, { position: 'absolute', left: 64, top: 144, width: 608, fontSize: 72, lineHeight: 1.2, fontWeight: 900 }),
    text(subline, { position: 'absolute', left: 64, top: 444, width: 608, fontSize: 36, lineHeight: 1.4, fontWeight: 700 }),
    text('stats47', { position: 'absolute', left: 64, top: 568, fontSize: 32, fontWeight: 700 }),
  );
  const boxes: { left: number; top: number; width: number; height: number; text: string }[] = [];
  const svg = await satori(element, { width: 1280, height: 670, fonts, onNodeDetected: n => {
    if (typeof n.textContent === 'string' && n.textContent.trim()) boxes.push({ left: n.left, top: n.top, width: n.width, height: n.height, text: n.textContent });
  } });
  if (!boxes.length) throw Error('文字配置を検査できませんでした。');
  for (const box of boxes) if (box.left < 48 || box.top < 40 || box.left + box.width > 1232 || box.top + box.height > 622)
    throw Error(`文字が安全域を超えています: ${box.text}`);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left) > 4 && Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top) > 4)
      throw Error(`文字が重なっています: ${a.text} / ${b.text}`);
  }
  const png = await sharp(Buffer.from(svg)).flatten({ background: '#fffdf7' }).png().toBuffer();
  return { png, svg, evidence: { renderer: 'note-pop-cover-v1', production: plan, backgroundSha256: coverSha(background),
    fonts: fonts.map(font => ({ name: font.name, weight: font.weight, sha256: coverSha(Buffer.from(font.data)) })), layout: boxes } };
}
