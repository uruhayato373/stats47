/**
 * 分析の結果と図の台帳から、記事の図のデータと出典を組み立てる純粋関数。
 * 値は結果の JSON からだけ読み、ここで丸めも補完もしない。ファイルの読み書きは analysis-draft.ts が持つ。
 */

/** 見出しの {towns} のような差し込みを結果の値で埋める。数は 3 桁区切りにする */
export function fillMeta(meta, result) {
  return meta.replace(/\{(\w+)\}/g, (_, key) => {
    const value = result[key];
    if (value === undefined) throw new Error(`結果に ${key} が無い (meta: ${meta})`);
    return typeof value === "number" ? value.toLocaleString("ja-JP") : String(value);
  });
}

/** 折れ線の入力。系列は結果の行をそのまま使う */
function buildLineChart(figure, rows, result) {
  const { chart } = figure;
  for (const row of rows) {
    if (!row.points?.length || row.points.some((point) => !Number.isFinite(point.value))) throw new Error(`${figure.id}: ${row.label} の点が足りない`);
  }
  return { title: figure.title, meta: fillMeta(chart.meta, result), source: chart.source, decimals: chart.decimals, series: rows };
}

/** 散布図の入力。点の名前は出さず、町の順位に読ませない */
function buildScatterChart(figure, rows, result) {
  const { chart } = figure;
  if (rows.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) throw new Error(`${figure.id}: 点の値が足りない`);
  return { title: figure.title, meta: fillMeta(chart.meta, result), note: chart.note, source: chart.source, level: "municipality", xLabel: chart.xLabel, yLabel: chart.yLabel, points: rows, labelNames: [] };
}

/** 箱ひげの行が持つ項目。端 (min / max) を外れ値の除外後にするかは分析が決め、meta か note に書く */
export const BOX_FIELDS = ["min", "q1", "median", "q3", "max"];

/**
 * 2 時点の変化 (スロープ)。折れ線の型に series を書いた図で、行ごとに 1 本の線を引き、series の 2 項目を左右の時点にする。
 * 両端に値を置くので値の軸の目盛りは出さない
 */
function buildSlopeChart(figure, rows, result, valueOf) {
  const { chart } = figure;
  if (chart.series.length !== 2) throw new Error(`${figure.id}: 2 時点の変化は series を 2 つ (始点と終点) にする`);
  return {
    title: figure.title, meta: fillMeta(chart.meta, result), source: chart.source, decimals: chart.decimals ?? 1, startLabels: true,
    series: rows.map((row) => ({ label: row[chart.category], points: chart.series.map((s) => ({ x: s.label, value: valueOf(row, s.field) })) })),
  };
}

/** 区分ごとの分布 (箱ひげ)。四分位と端は分析が計算した値をそのまま描く */
function buildBoxplotChart(figure, rows, result, valueOf) {
  const { chart } = figure;
  const groups = rows.map((row) => {
    const stats = Object.fromEntries(BOX_FIELDS.map((field) => [field, valueOf(row, field)]));
    if (BOX_FIELDS.some((field, i) => i > 0 && stats[field] < stats[BOX_FIELDS[i - 1]])) throw new Error(`${figure.id}: ${row[chart.category]} の min ≤ q1 ≤ median ≤ q3 ≤ max が崩れている`);
    return { label: row[chart.category], ...stats };
  });
  return { title: figure.title, meta: fillMeta(chart.meta, result), note: chart.note, source: chart.source, decimals: chart.decimals ?? 1, groups };
}

/** 図の定義と結果から、型の部品へ渡す図の入力を作る。定義した項目が結果に無ければ止める */
export function buildChart(figure, result) {
  const { chart } = figure;
  const rows = result[chart.rows];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${figure.id}: 結果に行 ${chart.rows} が無い`);
  if (figure.template === "line" && !chart.series) return buildLineChart(figure, rows, result);
  if (figure.template === "scatter") return buildScatterChart(figure, rows, result);
  const valueOf = (row, field) => {
    const value = row[field];
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${figure.id}: ${row[chart.category]} の ${field} が数値でない`);
    return value;
  };
  if (figure.template === "line") return buildSlopeChart(figure, rows, result, valueOf);
  if (figure.template === "boxplot") return buildBoxplotChart(figure, rows, result, valueOf);
  if (figure.template === "stacked-bar") {
    const categories = chart.series.map((s) => ({ label: s.label, values: rows.map((row) => valueOf(row, s.field)) }));
    if (categories.some((c) => c.values.some((v) => v < 0))) throw new Error(`${figure.id}: 100% 積み上げに負の値がある`);
    return { title: figure.title, meta: fillMeta(chart.meta, result), note: chart.note, source: chart.source, groups: rows.map((row) => row[chart.category]), categories, normalized: true, unit: chart.unit, decimals: chart.decimals };
  }
  return {
    title: figure.title,
    meta: fillMeta(chart.meta, result),
    source: chart.source,
    groups: rows.map((row) => row[chart.category]),
    series: chart.series.map((s) => ({ label: s.label, values: rows.map((row) => valueOf(row, s.field)) })),
  };
}

