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
  '#ffffff',
  '#fff',
  '#fafafa',
  '#f9fafb',
  '#f8fafc',
  // 暗いテキスト
  '#333',
  '#222',
  '#111827',
  '#1f2937',
  '#374151',
  // 中間テキスト
  '#6b7280',
  '#888',
  '#999',
  '#aaa',
  '#bbb',
  // グリッド
  '#e5e7eb',
  '#ebebeb',
  '#ccc',
];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    filename !== undefined &&
    classifyChartTypeFromName(filename) === 'tile-grid';
  // 先頭の HTML コメント (svg-builder/CLI が付与する <!-- data-source... --> provenance) を
  // 除いた本体で開始タグを判定する。
  const body = c.replace(/^(?:<!--[\s\S]*?-->\s*)+/, '');

  // --- 構造 (ERROR) ---
  if (!body.startsWith('<svg') && !body.startsWith('<?xml')) {
    errors.push('does not start with <svg or <?xml');
  }
  if (!c.endsWith('</svg>')) {
    errors.push('does not end with </svg>');
  }
  if (!/viewBox\s*=/.test(c)) {
    errors.push('missing viewBox attribute');
  }
  if (!/\bwidth\s*=/.test(c) || !/\bheight\s*=/.test(c)) {
    errors.push('missing width or height attribute');
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
          ` 生成器に渡すデータの形を確認する (欠損値をそのまま埋めていないか)`
      );
      break; // 1 件出れば十分 (同じ原因で複数出るため)
    }
  }

  // --- dark mode 対応 (WARN) ---
  if (!isThemeIndependent && !/prefers-color-scheme\s*:\s*dark/.test(c)) {
    warnings.push(
      'dark mode 非対応: @media (prefers-color-scheme:dark) の <style> がない。' +
        ' svg-builder 経由で再生成すると dark 対応になる'
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
      const re = new RegExp(
        `(?:fill|stroke)\\s*=\\s*"${escapeRegExp(col)}"`,
        'i'
      );
      return re.test(c);
    });
    if (foundColors.length > 0) {
      warnings.push(
        `theme 依存色を inline 指定: ${foundColors.join(', ')} —` +
          ` svg-* class (svg-bg/svg-title/svg-axis/svg-tick/svg-grid) に置換すると dark mode 追従`
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
  bar: [960, 680], // columns 960 (標準) / single 680。760/720/600 等の旧サイズは違反
  'tile-grid': [720], // 720×720 (2026-07-31 に 780×560 から変更。lintTileGridQuality 参照)
  summary: [960], // findings card 幅 960 (高さ可変)
  line: [680], // 680×420
  scatter: [720], // 720×720
  'stacked-bar': [680], // 680×可変
};
// 全カタログ統一完了 (2026-06-21): both 全件が正規幅。error で再発防止する。
const SIZE_ENFORCED = new Set([
  'bar',
  'tile-grid',
  'summary',
  'scatter',
  'line',
  'stacked-bar',
]);

/** SVG ファイル名 → chartType (generate-article-charts の classifyChartType と同等の suffix 判定) */
export function classifyChartTypeFromName(filename) {
  const f = String(filename)
    .replace(/\.svg$/i, '')
    .toLowerCase();
  if (
    /(?:-prefecture-rankings|-top5-bottom5|-top-bottom|-rate-ranking|-income-ranking|-ranking|-rankings)$/.test(
      f
    )
  )
    return 'bar';
  if (/(?:-tile-grid|-tilemap|-income-map|-ratio-map|-map)$/.test(f))
    return 'tile-grid';
  if (/(?:-national-trend|-timeseries|-trend)$/.test(f)) return 'line';
  if (/-scatter$/.test(f)) return 'scatter';
  if (/-stacked$/.test(f)) return 'stacked-bar';
  if (/(?:-summary-findings|-findings)$/.test(f)) return 'summary';
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
  const m = String(content).match(
    /viewBox\s*=\s*"0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/
  );
  if (!m) return { errors, warnings }; // viewBox 欠落は別 check (lintSvgContent) が捕捉
  const w = Math.round(parseFloat(m[1]));
  const allowed = CANONICAL_WIDTH[ct];
  if (!allowed.includes(w)) {
    const msg =
      `非正規サイズ: ${ct} の viewBox 幅 ${w} は正規 [${allowed.join('/')}] でない (${path_base(filename)})。` +
      ` svg-builder で再生成して統一する (ranking は rerender-ranking-columns.mts、tile/scatter/line は対応 restorer)`;
    (SIZE_ENFORCED.has(ct) ? errors : warnings).push(msg);
  }
  return { errors, warnings };
}
function path_base(p) {
  const s = String(p).split('/');
  return s[s.length - 1];
}

// ---------- scatter の品質不変量 (2026-08-02) ----------
/** 散布図の正規キャンバス。blog-svg-chart-standards.md §5 と scatter.ts が正典。 */
export const SCATTER_CANVAS = { w: 720, h: 720 };
export const PREFECTURE_SCATTER_POINT_COUNT = 47;

function scatterChartType(filename, jsonData) {
  return jsonData?.chartType === 'scatter'
    ? 'scatter'
    : classifyChartTypeFromName(filename);
}

function scatterRawPoints(jsonData) {
  if (Array.isArray(jsonData?.points)) return jsonData.points;
  if (Array.isArray(jsonData?.data)) return jsonData.data;
  return null;
}

function scatterPointLabel(point) {
  if (!point || typeof point !== 'object') return '';
  return String(
    point.label ?? point.pref ?? point.areaName ?? point.name ?? ''
  ).trim();
}

function scatterPointIdentity(point) {
  if (!point || typeof point !== 'object') return '';
  return String(
    point.areaCode ?? point.code ?? scatterPointLabel(point)
  ).trim();
}

function explicitScatterPointCount(jsonData, sourceData) {
  return jsonData?.expectedPointCount ?? sourceData?.expectedPointCount;
}

/**
 * 散布図 data JSON の再生成可能な最小契約を検査する。
 *
 * stats47 のブログ散布図は都道府県単位なので原則47点。秘匿値等で除外する場合は
 * source.json の excludedAreas と exclusionReason を必須にし、暗黙の欠損を許さない。
 *
 * @param {string} filename
 * @param {object|undefined} jsonData
 * @param {object|undefined} [sourceData]
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintScatterData(filename, jsonData, sourceData) {
  const errors = [];
  const warnings = [];
  if (scatterChartType(filename, jsonData) !== 'scatter')
    return { errors, warnings };

  if (!jsonData || typeof jsonData !== 'object' || Array.isArray(jsonData)) {
    errors.push('散布図JSONをオブジェクトとして解析できない');
    return { errors, warnings };
  }

  const points = scatterRawPoints(jsonData);
  if (!points) {
    errors.push('散布図JSONに points または data 配列がない');
    return { errors, warnings };
  }
  if (
    sourceData?.kind === 'calculated' &&
    !String(sourceData?.formula ?? '').trim()
  ) {
    errors.push('calculated 散布図は source.json の formula が必須');
  }

  const invalidIndexes = [];
  const missingLabelIndexes = [];
  const identities = [];
  for (const [index, point] of points.entries()) {
    if (
      !point ||
      typeof point !== 'object' ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y)
    ) {
      invalidIndexes.push(index);
      continue;
    }
    if (!scatterPointLabel(point)) missingLabelIndexes.push(index);
    identities.push(scatterPointIdentity(point));
  }
  if (invalidIndexes.length > 0) {
    errors.push(
      `散布図JSONに有限数の x/y を持たない点が ${invalidIndexes.length}/${points.length} 件ある` +
        ` (index: ${invalidIndexes.slice(0, 5).join(', ')})`
    );
  }
  if (missingLabelIndexes.length > 0) {
    errors.push(
      `散布図JSONに都道府県ラベルがない点が ${missingLabelIndexes.length}/${points.length} 件ある` +
        ` (index: ${missingLabelIndexes.slice(0, 5).join(', ')})`
    );
  }

  const duplicateIdentities = [
    ...new Set(
      identities.filter(
        (identity, index) => identity && identities.indexOf(identity) !== index
      )
    ),
  ];
  if (duplicateIdentities.length > 0) {
    errors.push(
      `散布図JSONの都道府県識別子が重複している: ${duplicateIdentities.slice(0, 5).join(', ')}`
    );
  }

  const explicitCount = explicitScatterPointCount(jsonData, sourceData);
  if (
    explicitCount !== undefined &&
    (!Number.isInteger(explicitCount) ||
      explicitCount < 1 ||
      explicitCount > PREFECTURE_SCATTER_POINT_COUNT)
  ) {
    errors.push(
      `expectedPointCount=${String(explicitCount)} は1〜${PREFECTURE_SCATTER_POINT_COUNT}の整数でなければならない`
    );
  }

  const excludedAreas = sourceData?.excludedAreas;
  let expectedFromExclusions;
  if (excludedAreas !== undefined) {
    if (
      !Array.isArray(excludedAreas) ||
      excludedAreas.some((area) => typeof area !== 'string' || !area.trim())
    ) {
      errors.push(
        'source.json の excludedAreas は空でない都道府県名の配列でなければならない'
      );
    } else {
      const normalizedExcluded = excludedAreas.map((area) => area.trim());
      const uniqueExcluded = new Set(normalizedExcluded);
      if (uniqueExcluded.size !== normalizedExcluded.length) {
        errors.push('source.json の excludedAreas に重複がある');
      }
      if (!String(sourceData?.exclusionReason ?? '').trim()) {
        errors.push(
          'excludedAreas がある散布図は source.json の exclusionReason が必須'
        );
      }
      expectedFromExclusions =
        PREFECTURE_SCATTER_POINT_COUNT - uniqueExcluded.size;
      const includedExcludedAreas = normalizedExcluded.filter((area) =>
        points.some((point) => scatterPointLabel(point) === area)
      );
      if (includedExcludedAreas.length > 0) {
        errors.push(
          `excludedAreas の点が散布図JSONに含まれている: ${includedExcludedAreas.join(', ')}`
        );
      }
    }
  }

  if (
    Number.isInteger(explicitCount) &&
    expectedFromExclusions !== undefined &&
    explicitCount !== expectedFromExclusions
  ) {
    errors.push(
      `expectedPointCount=${explicitCount} と excludedAreas から算出した ${expectedFromExclusions} が一致しない`
    );
  }

  const expectedCount =
    Number.isInteger(explicitCount) && explicitCount >= 1
      ? explicitCount
      : (expectedFromExclusions ?? PREFECTURE_SCATTER_POINT_COUNT);
  if (points.length !== expectedCount) {
    errors.push(
      `散布図JSONの点数が ${points.length} 件 — 期待値は ${expectedCount} 件` +
        (expectedFromExclusions === undefined
          ? '。欠損を許容する場合は source.json に excludedAreas と exclusionReason を明記する'
          : '')
    );
  }

  return { errors, warnings };
}

/**
 * data JSON の有効点数と SVG に実際に描かれた点数の一致を検査する。
 *
 * @param {string} filename
 * @param {string} svgContent
 * @param {object|undefined} jsonData
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintScatterParity(filename, svgContent, jsonData) {
  const errors = [];
  const warnings = [];
  if (scatterChartType(filename, jsonData) !== 'scatter')
    return { errors, warnings };
  const points = scatterRawPoints(jsonData);
  if (!points) return { errors, warnings };

  const validPointCount = points.filter(
    (point) =>
      point &&
      typeof point === 'object' &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y)
  ).length;
  const renderedPointCount = (
    String(svgContent).match(/<circle\b[^>]*>\s*<title>[^<]*：X=/g) || []
  ).length;
  if (renderedPointCount !== validPointCount) {
    errors.push(
      `散布図の点数不一致: JSON=${validPointCount} 件 / SVG=${renderedPointCount} 件。JSONから再生成する`
    );
  }
  return { errors, warnings };
}

/**
 * 散布図が「正方形・単色・凡例なし」の現行デザインを満たすか検査する。
 *
 * @param {string} filename - SVG ファイル名 (chartType 推定)
 * @param {string} svgContent - SVG 文字列
 * @param {object|undefined} [jsonData] - 対応する data/<name>.json (chartType の明示に使う)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintScatterQuality(filename, svgContent, jsonData) {
  const errors = [];
  const warnings = [];
  const ct = scatterChartType(filename, jsonData);
  if (ct !== 'scatter') return { errors, warnings };
  const svg = String(svgContent);
  const { w: CW, h: CH } = SCATTER_CANVAS;

  const vb = svg.match(/viewBox\s*=\s*"0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (vb) {
    const w = Math.round(parseFloat(vb[1]));
    const h = Math.round(parseFloat(vb[2]));
    if (w !== CW || h !== CH) {
      errors.push(
        `散布図のキャンバスが ${w}×${h} — 正規は ${CW}×${CH} の正方形。svg-builder で再生成する`
      );
    }
  }

  const plot = svg.match(
    /<rect\b[^>]*\bwidth="(\d+(?:\.\d+)?)"[^>]*\bheight="(\d+(?:\.\d+)?)"[^>]*\bclass="svg-plot svg-plot-border"[^>]*>/
  );
  if (!plot) {
    errors.push(
      '散布図のプロット領域が見つからない — svg-builder で再生成する'
    );
  } else if (Math.abs(parseFloat(plot[1]) - parseFloat(plot[2])) > 0.1) {
    errors.push(
      `散布図のプロット領域が ${plot[1]}×${plot[2]} — 幅と高さを同じにして正方形にする`
    );
  }

  const dotTags = [...svg.matchAll(/<circle\b[^>]*>\s*<title>[^<]*：X=/g)].map(
    (match) => match[0]
  );
  const fills = new Set(
    dotTags
      .map((tag) => tag.match(/\bfill="([^"]+)"/)?.[1]?.toLowerCase())
      .filter(Boolean)
  );
  const strokes = new Set(
    dotTags
      .map((tag) => tag.match(/\bstroke="([^"]+)"/)?.[1]?.toLowerCase())
      .filter(Boolean)
  );
  if (fills.size > 1 || strokes.size > 1) {
    errors.push(
      '散布図の点が複数色で描かれている — 地域別色分けをやめ、全点を単色にする'
    );
  }
  if (
    [...fills].some((fill) => fill !== '#64748b') ||
    [...strokes].some((stroke) => stroke !== '#475569')
  ) {
    errors.push(
      '散布図の点が正規のニュートラル色でない — fill=#64748b / stroke=#475569 で再生成する'
    );
  }
  if (/<!--\s*凡例\s*-->|北海道・東北|中国・四国|九州・沖縄/.test(svg)) {
    errors.push('散布図に地域凡例が残っている — 単一系列なので凡例を削除する');
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

/** SVG 文字列 → 表示テキスト (タグ除去 + XML エンティティ復元 + 空白正規化) */
function svgPlainText(svgContent) {
  return String(svgContent)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, '');
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
  const ct =
    jsonData?.chartType === 'tile-grid'
      ? 'tile-grid'
      : classifyChartTypeFromName(filename);
  if (ct !== 'tile-grid') return { errors, warnings };
  const svg = String(svgContent);
  const hasExplicit =
    Array.isArray(jsonData?.legendLabels) && jsonData.legendLabels.length === 2;
  const semantic = svg.match(/<text[^>]*>(安全|危険|良い|悪い)<\/text>/);
  if (semantic && !hasExplicit) {
    errors.push(
      `凡例に意味的ラベル「${semantic[1]}」が json の legendLabels 明示なしに焼き込まれている` +
        ` (既定は 低い/高い。意味的ラベルは指標の意味が確実な場合のみ json に legendLabels を明示する)`
    );
  }
  if (!semantic && !hasExplicit && !/<text[^>]*>低い</.test(svg)) {
    warnings.push(
      '凡例ラベル (低い/高い) が見つからない — 旧デザインの可能性。svg-builder で再生成して統一する'
    );
  }
  return { errors, warnings };
}

