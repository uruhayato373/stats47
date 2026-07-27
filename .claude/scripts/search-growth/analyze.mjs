#!/usr/bin/env node
/**
 * analyze — normalized Observation から決定的に candidate を生成し candidates.json を書く。
 * 正典: docs/02_実装計画/39 §5 / Phase 4。
 *   node .claude/scripts/search-growth/analyze.mjs
 */
import { buildCandidates, DEFAULT_CONFIG } from "./lib/scoring.mjs";
import { carryOverStatuses } from "./lib/triage.mjs";
import { PROJECT_ROOT } from "./lib/sources.mjs";
import { PATHS, readJson, writeJson, currentIsoWeek } from "./lib/state.mjs";

export function analyze({ observations, pastEffects = {}, prevCandidates = [], now = new Date().toISOString() }) {
  const built = buildCandidates(observations, { config: DEFAULT_CONFIG, pastEffects, now });
  // 週次再構築で人間承認の lifecycle (approved/in-progress 等) を消さない (§18.4)
  const candidates = carryOverStatuses(built, prevCandidates);
  const byType = {};
  for (const c of candidates) byType[c.type] = (byType[c.type] ?? 0) + 1;
  return { generatedAt: now, count: candidates.length, byType, candidates };
}

function main() {
  const now = new Date().toISOString();
  const latest = readJson(PATHS.latest);
  if (!latest) {
    console.error("[analyze] latest.json が無い。先に normalize を実行してください。");
    process.exit(1);
  }
  const pastEffects = readJson(PATHS.pastEffects, {})?.urls ?? {};
  const prevCandidates = readJson(PATHS.candidates, {})?.candidates ?? [];
  const result = analyze({ observations: latest.observations, pastEffects, prevCandidates, now });
  writeJson(PATHS.candidates, {
    generatedAt: now,
    week: currentIsoWeek(),
    sourceHealth: latest.sources,
    config: DEFAULT_CONFIG,
    count: result.count,
    byType: result.byType,
    candidates: result.candidates,
  });
  console.log(`[analyze] candidates=${result.count}`);
  console.log(`[analyze] by type: ${JSON.stringify(result.byType)}`);
  console.log(`[analyze] wrote ${PATHS.candidates.replace(PROJECT_ROOT + "/", "")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
