import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(LIB_DIR, "../../../..");
const STOREFRONT_PATH = join(REPO_ROOT, "apps/web/src/features/products/storefront.generated.ts");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function assertCleanCardUrl(rawUrl, allowedHost) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") throw new Error(`カードURLはHTTPS必須: ${rawUrl}`);
  if (url.search || url.hash) throw new Error(`カードURLにquery/hashを付けない: ${rawUrl}`);
  if (url.hostname !== allowedHost) throw new Error(`カードURLのhostが不正: ${rawUrl}`);
  return url.toString().replace(/\/$/, "");
}

/** query を使えない note カード向けに、記事別の clean 計測パスを作る。 */
export function buildNoteProductCardUrl(productTarget, noteUrl) {
  if (!/^\/products\/[a-z0-9-]+$/.test(productTarget)) {
    throw new Error(`商品導線pathが不正: ${productTarget}`);
  }
  const source = new URL(noteUrl);
  if (source.protocol !== "https:" || source.hostname !== "note.com") {
    throw new Error(`note URLが不正: ${noteUrl}`);
  }
  const noteKey = source.pathname.match(/\/n\/(n[0-9a-f]+)$/i)?.[1];
  if (!noteKey) throw new Error(`note keyを抽出できません: ${noteUrl}`);
  return assertCleanCardUrl(
    `https://stats47.jp${productTarget}/from/note/${noteKey}`,
    "stats47.jp",
  );
}

function parseJsonStringLiteral(raw) {
  return JSON.parse(`"${raw}"`);
}

function readStorefrontField(block, field) {
  const match = block.match(new RegExp(`"${field}":\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  return match ? parseJsonStringLiteral(match[1]) : null;
}

/**
 * note商品カードのtitle/descriptionを、マガジン名の代用ではなく
 * 実商品SSOT (storefront.generated.ts) から解決する。見つからなければ fail-fast する。
 */
export function resolveProductCardText(productTarget) {
  const slug = String(productTarget || "").match(/^\/products\/([a-z0-9-]+)$/)?.[1];
  if (!slug) throw new Error(`商品導線pathが不正: ${productTarget}`);
  const source = readFileSync(STOREFRONT_PATH, "utf8");
  for (const match of source.matchAll(/\{[^{}]*\}/g)) {
    const block = match[0];
    if (readStorefrontField(block, "slug") !== slug) continue;
    const title = readStorefrontField(block, "title");
    const description = readStorefrontField(block, "description");
    if (title && description) return { title, description };
  }
  throw new Error(`商品ストアに productTarget が見つかりません: ${productTarget}`);
}

export function normalizeLegacyStats47Links(body) {
  return String(body).replace(/http:\/\/(?:www\.)?stats47\.jp/gi, "https://stats47.jp");
}

/** note が自動再生成するカード文言・属性だけを除き、執筆本文の同一性を比較できる形にする。 */
export function canonicalizeNoteEditorBody(body) {
  let canonical = String(body || "")
    .replace(
      /<figure\b([^>]*embedded-service="external-article"[^>]*)>[\s\S]*?<\/figure>/g,
      (_match, attributes) => `<figure data-src="${attributes.match(/data-src="([^"]+)"/)?.[1] || ""}"></figure>`,
    )
    .replace(/\s+(?:name|id|embedded-content-key|target|rel)="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();
  // note の公開APIは同じリンクを隣接a要素へ分割することがある一方、
  // 編集画面は1要素へ再結合する。URLと表示文字列が同一なら執筆内容の差ではない。
  let previous;
  do {
    previous = canonical;
    canonical = canonical.replace(
      /<a href="([^"]+)">([\s\S]*?)<\/a><a href="\1">([\s\S]*?)<\/a>/g,
      '<a href="$1">$2$3</a>',
    );
  } while (canonical !== previous);
  return canonical;
}

function attrs(id) {
  return `name="${id}" id="${id}"`;
}

function noteCard(url, noteKey, idFactory) {
  const id = idFactory();
  const embed = `emb${idFactory().replaceAll("-", "").slice(0, 12)}`;
  return `<figure ${attrs(id)} data-src="${escapeHtml(url)}" data-identifier="${escapeHtml(noteKey)}" embedded-service="note" embedded-content-key="${embed}">\n</figure>`;
}

