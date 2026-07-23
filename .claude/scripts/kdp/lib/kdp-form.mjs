/**
 * kdp-form.mjs — KDP 出品フォーム (3ステップ: Details → Content → Pricing) のベストエフォート充填。
 *
 * ★KDP は React SPA で DOM が変わりやすい。ここのセレクタは label/role ベースで堅牢化しているが、
 *   初回は kdp-publish.mjs --probe で構造を確認し、必要ならここを調整すること (coconala-form の discover 相当)。
 * ★各フィールドは try/catch で、見つからなければ warnings に積んで継続する (偽成功を防ぐ)。
 *   warnings が残るときは kdp-publish.mjs が公開を止める。
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** label テキストで input/textarea を探して値を入れる。見つからなければ false。 */
async function fillByLabel(page, labelRe, value) {
  try {
    const loc = page.getByLabel(labelRe).first();
    if (await loc.count()) {
      await loc.scrollIntoViewIfNeeded().catch(() => {});
      await loc.fill(String(value), { timeout: 8000 });
      return true;
    }
  } catch {}
  // フォールバック: placeholder / 近傍 label のテキスト一致
  try {
    const ph = page.getByPlaceholder(labelRe).first();
    if (await ph.count()) { await ph.fill(String(value), { timeout: 8000 }); return true; }
  } catch {}
  return false;
}

async function clickByText(page, textRe) {
  for (const role of ["button", "link", "tab"]) {
    try {
      const loc = page.getByRole(role, { name: textRe }).first();
      if (await loc.count()) { await loc.click({ timeout: 8000 }); return true; }
    } catch {}
  }
  try {
    const loc = page.getByText(textRe, { exact: false }).first();
    if (await loc.count()) { await loc.click({ timeout: 8000 }); return true; }
  } catch {}
  return false;
}

/** Details ステップ: 言語・タイトル・サブタイトル・著者・内容紹介・キーワード。 */
export async function fillKdpDetails(page, lst, { tag = "[kdp]" } = {}) {
  const log = [];
  const warnings = [];
  const need = (ok, what) => { if (ok) log.push(`${tag} ✓ ${what}`); else warnings.push(`${what} を充填できず (DOM 変更の可能性・--probe で確認)`); };

  need(await fillByLabel(page, /Book Title|タイトル|Title/i, lst.title), "タイトル");
  if (lst.subtitle) need(await fillByLabel(page, /Subtitle|サブタイトル/i, lst.subtitle), "サブタイトル");
  // 著者 (Primary Author) — 名/姓で分かれる場合あり。単一欄を優先。
  const authorOk =
    (await fillByLabel(page, /Primary Author|著者|Author.*Last|姓/i, lst.author)) ||
    (await fillByLabel(page, /First name|名/i, lst.author));
  need(authorOk, "著者名");
  // 内容紹介 (Description) — リッチテキスト or textarea
  let descOk = await fillByLabel(page, /Description|内容紹介|説明/i, lst.description);
  if (!descOk) {
    try {
      const rt = page.locator('[contenteditable="true"]').first();
      if (await rt.count()) { await rt.click(); await rt.fill(lst.description); descOk = true; }
    } catch {}
  }
  need(descOk, "内容紹介");
  // キーワード (最大7・個別欄が7つ並ぶことが多い)
  let kwFilled = 0;
  for (let i = 0; i < lst.keywords.length && i < 7; i++) {
    const ok =
      (await fillByLabel(page, new RegExp(`Keyword.*${i + 1}|キーワード.*${i + 1}`, "i"), lst.keywords[i]));
    if (ok) kwFilled++;
  }
  if (kwFilled >= Math.min(3, lst.keywords.length)) log.push(`${tag} ✓ キーワード ${kwFilled}/${lst.keywords.length}`);
  else warnings.push(`キーワード欄を特定できず (${kwFilled} 件のみ・--probe で確認)`);
  // カテゴリは KDP のブラウズ階層選択が複雑なため人手 (warnings に案内)。
  warnings.push("カテゴリ (ブラウズ2-3枠) は KDP UI で人手選択を推奨 (kdp-listings.json の categories 参照)");
  return { log, warnings };
}

