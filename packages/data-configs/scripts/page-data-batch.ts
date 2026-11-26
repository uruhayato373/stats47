import { resolveEstatAppId } from "../../estat-api/src/ingest.js";
/**
 * page-data-batch — TS-config 駆動の e-Stat → R2 直行バッチ
 *
 * data-configs registry を walk して各 MetricConfig の source から data を fetch し、
 * R2 namespace (app/stats/<metric>/values.json 等) へ書き込む。
 *
 * Phase 6.4 の核心バッチ。Phase 6.3 で D1 → R2 一括移行が済んでいる前提で、
 * 本バッチは「以後の data 更新」(新規 metric / 年度更新) を D1 をスキップして実行する。
 *
 * 使い方:
 *   tsx packages/data-configs/scripts/page-data-batch.ts                    # 更新表 + configHash 差分
 *   tsx packages/data-configs/scripts/page-data-batch.ts --select-only      # JSON の選択結果のみ (取得・書込なし)
 *   tsx packages/data-configs/scripts/page-data-batch.ts --all              # 明示したときだけ全有効指標
 *   tsx packages/data-configs/scripts/page-data-batch.ts --metric <key>     # 単一
 *   tsx packages/data-configs/scripts/page-data-batch.ts --kind city        # entity 限定 (city 出力)
 *   tsx packages/data-configs/scripts/page-data-batch.ts --since 2024-01    # 更新が古いものだけ
 *   tsx packages/data-configs/scripts/page-data-batch.ts --dry-run          # fetch + 形状検証 (書かない)
 *
 * ★ローカルで dry-run するときは R2_PUBLIC_FETCH_URL を必ず設定する:
 *     R2_PUBLIC_FETCH_URL=https://storage.stats47.jp npx tsx ... --dry-run
 *   これが無いと公開済みデータを引けず、「0 件への退行」と「県数の減少」を検知できない
 *   (どちらも既存データとの比較でしか判定できないため、静かに warn へ落ちる)。
 *   CI (data-refresh.yml) では env に設定済み。
 *
 * 出力 (entities に応じて):
 *   - prefecture → app/stats/<metric>/values.json (47 県)
 *   - city       → app/stats/<metric>/cities.json (全市区町村、pref 表→city 表を自動解決)
 *
 * 制約:
 *   - 計算系 metric (source.kind === "calculated") は本バッチでは対応しない (別 skill)
 *   - mlit / external source も別 fetcher 必要
 *   - 現状サポート source: estat (prefecture + city) / kakei-chousa (prefecture、estat 経路に写像)
 *   - city は社会・人口統計体系 (00000101xx/00000102xx) のみ対応 (prefToCityStatsDataId 参照)
 *
 * 取得・整形・書き込みの本体は packages/data-configs/src/ingest/ にある。このファイルは CLI と再 export だけ。
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { statsR2Key } from "@stats47/r2-storage/keys";
import { datasetDir } from "../../../config/datasets.mjs";
import { listAllMetrics } from "../src/registry.js";
import type { MetricConfig } from "../src/types.js";
import { setAppIdReader, type Args } from "../src/ingest/batch-context.js";
import { filterActiveRefreshTargets, getR2FileMtime, hasNothingToPublish, processOne } from "../src/ingest/process-one.js";
export { classifyIngestShape, filterActiveRefreshTargets, hasNothingToPublish, processOne } from "../src/ingest/process-one.js";
export { fetchEstatData } from "../src/ingest/estat-fetch.js";
export { axisMembersFromMeta } from "../src/ingest/area-axis-fetch.js";
export { stripCatCodePrefix, resolveCat01ByName, kakeiEstatSource, fetchPrefectureRowsAllYears,
  cityEstatSource, fetchCityData, fetchCityRowsAllYears, isIngestableCityCode, prefToCityStatsDataId } from "../src/ingest/city-source.js";
export { fetchSampleCounts, shapeForPrefecture, shapeForCity, applySupplements } from "../src/ingest/shape.js";
setAppIdReader(readAppId);
export function parseBatchArgs(argv = process.argv.slice(2)): Args {
  const out: Args = {
    dryRun: false,
    all: false,
    selectOnly: false,
    concurrency: 4,
    allowEmpty: new Set(),
    allowShape: new Set(),
  };
  const addKeys = (target: Set<string>, raw: string | undefined) => {
    for (const k of (raw ?? "").split(",").map((x) => x.trim()).filter(Boolean)) target.add(k);
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--metric") {
      out.metric = argv[++i];
      if (!out.metric?.trim() || out.metric.startsWith("--")) throw new Error("--metric requires keys");
    }
    else if (a === "--all") out.all = true;
    else if (a === "--select-only") out.selectOnly = true;
    else if (a === "--kind") out.kind = argv[++i];
    else if (a === "--since") out.since = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
    else if (a === "--allow-empty") addKeys(out.allowEmpty, argv[++i]);
    else if (a === "--allow-shape") addKeys(out.allowShape, argv[++i]);
    else throw new Error(`Unknown option: ${a}`);
  }
  if (out.all && out.metric) throw new Error("--all and --metric are exclusive");
  if (out.selectOnly && (out.all || out.kind || out.since || out.dryRun || out.allowEmpty.size || out.allowShape.size)) {
    throw new Error("--select-only only supports --metric filtering");
  }
  return out;
}
export function readAppId(): string {
  return resolveEstatAppId();
}
async function main() {
  const args = parseBatchArgs();
  const appId = ""; // Resolve credentials only on the live API branch.
  const all = listAllMetrics();
  if (!args.selectOnly) console.log(`[batch] registry size: ${all.length}`);
  const isExplicitMetric = Boolean(args.metric);
  let targets = filterActiveRefreshTargets(all, isExplicitMetric);
  if (args.metric) {
    // --metric はカンマ区切りで複数指定できる (欠落キーの一括復旧用。単一指定は従来どおり)
    const wanted = new Set(
      args.metric
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    );
    const unknown = [...wanted].filter((k) => !all.some((c) => c.key === k));
    if (unknown.length > 0) {
      throw new Error(`--metric に registry 未登録のキーがあります: ${unknown.join(", ")}`);
    }
    targets = targets.filter((c) => wanted.has(c.key));
  }
  if ((!args.metric && !args.all) || args.selectOnly) {
    const { selectRefreshMetrics } = await import("./estat-refresh-selection.js");
    const selection = await selectRefreshMetrics(targets);
    if (args.selectOnly) {
      console.log(JSON.stringify(selection, null, 2));
      return;
    }
    const wanted = new Set(selection.metricKeys);
    targets = targets.filter((config) => wanted.has(config.key));
  }
  if (args.kind) {
    const entity = args.kind as MetricConfig["entities"][number];
    targets = targets.filter((c) => c.entities.includes(entity)).map((c) => ({ ...c, entities: [entity] }));
  }
  if (args.since) {
    const sinceMs = new Date(args.since).getTime();
    targets = targets.filter((c) => {
      const mtime = getR2FileMtime(statsR2Key(c.key, "prefecture"));
      return mtime == null || mtime < sinceMs;
    });
  }
  console.log(`[batch] targets after filter: ${targets.length}`);
  if (args.dryRun) {
    // ★2026-07-30 変更: 旧実装は先頭 10 件を表示して return するだけで **fetch すらしなかった**。
    // data-refresh.yml の既定 dispatch は dry_run=true なので、実質何も検証できていなかった。
    // 実際に e-Stat を叩いて形状まで判定し、書き込みだけを行わないようにする
    // (座標ミス・重複・打ち切りを本番反映の前に見つけられるようにするため)。
    console.log(
      `[dry-run] e-Stat を ${targets.length} 件 fetch して形状を検証します (書き込みはしません)。` +
        `${targets.length > 50 ? " 件数が多い場合は --metric で絞ってください。" : ""}`,
    );
  }
  let ok = 0;
  let fail = 0;
  let skip = 0;
  let empty = 0;
  let emptyAllowed = 0;
  let shape = 0;
  let shapeAllowed = 0;
  const failedKeys: string[] = [];
  const emptyKeys: string[] = [];
  const shapeKeys: string[] = [];
  const results: Awaited<ReturnType<typeof processOne>>[] = [];
  // concurrency-limited execution
  const queue = [...targets];
  const workers = Array.from({ length: args.concurrency }, async () => {
    while (queue.length > 0) {
      const c = queue.shift();
      if (!c) break;
      const result = await processOne(c, appId, args.dryRun, args.allowEmpty, args.allowShape);
      results.push(result);
      // status で分岐する (旧実装の message.includes("skipped") は文言依存で脆く、
      // かつ 0 件を表す種別が無いため rows=0 が ok に紛れ込んでいた)
      switch (result.status) {
        case "ok":
          ok++;
          // dry-run は書き込まないので、何が取れたか (行数・補完年) をここでしか確かめられない
          if (args.dryRun) console.log(`  [ok] ${result.key}: ${result.message}`);
          if (ok % 20 === 0) console.log(`  ok=${ok} fail=${fail} skip=${skip} empty=${empty} shape=${shape} remaining=${queue.length}`);
          break;
        case "empty-allowed":
          emptyAllowed++;
          break;
        case "empty":
          empty++;
          emptyKeys.push(result.key);
          break;
        case "shape-allowed":
          shapeAllowed++;
          break;
        case "shape":
          shape++;
          shapeKeys.push(result.key);
          break;
        case "skip":
          skip++;
          if (isExplicitMetric) console.log(`  [skip] ${result.key}: ${result.message}`);
          break;
        default:
          fail++;
          failedKeys.push(result.key);
          console.error(`  [fail] ${result.key}: ${result.message}`);
      }
    }
  });
  await Promise.all(workers);
  console.log(
    `\n[done] ok=${ok}, fail=${fail}, skip=${skip}, empty=${empty}, empty-allowed=${emptyAllowed}` +
      `, shape=${shape}, shape-allowed=${shapeAllowed}`,
  );
  if (failedKeys.length > 0) {
    console.log(`[done] failed keys (${failedKeys.length}): ${failedKeys.join(", ")}`);
  }
  if (emptyKeys.length > 0) {
    console.log(`[done] empty keys (${emptyKeys.length}): ${emptyKeys.join(", ")}`);
  }
  if (shapeKeys.length > 0) {
    console.log(`[done] shape keys (${shapeKeys.length}): ${shapeKeys.join(", ")}`);
  }
  console.log(
    `Next: npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats`,
  );
  // silent partial failure の再発防止 (2026-07-27 障害): 従来は fail>0 でも exit 0 を返し、
  // CI (data-refresh.yml) が成功と誤認していた (55 metric 中 25 件失敗しても workflow green)。
  // --metric 明示指定 (特定キーの復旧目的の実行) は 1 件でも fail したら exit 1。
  // 全量実行 (metric 未指定 = 月次 cron) は fail 比率が 10% を超えたら exit 1
  // (少数の恒常的失敗だけで毎月 cron を赤くしないための閾値)。
  if (hasNothingToPublish(results, { isExplicitMetric, dryRun: args.dryRun })) {
    console.error(
      `[fatal] --metric 指定の ${results.length} 件をすべて飛ばし、R2 へ上げる値がありません (理由は上の [skip] 行)。\n` +
        `        e-Stat 以外の指標は external-metric-ingest.yml、港・県間移動の指標はこの workflow の対象外です`,
    );
    process.exit(1);
  }
  if (isExplicitMetric && fail > 0) {
    console.error(
      `[fatal] --metric 指定実行で ${fail} 件失敗しました (復旧対象キーが未完了です)`,
    );
    process.exit(1);
  }
  // 観測値 0 件の再発防止 (2026-07-29 障害): rows=0 は fail と違い「恒常的に少数出る」性質の
  // ものではないため、比率閾値で薄めず 1 件でも exit 1 にする。0 件の artifact は書いていない
  // ので R2 の旧データは温存されており、exit 1 により push / 派生生成も走らない。
  if (empty > 0) {
    console.error(
      `[fatal] 観測値が 0 件の metric が ${empty} 件あります: ${emptyKeys.join(", ")}\n` +
        `        意図した 0 件なら台帳 data-quality.expected-empty に` +
        ` 理由・追跡先・期限を添えて登録してください (一回きりの検証は --allow-empty <keys>)`,
    );
    process.exit(1);
  }
  // 形状違反の再発防止 (2026-07-30 導入): 重複行・打ち切り・単位矛盾・県の欠損。
  // 0 件と同じく「恒常的に少数出る」性質のものではないので比率で薄めず 1 件でも exit 1。
  // 違反 artifact は書いていないので R2 の旧データは温存され、push も派生生成も走らない。
  if (shape > 0) {
    console.error(
      `[fatal] 形状が壊れた metric が ${shape} 件あります: ${shapeKeys.join(", ")}\n` +
        `        原因の大半は分類軸 (cdCat01-05 / cdTab) か timeScope の絞り忘れです。` +
        `未指定軸は diagnose-unpinned-axes.ts で列挙できます。\n` +
        `        既知の是正待ちなら ${datasetDir("metrics.quality")}/shape-exceptions.ts に` +
        ` 理由・追跡先・期限を添えて登録してください (一回きりの検証は --allow-shape <keys>)`,
    );
    process.exit(1);
  }
  if (!isExplicitMetric) {
    const total = ok + fail + skip;
    const failRatio = total > 0 ? fail / total : 0;
    if (failRatio > 0.1) {
      console.error(
        `[fatal] 全量実行で fail 比率が閾値超過: fail=${fail}/${total} (${(failRatio * 100).toFixed(1)}%) > 10%`,
      );
      process.exit(1);
    }
  }
}
// ★直接実行されたときだけ走らせる (2026-07-31)。
//   純粋関数をテストから import しただけで全 metric の取り込みが始まってしまい、
//   e-Stat へ数千リクエストを投げかけた。import は副作用を持ってはいけない。
const invokedDirectly = process.argv[1]
  ? resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;
if (invokedDirectly) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
