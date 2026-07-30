/**
 * section-upsert — improvement-log の `## <headerId>` セクションを冪等に差し替える。
 *
 * 元実装は `measure-gsc-impact.mjs` にインラインであった正規表現 upsert。
 * adapter が増えるたびに同じ正規表現を書き写すのを避けるため純粋関数として切り出す。
 *
 * 挙動:
 * - 同じ headerId の `## ` セクションがあれば、その次の `## ` (または末尾) までを置換する
 * - 無ければ**最初の `## ` の直前**に挿入する (新しい判定を上に積む)
 * - `## ` が 1 つも無いログ (H1 + 注記だけの新規ファイル) では末尾に追記する
 */

/**
 * @param {string} logText 既存ログ全文 (空文字も可)
 * @param {string} headerId `## ` の後ろに来る見出し文字列。例 "[BLOG-WAVE-2026-05-25-auto]"
 * @param {string} md 差し替える section 本文。先頭の改行は正規化される
 * @returns {string} 更新後の全文
 */
export function upsertSection(logText, headerId, md) {
  const body = normalizeSection(headerId, md);
  const text = typeof logText === "string" ? logText : "";
  const header = `## ${headerId}`;

  if (text.includes(header)) {
    const re = new RegExp(`\\n## ${escapeRegExp(headerId)}[\\s\\S]*?(?=\\n## |\\n*$)`);
    if (re.test(text)) return text.replace(re, body);
    // 先頭行が header の場合 (直前に改行が無い) のフォールバック
    const re2 = new RegExp(`^## ${escapeRegExp(headerId)}[\\s\\S]*?(?=\\n## |\\n*$)`);
    return text.replace(re2, body.replace(/^\n+/, ""));
  }

  const idx = text.indexOf("\n## ");
  if (idx >= 0) return text.slice(0, idx) + body + text.slice(idx);
  // `## ` が無い = 新規ログ。H1 / 注記の後ろに積む。
  return (text.trimEnd() + "\n" + body).replace(/^\n+/, "");
}

/** section が `\n## <headerId>\n\n` で始まり末尾に改行 1 つで終わる形に正規化する。 */
function normalizeSection(headerId, md) {
  let s = String(md ?? "").replace(/^\n+/, "").trimEnd();
  const header = `## ${headerId}`;
  if (!s.startsWith(header)) s = `${header}\n\n${s}`;
  return `\n${s}\n`;
}

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/-/g, "\\-");
}
