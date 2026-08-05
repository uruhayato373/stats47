#!/usr/bin/env node
/**
 * normalize — 既存 snapshot (実データ) を正規化 Observation にして latest.json / health.json を書く。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 * normalized state は derived で再生成可能。
 * source ごとに独立して処理し、1 source の失敗が全体を止めない。
 *
 *   node .claude/scripts/search-growth/normalize.mjs [--week YYYY-Www]
 */
import { NORMALIZE_SOURCES, ALL_SOURCES, PROJECT_ROOT } from "./lib/sources.mjs";
import { validateObservation } from "./lib/contracts.mjs";
import { redactString } from "./lib/redaction.mjs";
import { PATHS, writeJson, currentIsoWeek } from "./lib/state.mjs";
import { pathToFileURL } from "node:url";

export function normalizeAll({ now = new Date().toISOString(), root = PROJECT_ROOT, sources: defs = ALL_SOURCES } = {}) {
  const observations = [];
  const sources = {};
  for (const def of defs) {
    try {
      const res = def.normalize(root, now);
      if (!res || res.observedAt == null) {
        sources[def.name] = { status: "missing", observedAt: null, count: 0, freshness: "missing", note: "committed snapshot 無し" };
        continue;
      }
      const valid = [];
      for (const o of res.observations ?? []) {
        if (validateObservation(o).ok) valid.push(o);
      }
      observations.push(...valid);
      const fresh = valid[0]?.freshness ?? "missing";
      sources[def.name] = {
        status: valid.length ? (fresh === "stale" ? "partial" : "success") : "missing",
        observedAt: res.observedAt,
        count: valid.length,
        freshness: fresh,
        snapshotFile: res.snapshotFile ?? null,
        emitsAs: def.emitsAs ?? [def.name],
      };
    } catch (err) {
      sources[def.name] = { status: "failed", observedAt: null, count: 0, freshness: "missing", error: redactString(err?.message || String(err)) };
    }
  }
  return { generatedAt: now, observations, sources };
}

function main() {
  const now = new Date().toISOString();
  const week = currentIsoWeek();
  const result = normalizeAll({ now });
  writeJson(PATHS.latest, { generatedAt: now, week, sources: result.sources, observations: result.observations });
  const health = {
    generatedAt: now, week,
    sources: Object.fromEntries(Object.entries(result.sources).map(([k, v]) => [k, { status: v.status, freshness: v.freshness, observedAt: v.observedAt, count: v.count }])),
    totalObservations: result.observations.length,
  };
  writeJson(PATHS.health, health);

  const line = Object.entries(result.sources).map(([k, v]) => `${k}:${v.status}(${v.count})`).join("  ");
  console.log(`[normalize] week=${week} observations=${result.observations.length}`);
  console.log(`[normalize] sources: ${line}`);
  console.log(`[normalize] wrote ${PATHS.latest.replace(PROJECT_ROOT + "/", "")}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
