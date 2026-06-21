import "dotenv/config";

/**
 * verify-inputs.ts — 指定 ranking key 群が build-input 可能か (= 再生成可能か) を一括判定する。
 *
 * 背景: ai-content が R2 に有る/無い だけでは「再生成できるか」は分からない。観測値・item.latestYear の
 * 欠落で build-input が null を返すキーがある (例 public-phone-count は values.json 200 でも build-input 失敗)。
 * agent に投げる前にここで弾くと、SKIP で枠を無駄にしない。is-content-queue の --next 候補をこれで検証する。
 *
 * Usage:
 *   NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
 *     tsx packages/ai-content/src/scripts/verify-inputs.ts key1 key2 ...
 *   ... | tsx verify-inputs.ts --stdin              # 1行1key を標準入力から
 *   ... tsx verify-inputs.ts --stdin --ok-only      # OK の key だけを1行ずつ出力 (パイプ用)
 *
 * 出力 (既定): "OK\t<count>件\t<year>\t<key>" / "FAIL\t-\t-\t<key>"
 *   --ok-only: OK の key のみ (次バッチへそのまま渡せる)
 *
 * 関連: build-input.ts (buildRankingContentInput) / .claude/scripts/ai-content/build-ai-content-queue.mjs
 */

import { buildRankingContentInput } from "./build-input";
import type { AreaType } from "@stats47/types";

async function readStdinLines(): Promise<string[]> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks)
    .toString("utf8")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const argv = process.argv.slice(2);
  const useStdin = argv.includes("--stdin");
  const okOnly = argv.includes("--ok-only");
  const areaIdx = argv.indexOf("--area");
  const areaType = (areaIdx >= 0 ? argv[areaIdx + 1] : "prefecture") as AreaType;
  let keys = argv.filter((a) => !a.startsWith("--") && a !== areaType);
  if (useStdin) keys = await readStdinLines();
  keys = [...new Set(keys)];

  const CONCURRENCY = 12;
  const results: { key: string; ok: boolean; count: number; year: string }[] = [];
  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY);
    const r = await Promise.all(
      batch.map(async (key) => {
        try {
          const m = await buildRankingContentInput(key, areaType);
          return { key, ok: !!m, count: m?.totalCount ?? 0, year: m?.yearCode ?? "" };
        } catch {
          return { key, ok: false, count: 0, year: "" };
        }
      }),
    );
    results.push(...r);
  }

  if (okOnly) {
    for (const r of results) if (r.ok) process.stdout.write(r.key + "\n");
    process.stderr.write(`\nverify: OK ${results.filter((r) => r.ok).length} / ${results.length}\n`);
    return;
  }
  for (const r of results) {
    process.stdout.write(`${r.ok ? "OK" : "FAIL"}\t${r.ok ? r.count + "件" : "-"}\t${r.year || "-"}\t${r.key}\n`);
  }
  process.stderr.write(`\nverify: OK ${results.filter((r) => r.ok).length} / ${results.length}\n`);
}

main().catch((e) => {
  process.stderr.write(`[verify-inputs] ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
