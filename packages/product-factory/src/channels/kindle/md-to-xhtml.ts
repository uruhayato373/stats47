/**
 * ブログ / 書き下ろし markdown → EPUB 用 XHTML 変換 (決定的・ブログ記法サブセット)。
 *
 * 対応: 見出し (#/##/###)、段落、箇条書き (-)、強調 (**)、画像 (![alt](images/..))、
 *       callout (> [!NOTE]/[!TIP]/[!WARNING])。
 * 除去: <source-link>/<data-source>/<ad-slot>/<affiliate-banner> (書籍内に CTA・外部リンクを撒かない)。
 * 商品の決定的な数値表は pipe 形式に対応。出力は整形式 XHTML (要素は self-close/escape)。
 */

const CALLOUT_LABEL: Record<string, string> = {
  NOTE: "メモ",
  TIP: "ヒント",
  WARNING: "注意",
  IMPORTANT: "重要",
  CAUTION: "注意",
};

/**
 * XML エスケープ。
 *
 * ★`"` を必ず含める。出力は `alt="..."` / `src="..."` のように**二重引用符の属性値**へ入るため、
 * `"` を残すと属性が途中で閉じて XHTML が整形式でなくなる (EPUB は整形式 XML を要求するので
 * 本文中に `"` を含む alt が 1 つあるだけで書籍が壊れる)。CodeQL の
 * js/incomplete-html-attribute-sanitization が指摘していた欠陥。
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** インライン: 強調 **..**、画像は別処理、リンクはテキスト化 (外部リンクを書籍に残さない)。 */
function inline(s: string): string {
  let out = esc(s);
  // [text](url) → text (リンク除去・CTA/UTM を書籍に持ち込まない)
  out = out.replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, "$1");
  // **bold**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return out;
}

/** 除去対象のインラインタグ / カスタムタグ行を落とす。 */
function stripCustomTags(md: string): string {
  return md
    .replace(/<source-link[^>]*>[\s\S]*?<\/source-link>/gi, "")
    .replace(/<data-source[^>]*>[\s\S]*?<\/data-source>/gi, "")
    .replace(/<ad-slot[^>]*>[\s\S]*?<\/ad-slot>/gi, "")
    .replace(/<ad-slot[^>]*\/?>/gi, "")
    .replace(/<affiliate-banner[^>]*>[\s\S]*?<\/affiliate-banner>/gi, "")
    .replace(/<affiliate-banner[^>]*\/?>/gi, "");
}

/**
 * markdown を XHTML 本文断片 (章の中身) に変換する。<section> 等のラッパは付けない。
 * imgResolver: 画像パス (images/foo.png) → EPUB 内相対パス。省略時はそのまま。
 */
export function mdToXhtml(mdRaw: string, imgResolver?: (src: string) => string): string {
  const md = stripCustomTags(mdRaw);
  const lines = md.split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let i = 0;

  const flushPara = (): void => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" ")).trim()}</p>`);
      para = [];
    }
  };
  const flushList = (): void => {
    if (list.length) {
      out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join("")}</ul>`);
      list = [];
    }
  };
  const flush = (): void => {
    flushPara();
    flushList();
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 空行 = 段落境界
    if (trimmed === "") {
      flush();
      i += 1;
      continue;
    }

    // 見出し
    if (trimmed.startsWith("|") && /^\|(?:\s*:?-+:?\s*\|)+$/.test(lines[i + 1]?.trim() ?? "")) {
      flush();
      const cells = (row: string): string[] => row.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      const head = cells(trimmed);
      const body: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|") && cells(lines[i]).length === head.length) {
        body.push(cells(lines[i]));
        i += 1;
      }
      out.push(`<table><thead><tr>${head.map(c => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map(row => `<tr>${row.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
      continue;
    }

    const h = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      flush();
      const level = Math.min(h[1].length + 1, 6); // # は章タイトルより下げて h2 起点
      out.push(`<h${level}>${inline(h[2])}</h${level}>`);
      i += 1;
      continue;
    }

    // 画像 ![alt](src)
    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      flush();
      const src = imgResolver ? imgResolver(img[2]) : img[2];
      out.push(`<figure><img src="${esc(src)}" alt="${esc(img[1])}"/></figure>`);
      i += 1;
      continue;
    }

    // callout: > [!NOTE] ... 継続する > 行を集める
    const callout = trimmed.match(/^>\s*\[!(\w+)\]\s*(.*)$/);
    if (callout) {
      flush();
      const label = CALLOUT_LABEL[callout[1].toUpperCase()] ?? callout[1];
      const buf: string[] = [];
      if (callout[2].trim()) buf.push(callout[2].trim());
      i += 1;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const t = lines[i].trim().replace(/^>\s?/, "");
        if (t.trim()) buf.push(t.trim());
        i += 1;
      }
      out.push(
        `<aside class="callout"><p class="callout-label">${esc(label)}</p><p>${inline(buf.join(" "))}</p></aside>`,
      );
      continue;
    }

    // 箇条書き
    const li = trimmed.match(/^[-*]\s+(.*)$/);
    if (li) {
      flushPara();
      list.push(li[1]);
      i += 1;
      continue;
    }

    // 通常の段落行
    flushList();
    para.push(trimmed);
    i += 1;
  }
  flush();
  return out.join("\n");
}
