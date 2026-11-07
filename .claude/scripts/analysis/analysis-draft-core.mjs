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

/** 図の定義と結果から、型の部品へ渡す図の入力を作る。定義した項目が結果に無ければ止める */
export function buildChart(figure, result) {
  const { chart } = figure;
  const rows = result[chart.rows];
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`${figure.id}: 結果に行 ${chart.rows} が無い`);
  if (figure.template === "line") return buildLineChart(figure, rows, result);
  if (figure.template === "scatter") return buildScatterChart(figure, rows, result);
  const valueOf = (row, field) => {
    const value = row[field];
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${figure.id}: ${row[chart.category]} の ${field} が数値でない`);
    return value;
  };
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
    return { title: built.title, chartType: "line", unit: chart.unit, series };
  }
  if (figure.template === "scatter") return { title: built.title, chartType: "scatter", level: built.level, unit: chart.unit, points: built.points };
  const rows = result[chart.rows];
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

/** 下書きを作る前に台帳の不足を全部挙げる */
export function draftInputProblems({ analysis, figures, supportedTemplates }) {
  const problems = [];
  if (!analysis.article) problems.push(`${analysis.id}: article が無い`);
  if (figures.length === 0) problems.push(`${analysis.id}: 図が台帳に無い`);
  for (const figure of figures) {
    if (!figure.chart) problems.push(`${figure.id}: chart が無い`);
    if (!supportedTemplates.includes(figure.template)) problems.push(`${figure.id}: 型 ${figure.template} は下書きに未対応 (対応: ${supportedTemplates.join(", ")})`);
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
