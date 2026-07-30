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
 *
 * `filename` を渡すと chartType を推定し、テーマ関連の 2 つの WARN
 * (dark mode 非対応 / theme 依存色の inline 直書き) を **tile-grid では出さない**。
 * タイルマップは仕様上テーマ非依存 (透過背景 + 固定配色) で、
 * `@media (prefers-color-scheme)` を持たないことが正しい ({@link lintTileGridQuality} 参照)。
 * これを渡さないと「dark 対応にしろ」と「テーマ依存にするな」で指示が矛盾する。
 *
 * @param {string} content - SVG 文字列 (先頭 provenance コメント可)
 * @param {string} [filename] - SVG ファイル名 (chartType 推定用・省略可)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintSvgContent(content, filename) {
  const errors = [];
  const warnings = [];
  const c = content.trim();
  const isThemeIndependent =
    filename !== undefined && classifyChartTypeFromName(filename) === "tile-grid";
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

  // --- テンプレート未解決の描画 (ERROR) ---
  // 生成器がテンプレートリテラルに undefined/null/NaN/[object Object] を埋めると、
  // そのまま文字として SVG に焼き込まれる。実際に本番の 1 枚で凡例が "undefined" に
  // なっていた (2026-07-29 発見。data json の legendLabels が配列でなくオブジェクト形
  // だったが、旧生成器が検証せず legendLabels[0] を埋めていた)。
  // 描画される <text> の中身だけを見る (id や属性値の "undefined" は誤検知になるため)。
  for (const m of c.matchAll(/<(?:text|tspan)\b[^>]*>([^<]*)</g)) {
    const t = m[1];
    if (/\b(?:undefined|NaN)\b|\[object Object\]/.test(t)) {
      errors.push(
        `SVG に未解決のテンプレート値が描画されている: "${t.trim().slice(0, 40)}" —` +
          ` 生成器に渡すデータの形を確認する (欠損値をそのまま埋めていないか)`,
      );
      break; // 1 件出れば十分 (同じ原因で複数出るため)
    }
  }

  // --- dark mode 対応 (WARN) ---
  if (!isThemeIndependent && !/prefers-color-scheme\s*:\s*dark/.test(c)) {
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
  if (!hasThemeStyle && !isThemeIndependent) {
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
  "tile-grid": [780],       // 780×560 (2026-07-29 に 600×700 から変更。lintTileGridQuality 参照)
  summary: [960],           // findings card 幅 960 (高さ可変)
  line: [680],              // 680×420
  scatter: [960],           // 960×624
  "stacked-bar": [680],     // 680×可変
};
// 全カタログ統一完了 (2026-06-21): both 全件が正規幅。error で再発防止する。
const SIZE_ENFORCED = new Set(["bar", "tile-grid", "summary", "scatter", "line", "stacked-bar"]);

/** SVG ファイル名 → chartType (generate-article-charts の classifyChartType と同等の suffix 判定) */
export function classifyChartTypeFromName(filename) {
  const f = String(filename).replace(/\.svg$/i, "").toLowerCase();
  if (/(?:-prefecture-rankings|-top5-bottom5|-top-bottom|-rate-ranking|-income-ranking|-ranking|-rankings)$/.test(f)) return "bar";
  if (/(?:-tile-grid|-tilemap|-income-map|-ratio-map|-map)$/.test(f)) return "tile-grid";
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

/** SVG 文字列 → 表示テキスト (タグ除去 + XML エンティティ復元 + 空白正規化) */
function svgPlainText(svgContent) {
  return String(svgContent)
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, "");
}

/**
 * choropleth (tile-grid) の凡例 意味的ラベル誤用を検査する (SVG × data json のペア検査)。
 *
 * 背景 (2026-07-13): 旧デフォルト ["安全","危険"] (交通事故マップ由来) が消費支出額等の
 * 中立指標マップ全数に焼き込まれていた。現デフォルトは ["低い","高い"] で、意味的ラベルは
 * json の legendLabels 明示時のみ許可する (blog-svg-chart-standards.md §2-A choropleth)。
 *
 * @param {string} filename - SVG ファイル名 (chartType 推定)
 * @param {string} svgContent - SVG 文字列
 * @param {object|undefined} jsonData - 対応する data/<name>.json のパース結果 (無ければ undefined)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintChoroplethLegend(filename, svgContent, jsonData) {
  const errors = [];
  const warnings = [];
  const ct = jsonData?.chartType === "tile-grid" ? "tile-grid" : classifyChartTypeFromName(filename);
  if (ct !== "tile-grid") return { errors, warnings };
  const svg = String(svgContent);
  const hasExplicit = Array.isArray(jsonData?.legendLabels) && jsonData.legendLabels.length === 2;
  const semantic = svg.match(/<text[^>]*>(安全|危険|良い|悪い)<\/text>/);
  if (semantic && !hasExplicit) {
    errors.push(
      `凡例に意味的ラベル「${semantic[1]}」が json の legendLabels 明示なしに焼き込まれている` +
      ` (既定は 低い/高い。意味的ラベルは指標の意味が確実な場合のみ json に legendLabels を明示する)`
    );
  }
  if (!semantic && !hasExplicit && !/<text[^>]*>低い</.test(svg)) {
    warnings.push("凡例ラベル (低い/高い) が見つからない — 旧デザインの可能性。svg-builder で再生成して統一する");
  }
  return { errors, warnings };
}

// ---------- tile-grid の品質不変量 (2026-07-29) ----------
/** タイルマップの正規キャンバス。blog-svg-chart-standards.md §5 と choropleth.ts が正典。 */
export const TILE_GRID_CANVAS = { w: 780, h: 560 };

/**
 * タイルマップ (choropleth) が現行デザインの不変量を満たすか検査する。
 *
 * 「プロジェクト内のタイルマップを全て同じ品質に保つ」ための決定的ゲート。
 * 旧デザイン (600×700・不透明背景・OS 追従ダークモード) の残存を検出する。
 *
 * 検査する不変量と、それぞれの理由:
 *
 * 1. **キャンバス 780×560** — 記事では 672px 幅の `<img>` になるため、画面上の高さは
 *    `672 × H/W` で決まる。旧 600×700 は 784px となり記事を占有していた。
 * 2. **背景を敷かない** — 不透明な地色があるとページの地色と食い違う。透過ならライトでも
 *    ダークでも記事に馴染む。
 * 3. **`prefers-color-scheme` を使わない** — サイトのテーマは next-themes の class 方式で
 *    `enableSystem={false}`。OS を意図的に無視するので、SVG 側が OS に追従すると
 *    **OS ダーク + サイトライト**で SVG だけ反転する。`<img>` 内から親の class は見えないため、
 *    テーマ非依存の配色にするのが唯一の正解。
 * 4. **`svg-*` テーマ class を使わない** — 3 と同じ理由。`svgThemeStyle()` は tile-grid では使わない。
 * 5. **凡例が右下** — 左上は上位/下位リストが占めるため。
 * 6. **上位/下位リストがある** — 左カラムの空白を埋め、地図だけでは読み取れない実数値を出す。
 *
 * @param {string} filename - SVG ファイル名 (chartType 推定)
 * @param {string} svgContent - SVG 文字列
 * @param {object|undefined} [jsonData] - 対応する data/<name>.json (chartType の明示に使う)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintTileGridQuality(filename, svgContent, jsonData) {
  const errors = [];
  const warnings = [];
  const ct = jsonData?.chartType === "tile-grid" ? "tile-grid" : classifyChartTypeFromName(filename);
  if (ct !== "tile-grid") return { errors, warnings };
  const svg = String(svgContent);
  const { w: CW, h: CH } = TILE_GRID_CANVAS;

  // 1. キャンバス寸法 (幅は lintSvgSize も見るが、高さはここでしか見ない)
  const vb = svg.match(/viewBox\s*=\s*"0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (vb) {
    const w = Math.round(parseFloat(vb[1]));
    const h = Math.round(parseFloat(vb[2]));
    if (w !== CW || h !== CH) {
      errors.push(
        `タイルマップのキャンバスが ${w}×${h} — 正規は ${CW}×${CH}` +
          ` (記事内は 672px 幅で描画されるため、この比率が画面上の占有高さを決める)。svg-builder で再生成する`,
      );
    }
  }

  // 2. 不透明な背景 (キャンバス全面を覆う rect)
  const bgRect = svg.match(
    new RegExp(`<rect(?![^>]*\\bx=)[^>]*width="${CW}"[^>]*height="${CH}"[^>]*>`),
  );
  if (bgRect || /class="svg-(bg|plot)"/.test(svg)) {
    errors.push(
      "背景 rect が敷かれている — タイルマップは透過にしてページの地色に馴染ませる" +
        " (ライト/ダークの両対応がこれで同時に成立する)",
    );
  }

  // 3-4. テーマ依存の指定
  if (/prefers-color-scheme/.test(svg)) {
    errors.push(
      "`@media (prefers-color-scheme)` を含む — サイトのテーマは OS を参照しない" +
        " (next-themes / enableSystem=false) ため、OS とサイトが食い違うと SVG だけ色が反転する。" +
        "テーマ非依存の配色にする",
    );
  }
  if (/class="svg-(title|axis|tick|grid|plot-border)"/.test(svg)) {
    errors.push(
      "テーマ依存の svg-* class を使っている — tile-grid では svgThemeStyle() を使わない (理由は上に同じ)",
    );
  }

  // 5. 凡例が右下にあるか (グラデーションバーの位置で判定)
  const bar = svg.match(/<rect x="([\d.]+)" y="([\d.]+)"[^>]*fill="url\(#choropleth-lg\)"/);
  if (!bar) {
    errors.push("凡例のグラデーションバーが見つからない — svg-builder で再生成する");
  } else {
    const bx = parseFloat(bar[1]);
    const by = parseFloat(bar[2]);
    if (bx < CW / 2 || by < CH / 2) {
      errors.push(
        `凡例が右下にない (x=${bx}, y=${by})。左上は上位/下位リストが使うため凡例は右下に置く`,
      );
    }
  }

  // 6. 上位/下位リスト (タイルが 3 件以上あるときのみ要求)
  const tileCount = (svg.match(/<rect [^>]*rx="3"[^>]*fill="(?:rgb\(|#)/g) || []).length;
  const hasRankList = /高い順/.test(svg) && /低い順/.test(svg);
  if (tileCount >= 3 && !hasRankList) {
    warnings.push("上位/下位リストが見つからない — 旧デザインの可能性。svg-builder で再生成して統一する");
  }
  return { errors, warnings };
}

/**
 * findings カードの json ↔ SVG 内容パリティを検査する (SVG × data json のペア検査)。
 *
 * 背景 (2026-07-13): renderer が json の {heading, text} 構造の heading (太字見出し) を捨てて
 * text だけ描画する退行バグが発生し、本番 1 記事で heading 4/4 が欠落した。json の全 heading/text
 * が SVG に描画されていることを決定的に担保する。
 *
 * @param {string} filename - SVG ファイル名 (chartType 推定)
 * @param {string} svgContent - SVG 文字列
 * @param {object|Array|undefined} jsonData - 対応する data/<name>.json のパース結果
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintFindingsParity(filename, svgContent, jsonData) {
  const errors = [];
  const warnings = [];
  const ct = jsonData?.chartType === "summary" ? "summary" : classifyChartTypeFromName(filename);
  if (ct !== "summary") return { errors, warnings };
  const items = Array.isArray(jsonData) ? jsonData : jsonData?.findings;
  if (!Array.isArray(items) || items.length === 0) return { errors, warnings };
  const plain = svgPlainText(svgContent);
  const expected = [];
  for (const it of items) {
    if (typeof it === "string") expected.push(it);
    else if (it && typeof it === "object") {
      if (it.heading) expected.push(it.heading);
      if (it.text) expected.push(it.text);
    }
  }
  const missing = expected.filter((t) => t && !plain.includes(String(t).replace(/\s+/g, "")));
  if (missing.length > 0) {
    errors.push(
      `findings の内容欠落 ${missing.length}/${expected.length} 件 — json の heading/text が SVG に描画されていない` +
      ` (例: "${String(missing[0]).slice(0, 30)}")。generate-article-charts で再生成が必要 (過去に renderer の heading 脱落バグで発生)`
    );
  }
  return { errors, warnings };
}
