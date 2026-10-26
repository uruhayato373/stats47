/**
 * title-year-lint — 年の違う図を並べた記事で、title / seoTitle に年が 1 つしか無い形を検出する
 * (BLOG-SEOTITLE-MIXED-YEAR-01、2026-10-26 追加)。
 *
 * 事象: 農業産出額 (2024年) と農家総所得 (2003年度) を並べた記事の seoTitle に「2024年」だけが
 * 付き、農家総所得も 2024 年の値に見えた (sixth-industry-direct-sales の critic が BLOCK)。
 *
 * 判定: 本文が参照する図 (data/<base>.json + .source.json) の「時点の年」を集め、異なる年が
 * 2 つ以上あるのに、title と seoTitle に書かれた年 (「NNNN年」「NNNN年度」) が合わせて 1 種類
 * だけで、その年が図の年のどれかに一致するなら warning にする。図のどれとも違う年 (「1980年」との
 * 比較や「2040年」の推計の見出し) は図の時点を名乗っていないので対象外。年が 0 個のタイトルも対象外。
 *
 * 図の年の取り方:
 *   - source.json の year を優先し、無ければ data JSON の year。散布図の xYear / yYear 等も拾う
 *   - 「2013-2018」「1956〜2018」のような範囲は時系列の期間なので時点の年に数えない
 *   - 年度かどうかは year 文字列の「年度」か、図の title / subtitle / label / 軸ラベルの
 *     「NNNN年度」で判定し、メッセージに出す (判定は年の数値だけで行う)
 */

const YEAR_KEYS = ['year', 'xYear', 'yYear', 'yearX', 'yearY'];
const RANGE_RE =
  /(?:19|20)\d{2}\s*(?:年度?)?\s*[-‐–〜~～]\s*(?:(?:19|20)\d{2}|\d{2})\s*(?:年度?)?/g;
const YEAR_RE = /(?<![\d,.])((?:19|20)\d{2})(?!\d)(\s*年度)?/g;

function yearStrings(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return YEAR_KEYS.filter((k) => obj[k] != null && obj[k] !== '').map((k) =>
    String(obj[k])
  );
}

function labelText(json) {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return '';
  return ['title', 'subtitle', 'label', 'readerLabel', 'xLabel', 'yLabel']
    .map((k) => (typeof json[k] === 'string' ? json[k] : ''))
    .join(' ');
}

/**
 * 1 つの図の時点の年を返す。
 * @returns {{year:number, fiscal:boolean}[]}
 */
export function extractChartYears(json, source) {
  const fromSource = yearStrings(source);
  const raw = fromSource.length ? fromSource : yearStrings(json);
  const labels = `${labelText(json)} ${labelText(source)}`;
  const out = new Map();
  for (const s of raw) {
    const stripped = s.replace(RANGE_RE, ' ');
    for (const m of stripped.matchAll(YEAR_RE)) {
      const year = Number(m[1]);
      const fiscal =
        Boolean(m[2]) || new RegExp(`${year}\\s*年度`).test(labels);
      const prev = out.get(year);
      out.set(year, { year, fiscal: Boolean(prev?.fiscal) || fiscal });
    }
  }
  return [...out.values()];
}

function frontmatterValue(content, key) {
  const fm = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return '';
  const line = fm[1].match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return line ? line[1].replace(/^["']|["']$/g, '') : '';
}

/**
 * title / seoTitle に書かれた年。後ろに「年」が続くものと、「2020・2023年」「2023-2024年」のように
 * 区切りで並べて最後に「年」を付けた列の各年を拾う。
 */
export function extractTitleYears(content) {
  const text = `${frontmatterValue(content, 'title')} ${frontmatterValue(content, 'seoTitle')}`;
  const runs = text.matchAll(
    /(?<![\d,.])(?:19|20)\d{2}(?:\s*[・、,/\-‐–〜~～]\s*(?:19|20)\d{2})*(?=\s*年)/g
  );
  return [
    ...new Set(
      [...runs].flatMap((m) =>
        [...m[0].matchAll(/(?:19|20)\d{2}/g)].map((y) => Number(y[0]))
      )
    ),
  ];
}

/**
 * @param {string} content article.md 全文
 * @param {{base:string, json:any, source:any}[]} charts 本文が参照する図
 * @returns {{warnings:string[], chartYears:{year:number,fiscal:boolean}[], titleYears:number[]}}
 */
export function lintMixedYearTitle(content, charts) {
  const merged = new Map();
  for (const c of charts) {
    for (const y of extractChartYears(c.json, c.source)) {
      const prev = merged.get(y.year);
      merged.set(y.year, {
        year: y.year,
        fiscal: Boolean(prev?.fiscal) || y.fiscal,
      });
    }
  }
  const chartYears = [...merged.values()].sort((a, b) => a.year - b.year);
  const titleYears = extractTitleYears(content);
  const warnings = [];
  if (
    chartYears.length >= 2 &&
    titleYears.length === 1 &&
    chartYears.some((y) => y.year === titleYears[0])
  ) {
    const list = chartYears
      .map((y) => `${y.year}${y.fiscal ? '年度' : '年'}`)
      .join('・');
    warnings.push(
      `年の違う図 (${list}) を並べているのに title/seoTitle の年は ${titleYears[0]}年 の 1 つだけ — ` +
        `別の年の指標まで ${titleYears[0]}年 の値に見える。指標ごとに年を書き分けるか、タイトルから年を外す`
    );
  }
  return { warnings, chartYears, titleYears };
}
