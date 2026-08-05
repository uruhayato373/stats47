#!/usr/bin/env node
/**
 * collect — source 別に raw を取得 (既存 fetcher を再利用) し manifest を書く。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 * - 既定 (no --live): committed snapshot の presence/freshness を probe し「再利用」する。
 * - --live: credential がある source だけ既存 fetcher を subprocess で実行 (無い source は skipped)。
 * - source の失敗は隔離し、exit summary で success/partial/failed/skipped を返す。partial を成功に見せない。
 * - network も mutation もしない (probe は committed snapshot の read のみ)。secret 値は表示しない。
 *
 *   node .claude/scripts/search-growth/collect.mjs [--live] [--week YYYY-Www]
 */
import { spawnSync } from "node:child_process";
import { ALL_SOURCES, NORMALIZE_SOURCES, PROJECT_ROOT, liveCommandFor } from "./lib/sources.mjs";
import { PATHS, writeJson, ensureDir, getArg, hasFlag, currentIsoWeek } from "./lib/state.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function secretPresent(name) {
  // 値は読まない。存在有無だけ。
  return name ? Object.prototype.hasOwnProperty.call(process.env, name) && !!process.env[name] : false;
}

export async function collect({ live = false, week = currentIsoWeek(), now = new Date().toISOString(), sources = ALL_SOURCES, normalizeSources = NORMALIZE_SOURCES } = {}) {
  const results = [];
  for (const def of sources) {
    try {
      const canNormalize = normalizeSources.includes(def);
      const hasSecret = secretPresent(def.secretName);
      // live 実行 (creds があり --live 指定時のみ)。committed snapshot が無い new source はここでしか取れない。
      if (live && def.liveScript && hasSecret) {
        const cmd = liveCommandFor(def, week);
        const r = spawnSync(cmd.cmd, cmd.args, { cwd: PROJECT_ROOT, encoding: "utf8", timeout: 5 * 60 * 1000 });
        if (r.status === 0) {
          results.push({ source: def.name, status: "success", mode: "live", note: cmd.note });
          continue;
        }
        results.push({ source: def.name, status: "failed", mode: "live", note: cmd.note, error: `exit ${r.status}` });
        continue;
      }
      // committed snapshot を再利用
      if (canNormalize) {
        const res = def.normalize(PROJECT_ROOT, now);
        if (res && res.observedAt != null) {
          const count = res.observations?.length ?? 0;
          const fresh = res.observations?.[0]?.freshness ?? "success";
          results.push({
            source: def.name,
            status: fresh === "stale" ? "partial" : "success",
            mode: "snapshot",
            observedAt: res.observedAt,
            count,
            snapshotFile: res.snapshotFile ?? null,
            secretName: def.secretName,
            secretPresent: hasSecret,
          });
        } else {
          results.push({ source: def.name, status: "missing", mode: "snapshot", note: "committed snapshot 無し", secretName: def.secretName, secretPresent: hasSecret });
        }
        continue;
      }
      // live-only の in-process collector (http/sitemap.xml は credential 不要の read-only GET)
      if (live && typeof def.liveCollect === "function" && (def.liveNoSecret || hasSecret)) {
        const r = await def.liveCollect({ now });
        results.push({ source: def.name, status: r.status, mode: "live", count: r.count, note: r.error ?? r.file, secretName: def.secretName, secretPresent: hasSecret });
        continue;
      }
      // live-only source で live 未実行 (creds 無し or --live 無し)
      results.push({
        source: def.name,
        status: "skipped",
        mode: "live-only",
        note: hasSecret ? "--live で実行可 (creds present)" : `live 未検証: ${def.liveCollect ? "--live 指定で実行可 (creds 不要)" : "creds 無し (" + (def.secretName ?? "N/A") + ")"}`,
        secretName: def.secretName,
        secretPresent: hasSecret,
      });
    } catch (err) {
      results.push({ source: def.name, status: "failed", error: String(err?.message || err) });
    }
  }
  return { generatedAt: now, week, live, sources: results };
}

async function main() {
  const argv = process.argv.slice(2);
  const live = hasFlag(argv, "--live");
  const week = getArg(argv, "--week", currentIsoWeek());
  const manifest = await collect({ live, week });
  ensureDir(PATHS.manifests);
  const file = path.join(PATHS.manifests, `${week}.json`);
  writeJson(file, manifest);

  const summary = { success: 0, partial: 0, failed: 0, skipped: 0, missing: 0 };
  for (const s of manifest.sources) summary[s.status] = (summary[s.status] ?? 0) + 1;
  console.log(`[collect] week=${week} live=${live}`);
  for (const s of manifest.sources) {
    console.log(`  ${s.source.padEnd(11)} ${s.status.padEnd(8)} ${s.mode ?? ""} ${s.note ?? (s.count != null ? "count=" + s.count : "")}`);
  }
  console.log(`[collect] summary: ${JSON.stringify(summary)}`);
  // partial/failed を success に見せない。live 未検証 source は skipped で明示。
  if (summary.failed > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
