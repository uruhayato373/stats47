/**
 * 市区町村データ商品の業種別 (産業中分類) の表の純粋な組み立て部分 (入出力は build-muni-data-product.mjs)。
 * 入力は fetch-estat-muni-industry.mjs が CI で取った e-Stat 地域編の行 ({ year, area, industry, industryName, value })。
 * 値は元データのまま (単位も元の表のまま) で、無い組み合わせも理由の注記を付けて行として残す。
 * 秘匿 (X) の値を製造業計との差から逆算しない。差は検算表に「公表されていない業種の合計」としてだけ出す。
 */
import { splitAreaName } from './muni-data-product.mjs';

export const INDUSTRY_HEADER = ['自治体コード', '都道府県', '自治体名', '年', '業種コード', '業種名', '値', '単位', '注記'];
export const TOTAL_INDUSTRY = '00';
const NOTE_SEPARATOR = '; ';
const DESIGNATED_NOTE = '市全体の業種別は元データに無い。区の別表を参照';
const SYMBOL_MEANINGS = { X: '秘匿' };
const isNumber = (value) => /^-?\d+(\.\d+)?$/.test(String(value ?? ''));

/** 表に出てくる業種 (製造業計を先頭に業種コード順)。表ごとに業種の名前が違えば止める */
export function industryCatalog(tables) {
  const names = new Map();
  for (const table of tables) for (const row of table.rows) {
    const known = names.get(row.industry);
    if (known && known !== row.industryName) throw Error(`業種 ${row.industry} の名前が表で違う: ${known} / ${row.industryName}`);
    names.set(row.industry, row.industryName);
  }
  if (!names.has(TOTAL_INDUSTRY)) throw Error('製造業計 (業種コード 00) が無い');
  return [...names].sort(([a], [b]) => a.localeCompare(b)).map(([code, name]) => ({ code, name }));
}

/**
 * 対象の地域 × 年 × 業種の行を作る。designated は業種別が区単位でしか公表されない政令市のコード。
 * 単位は表の単位 (経済構造実態調査は万円) をそのまま書く。表ごとに単位が違えば止める。
 */
export function buildIndustryRows({ tables, areas, designated = new Set() }) {
  const units = [...new Set(tables.map((t) => t.unit))];
  if (units.length !== 1 || !units[0]) throw Error(`業種別の表の単位がそろわない: ${units.join(' / ')}`);
  const index = new Map();
  for (const table of tables) for (const row of table.rows) {
    const key = `${row.area}|${row.year}|${row.industry}`;
    if (index.has(key)) throw Error(`同じ自治体・年・業種の行が 2 つある: ${key}`);
    index.set(key, row.value);
  }
  const years = [...new Set(tables.flatMap((t) => t.rows.map((r) => r.year)))].sort((a, b) => a - b);
  const industries = industryCatalog(tables);
  const rows = [];
  for (const area of areas) {
    const { pref, name } = splitAreaName(area.cityName);
    for (const year of years) for (const industry of industries) {
      const raw = index.get(`${area.cityCode}|${year}|${industry.code}`);
      let note = null;
      if (raw === undefined) note = designated.has(area.cityCode) && industry.code !== TOTAL_INDUSTRY ? DESIGNATED_NOTE : '元データに行なし';
      else if (!isNumber(raw)) note = `元データ記号 ${raw}${SYMBOL_MEANINGS[raw] ? ` (${SYMBOL_MEANINGS[raw]})` : ''}`;
      rows.push({
        code: area.cityCode, pref, name, year, industry: industry.code, industryName: industry.name,
        value: raw !== undefined && isNumber(raw) ? Number(raw) : null, unit: units[0], note: note ?? '',
      });
    }
  }
  return rows;
}

export const industryRowCells = (r) => [r.code, r.pref, r.name, r.year, r.industry, r.industryName, r.value, r.unit, r.note.split(NOTE_SEPARATOR).filter(Boolean).join(NOTE_SEPARATOR)];

/**
 * 自治体 × 年ごとに、製造業計・公表された業種の和・公表されていない業種の合計 (製造業計 − 和) と、
 * 本体の CSV (製造品出荷額等の合計) との差を出す。scale は業種別の単位を本体の単位へ直す割り算の数 (万円 → 百万円 は 100)。
 * 本体と合うかは丸めを許して |業種別の計 ÷ scale − 本体| < 1 で見る。
 */
