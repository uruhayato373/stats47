#!/usr/bin/env npx tsx
/**
 * 月次の取り込みの対象外の指標 (external) について、出典ページの変化を週次で検知する。
 * 出力: data/provenance/source-watch.json (前回との比較の元) / source-watch.md (週次レビューが読む)。
 * 値は変えない。到達できない出典があっても監査は失敗にしない (一覧に出す)。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { datasetDir } from "../../../config/datasets.mjs";
import { compareSource, fingerprint, sourceWatchUrl } from "./lib/source-watch.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const STATE_DIR = resolve(ROOT, datasetDir("provenance.queue"));
const JSON_PATH = resolve(STATE_DIR, "source-watch.json");
const REPORT_PATH = resolve(STATE_DIR, "source-watch.md");
const CONCURRENCY = 6;
const TIMEOUT_MS = 30_000;
const USER_AGENT = "Mozilla/5.0 (compatible; stats47-source-watch/1.0; +https://stats47.jp)";

type Snapshot = { ok: true; status: number; hash: string; latestYear: number | null } | { ok: false; status: number | string };

async function fetchOnce(url: string): Promise<Snapshot> {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return { ok: false, status: res.status };
    const body = Buffer.from(await res.arrayBuffer());
    return { ok: true, status: res.status, ...fingerprint({ body, contentType: res.headers.get("content-type") }) };
  } catch (error) {
    return { ok: false, status: (error as Error).name };
  }
}

async function fetchSnapshot(url: string): Promise<Snapshot> {
  const first = await fetchOnce(url);
  return first.ok ? first : fetchOnce(url);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: limit }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }));
  return results;
}

async function main(): Promise<void> {
  const watched = new Map<string, string[]>();
  const noUrl: string[] = [];
  for (const metric of Object.values(METRICS_REGISTRY)) {
    if (metric.isActive === false || metric.source.kind !== "external") continue;
    const url = sourceWatchUrl(metric.source);
    if (!url) {
      noUrl.push(metric.key);
      continue;
    }
    watched.set(url, [...(watched.get(url) ?? []), metric.key]);
  }

  const previous = existsSync(JSON_PATH) ? JSON.parse(readFileSync(JSON_PATH, "utf8")) : { sources: {} };
  const checkedAt = new Date().toISOString();
  const urls = [...watched.keys()].sort();
  const snapshots = await mapLimit(urls, CONCURRENCY, fetchSnapshot);

  const sources: Record<string, unknown> = {};
  const groups: Record<string, { url: string; status?: unknown; metrics: string[] }[]> = { "newer-year": [], content: [], unreachable: [] };
  urls.forEach((url, index) => {
    const { kind, entry } = compareSource(previous.sources[url], snapshots[index], checkedAt);
    const metrics = watched.get(url) ?? [];
    sources[url] = { ...entry, metrics };
    groups[kind]?.push({ url, status: (entry as { status?: unknown }).status, metrics });
  });

  writeFileSync(JSON_PATH, `${JSON.stringify({ checkedAt, noUrl, sources }, null, 2)}\n`);

  const section = (title: string, rows: { url: string; status?: unknown; metrics: string[] }[]) =>
    rows.length === 0
      ? `## ${title}\n\nなし\n`
      : `## ${title}\n\n${rows.map((r) => `- ${r.url} (${r.status}) — ${r.metrics.length} 指標: ${r.metrics.slice(0, 5).join(", ")}${r.metrics.length > 5 ? " ほか" : ""}`).join("\n")}\n`;

  writeFileSync(REPORT_PATH, `# 出典ページの変化

観測: ${checkedAt} / 出典 ${urls.length} 種類 / 出典の URL が無い指標 ${noUrl.length} 件

新しい版の取り込みは指標の \`provenance.restore\` の手順で行う。ページの変化だけで値を更新しない。

${section("新しい年の表記が増えた (新しい版の可能性が高い)", groups["newer-year"])}
${section("本文だけ変わった (版の更新とは限らない)", groups.content)}
${section("開けなかった", groups.unreachable)}
`);

  console.log(`出典 ${urls.length} 種類: 新しい年 ${groups["newer-year"].length} / 本文の変化 ${groups.content.length} / 開けない ${groups.unreachable.length} / URL なし ${noUrl.length} 指標`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