export function externalCard(url, title, description, idFactory) {
  const id = idFactory();
  const embed = `emb${idFactory().replaceAll("-", "").slice(0, 12)}`;
  const hostname = new URL(url).hostname;
  return `<figure ${attrs(id)} data-src="${escapeHtml(url)}" data-identifier="null" embedded-service="external-article" embedded-content-key="${embed}">\n<a href="${escapeHtml(url)}" rel="nofollow noopener" target="_blank">\n<strong>${escapeHtml(title)}</strong>\n<em>${escapeHtml(description)}</em>\n<em>${escapeHtml(hostname)}</em>\n</a><a href="${escapeHtml(url)}" rel="nofollow noopener" target="_blank"></a>\n</figure>`;
}

function hasUrl(body, url) {
  return body.includes(`data-src="${url}"`) || body.includes(`href="${url}"`);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function figureByDataSrcPattern(url) {
  return new RegExp(`<figure\\b[^>]*\\bdata-src="${escapeRegExp(url)}"[^>]*>[\\s\\S]*?<\\/figure>`, "g");
}

/** 公開本文に残る既知の旧URLだけを catalog 契約に従って修復する。 */
export function applyPublishedLinkRepairs(body, repairs, { idFactory = randomUUID } = {}) {
  const original = String(body);
  let output = normalizeLegacyStats47Links(original);
  const results = [];

  for (const repair of repairs || []) {
    const fromUrl = assertCleanCardUrl(repair.fromUrl, "stats47.jp");
    const before = output;

    if (repair.mode === "regenerate-card") {
      // URLはそのまま、embedded-service="external-article"のカードを維持して
      // title/descriptionだけを実商品SSOTの値へ揃える (replace-cardのような格下げはしない)。
      let matched = false;
      output = output.replace(figureByDataSrcPattern(fromUrl), (figure) => {
        matched = true;
        const currentTitle = figure.match(/<strong>([\s\S]*?)<\/strong>/)?.[1];
        const currentDescription = figure.match(/<em>([\s\S]*?)<\/em>/)?.[1];
        // note の実配信ページは external-article カードの <a> 内テキストを一切使わず、
        // embedded_contents レジストリ (embedded-content-key で解決) の内容だけを描画する。ここで
        // 読んでいる本文 (note 公開API) はレジストリ解決前の生の保存値を返すことがあり、そのときは
        // <a> 内テキストが欠けて見える (2026-09-20 実測: stats47.jp/products/.../from/note/<id> への
        // カード全数で embedded_contents に未登録＝読者には空カードとして配信されていた。原因は転送先
        // ページが OGP を持たず note 側の解決に失敗していたこと。apps/web/src/app/products/[slug]/
        // from/note/[noteKey]/page.tsx で解消済み)。この <a> 内テキストは編集画面の初期プレビュー用の
        // 置物であり実描画を左右しないため、空に見えても「誤った文言」として書き直さない
        // (書き直しても次の取得でまた空になり得、check が意味なく赤くなるだけ)。
        const renderedWithoutText = currentTitle === undefined && currentDescription === undefined;
        const alreadyCorrect = renderedWithoutText || (currentTitle === escapeHtml(repair.title)
          && currentDescription === escapeHtml(repair.description));
        return alreadyCorrect ? figure : externalCard(fromUrl, repair.title, repair.description, idFactory);
      });
      // カードがまだ存在しない記事 (本文差し替え直後など) では何もしない。
      // 新規追加は applyNavigationFooter の hasUrl 判定に委ねる (regenerate-card は
      // 既存カードの文言訂正専任で、新規追加の責務を持たない)。
      results.push({ mode: repair.mode, fromUrl, toUrl: fromUrl, changed: matched && output !== before });
      continue;
    }

    const toUrl = assertCleanCardUrl(repair.toUrl, "stats47.jp");

    if (repair.mode === "replace-url") {
      output = output.replaceAll(fromUrl, toUrl);
    } else if (repair.mode === "replace-card") {
      output = output.replace(figureByDataSrcPattern(fromUrl), (figure) => {
        const id = figure.match(/\\b(?:name|id)="([^"]+)"/)?.[1] || idFactory();
        return `<p ${attrs(id)}><a href="${escapeHtml(toUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(repair.linkText)}</a></p>`;
      });
      if (repair.headingFrom && repair.headingTo) {
        const headingPattern = new RegExp(
          `(<h[1-6]\\b[^>]*>)${escapeRegExp(repair.headingFrom)}(<\\/h[1-6]>)`,
          "g",
        );
        output = output.replace(headingPattern, `$1${escapeHtml(repair.headingTo)}$2`);
      }
    } else {
      throw new Error(`未対応の公開リンク修復 mode: ${repair.mode}`);
    }

    const alreadyCompliant = before.includes(toUrl) && !before.includes(fromUrl);
    if (output === before && !alreadyCompliant) {
      throw new Error(`公開本文に修復元URLが見つかりません: ${fromUrl}`);
    }
    results.push({ mode: repair.mode, fromUrl, toUrl, changed: output !== before });
  }

  return {
    body: output,
    changed: output !== original,
    normalizedLegacyLinks: normalizeLegacyStats47Links(original) !== original,
    repairs: results,
  };
}

