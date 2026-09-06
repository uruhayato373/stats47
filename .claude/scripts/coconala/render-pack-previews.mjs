import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { inspectPack, selectPreview } from './lib/pack-evidence.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const listings = JSON.parse(readFileSync(resolve(root, '.claude/config/coconala-listings.json'))).listings;
const render = process.argv.includes('--render');
const browser = render ? await chromium.launch({ headless: true }) : null;
const page = browser ? await browser.newPage({ viewport: { width: 1220, height: 1020 } }) : null;
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
try {
  for (const [id, listing] of Object.entries(listings)) {
    if (!id.startsWith('P-')) continue;
    const evidence = await inspectPack(root, listing);
    const preview = selectPreview(evidence, listing._delivery.previewHeader);
    if (page) {
      const { source, header, values } = preview;
      await page.setContent(`<!doctype html><html lang="ja"><meta charset="utf-8"><style>
        *{box-sizing:border-box}body{margin:0;padding:54px;font-family:Arial,'Hiragino Sans',sans-serif;color:#162b46;background:#f6f9fd}
        h1{font-size:35px;margin:20px 0 8px}.eyebrow{color:#2765b0;font-size:25px}.sub{font-size:23px;margin:12px 0 28px}
        table{border-collapse:collapse;width:100%;background:white;font-size:27px}th,td{padding:17px 24px;border-bottom:1px solid #dae3ee;text-align:left}
        td:last-child{text-align:right;font-variant-numeric:tabular-nums}th{background:#193c65;color:white}.foot{font-size:21px;line-height:1.7;margin-top:25px}strong{color:#185bab}
        </style><div class="eyebrow">stats47 ｜ ${esc(id)} ｜ 納品CSVからの実データ見本</div>
        <h1>${esc(listing.title.replace('をお渡しします', ''))}</h1><div class="sub">全${evidence.count.toLocaleString('ja-JP')}指標のうち1指標・6地域を抜粋した表示例</div>
        <table><tr><th>県コード上の表示名</th><th>${esc(header)}</th></tr>${values.map(([name, value]) => `<tr><td>${esc(name)}</td><td>${esc(value)}</td></tr>`).join('')}</table>
        <div class="foot"><strong>出典：${esc(source['調査名'])} ／ 基準年：${esc(source['年'])}</strong><br>${esc(source['表名'])}<br>
        ${id === 'P-14' ? '表示名は県名ですが、値は県庁所在市（東京都は区部）の二人以上世帯です。' : '県庁所在市・特定世帯等の値を含む場合があります。対象は出典台帳で確認してください。'}<br>
        数値は納品CSVそのまま。表示用レイアウトは納品Excelの画面ではありません。</div></html>`);
      const path = resolve(root, listing._images[1]);
      mkdirSync(dirname(path), { recursive: true });
      await page.screenshot({ path, fullPage: true });
    }
    console.log(JSON.stringify({ id, count: evidence.count, slides: evidence.slides, hasXlsx: evidence.hasXlsx, manifestSha256: evidence.manifestSha256, preview: preview.header, rendered: render }));
  }
} finally {
  await browser?.close();
}
