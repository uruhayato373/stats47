/**
 * Worker `stats47` の route 別 CPU (Workers Observability の telemetry query → 週次記録)。
 * 純粋関数だけを置く。API 呼び出しは .claude/scripts/cloudflare/fetch-route-cpu.mjs 側。
 *
 * なぜ要るか (CF-CPU-ISR-01・2026-11-21): 日次の記録は Worker 全体の CPU 合計だけで、どの route が
 * 毎回描画になっているかは画面でしか分からなかった。`/ranking/*` と `/areas/*` は ISR のつもりで
 * 5 か月毎回描画され (1 URL あたり 1 日 3 回超・1 回約 1.7 秒)、CPU 課金の約 7 割を占めていた。
 *
 * 「フル描画」は 1 リクエストの CPU が FULL_RENDER_CPU_MS を超えたもの。ISR や Workers Cache から返した
 * 応答は数 ms〜数十 ms に収まるので、閾値を超えた件数が「描画した回数」の近似になる。
 * API: POST /accounts/<id>/workers/observability/telemetry/query
 * (https://developers.cloudflare.com/api/resources/workers/subresources/observability/ 、2026-11-21 確認)。
 * token には Workers の Metadata Read-Only 相当の権限が要る
 * (https://developers.cloudflare.com/workers/authorization/ 、2026-11-21 確認)。
 */

export const SCRIPT_NAME = "stats47";
export const FULL_RENDER_CPU_MS = 200;

/** route の先頭で束ねる。`include` は URL の部分一致 (telemetry query の includes)。 */
export const ROUTE_GROUPS = [
  { key: "ranking", include: "stats47.jp/ranking/" },
  { key: "areas", include: "stats47.jp/areas/" },
  { key: "municipalities", include: "stats47.jp/municipalities" },
  { key: "themes", include: "stats47.jp/themes/" },
  { key: "blog", include: "stats47.jp/blog" },
  { key: "survey", include: "stats47.jp/survey" },
  { key: "category", include: "stats47.jp/category" },
  { key: "geo", include: "stats47.jp/geo" },
  { key: "api", include: "stats47.jp/api/" },
  { key: "search", include: "stats47.jp/search" },
];

const CPU_KEY = "$workers.cpuTimeMs";
const URL_KEY = "$workers.event.request.url";
const UA_KEY = "$workers.event.request.headers.user-agent";
const VERSION_KEY = "$workers.scriptVersion.id";

function baseFilters() {
  return [{ key: "$workers.scriptName", operation: "eq", type: "string", value: SCRIPT_NAME }];
}

/** telemetry query の本文。groupBy なしの集計 (calculations ビュー)。 */
export function buildQuery({ queryId, from, to, filters = [], calculations, groupBy = null, limit = 10 }) {
  return {
    queryId,
    timeframe: { from, to },
    view: "calculations",
    limit,
    parameters: {
      datasets: ["cloudflare-workers"],
      filters: [...baseFilters(), ...filters],
      calculations,
      groupBys: groupBy ? [{ type: "string", value: groupBy }] : [],
      // groupBy の上位 limit 件を CPU の多い順に取る (指定しないと任意の limit 件が返る。2026-11-21 実測)
      ...(groupBy ? { orderBy: { value: `sum(${CPU_KEY})`, order: "desc" } } : {}),
      limit,
    },
  };
}

const TOTALS = [
  { operator: "sum", key: CPU_KEY, keyType: "number" },
  { operator: "count" },
];
const WITH_UNIQ_URL = [{ operator: "uniq", key: URL_KEY, keyType: "string" }, ...TOTALS];

const includes = (value) => ({ key: URL_KEY, operation: "includes", type: "string", value });
const fullRender = { key: CPU_KEY, operation: "gt", type: "number", value: FULL_RENDER_CPU_MS };

/** 1 週間ぶんの記録に要る query の一覧。`id` は応答を組み立てるときの名前。 */
export function planQueries({ from, to }) {
  const q = (id, opts) => ({ id, body: buildQuery({ queryId: `route-cpu-${id}-${to}`, from, to, ...opts }) });
  return [
    q("total", { calculations: TOTALS }),
    ...ROUTE_GROUPS.flatMap((g) => [
      q(`route:${g.key}`, { filters: [includes(g.include)], calculations: WITH_UNIQ_URL }),
      q(`render:${g.key}`, { filters: [includes(g.include), fullRender], calculations: WITH_UNIQ_URL }),
    ]),
    q("ua", { filters: [fullRender], calculations: TOTALS, groupBy: UA_KEY, limit: 10 }),
    // 窓の中で応答した Worker の版の数。ISR のキャッシュは版 (buildId) ごとなので、デプロイの回数だけ全 URL が描き直しになる
    q("versions", { calculations: [{ operator: "uniq", key: VERSION_KEY, keyType: "string" }] }),
  ];
}