export function industryCheck({ rows, mainRows, scale }) {
  const main = new Map(mainRows.map((r) => [`${r.code}|${r.year}`, r.value]));
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.code}|${row.year}`;
    const group = groups.get(key) ?? { code: row.code, pref: row.pref, name: row.name, year: row.year, total: null, published: 0, hiddenIndustries: 0 };
    if (row.industry === TOTAL_INDUSTRY) group.total = row.value;
    else if (row.value != null) group.published += row.value;
    else if (row.note.startsWith('元データ記号')) group.hiddenIndustries += 1;
    groups.set(key, group);
  }
  const checks = [...groups.values()].map((g) => {
    const mainValue = main.get(`${g.code}|${g.year}`) ?? null;
    const unpublished = g.total == null ? null : g.total - g.published;
    const mainDiff = g.total == null || mainValue == null ? null : Math.round((g.total / scale - mainValue) * 100) / 100;
    return { ...g, unpublished, main: mainValue, mainDiff, matchesMain: mainDiff == null ? null : Math.abs(mainDiff) < 1 };
  });
  const compared = checks.filter((c) => c.matchesMain != null);
  return {
    checks,
    summary: {
      areaYears: checks.length,
      compared: compared.length,
      matchesMain: compared.filter((c) => c.matchesMain).length,
      mismatches: compared.filter((c) => !c.matchesMain).map((c) => ({ code: c.code, name: c.name, year: c.year, mainDiff: c.mainDiff })),
      negativeUnpublished: checks.filter((c) => c.unpublished != null && c.unpublished < 0).map((c) => `${c.code}|${c.year}`),
    },
  };
}

/** README の業種別の節。ファイル・列・注記・検算をこの節だけで説明する */
export function renderIndustryReadme({ metric, spec, industry }) {
  const { tables, industries, rows, wardRows, check, designated } = industry;
  const years = [...new Set(tables.flatMap((t) => t.years))].sort((a, b) => a - b);
  const s = check.summary;
  const mismatchText = s.mismatches.length
    ? `合わない ${s.mismatches.length} 件: ${s.mismatches.slice(0, 10).map((m) => `${m.year} 年 ${m.name} (${m.mainDiff})`).join('、')}${s.mismatches.length > 10 ? ' ほか' : ''}`
    : '合わないものはありません';
  return `## 業種別の表 (産業中分類 ${industries.length - 1} 業種・${years[0]}〜${years.at(-1)} 年)

| ファイル | 内容 |
|---|---|
| \`${metric}_industry_municipalities_utf8.csv\` / \`_utf8bom.csv\` | 自治体 × 年 × 業種 (${rows.toLocaleString()} 行)。業種コード 00 は製造業計 |
| \`${metric}_industry_wards_utf8.csv\` / \`_utf8bom.csv\` | 別表。政令市の区と東京 23 区 (${wardRows.toLocaleString()} 行) |
| \`${metric}_industry_check.csv\` | 自治体 × 年の検算表 (製造業計・公表された業種の和・公表されていない業種の合計・本体の値との差) |

- 出典: ${spec.industry.sourceLabel}。表は ${tables.map((t) => `${t.years.join('・')} 年実績 = ${t.statsDataId}`).join('、')}。
- 対象は${spec.industry.scope}です。本体の時系列 (${spec.sourceLabel}) の 2020 年以前とは対象の範囲が違うので、業種別の表を 2020 年以前の年とつなげないでください。
- 列は本体と同じ形に「業種コード」「業種名」を足したものです。**値の単位は ${tables[0].unit} で、本体 (${spec.unit}) と違います**。元の表のまま換算していません。
- 「元データ記号 X (秘匿)」の行は、事業所が少なく数値が公表されていないものです。0 にせず空のまま載せています。製造業計から公表された業種の和を引いた差は検算表に「公表されていない業種の合計」として載せていますが、個々の業種の値を逆算しないでください。
- 区を持つ ${designated} 件 (政令市と東京都特別区部) は、市全体の業種別が e-Stat の表に無い場合、自治体の表では製造業計だけを載せ、業種の行は空欄にして「区の別表を参照」と注記しました。区 × 業種は別表にあります。
- 検算: 製造業計 (${tables[0].unit}) を ${spec.industry.scale} で割った値と本体の${spec.title} (${spec.unit}) を、${s.compared.toLocaleString()} 件の自治体 × 年で比べ、${s.matchesMain.toLocaleString()} 件が 1 ${spec.unit}未満の差で一致しました。${mismatchText}。
`;
}
