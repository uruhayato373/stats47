import { randomUUID } from "node:crypto";

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

function externalCard(url, title, description, idFactory) {
  const id = idFactory();
  const embed = `emb${idFactory().replaceAll("-", "").slice(0, 12)}`;
  const hostname = new URL(url).hostname;
  return `<figure ${attrs(id)} data-src="${escapeHtml(url)}" data-identifier="null" embedded-service="external-article" embedded-content-key="${embed}">\n<a href="${escapeHtml(url)}" rel="nofollow noopener" target="_blank">\n<strong>${escapeHtml(title)}</strong>\n<em>${escapeHtml(description)}</em>\n<em>${escapeHtml(hostname)}</em>\n</a><a href="${escapeHtml(url)}" rel="nofollow noopener" target="_blank"></a>\n</figure>`;
}

function hasUrl(body, url) {
  return body.includes(`data-src="${url}"`) || body.includes(`href="${url}"`);
}

function hasStats47Url(body) {
  return /\b(?:href|data-src)="https?:\/\/(?:www\.)?stats47\.jp(?:[\/"?#]|$)/i.test(body);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 公開本文に残る既知の旧URLだけを catalog 契約に従って修復する。 */
export function applyPublishedLinkRepairs(body, repairs, { idFactory = randomUUID } = {}) {
  const original = String(body);
  let output = normalizeLegacyStats47Links(original);
  const results = [];

  for (const repair of repairs || []) {
    const fromUrl = assertCleanCardUrl(repair.fromUrl, "stats47.jp");
    const toUrl = assertCleanCardUrl(repair.toUrl, "stats47.jp");
    const before = output;

    if (repair.mode === "replace-url") {
      output = output.replaceAll(fromUrl, toUrl);
    } else if (repair.mode === "replace-card") {
      const figurePattern = new RegExp(
        `<figure\\b[^>]*\\bdata-src="${escapeRegExp(fromUrl)}"[^>]*>[\\s\\S]*?<\\/figure>`,
        "g",
      );
      output = output.replace(figurePattern, (figure) => {
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
export function applyNavigationFooter(body, plan, { idFactory = randomUUID } = {}) {
  const original = String(body);
  let output = normalizeLegacyStats47Links(original);
  const nextUrl = plan.nextNoteUrl ? assertCleanCardUrl(plan.nextNoteUrl, "note.com") : null;
  const magazineUrl = plan.magazineUrl ? assertCleanCardUrl(plan.magazineUrl, "note.com") : null;
  const siteUrl = plan.siteUrl ? assertCleanCardUrl(plan.siteUrl, "stats47.jp") : null;
  const productUrl = plan.productUrl ? assertCleanCardUrl(plan.productUrl, "stats47.jp") : null;
  const additions = [];

  if (nextUrl && !hasUrl(output, nextUrl)) {
    additions.push(
      `<p ${attrs(idFactory())}><strong>もう一歩深掘りする</strong><br>${escapeHtml(plan.nextNoteLead)}</p>`,
      noteCard(nextUrl, plan.nextNoteKey, idFactory),
    );
  }
  if (magazineUrl && !hasUrl(output, magazineUrl)) {
    additions.push(
      `<p ${attrs(idFactory())}><strong>同じテーマの記事をまとめて読む</strong><br>読みたい順に探せるマガジンです。</p>`,
      externalCard(magazineUrl, plan.magazineName, plan.magazineDescription, idFactory),
    );
  }
  if (siteUrl && !hasStats47Url(output)) {
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
    const dividerId = idFactory();
    const headingId = idFactory();
    output += `<hr ${attrs(dividerId)}><h2 ${attrs(headingId)}>次に読む</h2>${additions.join("")}<p ${attrs(idFactory())}><br></p>`;
  }

  return {
    body: output,
    changed: output !== original,
    normalizedLegacyLinks: output !== original && normalizeLegacyStats47Links(original) !== original,
    addedNextNote: Boolean(nextUrl) && additions.some((part) => part.includes(`data-src="${nextUrl}"`)),
    addedMagazine: Boolean(magazineUrl) && additions.some((part) => part.includes(`data-src="${magazineUrl}"`)),
    addedSite: Boolean(siteUrl) && additions.some((part) => part.includes(`data-src="${siteUrl}"`)),
    addedProduct: Boolean(productUrl) && additions.some((part) => part.includes(`data-src="${productUrl}"`)),
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
  if (!preview.body.startsWith(visible)) throw new Error("公開プレビュー本文を安全に拡張できません");
  const separatorIndex = original.indexOf(separator);
  const insertionIndex = original.lastIndexOf("<", separatorIndex);
  if (separatorIndex < 0 || insertionIndex < 0) throw new Error("旧試し読み境界を本文内で確認できません");
  const addition = preview.body.slice(visible.length);
  return {
    ...preview,
    body: `${original.slice(0, insertionIndex)}${addition}${original.slice(insertionIndex)}`,
    changed: true,
  };
}
