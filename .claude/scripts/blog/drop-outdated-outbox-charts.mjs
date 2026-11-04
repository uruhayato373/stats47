#!/usr/bin/env node
/**
 * drop-outdated-outbox-charts.mjs — 送り箱の古い図で、公開中の新しい図を上書きしないようにする。
 *
 * contents/blog の図は書かれた時点の形のままで、公開の workflow は記事のフォルダをそのまま R2 へ同期する。
 * 公開中の図が共通の型の画像になっていて、送り箱の図が旧形式で、点データも同じなら、同じ図の古い版なので
 * 送り箱から除く (公開の workflow は画像を生成しない。生成は regenerate-blog-svgs.yml の exact publish だけ)。
 *
 * Usage: node .claude/scripts/blog/drop-outdated-outbox-charts.mjs --slug <slug>
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)('../lib/site-config.cjs');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const isTypeImage = (svg) => /data-image-template="/.test(svg);

/** 送り箱の図が、公開中の図の古い版か (純粋関数) */
export function isOutdatedChart({ outboxSvg, liveSvg, outboxData, liveData }) {
  return liveSvg !== null && liveData !== null && !isTypeImage(outboxSvg) && isTypeImage(liveSvg) && outboxData === liveData;
}

const fetchText = async (url) => {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.text();
};

async function main(argv) {
  const slug = argv[argv.indexOf('--slug') + 1];
  if (!argv.includes('--slug') || !slug) throw new Error('--slug <slug> が要る');
  const dir = path.join('contents/blog', slug, 'data');
  if (!fs.existsSync(dir)) return;
  let dropped = 0;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.svg') && !f.endsWith('-dark.svg'))) {
    const base = file.replace(/\.svg$/, '').replace(/-(ig|mobile)$/, '');
    const dataFile = path.join(dir, `${base}.json`);
    if (!fs.existsSync(dataFile)) continue;
    const live = `${R2}/app/blog/${slug}/data`;
    const [liveSvg, liveData] = await Promise.all([fetchText(`${live}/${file}`), fetchText(`${live}/${base}.json`)]);
    const outdated = isOutdatedChart({
      outboxSvg: fs.readFileSync(path.join(dir, file), 'utf8'), liveSvg,
      outboxData: fs.readFileSync(dataFile, 'utf8'), liveData,
    });
    if (outdated) {
      fs.rmSync(path.join(dir, file));
      dropped++;
    }
  }
  console.log(`[outbox] ${slug}: 古い図 ${dropped} 枚を公開の対象から外した`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
