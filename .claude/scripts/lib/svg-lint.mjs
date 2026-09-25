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

  // --- XML コメントの違法性 (ERROR) ---
  // `<img src="*.svg">` はブラウザが SVG を厳格 XML として解析するため、コメント内の
  // 違法パターンが 1 つでもあると全体がパースエラーになり broken image になる。
  // XML コメントは本文に "--" を含めず、末尾を "-" で終えられない (`--->` を作る)。
  // 実測 (2026-08-13): 相関 scatter 7 枚が、先頭 provenance コメントに焼かれたファイル名の
  // "--" (2 ranking key の連結子) で不正 XML になり全 <img> が描画されていなかった。
  // provenance 生成側は buildProvenanceLine が XML 安全化するが (svg-provenance.mjs)、
  // 生成器を通らない経路・手書き SVG も公開前にここで止める (両側で守る)。
  // 判定は「コメント本文に -- を含む or 末尾が -」だけ。妥当な XML コメントはこの 2 つを
  // 決して満たさないため誤検知はゼロ (valid な SVG を弾かない)。
  for (const m of c.matchAll(/<!--([\s\S]*?)-->/g)) {
    const commentBody = m[1];
    if (commentBody.includes('--') || commentBody.endsWith('-')) {
      const snippet = m[0].trim().slice(0, 60);
      errors.push(
        `XML コメントが不正: "${snippet}..." — コメント本文に "--" を含む/末尾が "-" だと` +
          ` <img> で SVG が厳格 XML 解析され broken image になる (相関 scatter のファイル名 "--" が典型)`
      );
      break; // 1 件出れば十分 (同じ原因で複数出るため)
    }
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
  'bar-mobile': [640], // ブログ mobile / note 本文向け縦長
  'bar-social': [1080], // Instagram 4:5
  'tile-grid': [720], // 720×720 (2026-07-31 に 780×560 から変更。lintTileGridQuality 参照)
  summary: [960], // findings card 幅 960 (高さ可変)
  line: [680], // 680×420
  scatter: [720], // 720×720
  'stacked-bar': [680], // 680×可変
};
// 全カタログ統一完了 (2026-06-21): both 全件が正規幅。error で再発防止する。
const SIZE_ENFORCED = new Set([
  'bar',
  'bar-mobile',
  'bar-social',
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
  const rankingSuffix =
    '(?:-prefecture-rankings|-top5-bottom5|-top-bottom|-rate-ranking|-income-ranking|-ranking|-rankings)';
  if (new RegExp(`${rankingSuffix}-mobile$`).test(f)) return 'bar-mobile';
  if (new RegExp(`${rankingSuffix}-ig$`).test(f)) return 'bar-social';
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
 * 横長ランキング本文画像に mobile 本文用バリアントが揃っているかを検査する。
 * desktop SVG 自体の文字を大きくしても 390px 幅では縮小されるため、ファイル対を契約にする。
 */
export function lintResponsiveBarPair(filename, desktopContent, mobileContent) {
  const errors = [];
  const warnings = [];
  if (classifyChartTypeFromName(filename) !== 'bar') return { errors, warnings };
  const viewBox = String(desktopContent).match(
    /viewBox\s*=\s*"0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/
  );
  if (!viewBox || Math.round(parseFloat(viewBox[1])) !== 960) {
    return { errors, warnings }; // single(680) は mobile でも1列なので別バリアント不要
  }
  if (typeof mobileContent !== 'string' || mobileContent.length === 0) {
    errors.push(
      `mobile 本文用 SVG が無い: ${path_base(filename).replace(/\.svg$/i, '')}-mobile.svg。` +
        '横長2列をスマホで縮小せず、同じ JSON から generate-article-charts で媒体別出力する'
    );
    return { errors, warnings };
  }
  const size = lintSvgSize(
    path_base(filename).replace(/\.svg$/i, '-mobile.svg'),
    mobileContent
  );
  errors.push(...size.errors);
  warnings.push(...size.warnings);
  const fontSizes = [...String(mobileContent).matchAll(/font-size="(\d+(?:\.\d+)?)"/g)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  const minFont = fontSizes.length > 0 ? Math.min(...fontSizes) : 0;
  if (minFont < 20) {
    errors.push(
      `mobile 本文用 SVG の最小文字 ${minFont}px は基準 20px 未満。` +
        '640px viewBox を390px表示した際の実効文字サイズを確保する'
    );
  }
  return { errors, warnings };
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

// ---------- チャート文字のはみ出し・重なり (2026-09-25) ----------
//
// 背景: 折れ線 (line.ts) の下部凡例が斜めの X 軸ラベルに重なり、Y 軸タイトル (チャート題名
// そのもの) がプロット高より長くキャンバス外へはみ出していた
// (docs/31_note記事原稿/b-kakei-beer-peak-month/data/beer-months-by-year-timeseries.svg)。
// 既存 lint は tile-grid の右端しか見ておらず、どちらも検出できなかった。
//
// 推定は findTextOverflows と同じ文字幅ヒューリスティック (半角 0.55em / 全角 1.0em)、
// ベースライン ≈ y・ascent 0.8em・descent 0.2em。グリフ実測ではないので閾値は寛容にする
// (目的は「ラベルがまるごと切れる」「凡例と軸ラベルが衝突する」級の検出。1px の精度ではない。
// 誤検知のあるゲートは無効化されるだけ — blog-svg-chart-standards.md §6-2)。

/** 文字配置 lint の閾値 (SSOT)。 */
export const CHART_TEXT_LAYOUT = Object.freeze({
  /** viewBox からのはみ出しを許容する量 (px)。幅推定の誤差吸収。 */
  overflowTolerancePx: 2,
  /** 重なりと判定する交差面積の下限 (小さい方の箱に対する比)。 */
  overlapMinFraction: 0.25,
  /** 重なりと判定する交差領域の下限 (px、x/y 両方)。 */
  overlapMinPx: 4,
  ascentEm: 0.8,
  descentEm: 0.2,
  /** font-size 未指定時の既定 (SVG/CSS の medium)。 */
  defaultFontSize: 16,
});

const SKIP_TEXT_CONTAINERS = new Set([
  'title',
  'desc',
  'style',
  'script',
  'defs',
  'clippath',
  'mask',
  'symbol',
  'pattern',
  'marker',
  'metadata',
  'lineargradient',
  'radialgradient',
  'filter',
]);

function decodeXmlEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** 文字列の概算幅 (em)。svg-builder の textUnits と同一のヒューリスティック。 */
export function estimateTextUnits(text) {
  return [...String(text)].reduce(
    (w, ch) => w + (/[ -~｡-ﾟ]/.test(ch) ? 0.55 : 1.0),
    0
  );
}

function readAttr(attrs, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`).exec(attrs);
  return m ? (m[1] ?? m[2]) : undefined;
}
function firstNumber(v) {
  if (v === undefined) return undefined;
  const n = parseFloat(String(v).trim().split(/[\s,]+/)[0]);
  return Number.isFinite(n) ? n : undefined;
}
function styleProp(attrs, prop) {
  const style = readAttr(attrs, 'style');
  if (!style) return undefined;
  const m = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`).exec(style);
  return m ? m[1].trim() : undefined;
}
function attrOrStyle(attrs, name) {
  return styleProp(attrs, name) ?? readAttr(attrs, name);
}

// 2D アフィン行列 [a, b, c, d, e, f]: x' = a x + c y + e, y' = b x + d y + f
const IDENTITY = [1, 0, 0, 1, 0, 0];
function mulMatrix(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}
function parseTransform(str) {
  let m = IDENTITY;
  if (!str) return m;
  for (const t of String(str).matchAll(
    /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g
  )) {
    const v = t[2]
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter(Number.isFinite);
    let n = IDENTITY;
    if (t[1] === 'matrix' && v.length === 6) n = v;
    else if (t[1] === 'translate') n = [1, 0, 0, 1, v[0] ?? 0, v[1] ?? 0];
    else if (t[1] === 'scale') n = [v[0] ?? 1, 0, 0, v[1] ?? v[0] ?? 1, 0, 0];
    else if (t[1] === 'rotate') {
      const r = ((v[0] ?? 0) * Math.PI) / 180;
      const rot = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
      const cx = v[1] ?? 0;
      const cy = v[2] ?? 0;
      n = mulMatrix(mulMatrix([1, 0, 0, 1, cx, cy], rot), [1, 0, 0, 1, -cx, -cy]);
    } else if (t[1] === 'skewX')
      n = [1, 0, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 1, 0, 0];
    else if (t[1] === 'skewY')
      n = [1, Math.tan(((v[0] ?? 0) * Math.PI) / 180), 0, 1, 0, 0];
    m = mulMatrix(m, n);
  }
  return m;
}
const applyMatrix = (m, x, y) => [
  m[0] * x + m[2] * y + m[4],
  m[1] * x + m[3] * y + m[5],
];

/**
 * SVG 内の描画される文字行を、変換 (rotate 等) 適用後の四角形 (4 頂点) として列挙する。
 * 1 つの `<text>` が複数行 (x/y 付き `<tspan>`) を持つ場合は行ごとに箱を作る。
 * x/y を持たない `<tspan>` (タイトル横の小さい補足など) は同じ行の続きとして幅に足す。
 *
 * @param {string} svgContent
 * @returns {{ viewBox: {x:number,y:number,w:number,h:number}|null,
 *             boxes: Array<{label:string, el:number, poly:number[][]}> }}
 */
export function extractTextBoxes(svgContent) {
  const svg = String(svgContent);
  const vbm = /<svg\b[^>]*\bviewBox\s*=\s*"([^"]+)"/.exec(svg);
  let viewBox = null;
  if (vbm) {
    const v = vbm[1].trim().split(/[\s,]+/).map(Number);
    if (v.length === 4 && v.every(Number.isFinite))
      viewBox = { x: v[0], y: v[1], w: v[2], h: v[3] };
  }
  const L = CHART_TEXT_LAYOUT;
  const boxes = [];
  const stack = [
    { tag: '#root', m: IDENTITY, fs: L.defaultFontSize, anchor: 'start', baseline: 'auto', skip: false },
  ];
  let text = null; // 現在の <text> の収集状態
  let elId = 0;
  const tokenRe =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<(\/?)([a-zA-Z][\w:.-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>|([^<]+)/g;

  const flushLine = () => {
    if (!text || !text.cur) return;
    const line = text.cur;
    text.cur = null;
    // SVG 既定の空白処理 (xml:space="default"): 改行は除去、タブは空白、連続空白は 1 つ、
    // 行の前後の空白は除去。これをしないと <tspan> 間のインデントが幅に数えられる。
    const chars = [];
    for (const s of line.segs) {
      for (const ch of s.t.replace(/[\r\n]/g, '').replace(/\t/g, ' ')) {
        if (ch === ' ' && (chars.length === 0 || chars[chars.length - 1].ch === ' ')) continue;
        chars.push({ ch, fs: s.fs });
      }
    }
    while (chars.length && chars[chars.length - 1].ch === ' ') chars.pop();
    const label = chars.map((c) => c.ch).join('');
    if (!label) return;
    const w = chars.reduce((acc, c) => acc + estimateTextUnits(c.ch) * c.fs, 0);
    const fs = Math.max(...chars.map((c) => c.fs));
    const x0 =
      text.anchor === 'end' ? line.x - w : text.anchor === 'middle' ? line.x - w / 2 : line.x;
    let top = line.y - L.ascentEm * fs;
    let bottom = line.y + L.descentEm * fs;
    if (/^(middle|central)$/.test(text.baseline)) {
      top = line.y - fs / 2;
      bottom = line.y + fs / 2;
    } else if (/^(hanging|text-before-edge)$/.test(text.baseline)) {
      top = line.y;
      bottom = line.y + fs;
    }
    const poly = [
      [x0, top],
      [x0 + w, top],
      [x0 + w, bottom],
      [x0, bottom],
    ].map(([px, py]) => applyMatrix(text.m, px, py));
    boxes.push({ label, el: text.id, poly });
  };

  for (const tok of svg.matchAll(tokenRe)) {
    const top = stack[stack.length - 1];
    if (tok[5] !== undefined) {
      // 文字ノード
      if (text && !top.skip) {
        const t = decodeXmlEntities(tok[5]);
        if (t.length) {
          if (!text.cur) text.cur = { x: text.nextX, y: text.nextY, segs: [] };
          text.cur.segs.push({ t, fs: top.fs });
        }
      }
      continue;
    }
    if (tok[2] === undefined) continue; // コメント / CDATA
    const isClosing = tok[1] === '/';
    const tag = tok[2].toLowerCase();
    const attrs = tok[3] || '';
    const isSelfClosing = tok[4] === '/';
    if (isClosing) {
      // 対応する開きタグまで戻す (壊れた入れ子に寛容)
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      if (tag === 'text' && text) {
        flushLine();
        text = null;
      }
      continue;
    }
    const fsAttr = attrOrStyle(attrs, 'font-size');
    const fsNum = fsAttr !== undefined ? parseFloat(fsAttr) : NaN;
    const isHidden =
      (attrOrStyle(attrs, 'display') ?? '') === 'none' ||
      /^(hidden|collapse)$/.test(attrOrStyle(attrs, 'visibility') ?? '') ||
      parseFloat(attrOrStyle(attrs, 'opacity') ?? '1') === 0;
    const frame = {
      tag,
      m: mulMatrix(top.m, parseTransform(readAttr(attrs, 'transform'))),
      fs: Number.isFinite(fsNum) ? fsNum : top.fs,
      anchor: attrOrStyle(attrs, 'text-anchor') ?? top.anchor,
      baseline: attrOrStyle(attrs, 'dominant-baseline') ?? top.baseline,
      skip: top.skip || SKIP_TEXT_CONTAINERS.has(tag) || isHidden,
    };
    if (tag === 'text' && !frame.skip && !isSelfClosing) {
      const x =
        (firstNumber(readAttr(attrs, 'x')) ?? 0) + (firstNumber(readAttr(attrs, 'dx')) ?? 0);
      const y =
        (firstNumber(readAttr(attrs, 'y')) ?? 0) + (firstNumber(readAttr(attrs, 'dy')) ?? 0);
      text = {
        id: elId++,
        m: frame.m,
        anchor: frame.anchor,
        baseline: frame.baseline,
        nextX: x,
        nextY: y,
        cur: null,
      };
    } else if (tag === 'tspan' && text) {
      const tx = firstNumber(readAttr(attrs, 'x'));
      const ty = firstNumber(readAttr(attrs, 'y'));
      const dy = firstNumber(readAttr(attrs, 'dy')) ?? 0;
      if (tx !== undefined || ty !== undefined) {
        // 新しい行: 絶対位置 (x/y) か、x 付きの dy 改行
        const baseY = ty ?? (text.cur ? text.cur.y : text.nextY);
        flushLine();
        text.nextX = tx ?? text.nextX;
        text.nextY = baseY + dy;
      }
    }
    if (!isSelfClosing) stack.push(frame);
  }
  return { viewBox, boxes };
}

function polygonArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function polygonBBox(p) {
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
/** 凸多角形 subject を凸多角形 clip で切り取る (Sutherland–Hodgman)。 */
function clipConvexPolygon(subject, clip) {
  const sign = Math.sign(polygonArea(clip)) || 1;
  const isInside = (p, a, b) =>
    sign * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) >= 0;
  const intersect = (p, q, a, b) => {
    const den = (p[0] - q[0]) * (a[1] - b[1]) - (p[1] - q[1]) * (a[0] - b[0]);
    if (den === 0) return q;
    const t = ((p[0] - a[0]) * (a[1] - b[1]) - (p[1] - a[1]) * (a[0] - b[0])) / den;
    return [p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])];
  };
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const isCurIn = isInside(cur, a, b);
      const isPrevIn = isInside(prev, a, b);
      if (isCurIn) {
        if (!isPrevIn) out.push(intersect(prev, cur, a, b));
        out.push(cur);
      } else if (isPrevIn) {
        out.push(intersect(prev, cur, a, b));
      }
    }
  }
  return out;
}