// ---------- tile-grid の品質不変量 (2026-07-29) ----------
/** タイルマップの正規キャンバス。blog-svg-chart-standards.md §5 と choropleth.ts が正典。 */
export const TILE_GRID_CANVAS = { w: 720, h: 720 };

/**
 * タイルマップ (choropleth) が現行デザインの不変量を満たすか検査する。
 *
 * 「プロジェクト内のタイルマップを全て同じ品質に保つ」ための決定的ゲート。
 * 旧デザイン (600×700・不透明背景・OS 追従ダークモード) の残存を検出する。
 *
 * 検査する不変量と、それぞれの理由:
 *
 * 1. **キャンバス 720×720 (正方形)** — タイル格子は 14列×16行の縦長なので、キャンバスが
 *    正方形以上に横長である限り**地図の大きさはキャンバスの高さだけで決まる**。旧 780×560 は
 *    左に 268px のテキストカラムを確保していたが、それは地図を狭めておらず余った幅を
 *    埋めていただけだった (実測)。正方形にしてタイルを 30px→39px に拡大した。
 * 2. **背景を敷かない** — 不透明な地色があるとページの地色と食い違う。透過ならライトでも
 *    ダークでも記事に馴染む。
 * 3. **`prefers-color-scheme` を使わない** — サイトのテーマは next-themes の class 方式で
 *    `enableSystem={false}`。OS を意図的に無視するので、SVG 側が OS に追従すると
 *    **OS ダーク + サイトライト**で SVG だけ反転する。`<img>` 内から親の class は見えないため、
 *    テーマ非依存の配色にするのが唯一の正解。
 * 4. **`svg-*` テーマ class を使わない** — 3 と同じ理由。`svgThemeStyle()` は tile-grid では使わない。
 * 5. **凡例が右下** — 左上は上位 3 県が占めるため。
 * 6. **上位 3 県のリストがある** — 左上の空きを埋め、地図だけでは読み取れない実数値を出す。
 *    下位は出さない (2026-07-31 オーナー判断。6 行入れると地図の東北ブロックに掛かる)。
 *
 * @param {string} filename - SVG ファイル名 (chartType 推定)
 * @param {string} svgContent - SVG 文字列
 * @param {object|undefined} [jsonData] - 対応する data/<name>.json (chartType の明示に使う)
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function lintTileGridQuality(filename, svgContent, jsonData) {
  const errors = [];
  const warnings = [];
  const ct =
    jsonData?.chartType === 'tile-grid'
      ? 'tile-grid'
      : classifyChartTypeFromName(filename);
  if (ct !== 'tile-grid') return { errors, warnings };
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
          ` (記事内は 672px 幅で描画されるため、この比率が画面上の占有高さを決める)。svg-builder で再生成する`
      );
    }
  }

  // 2. 不透明な背景 (キャンバス全面を覆う rect)
  const bgRect = svg.match(
    new RegExp(`<rect(?![^>]*\\bx=)[^>]*width="${CW}"[^>]*height="${CH}"[^>]*>`)
  );
  if (bgRect || /class="svg-(bg|plot)"/.test(svg)) {
    errors.push(
      '背景 rect が敷かれている — タイルマップは透過にしてページの地色に馴染ませる' +
        ' (ライト/ダークの両対応がこれで同時に成立する)'
    );
  }

  // 3-4. テーマ依存の指定
  if (/prefers-color-scheme/.test(svg)) {
    errors.push(
      '`@media (prefers-color-scheme)` を含む — サイトのテーマは OS を参照しない' +
        ' (next-themes / enableSystem=false) ため、OS とサイトが食い違うと SVG だけ色が反転する。' +
        'テーマ非依存の配色にする'
    );
  }
  if (/class="svg-(title|axis|tick|grid|plot-border)"/.test(svg)) {
    errors.push(
      'テーマ依存の svg-* class を使っている — tile-grid では svgThemeStyle() を使わない (理由は上に同じ)'
    );
  }

  // 5. 凡例が右下にあるか (グラデーションバーの位置で判定)
  const bar = svg.match(
    /<rect x="([\d.]+)" y="([\d.]+)"[^>]*fill="url\(#choropleth-lg\)"/
  );
  if (!bar) {
    errors.push(
      '凡例のグラデーションバーが見つからない — svg-builder で再生成する'
    );
  } else {
    const bx = parseFloat(bar[1]);
    const by = parseFloat(bar[2]);
    if (bx < CW / 2 || by < CH / 2) {
      errors.push(
        `凡例が右下にない (x=${bx}, y=${by})。左上は上位/下位リストが使うため凡例は右下に置く`
      );
    }
  }

  // 6. 上位 3 県のリスト (タイルが 3 件以上あるときのみ要求)
  //    旧デザインは「高い順 / 低い順」の見出しを持っていた。現行は見出しを持たず
  //    「1. 宮崎県」の形で並べるので、その形を探す。
  const tileCount = (
    svg.match(/<rect [^>]*rx="3"[^>]*fill="(?:rgb\(|#)/g) || []
  ).length;
  const rankRows = (svg.match(/>[1-3]\.\s/g) || []).length;
  if (tileCount >= 3 && rankRows < 3) {
    warnings.push(
      '上位 3 県のリストが見つからない — 旧デザインの可能性。svg-builder で再生成して統一する'
    );
  }
  // 旧デザインの残存を積極的に検出する (見出しが残っていれば確実に旧版)
  if (/高い順|低い順|多い順/.test(svg)) {
    errors.push(
      '旧デザインの見出し (高い順/低い順/多い順) が残っている — 現行は見出しを持たず' +
        ' 上位 3 県のみを「1. 県名」の形で出す。svg-builder で再生成する'
    );
  }

  // 8. テキストがキャンバス内に収まるか
  //    2026-08-11 実測: 凡例の右端ラベル「高い」が x=704 から左揃えで置かれ、CJK 2 文字
  //    (font-size 11 で約 22px) がキャンバス 720 を 6px はみ出して切れていた。
  //    不変量 1-7 はどれもこれを検出できなかった (寸法・背景・配色・凡例の"位置"しか見ない)。
  //    文字が切れて読めないのは明確な欠陥なので error にする。
  for (const overflow of findTextOverflows(svg, CW)) {
    errors.push(
      `テキスト "${overflow.text}" がキャンバス右端をはみ出す (右端 ${overflow.right}px > ${CW}px) — ` +
        '切れて読めなくなる。svg-builder 側でラベル幅ぶん内側に寄せて再生成する'
    );
  }
  return { errors, warnings };
}

/**
 * SVG 内の `<text>` のうち、キャンバス幅をはみ出すものを返す。
 *
 * 文字幅は svg-builder の `textUnits` と同じヒューリスティック (半角 0.55em / 全角 1.0em) で
 * 推定する。グリフの実測ではないので、**わずかな超過では発火させない** (許容 2px)。
 * 目的は「ラベルがまるごと切れる」級の欠陥を捕まえることで、1px の精度ではない。
 *
 * @param {string} svg - SVG 文字列
 * @param {number} canvasWidth - viewBox の幅
 * @returns {Array<{ text: string, right: number }>}
 */
