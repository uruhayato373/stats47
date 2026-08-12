/**
 * kdp-form.mjs — KDP 出品フォーム (3ステップ: Details → Content → Pricing) のベストエフォート充填。
 *
 * ★KDP は React SPA で DOM が変わりやすい。ここのセレクタは label/role ベースで堅牢化しているが、
 *   初回は kdp-publish.mjs --probe で構造を確認し、必要ならここを調整すること (coconala-form の discover 相当)。
 * ★各フィールドは try/catch で、見つからなければ warnings に積んで継続する (偽成功を防ぐ)。
 *   warnings が残るときは kdp-publish.mjs が公開を止める。
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * ★実測した id / name で入れる (2026-08-12 の --probe で確定)。
 *
 * 日本語版 KDP の入稿フォームは `<label>` が空で、`id="data-title"` /
 * `name="data[title]"` で要素を識別する。ラベル文字列で探す実装は**1 つも一致しない**。
 * ここを第一手段にし、`fillByLabel` は DOM が変わったときの保険として後ろに置く。
 */
async function fillById(page, id, value) {
  if (value === undefined || value === null || value === "") return true; // 空は入れない (成功扱い)
  for (const sel of [`#${id}`, `[name="${idToName(id)}"]`]) {
    try {
      const loc = page.locator(sel).first();
      if (await loc.count()) {
        await loc.scrollIntoViewIfNeeded().catch(() => {});
        await loc.fill(String(value), { timeout: 8000 });
        return true;
      }
    } catch {}
  }
  return false;
}

/** `data-title-pronunciation` → `data[title_pronunciation]` (KDP の name 規約)。 */
function idToName(id) {
  const rest = id.replace(/^data-/, "").replace(/-/g, "_");
  // 著者は入れ子: data[primary_author][first_name]
  const m = /^primary_author_(.+)$/.exec(rest);
  return m ? `data[primary_author][${m[1]}]` : `data[${rest}]`;
}

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

  // ★日本語フォームはフリガナ・ローマ字も必須。SSOT は packages/product-factory の kdp-reading.ts。
  need((await fillById(page, "data-title", lst.title)) || (await fillByLabel(page, /Book Title|タイトル|Title/i, lst.title)), "タイトル");
  need(await fillById(page, "data-title-pronunciation", lst.titleKana), "タイトルのフリガナ");
  need(await fillById(page, "data-title-romanized", lst.titleRomaji), "タイトルのローマ字");
  if (lst.subtitle) {
    need((await fillById(page, "data-subtitle", lst.subtitle)) || (await fillByLabel(page, /Subtitle|サブタイトル/i, lst.subtitle)), "サブタイトル");
    need(await fillById(page, "data-subtitle-pronunciation", lst.subtitleKana), "サブタイトルのフリガナ");
    need(await fillById(page, "data-subtitle-romanized", lst.subtitleRomaji), "サブタイトルのローマ字");
  }
  // 著者は姓・名が別欄 (屋号なので姓に入れて名は空)。
  need(await fillById(page, "data-primary-author-last-name", lst.authorLastName ?? lst.author), "著者の姓");
  need(await fillById(page, "data-primary-author-first-name", lst.authorFirstName ?? ""), "著者の名");
  need(await fillById(page, "data-primary-author-pronunciation", lst.authorKana), "著者のフリガナ");
  need(await fillById(page, "data-primary-author-name-romanized", lst.authorRomaji), "著者のローマ字");
  // 内容紹介 (Description)
  // ★KDP は CKEditor (iframe.cke_wysiwyg_frame) を使う (2026-08-12 実測)。
  //   hidden の data[description] に直接書くと React/CKEditor の状態と同期せず保存されないので、
  //   **iframe の本文へ実際に打ち込む**。
  let descOk = false;
  try {
    const fr = page.frameLocator("iframe.cke_wysiwyg_frame").first();
    const body = fr.locator("body").first();
    if (await body.count()) {
      await body.click({ timeout: 8000 });
      await page.keyboard.press("Control+A").catch(() => {});
      await page.keyboard.press("Meta+A").catch(() => {});
      await body.type(lst.description, { delay: 0, timeout: 60000 });
      descOk = true;
    }
  } catch {}
  if (!descOk) descOk = await fillByLabel(page, /Description|内容紹介|説明/i, lst.description);
  need(descOk, "内容紹介");

  // キーワード — 実測で data-keywords-0 … data-keywords-6 の 7 欄が並ぶ。
  let kwFilled = 0;
  for (let i = 0; i < lst.keywords.length && i < 7; i++) {
    if (await fillById(page, `data-keywords-${i}`, lst.keywords[i])) kwFilled++;
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
