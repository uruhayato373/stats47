#!/usr/bin/env node
/**
 * discover-categories.mjs — ココナラ出品フォームのカテゴリ/ジャンル/提供形式の実 value を取得する
 * (stats47)。listings の category(master/sub/type)・genreFacets・provisionFormat を確定するための調査。
 * 出品フォーム (/services/add → 内容の入力に進む → /mypage/services/{id}) を開いて select の
 * option を列挙する。--master <value> を渡すと、その大カテゴリを選択後に sub/type/facet を列挙。
 *
 * ★注意: このフローは空の下書きサービスを1件作成する。表示された draftId は再利用 or
 *   coconala-delete-draft.mjs --id <draftId> で掃除できる。
 *
 * 使い方:
 *   node .claude/scripts/coconala/discover-categories.mjs                 # 大カテゴリ一覧
 *   node .claude/scripts/coconala/discover-categories.mjs --master 24     # 大=24 の sub/type/facet
 */
import { launchContext, waitForLogin, assertAccount, sleep } from './lib/coconala-session.mjs';
import { dismissModal } from './lib/coconala-form.mjs';

const argv = process.argv.slice(2);
const getArg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const MASTER = getArg('--master');

const dumpSelect = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  return Array.from(el.options).map((o) => ({ v: o.value, t: (o.textContent || '').trim() })).filter((o) => o.v);
}, sel);

const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  const lg = await waitForLogin(page, { tag: '[discover]', waitMinutes: 3 });
  if (!lg.ok) { console.error('ABORT 未ログイン'); await ctx.close(); process.exit(2); }
  const acc = await assertAccount(page, { tag: '[discover]' });
  if (!acc.ok) { console.error('ABORT', acc.reason); await ctx.close(); process.exit(2); }

  await page.goto('https://coconala.com/services/add', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(3000);
  await dismissModal(page);
  const label = page.getByText('テキストチャット・', { exact: false });
  if (await label.count()) await label.first().click();
  await sleep(1500);
  const proceed = page.getByRole('button', { name: '内容の入力に進む' });
  if (await proceed.count()) {
    try { await proceed.first().click({ timeout: 10000 }); } catch {
      await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /内容の入力に進む/.test(x.innerText)); b?.click(); });
    }
  }
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch {}
  await sleep(4000);
  const draftId = (page.url().match(/\/services\/(\d+)/) || [])[1] || '(不明)';
  console.log('DRAFT_ID:', draftId, '(不要なら coconala-delete-draft.mjs --id', draftId, ')');

  const master = await dumpSelect(page, '#ServiceCategory');
  console.log('\n=== 大カテゴリ (#ServiceCategory) ===');
  console.log(JSON.stringify(master, null, 0));

  if (MASTER) {
    await page.selectOption('#ServiceCategory', String(MASTER));
    await sleep(2500);
    const sub = await dumpSelect(page, '#ServiceSubCategory');
    console.log(`\n=== サブカテゴリ (master=${MASTER}) ===`);
    console.log(JSON.stringify(sub, null, 0));
    if (sub && sub[0]) {
      await page.selectOption('#ServiceSubCategory', String(sub[0].v));
      await sleep(2000);
      const type = await dumpSelect(page, '#ServiceMasterCategoryTypeId');
      console.log(`\n=== カテゴリタイプ (sub=${sub[0].v} を仮選択) ===`);
      console.log(JSON.stringify(type, null, 0));
    }
    const facets = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input[type=checkbox][name^="data[facets]"]')).map((b) => {
        const lbl = b.closest('label') || document.querySelector(`label[for="${b.id}"]`);
        return { v: b.value, t: (lbl?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30) };
      }),
    );
    console.log('\n=== ジャンル facet (先頭sub時点) ===');
    console.log(JSON.stringify(facets, null, 0));
  }
  const pf = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input[name="data[Service][provision_format]"]')).map((r) => {
      const lbl = r.closest('label') || document.querySelector(`label[for="${r.id}"]`);
      return { v: r.value, t: (lbl?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30) };
    }),
  );
  console.log('\n=== 提供形式 provision_format ===');
  console.log(JSON.stringify(pf, null, 0));
} finally {
  await ctx.close();
}
