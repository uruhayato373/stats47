import { createElement } from 'react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import satori from 'satori';
import { LinkCardOgp, LINK_CARD_IMAGE, resolveLinkCardTitleLayout, type LinkCardOgpProps } from '../../src/features/ogp/LinkCardOgp';
import type { SatoriFont } from './satori-image-render';

export interface LinkCardTextBox {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Geometric gate only: visual review of the actual small images is still required. */
export function assertLinkCardTextLayout(boxes: readonly LinkCardTextBox[], title: string, titleFontSize: number) {
  if (!boxes.length || !boxes.some(box => box.text === title)) throw Error('主題の文字配置を検査できません');
  if (titleFontSize * LINK_CARD_IMAGE.noteHeight / LINK_CARD_IMAGE.height < 15) throw Error('リンクカードで主題が15px未満になります');
  const safeRight = LINK_CARD_IMAGE.safeLeft + LINK_CARD_IMAGE.safeWidth;
  for (const box of boxes) {
    if (![box.left, box.top, box.width, box.height].every(Number.isFinite)
      || box.width <= 0 || box.height <= 0
      || box.left < LINK_CARD_IMAGE.safeLeft || box.left + box.width > safeRight
      || box.top < 24 || box.top + box.height > LINK_CARD_IMAGE.height - 24) {
      throw Error(`正方形の安全域から文字がはみ出しています: ${box.text}`);
    }
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left) > 2
      && Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top) > 2) {
      throw Error(`文字が重なっています: ${a.text} / ${b.text}`);
    }
  }
}

export async function renderLinkCardPreview(directory: string, key: string, data: LinkCardOgpProps, fonts: SatoriFont[]) {
  mkdirSync(directory, { recursive: true });
  const boxes: LinkCardTextBox[] = [];
  const svg = await satori(createElement(LinkCardOgp, data), {
    width: LINK_CARD_IMAGE.width,
    height: LINK_CARD_IMAGE.height,
    fonts,
    onNodeDetected: node => {
      if (node.textContent) boxes.push({text: node.textContent, left: node.left, top: node.top, width: node.width, height: node.height});
    },
  });
  assertLinkCardTextLayout(boxes, data.title, resolveLinkCardTitleLayout(data.title).fontSize);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  const file = join(directory, `${key}.png`);
  writeFileSync(file, png);
  await sharp(png).resize(220, 150, { fit: 'cover', position: 'centre' }).png().toFile(join(directory, `${key}-note.png`));
  await sharp(png).resize(150, 150, { fit: 'cover', position: 'centre' }).png().toFile(join(directory, `${key}-square.png`));
  return file;
}