export function findTextOverflows(svg, canvasWidth) {
  const TOLERANCE_PX = 2;
  const out = [];
  for (const m of String(svg).matchAll(/<text\s([^>]*)>([^<]*)<\/text>/g)) {
    const attrs = m[1];
    const label = m[2];
    if (!label.trim()) continue;
    const x = parseFloat((/\bx="([\d.-]+)"/.exec(attrs) || [])[1] ?? 'NaN');
    if (!Number.isFinite(x)) continue;
    const size = parseFloat((/font-size="([\d.]+)"/.exec(attrs) || [])[1] ?? '11');
    const anchor = (/text-anchor="(end|middle|start)"/.exec(attrs) || [])[1] ?? 'start';
    // 半角 0.55em / 全角 1.0em (svg-builder の textUnits と同一)
    const widthEm = [...label].reduce(
      (w, ch) => w + (/[ -~｡-ﾟ]/.test(ch) ? 0.55 : 1.0),
      0
    );
    const width = widthEm * size;
    const right =
      anchor === 'end' ? x : anchor === 'middle' ? x + width / 2 : x + width;
    if (right > canvasWidth + TOLERANCE_PX) {
      out.push({ text: label, right: Math.round(right) });
    }
  }
  return out;
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
  const ct =
    jsonData?.chartType === 'summary'
      ? 'summary'
      : classifyChartTypeFromName(filename);
  if (ct !== 'summary') return { errors, warnings };
  const items = Array.isArray(jsonData) ? jsonData : jsonData?.findings;
  if (!Array.isArray(items) || items.length === 0) return { errors, warnings };
  const plain = svgPlainText(svgContent);
  const expected = [];
  for (const it of items) {
    if (typeof it === 'string') expected.push(it);
    else if (it && typeof it === 'object') {
      if (it.heading) expected.push(it.heading);
      if (it.text) expected.push(it.text);
    }
  }
  const missing = expected.filter(
    (t) => t && !plain.includes(String(t).replace(/\s+/g, ''))
  );
  if (missing.length > 0) {
    errors.push(
      `findings の内容欠落 ${missing.length}/${expected.length} 件 — json の heading/text が SVG に描画されていない` +
        ` (例: "${String(missing[0]).slice(0, 30)}")。generate-article-charts で再生成が必要 (過去に renderer の heading 脱落バグで発生)`
    );
  }
  return { errors, warnings };
}