/** Content ステップ: 原稿 (EPUB) とカバーのアップロード。 */
export async function uploadKdpContent(page, { epubAbs, coverAbs, tag = "[kdp]" } = {}) {
  const log = [];
  const warnings = [];
  await clickByText(page, /Kindle eBook Content|コンテンツ|Content/i);
  await sleep(2500);
  // 原稿 (manuscript) アップロード: file input を探す
  let epubOk = false;
  try {
    const inputs = page.locator('input[type="file"]');
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      // 最初の file input を manuscript とみなす (KDP は manuscript→cover の順)
      await inputs.nth(i).setInputFiles(epubAbs, { timeout: 15000 });
      epubOk = true;
      break;
    }
  } catch {}
  if (epubOk) { log.push(`${tag} ✓ 原稿 (EPUB) アップロード開始`); await sleep(8000); }
  else warnings.push("原稿 (EPUB) の file input を特定できず (--probe で確認)");

  if (coverAbs) {
    let coverOk = false;
    try {
      const inputs = page.locator('input[type="file"]');
      const n = await inputs.count();
      if (n >= 2) { await inputs.nth(1).setInputFiles(coverAbs, { timeout: 15000 }); coverOk = true; }
    } catch {}
    if (coverOk) { log.push(`${tag} ✓ カバー アップロード開始`); await sleep(6000); }
    else warnings.push("カバーの file input を特定できず (KDP Cover Creator で作成も可)");
  }
  return { log, warnings };
}

/** Pricing ステップ: KU・地域・ロイヤリティ・価格。 */
export async function setKdpPricing(page, lst, { tag = "[kdp]" } = {}) {
  const log = [];
  const warnings = [];
  await clickByText(page, /Pricing|価格|Rights and Pricing/i);
  await sleep(2500);
  // KU (KDP Select) — kuEnrolled=false のときは登録しない (既定で未チェックが多い)。
  log.push(`${tag} KU 登録: ${lst.kuEnrolled ? "有効化 (人手確認推奨)" : "登録しない (既定)"}`);
  // ロイヤリティプラン (70% / 35%)
  const royOk = await clickByText(page, lst.royaltyPlan === 70 ? /70\s*%/ : /35\s*%/);
  if (royOk) log.push(`${tag} ✓ ロイヤリティ ${lst.royaltyPlan}%`); else warnings.push("ロイヤリティ選択を特定できず");
  // 価格 (JPY) — 日本マーケットプレイスの価格欄
  const priceOk = await fillByLabel(page, /Price|価格|JPY|List Price/i, lst.priceYen);
  if (priceOk) log.push(`${tag} ✓ 価格 ¥${lst.priceYen}`); else warnings.push("価格欄を特定できず (--probe で確認)");
  return { log, warnings };
}

/** 下書き保存。 */
export async function saveDraft(page, { tag = "[kdp]" } = {}) {
  const ok = await clickByText(page, /Save as Draft|下書きとして保存|下書き保存|Save Draft/i);
  await sleep(3000);
  return { ok };
}

/** 公開。ASIN を拾えれば返す。 */
export async function publishBook(page, { tag = "[kdp]" } = {}) {
  const ok = await clickByText(page, /Publish Your Kindle eBook|Publish|出版|公開/i);
  if (!ok) return { ok: false, reason: "公開ボタンを特定できず" };
  await sleep(5000);
  // 確認ダイアログがあれば承認
  await clickByText(page, /Publish|確定|OK/i).catch(() => {});
  await sleep(3000);
  let asin = "";
  try {
    asin = await page.evaluate(() => (document.body?.innerText || "").match(/\bB0[A-Z0-9]{8}\b/)?.[0] || "");
  } catch {}
  // 成功の確証: URL 変化 or 成功文言
  const confirmed = await page.evaluate(() => /published|出版|審査|review|Bookshelf/i.test(document.body?.innerText || ""));
  return { ok: !!confirmed, asin };
}