const shortLabel = (s) => (s.length > 20 ? `${[...s].slice(0, 19).join('')}…` : s);

/**
 * チャート SVG の文字が viewBox をはみ出すもの・他の文字と重なるものを返す。
 *
 * - overflows: 推定 bbox (text-anchor / font-size / transform=rotate を反映) が viewBox の
 *   どれかの辺を overflowTolerancePx 超えてはみ出す文字。例 `"12月" right +6px`
 * - overlaps: 別の `<text>` 同士で、推定箱の交差面積が小さい方の箱の overlapMinFraction 以上
 *   かつ交差領域が x/y とも overlapMinPx 以上のペア。例 `"2000年" ⇄ "4月"`
 *
 * `<title>`/`<desc>`/`<defs>` 等の中の文字は描画されないので除外。同じ `<text>` 内の行同士
 * (タイルの県名と値など、意図的に積んだもの) は比較しない。同一文字列・同一位置の 2 枚重ね
 * (縁取り halo の描画手法) も重なりに数えない。
 *
 * @param {string} svgContent
 * @returns {{ overflows: string[], overlaps: string[] }}
 */
export function findChartTextIssues(svgContent) {
  const L = CHART_TEXT_LAYOUT;
  const { viewBox, boxes } = extractTextBoxes(svgContent);
  const overflows = [];
  const overlaps = [];
  const measured = boxes.map((b) => ({
    ...b,
    bb: polygonBBox(b.poly),
    area: Math.abs(polygonArea(b.poly)),
  }));

  if (viewBox) {
    const vx1 = viewBox.x + viewBox.w;
    const vy1 = viewBox.y + viewBox.h;
    for (const b of measured) {
      const [side, amount] = [
        ['left', viewBox.x - b.bb.x0],
        ['right', b.bb.x1 - vx1],
        ['top', viewBox.y - b.bb.y0],
        ['bottom', b.bb.y1 - vy1],
      ].sort((p, q) => q[1] - p[1])[0];
      if (amount > L.overflowTolerancePx) {
        overflows.push(`"${shortLabel(b.label)}" ${side} +${Math.round(amount)}px`);
      }
    }
  }

  for (let i = 0; i < measured.length; i++) {
    const a = measured[i];
    for (let j = i + 1; j < measured.length; j++) {
      const b = measured[j];
      if (a.el === b.el) continue;
      if (a.bb.x1 <= b.bb.x0 || b.bb.x1 <= a.bb.x0 || a.bb.y1 <= b.bb.y0 || b.bb.y1 <= a.bb.y0)
        continue;
      // 縁取り (halo) の 2 枚重ね: 同じ文字列をほぼ同じ位置に描く
      if (
        a.label === b.label &&
        a.poly.every((p, k) => Math.hypot(p[0] - b.poly[k][0], p[1] - b.poly[k][1]) < 1)
      )
        continue;
      const inter = clipConvexPolygon(a.poly, b.poly);
      if (inter.length < 3) continue;
      const area = Math.abs(polygonArea(inter));
      const ib = polygonBBox(inter);
      if (
        area >= L.overlapMinFraction * Math.min(a.area, b.area) &&
        ib.x1 - ib.x0 >= L.overlapMinPx &&
        ib.y1 - ib.y0 >= L.overlapMinPx
      ) {
        overlaps.push(`"${shortLabel(a.label)}" ⇄ "${shortLabel(b.label)}"`);
      }
    }
  }
  return { overflows, overlaps };
}
