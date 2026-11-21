import assert from "node:assert/strict";
import test from "node:test";

import {
  FULL_RENDER_CPU_MS,
  ROUTE_GROUPS,
  buildRecord,
  planQueries,
  readTotals,
  renderMarkdown,
  routeCpuMetrics,
} from "../route-cpu.mjs";

/** telemetry query の calculations 応答 (groupBy なし) を作る */
const totals = ({ cpu = 0, count = 0, uniq = null }) => ({
  result: {
    calculations: [
      ...(uniq === null ? [] : [{ calculation: "uniq($workers.event.request.url)", aggregates: [{ value: uniq, count }] }]),
      { calculation: "sum($workers.cpuTimeMs)", aggregates: [{ value: cpu, count }] },
      { calculation: "count", aggregates: [{ value: count, count }] },
    ],
  },
});

function responsesWith(overrides = {}) {
  const responses = { total: totals({ cpu: 45_821_000, count: 60_421 }), ua: { result: { calculations: [] } } };
  for (const g of ROUTE_GROUPS) {
    responses[`route:${g.key}`] = totals({ cpu: 0, count: 0, uniq: 0 });
    responses[`render:${g.key}`] = totals({ cpu: 0, count: 0, uniq: 0 });
  }
  return { ...responses, ...overrides };
}

test("フル描画は CPU が閾値を超えたリクエストとして数え、route ごとに 2 本の query を組む", () => {
  const queries = planQueries({ from: 0, to: 86_400_000 });
  assert.equal(queries.length, 3 + ROUTE_GROUPS.length * 2);
  const render = queries.find((q) => q.id === "render:ranking").body;
  const filters = render.parameters.filters;
  assert.deepEqual(filters[0], { key: "$workers.scriptName", operation: "eq", type: "string", value: "stats47" });
  assert.ok(filters.some((f) => f.key === "$workers.cpuTimeMs" && f.operation === "gt" && f.value === FULL_RENDER_CPU_MS));
  assert.ok(filters.some((f) => f.operation === "includes" && f.value === "stats47.jp/ranking/"));
  assert.equal(render.parameters.orderBy, undefined);
  const ua = queries.find((q) => q.id === "ua").body;
  assert.deepEqual(ua.parameters.orderBy, { value: "sum($workers.cpuTimeMs)", order: "desc" });
});

test("2026-11-21 の /ranking/* (ISR が効いていない状態) の値を組み立て、最大値の route を指標に出す", () => {
  // 実測: 24 時間で フル描画 9,710 回・3,100 URL・16,251,279 ms (Observability)
  const record = buildRecord({
    responses: responsesWith({
      "route:ranking": totals({ cpu: 17_273_000, count: 14_464, uniq: 3_500 }),
      "render:ranking": totals({ cpu: 16_251_279, count: 9_710, uniq: 3_100 }),
    }),
    from: 0,
    to: 86_400_000,
    days: 1,
  });
  const ranking = record.routes[0];
  assert.equal(ranking.route, "ranking");
  assert.equal(ranking.fullRendersPerUrlPerDay, 3.1);
  assert.equal(ranking.avgFullRenderCpuMs, 1674);
  assert.equal(ranking.cpuShare, 37.7);
  assert.deepEqual(routeCpuMetrics(record), {
    workers_route_max_full_renders_per_url: { value: 3.1, route: "ranking" },
    workers_route_max_avg_full_render_cpu_ms: { value: 1674, route: "ranking" },
  });
});

test("7 日窓は 1 日あたりに割り、件数 0 の route は null にする", () => {
  const record = buildRecord({
    responses: responsesWith({ "render:blog": totals({ cpu: 700_000, count: 700, uniq: 100 }) }),
    from: 0,
    to: 7 * 86_400_000,
    days: 7,
  });
  assert.equal(record.routes.find((r) => r.route === "blog").fullRendersPerUrlPerDay, 1);
  assert.equal(record.routes.find((r) => r.route === "geo").fullRendersPerUrlPerDay, null);
  assert.equal(record.total.dailyCpuMs, Math.round(45_821_000 / 7));
});

test("フル描画が 1 件も無い日は指標を null にする (0 と見せない)", () => {
  const record = buildRecord({ responses: responsesWith(), from: 0, to: 86_400_000, days: 1 });
  assert.deepEqual(routeCpuMetrics(record), {
    workers_route_max_full_renders_per_url: null,
    workers_route_max_avg_full_render_cpu_ms: null,
  });
});

test("応答が空でも 0 を返し、Markdown に版の数を書く", () => {
  assert.deepEqual(readTotals(undefined), { cpuMs: 0, requests: 0, uniqueUrls: null });
  const versions = { result: { calculations: [{ calculation: "uniq($workers.scriptVersion.id)", aggregates: [{ value: 2 }] }] } };
  const record = buildRecord({ responses: responsesWith({ versions }), from: 0, to: 86_400_000, days: 1 });
  assert.equal(record.versionsSeen, 2);
  const md = renderMarkdown(record);
  assert.match(md, /Worker の版 2 個/);
});