/**
 * 公開本文の末尾へ、主 CTA=次の1本、副 CTA=マガジンを追加する。
 * 同じURLが既にあれば再追加しない。stats47 の旧 http リンクは https へ正規化する。
 */
/**
 * 「次に読む」フッター見出しが 2 回以上ある本文を 1 回に畳む (2 個目以降の <hr><h2>次に読む</h2> だけを外し、
 * カード本体は残す)。2026-09-16 の商品カード一括追加で 190 本が二重化していた (最大 3 個)。
 */
export function collapseDuplicateFooterHeadings(body) {
  const pattern = /(?:<p [^>]*><br><\/p>)?<hr [^>]*><h2 [^>]*>次に読む<\/h2>/g;
  let seen = 0;
  return String(body).replace(pattern, (match) => (seen++ === 0 ? match : ""));
}

export function applyNavigationFooter(body, plan, { idFactory = randomUUID } = {}) {
  const original = String(body);
  let output = collapseDuplicateFooterHeadings(normalizeLegacyStats47Links(original));
  const dedupedFooterHeading = output !== normalizeLegacyStats47Links(original);
  const nextUrl = plan.nextNoteUrl ? assertCleanCardUrl(plan.nextNoteUrl, "note.com") : null;
  const magazineUrl = plan.magazineUrl ? assertCleanCardUrl(plan.magazineUrl, "note.com") : null;
  const siteUrl = plan.siteUrl ? assertCleanCardUrl(plan.siteUrl, "stats47.jp") : null;
  const productUrl = plan.productUrl ? assertCleanCardUrl(plan.productUrl, "stats47.jp") : null;
  const datasets = (plan.datasets || []).map((dataset) => ({
    ...dataset,
    noteUrl: assertCleanCardUrl(dataset.noteUrl, "note.com"),
  }));
  const additions = [];

  // 「次の 1 本」は views で選ばれ直すため URL が変わりうる。既に深掘りカードがある記事へ 2 枚目を積まない
  // (2026-09-20: s47-population 7 本で別記事へのカードが既にあり、URL 一致だけだと二重になる状態を検出)。
  const hasNextBlock = output.includes("もう一歩深掘りする");
  if (nextUrl && !hasNextBlock && !hasUrl(output, nextUrl)) {
    additions.push(
      `<p ${attrs(idFactory())}><strong>もう一歩深掘りする</strong><br>${escapeHtml(plan.nextNoteLead)}</p>`,
      noteCard(nextUrl, plan.nextNoteKey, idFactory),
    );
  }
  // 同マガジンの有料データセット記事 (magazine.datasetArticles)。無料記事から有料商品への直接導線になる。
  for (const dataset of datasets) {
    if (hasUrl(output, dataset.noteUrl)) continue;
    additions.push(
      `<p ${attrs(idFactory())}><strong>この記事の元データを手元で使う</strong><br>${escapeHtml(dataset.lead)}</p>`,
      noteCard(dataset.noteUrl, dataset.noteKey, idFactory),
    );
  }
  if (magazineUrl && !hasUrl(output, magazineUrl)) {
    additions.push(
      `<p ${attrs(idFactory())}><strong>同じテーマの記事をまとめて読む</strong><br>読みたい順に探せるマガジンです。</p>`,
      externalCard(magazineUrl, plan.magazineName, plan.magazineDescription, idFactory),
    );
  }
  // 本文中に別の stats47 リンクがあっても、catalog が指定した主着地は省略しない。
  // a-kakei は根拠ランキングへの本文リンクを持つため、host 単位で判定すると
  // 県別ブログへの主 CTA が消えていた。重複判定は対象 URL 単位で行う。
  if (siteUrl && !hasUrl(output, siteUrl)) {
    additions.push(
      `<p ${attrs(idFactory())}><strong>47都道府県のデータを確認する</strong><br>${escapeHtml(plan.siteDescription)}</p>`,
      externalCard(siteUrl, plan.siteTitle, plan.siteDescription, idFactory),
    );
  }
  if (productUrl && !hasUrl(output, productUrl)) {
    additions.push(
      `<p ${attrs(idFactory())}><strong>このテーマをまとめて読む・使う</strong><br>${escapeHtml(plan.productDescription)}</p>`,
      externalCard(productUrl, plan.productTitle, plan.productDescription, idFactory),
    );
  }

  if (additions.length > 0) {
    // 既に「次に読む」フッターがある記事へ枠を足すときは、見出しを二重に作らず末尾へ追記する。
    if (/<h2\b[^>]*>次に読む<\/h2>/.test(output)) {
      output += additions.join("");
    } else {
      const dividerId = idFactory();
      const headingId = idFactory();
      output += `<hr ${attrs(dividerId)}><h2 ${attrs(headingId)}>次に読む</h2>${additions.join("")}<p ${attrs(idFactory())}><br></p>`;
    }
  }

  return {
    body: output,
    changed: output !== original,
    normalizedLegacyLinks: output !== original && normalizeLegacyStats47Links(original) !== original,
    addedNextNote: Boolean(nextUrl) && additions.some((part) => part.includes(`data-src="${nextUrl}"`)),
    addedMagazine: Boolean(magazineUrl) && additions.some((part) => part.includes(`data-src="${magazineUrl}"`)),
    addedSite: Boolean(siteUrl) && additions.some((part) => part.includes(`data-src="${siteUrl}"`)),
    addedProduct: Boolean(productUrl) && additions.some((part) => part.includes(`data-src="${productUrl}"`)),
    addedDataset: datasets.some((dataset) => additions.some((part) => part.includes(`data-src="${dataset.noteUrl}"`))),
    dedupedFooterHeading,
    additionsPreview: additions.map((part) => part.replace(/\s+/g, " ").slice(0, 90)),
  };
}