/** 図の点データ。本文の照合と再生成の入力になる */
export function buildChartData(figure, built, result) {
  const { chart } = figure;
  // 執筆の指示文の読み手に合わせ、時系列の形 ({ year, value }) にそろえる
  if (figure.template === "line") {
    const series = built.series.map((line) => ({ label: line.label, data: line.points.map((point) => ({ year: Number.parseInt(point.x, 10), value: point.value })) }));
    return { title: built.title, chartType: "line", ...(built.startLabels ? { form: "slope" } : {}), unit: chart.unit, series };
  }
  if (figure.template === "scatter") return { title: built.title, chartType: "scatter", level: built.level, unit: chart.unit, points: built.points };
  const rows = result[chart.rows];
  const count = (i) => (chart.count ? { [chart.count]: rows[i][chart.count] } : {});
  if (figure.template === "boxplot") {
    return { title: built.title, chartType: "boxplot", data: built.groups.map((g, i) => ({ ...g, ...count(i), unit: chart.unit })) };
  }
  if (figure.template === "stacked-bar") {
    // 描画は行の合計を 100% にする。値は結果のまま運び、割合は本文の照合で同じ式から出す
    return {
      title: built.title, chartType: "stacked-bar", normalized: true,
      data: built.groups.map((group, i) => ({ label: group, ...count(i), unit: chart.unit, ...Object.fromEntries(built.categories.map((c) => [c.label, c.values[i]])) })),
    };
  }
  return {
    title: built.title,
    data: built.groups.map((group, i) => ({
      label: group,
      ...(chart.count ? { [chart.count]: rows[i][chart.count] } : {}),
      unit: chart.unit,
      ...Object.fromEntries(built.series.map((s) => [s.label, s.values[i]])),
    })),
  };
}

/** 図の出典。指標は分析の spec から導くので、台帳に写しを持たない */
export function buildChartSource({ figure, spec, generatedBy, result }) {
  const { chart, scope } = figure;
  const file = scope === "municipality" ? "cities.json" : "values.json";
  return {
    kind: "derived",
    source: spec.metrics.map((m) => `r2:app/stats/${m.key}/${file}`).join(" + "),
    transform: chart.transform,
    generatedBy,
    ...(scope === "municipality" ? { areaScope: { level: "municipality", wardMode: "merged", within: { kind: "nation" } } } : {}),
    displaySources: chart.displaySources,
    ...(figure.template === "scatter" ? { expectedPointCount: result[chart.rows].length, pearsonR: result[chart.correlationField] } : {}),
  };
}

/**
 * 型ごとの図の名前の接尾辞。記事の表示は名前で 4:5 の幅と暗い版 (-dark.svg) を選ぶ
 * (apps/web/src/features/blog/lib/responsive-chart.ts)。-stacked と -trend は横長の旧図の名前なので使わない
 */
export const NAME_SUFFIX = { "grouped-bar": "-bars", "stacked-bar": "-bars", line: "-lines", scatter: "-scatter", boxplot: "-boxplot" };

/** 型ごとに chart に要る項目。行から値を読む型は区分の名前 (category) と系列 (series) を要る */
const REQUIRED_FIELDS = { "grouped-bar": ["category", "series"], "stacked-bar": ["category", "series"], boxplot: ["category"] };

/** 下書きを作る前に台帳の不足を全部挙げる */
export function draftInputProblems({ analysis, figures, supportedTemplates }) {
  const problems = [];
  if (!analysis.article) problems.push(`${analysis.id}: article が無い`);
  if (figures.length === 0) problems.push(`${analysis.id}: 図が台帳に無い`);
  for (const figure of figures) {
    if (!figure.chart) problems.push(`${figure.id}: chart が無い`);
    if (!supportedTemplates.includes(figure.template)) problems.push(`${figure.id}: 型 ${figure.template} は下書きに未対応 (対応: ${supportedTemplates.join(", ")})`);
    if (!figure.chart) continue;
    const suffix = NAME_SUFFIX[figure.template];
    if (suffix && !figure.chart.name.endsWith(suffix)) problems.push(`${figure.id}: 名前 ${figure.chart.name} は ${suffix} で終える (記事の表示が 4:5 と暗い版を名前で選ぶ)`);
    for (const field of REQUIRED_FIELDS[figure.template] ?? []) if (!figure.chart[field]) problems.push(`${figure.id}: ${figure.template} に chart.${field} が無い`);
    if (figure.template === "line" && figure.chart.series && !figure.chart.category) problems.push(`${figure.id}: 2 時点の変化に chart.category が無い`);
  }
  return problems;
}

/** 書き手へ渡す材料。結論と注意点は台帳の文をそのまま渡す */
export function buildMaterials({ analysis }) {
  return [
    "# 問いと結論 (記事はこの問いに答えます)",
    "",
    `- 問い: ${analysis.question}`,
    `- 結論: ${analysis.finding}`,
    "",
    "## 必ず本文に反映する注意点",
    "",
    ...analysis.caveats.map((c) => `- ${c}`),
    "",
    "因果として書きません。個々の町を順位にしません。結論にない解釈を足しません。",
    "",
  ].join("\n");
}
