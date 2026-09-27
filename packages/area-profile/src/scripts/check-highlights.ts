/**
 * 県の「特徴」の生成時検査を R2 へ書かずに実行する (AREA-HIGHLIGHTS-SSOT-01)。
 *
 * databook.json を公開 R2 の values.json / item.json から in-memory で組み立て、47 県ぶん
 * 選定 + 検査を行い、県ごとの候補数 (上位/下位) と選定件数、違反を表示する。違反があれば非 0 終了。
 * exporter (exportAreaDatabookSnapshot) も R2 へ書く前に同じ検査を実行する。
 *
 * Usage:
 *   npm run check:highlights --workspace=@stats47/area-profile [-- --out-dir <dir>]
 *   --out-dir: 生成した databook.json を <dir>/<areaCode>/databook.json に書く (SNS の --databook 入力用)
 *   --from-dir: R2 を読まず、--out-dir で書き出した databook.json を検査する (選定規則だけ変えたとき用)
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { KNOWN_RANKING_KEYS } from "@stats47/ranking/config";

import { buildAreaDatabookSnapshots } from "../exporters/area-databook-snapshot";
import { checkAreaHighlights } from "../highlights/check-area-highlights";
import { listAreaHighlightCandidates } from "../highlights/select-area-highlights";
import { parseAreaDatabookSnapshot, type AreaDatabookSnapshot } from "../types/databook-snapshot";

async function main() {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf("--out-dir");
  const outDir = outIdx !== -1 ? argv[outIdx + 1] : null;

  const fromIdx = argv.indexOf("--from-dir");
  const fromDir = fromIdx !== -1 ? argv[fromIdx + 1] : null;
  let snapshots: AreaDatabookSnapshot[];
  if (fromDir) {
    snapshots = readdirSync(fromDir)
      .sort()
      .map((code) => parseAreaDatabookSnapshot(JSON.parse(readFileSync(join(fromDir, code, "databook.json"), "utf8"))));
  } else {
    const built = await buildAreaDatabookSnapshots();
    snapshots = built.snapshots;
    if (built.metricsMissing.length > 0) console.error(`⚠ 値が無い指標: ${built.metricsMissing.join(", ")}`);
  }

  const rows = snapshots
    .map((s) => {
      const candidates = listAreaHighlightCandidates(s);
      return {
        areaCode: s.areaCode,
        areaName: s.areaName,
        candidatesTop: candidates.top.length,
        candidatesBottom: candidates.bottom.length,
      };
    })
    .sort((a, b) => a.areaCode.localeCompare(b.areaCode));
  const result = checkAreaHighlights(snapshots, { publishedKeys: KNOWN_RANKING_KEYS });
  const filled = new Map(result.filled.map((f) => [f.areaCode, f]));

  for (const r of rows) {
    const f = filled.get(r.areaCode);
    console.log(
      `${r.areaCode} ${r.areaName}\t候補 上位${r.candidatesTop}/下位${r.candidatesBottom}\t選定 上位${f?.top ?? 0}/下位${f?.bottom ?? 0}`,
    );
  }
  const minOf = (pick: (r: (typeof rows)[number]) => number) => Math.min(...rows.map(pick));
  const maxOf = (pick: (r: (typeof rows)[number]) => number) => Math.max(...rows.map(pick));
  console.log(
    `県数 ${rows.length} / 候補 上位 min ${minOf((r) => r.candidatesTop)} max ${maxOf((r) => r.candidatesTop)}` +
      ` / 下位 min ${minOf((r) => r.candidatesBottom)} max ${maxOf((r) => r.candidatesBottom)}`,
  );

  if (outDir) {
    for (const s of snapshots) {
      const dir = join(outDir, s.areaCode);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "databook.json"), JSON.stringify(s));
    }
    console.log(`→ ${snapshots.length} 県の databook.json を ${outDir} に書き出しました (R2 には書いていません)`);
  }

  if (rows.length !== 47) {
    console.error(`✗ 県数が 47 ではありません: ${rows.length}`);
    process.exit(1);
  }
  if (result.violations.length > 0) {
    console.error(`✗ 違反 ${result.violations.length} 件`);
    for (const v of result.violations) console.error(`  - ${v.areaCode} [${v.kind}] ${v.detail}`);
    process.exit(1);
  }
  console.log("✓ 47 県すべて検査に合格");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