/** 無料記事に残る旧試し読み境界より前へ、一般読者に不足している導線だけを追加する。 */
export function applyVisibleNavigationBeforeSeparator(
  body,
  publicBody,
  separator,
  plan,
  { idFactory = randomUUID } = {},
) {
  const original = String(body);
  const visible = String(publicBody);
  const preview = applyNavigationFooter(visible, plan, { idFactory });
  if (!preview.changed) return { ...preview, body: original, changed: false };
  // 二重見出しの畳み込みはプレビューの中身を変えるので「末尾への追記」ではない。追記が無く畳み込みだけなら
  // 全文に同じ畳み込みを掛けて返す (公開プレビュー部分は全文の先頭にそのまま含まれる)。
  const collapsedVisible = collapseDuplicateFooterHeadings(normalizeLegacyStats47Links(visible));
  if (preview.body === collapsedVisible) {
    if (!original.startsWith(visible)) throw new Error("公開プレビュー本文が全文の先頭と一致しません");
    return { ...preview, body: collapseDuplicateFooterHeadings(normalizeLegacyStats47Links(original)), changed: true };
  }
  if (!preview.body.startsWith(collapsedVisible)) throw new Error("公開プレビュー本文を安全に拡張できません");
  const separatorIndex = original.indexOf(separator);
  const insertionIndex = original.lastIndexOf("<", separatorIndex);
  if (separatorIndex < 0 || insertionIndex < 0) throw new Error("旧試し読み境界を本文内で確認できません");
  const addition = preview.body.slice(collapsedVisible.length);
  const base = collapsedVisible === visible ? original : original.replace(visible, collapsedVisible);
  const baseInsertion = base.lastIndexOf("<", base.indexOf(separator));
  return {
    ...preview,
    body: `${base.slice(0, baseInsertion)}${addition}${base.slice(baseInsertion)}`,
    changed: true,
  };
}