/** telemetry query の応答から calculation 名 → 値 (groupBy なし) を取り出す。 */
export function readTotals(response) {
  const out = {};
  for (const calc of response?.result?.calculations ?? []) {
    out[calc.calculation] = calc.aggregates?.[0]?.value ?? 0;
  }
  return {
    cpuMs: Math.round(out[`sum(${CPU_KEY})`] ?? 0),
    requests: out.count ?? 0,
    uniqueUrls: out[`uniq(${URL_KEY})`] ?? null,
  };
}

/** groupBy 付きの応答 → [{ key, cpuMs, requests }] (CPU の多い順)。 */
export function readGroups(response) {
  const calc = (response?.result?.calculations ?? []).find((c) => c.calculation === `sum(${CPU_KEY})`);
  return (calc?.aggregates ?? [])
    .map((a) => ({ key: a.groupKey, cpuMs: Math.round(a.value ?? 0), requests: a.count ?? 0 }))
    .sort((a, b) => b.cpuMs - a.cpuMs);
}

const round1 = (n) => Math.round(n * 10) / 10;

/**
 * query の応答 (id → 応答) から週次記録を組み立てる。
 * days は集計窓の日数 (1 URL あたり 1 日の描画回数の分母)。
 * 版が多い週は、ISR が効いていても描画回数が版の数だけ増える (読み手が区別できるよう versionsSeen を残す)。
 */
export function buildRecord({ responses, from, to, days }) {
  const total = readTotals(responses.total);
  const versionCalc = (responses.versions?.result?.calculations ?? [])[0];
  const versionsSeen = versionCalc?.aggregates?.[0]?.value ?? null;
  const routes = ROUTE_GROUPS.map((g) => {
    const all = readTotals(responses[`route:${g.key}`]);
    const render = readTotals(responses[`render:${g.key}`]);
    return {
      route: g.key,
      cpuMs: all.cpuMs,
      cpuShare: total.cpuMs ? round1((all.cpuMs / total.cpuMs) * 100) : 0,
      requests: all.requests,
      fullRenders: render.requests,
      fullRenderUrls: render.uniqueUrls,
      avgFullRenderCpuMs: render.requests ? Math.round(render.cpuMs / render.requests) : null,
      fullRendersPerUrlPerDay:
        render.uniqueUrls ? round1(render.requests / render.uniqueUrls / days) : null,
    };
  }).sort((a, b) => b.cpuMs - a.cpuMs);
  return {
    window: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), days },
    fullRenderCpuMs: FULL_RENDER_CPU_MS,
    total: { cpuMs: total.cpuMs, requests: total.requests, dailyCpuMs: Math.round(total.cpuMs / days) },
    versionsSeen,
    routes,
    topUserAgentsByFullRenderCpu: readGroups(responses.ua).slice(0, 10),
  };
}

/**
 * threshold-check の flatten が読む指標。全 route の最大値と、その route 名。
 * 閾値はここに置かない (正本は .claude/config/budgets/cloudflare-cost-improvement/budgets-daily.json)。
 */
export function routeCpuMetrics(record) {
  const pick = (field) => record.routes
    .filter((r) => typeof r[field] === "number")
    .reduce((best, r) => (best === null || r[field] > best[field] ? r : best), null);
  const renders = pick("fullRendersPerUrlPerDay");
  const avg = pick("avgFullRenderCpuMs");
  return {
    workers_route_max_full_renders_per_url: renders ? { value: renders.fullRendersPerUrlPerDay, route: renders.route } : null,
    workers_route_max_avg_full_render_cpu_ms: avg ? { value: avg.avgFullRenderCpuMs, route: avg.route } : null,
  };
}

/** 週次要約 (LATEST.md) 用の Markdown 表。上位 limit route。 */
export function renderMarkdown(record, limit = 6) {
  const usd = (ms) => Math.max(0, (ms * 30 - 30_000_000) * 0.02 / 1_000_000).toFixed(2);
  const lines = [
    `Worker CPU (${record.window.from.slice(0, 10)}〜${record.window.to.slice(0, 10)}・${record.window.days} 日): 1 日平均 ${(record.total.dailyCpuMs / 1000).toFixed(0)} 秒、月換算の CPU 課金 約 $${usd(record.total.dailyCpuMs)}${record.versionsSeen === null ? "" : `、応答した Worker の版 ${record.versionsSeen} 個`}`,
    "",
    "| route | CPU 割合 | フル描画 / URL / 日 | フル描画の平均 CPU |",
    "|---|---|---|---|",
    ...record.routes.slice(0, limit).map((r) =>
      `| ${r.route} | ${r.cpuShare}% | ${r.fullRendersPerUrlPerDay ?? "—"} | ${r.avgFullRenderCpuMs === null ? "—" : `${r.avgFullRenderCpuMs} ms`} |`),
  ];
  return lines.join("\n");
}
