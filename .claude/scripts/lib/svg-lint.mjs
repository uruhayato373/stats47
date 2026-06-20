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
  // svgThemeStyle() (@media prefers-color-scheme:dark) を含む = svg-builder 出力で、
  // 何を dark 追従させ何を固定するかは意図的に選択済み。カード型2列ランキング
  // (layout:"columns") はライト固定のカード島 (#ffffff カード背景 / #1f2937 県名) を
  // 意図的に使うため、ここで残る inline 色は誤検知。dark style がある SVG はこの WARN を出さない。
  const hasThemeStyle = /prefers-color-scheme\s*:\s*dark/.test(c);
  if (!hasThemeStyle) {
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
  }

  return { errors, warnings };
}

// ---------- カタログ別 正規サイズ (アスペクト比統一・再発防止) ----------
// 正典: blog-svg-chart-standards.md §5。filename→chartType→正規 viewBox 幅。
// width が固定の不変量 (高さは件数/内容で可変)。違反は「非正規サイズ = 再生成すべき」。
// 統一済みカタログ (ENFORCED) = error / 未統一 = warning (統一完了後 error に昇格)。
const CANONICAL_WIDTH = {
  bar: [960, 680],          // columns 960 (標準) / single 680。760/720/600 等の旧サイズは違反
  "tile-grid": [600],       // 600×700
  summary: [960],           // findings card 幅 960 (高さ可変)
  line: [680],              // 680×420 (未統一→warn)
  scatter: [960],           // §5標準 960×624 (未統一→warn)
  "stacked-bar": [680],     // 680×可変 (未統一→warn)
};
const SIZE_ENFORCED = new Set(["bar", "tile-grid", "summary"]); // error にするカタログ

/** SVG ファイル名 → chartType (generate-article-charts の classifyChartType と同等の suffix 判定) */
export function classifyChartTypeFromName(filename) {
  const f = String(filename).replace(/\.svg$/i, "").toLowerCase();
  if (/(?:-prefecture-rankings|-top5-bottom5|-top-bottom|-rate-ranking|-income-ranking|-ranking|-rankings)$/.test(f)) return "bar";
  if (/(?:-tile-grid|-income-map|-ratio-map|-map)$/.test(f)) return "tile-grid";
  if (/(?:-national-trend|-timeseries|-trend)$/.test(f)) return "line";
  if (/-scatter$/.test(f)) return "scatter";
  if (/-stacked$/.test(f)) return "stacked-bar";
  if (/(?:-summary-findings|-findings)$/.test(f)) return "summary";
  return null; // 分類不能 (無意味名 inline-chart-N 等) は対象外
}

/**
 * SVG の viewBox 幅がカタログの正規サイズに一致するか検査する (アスペクト比統一・再発防止)。
 * @param {string} filename - SVG ファイル名 (chartType 推定に使う)
 * @param {string} content - SVG 文字列
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintSvgSize(filename, content) {
  const errors = [];
  const warnings = [];
  const ct = classifyChartTypeFromName(filename);
  if (!ct || !CANONICAL_WIDTH[ct]) return { errors, warnings }; // 分類不能は対象外
  const m = String(content).match(/viewBox\s*=\s*"0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!m) return { errors, warnings }; // viewBox 欠落は別 check (lintSvgContent) が捕捉
  const w = Math.round(parseFloat(m[1]));
  const allowed = CANONICAL_WIDTH[ct];
  if (!allowed.includes(w)) {
    const msg = `非正規サイズ: ${ct} の viewBox 幅 ${w} は正規 [${allowed.join("/")}] でない (${path_base(filename)})。` +
      ` svg-builder で再生成して統一する (ranking は rerender-ranking-columns.mts、tile/scatter/line は対応 restorer)`;
    (SIZE_ENFORCED.has(ct) ? errors : warnings).push(msg);
  }
  return { errors, warnings };
}
function path_base(p) { const s = String(p).split("/"); return s[s.length - 1]; }

/**
 * Markdown 本文からインライン <svg>...</svg> ブロックを抽出する。
 * @param {string} md - Markdown 文字列
 * @returns {string[]}
 */
export function extractInlineSvgs(md) {
  const matches = md.match(/<svg[\s\S]*?<\/svg>/g);
  return matches ?? [];
}
