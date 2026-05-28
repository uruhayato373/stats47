/**
 * svg-lint — ブログ/note チャート SVG の品質 lint (共有ライブラリ)
 *
 * generate-article-charts.mjs (単一記事の --validate) と
 * audit-chart-quality.mjs (全記事バッチ監査) の両方から使う決定的 lint。
 *
 * 判定は 2 段階:
 *   - errors:   描画が壊れる致命的問題 (viewBox/width/height/閉じタグ) → CI fail
 *   - warnings: 機能はするが品質基準未達 (dark mode 非対応 / theme 色 inline 直書き)
 *
 * 設計方針 (CLAUDE.md 原則 5): SVG 品質判定は決定的なのでコードで一律検査する。
 * 関連: packages/svg-builder (描画) / .claude/scripts/blog/generate-article-charts.mjs
 */

// theme 依存色 = ダークモードで追従させるべき背景・文字・グリッド色。
// これらが inline fill/stroke で直書きされていると <img> 埋め込み時に dark mode で
// 追従しない (svg-builder の svg-* class + @media prefers-color-scheme で対応すべき)。
// データ色 (棒・ドット・地方ブロックの vivid 色) は light/dark 両対応なので対象外。
export const THEME_DEPENDENT_COLORS = [
  // 背景
  "#ffffff", "#fff", "#fafafa", "#f9fafb", "#f8fafc",
  // 暗いテキスト
  "#333", "#222", "#111827", "#1f2937", "#374151",
  // 中間テキスト
  "#6b7280", "#888", "#999", "#aaa", "#bbb",
  // グリッド
  "#e5e7eb", "#ebebeb", "#ccc",
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * SVG 文字列を lint する。
 * @param {string} content - SVG 文字列 (先頭 provenance コメント可)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintSvgContent(content) {
  const errors = [];
  const warnings = [];
  const c = content.trim();
  // 先頭の HTML コメント (svg-builder/CLI が付与する <!-- data-source... --> provenance) を
  // 除いた本体で開始タグを判定する。
  const body = c.replace(/^(?:<!--[\s\S]*?-->\s*)+/, "");

  // --- 構造 (ERROR) ---
  if (!body.startsWith("<svg") && !body.startsWith("<?xml")) {
    errors.push("does not start with <svg or <?xml");
  }
  if (!c.endsWith("</svg>")) {
    errors.push("does not end with </svg>");
  }
  if (!/viewBox\s*=/.test(c)) {
    errors.push("missing viewBox attribute");
  }
  if (!/\bwidth\s*=/.test(c) || !/\bheight\s*=/.test(c)) {
    errors.push("missing width or height attribute");
  }

  // --- dark mode 対応 (WARN) ---
  if (!/prefers-color-scheme\s*:\s*dark/.test(c)) {
    warnings.push(
      "dark mode 非対応: @media (prefers-color-scheme:dark) の <style> がない。" +
        " svg-builder 経由で再生成すると dark 対応になる",
    );
  }

  // --- theme 依存色の inline 直書き (WARN) ---
  const foundColors = THEME_DEPENDENT_COLORS.filter((col) => {
    const re = new RegExp(`(?:fill|stroke)\\s*=\\s*"${escapeRegExp(col)}"`, "i");
    return re.test(c);
  });
  if (foundColors.length > 0) {
    warnings.push(
      `theme 依存色を inline 指定: ${foundColors.join(", ")} —` +
        ` svg-* class (svg-bg/svg-title/svg-axis/svg-tick/svg-grid) に置換すると dark mode 追従`,
    );
  }

  return { errors, warnings };
}

/**
 * Markdown 本文からインライン <svg>...</svg> ブロックを抽出する。
 * @param {string} md - Markdown 文字列
 * @returns {string[]}
 */
export function extractInlineSvgs(md) {
  const matches = md.match(/<svg[\s\S]*?<\/svg>/g);
  return matches ?? [];
}
