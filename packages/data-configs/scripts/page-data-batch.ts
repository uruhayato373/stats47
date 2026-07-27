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
 *   tsx packages/data-configs/scripts/page-data-batch.ts                    # 全 metric
 *   tsx packages/data-configs/scripts/page-data-batch.ts --metric <key>     # 単一
 *   tsx packages/data-configs/scripts/page-data-batch.ts --kind city        # entity 限定 (city 出力)
 *   tsx packages/data-configs/scripts/page-data-batch.ts --since 2024-01    # 更新が古いものだけ
 *   tsx packages/data-configs/scripts/page-data-batch.ts --dry-run          # 計画のみ
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
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listAllMetrics } from "../src/registry.js";
import type { MetricConfig, SourceConfig } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const R2_LOCAL = resolve(REPO_ROOT, ".local/r2");

interface Args {
  metric?: string;
  kind?: string;
  since?: string;
  dryRun: boolean;
  concurrency: number;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = { dryRun: false, concurrency: 4 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--metric") out.metric = argv[++i];
    else if (a === "--kind") out.kind = argv[++i];
    else if (a === "--since") out.since = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--concurrency") out.concurrency = Number(argv[++i]);
  }
  return out;
}

function readAppId(): string {
  // クラウド環境では env を直接注入 (.env.local ファイルは無い) ため process.env を優先
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) {
    return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  }
  const envPath = resolve(REPO_ROOT, ".env.local");
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.startsWith("NEXT_PUBLIC_ESTAT_APP_ID="));
    const id = line?.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
    if (id) return id;
  }
  throw new Error("NEXT_PUBLIC_ESTAT_APP_ID not set (process.env nor .env.local)");
}

/** R2 file 最終更新時刻を取得 (since フィルタ用) */
function getR2FileMtime(key: string): number | null {
  const filePath = resolve(R2_LOCAL, key);
  if (!existsSync(filePath)) return null;
  return statSync(filePath).mtimeMs;
}

interface EstatValue {
  "@cat01"?: string;
  "@cat02"?: string;
  "@area": string;
  "@time": string;
  $: string;
}

/** e-Stat API から data を fetch */
async function fetchEstatData(
  appId: string,
  config: Extract<SourceConfig, { kind: "estat" }>,
): Promise<EstatValue[]> {
  const params = new URLSearchParams({
    appId,
    statsDataId: config.statsDataId,
    limit: "100000",
  });
  if (config.cdCat01) params.set("cdCat01", config.cdCat01);
  if (config.cdCat02) params.set("cdCat02", config.cdCat02);
  if (config.cdCat03) params.set("cdCat03", config.cdCat03);
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
  const json = (await res.json()) as Record<string, unknown>;
  const stat = (json.GET_STATS_DATA as Record<string, unknown> | undefined)
    ?.STATISTICAL_DATA as Record<string, unknown> | undefined;
  if (!stat) {
    throw new Error(`e-Stat response invalid for ${config.statsDataId}`);
  }
  return ((stat.DATA_INF as Record<string, unknown>).VALUE as EstatValue[]) ?? [];
}

/**
 * e-Stat の値文字列を数値 or null に変換。
 * 欠損・秘匿マーカー ("***" 秘匿 / "-" 該当なし / "X" 秘匿 / "…" 等) は null。
 */
function parseEstatValue(raw: string): number | null {
  if (raw === "***" || raw === "-" || raw === "X" || raw === "…") {
    return null;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * 家計調査 (0003348235/0003348239) の @area は都道府県コードではなく
 * 県庁所在市コード (原則 NN003、例外: 福岡市=40004。40003 は北九州市)。
 * サイトの慣行 (既存 675 metric) に合わせ、県庁所在市の値を都道府県コード NN000 に写像する。
 * 全国 (00000) と県庁所在市以外の大都市 (川崎/相模原/浜松/堺/北九州) は対象外として捨てる。
 */
const KAKEI_CITY_TO_PREF = new Map<string, string>();
for (let i = 1; i <= 47; i++) {
  const nn = String(i).padStart(2, "0");
  KAKEI_CITY_TO_PREF.set(i === 40 ? "40004" : `${nn}003`, `${nn}000`);
}
function remapKakeiAreas(values: EstatValue[]): EstatValue[] {
  const out: EstatValue[] = [];
  for (const v of values) {
    const pref = KAKEI_CITY_TO_PREF.get(v["@area"]);
    if (!pref) continue;
    out.push({ ...v, "@area": pref });
  }
  return out;
}

/** 5 桁エリアコード判定 (都道府県集計行 NN000) */
function isPrefCode5(code: string): boolean {
  if (!/^\d{2}000$/.test(code)) return false;
  const n = Number(code.slice(0, 2));
  return n >= 1 && n <= 47;
}

/** 5 桁市区町村コード判定 (NNxyz, xyz≠000, 県 01-47) */
function isCityCode5(code: string): boolean {
  if (!/^\d{5}$/.test(code)) return false;
  const pref = Number(code.slice(0, 2));
  if (pref < 1 || pref > 47) return false;
  return code.slice(2) !== "000";
}

/**
 * 社会・人口統計体系: 都道府県表 statsDataId → 市区町村表 statsDataId を解決。
 *
 * metric は pref 表 (00000101xx / 00000102xx) のみを source に持つため、city データは
 * 同一 cdCat01 で対応する city 表から取得する。マッピング (2026-05-29 実測で確定):
 *   - pref 基礎データ      00000101CC → city 基礎データ(廃置分合処理済)   00000202CC
 *   - pref 社会生活統計指標 00000102CC → city 社会生活統計指標(廃置分合処理済) 00000203CC
 *     (いずれも廃置分合処理済を採用。area マスタ cities.json=1913 件と件数一致し areaName join が
 *      完全になるため。オリジナル(00000201CC,1917件)は master に無い 4 件が join 漏れになる。
 *      値は同一: C3109 0000020203→札幌519, #A05307 0000010201→0000020301 で確認済)
 *   - CC=12(家計)/13(生活時間) は city 表が存在しない → null
 */
function prefToCityStatsDataId(prefId: string): string | null {
  const m = /^0000010([12])(\d{2})$/.exec(prefId);
  if (!m) return null;
  const series = m[1]; // "1"=基礎データ, "2"=社会生活統計指標
  const catStr = m[2]; // "01".."13"
  const cat = Number(catStr);
  if (cat < 1 || cat > 11) return null; // 12,13 は city 表なし
  return series === "1" ? `0000020${"2"}${catStr}` : `0000020${"3"}${catStr}`;
}

// ---- area マスタ (areaName 付与用) -------------------------------------
interface AreaMasters {
  pref: Map<string, string>; // prefCode(5桁) → prefName
  city: Map<string, string>; // cityCode(5桁) → cityName
}
let _masters: AreaMasters | null = null;
function loadAreaMasters(): AreaMasters {
  if (_masters) return _masters;
  const prefRaw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "packages/area/src/data/prefectures.json"), "utf8"),
  ) as Array<{ prefCode: string; prefName: string }>;
  const cityRaw = JSON.parse(
    readFileSync(resolve(REPO_ROOT, "packages/area/src/data/cities.json"), "utf8"),
  ) as Array<{ cityCode: string; cityName: string }>;
  _masters = {
    pref: new Map(prefRaw.map((p) => [p.prefCode, p.prefName])),
    city: new Map(cityRaw.map((c) => [c.cityCode, c.cityName])),
  };
  return _masters;
}

/** config.yearFormat に応じた yearName ("YYYY年度" / "YYYY年") */
function yearNameOf(yearCode: string, config: MetricConfig): string {
  return config.yearFormat === "fiscal" ? `${yearCode}年度` : `${yearCode}年`;
}

/**
 * config.years の範囲内か判定 (e-Stat 規約: cdTimeFrom/To を使わずメモリ内でフィルタ)。
 * years 未指定なら全年通す。
 */
function inYearRange(yearCode: string, config: MetricConfig): boolean {
  const y = Number(yearCode);
  if (!Number.isFinite(y)) return false;
  const spec = config.years;
  if (spec === "all" || spec == null) return true;
  // config.years が稀にフルタイムコード (例 2009100000) を含むため 4 桁年に正規化して比較
  const to4 = (n: number): number => (n > 9999 ? Number(String(n).slice(0, 4)) : n);
  if ("years" in spec) return spec.years.map(to4).includes(y);
  // { from, to }
  return y >= to4(spec.from) && y <= to4(spec.to);
}

interface ShapedRow {
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName: string;
  value: number | null;
  unit: string;
  rank: number | null;
  prefectureCode?: string;
}

/** 年ごとに value 降順で rank を付与 (1=最大値)。null は rank null。同値は同順位 (競争順位)。 */
function assignRanks(rows: ShapedRow[]): void {
  const byYear = new Map<string, ShapedRow[]>();
  for (const r of rows) {
    if (!byYear.has(r.yearCode)) byYear.set(r.yearCode, []);
    byYear.get(r.yearCode)!.push(r);
  }
  for (const group of byYear.values()) {
    const ranked = group
      .filter((r) => r.value != null)
      .sort((a, b) => (b.value as number) - (a.value as number));
    let prevValue: number | null = null;
    let prevRank = 0;
    ranked.forEach((r, i) => {
      if (prevValue !== null && r.value === prevValue) {
        r.rank = prevRank; // 同値は同順位
      } else {
        r.rank = i + 1;
        prevRank = i + 1;
        prevValue = r.value;
      }
    });
  }
}

/** meta を組み立てる共通処理 */
function buildMeta(rows: ShapedRow[]) {
  const years = Array.from(new Set(rows.map((r) => r.yearCode))).sort();
  const areas = new Set(rows.map((r) => r.areaCode));
  return {
    rowCount: rows.length,
    yearRange: (years.length > 0 ? [years[0], years[years.length - 1]] : null) as
      | [string, string]
      | null,
    areaCount: areas.size,
    generatedAt: new Date().toISOString(),
  };
}

/** 取得 raw values → StatsValues 構造 (prefecture)。areaName/unit/yearName/rank を付与し本番投入可能形に。 */
function shapeForPrefecture(config: MetricConfig, values: EstatValue[]) {
  const masters = loadAreaMasters();
  const rows: ShapedRow[] = values
    .filter((v) => isPrefCode5(v["@area"]) && inYearRange(v["@time"].slice(0, 4), config))
    .map((v) => {
      const yearCode = v["@time"].slice(0, 4);
      return {
        areaCode: v["@area"],
        areaName: masters.pref.get(v["@area"]) ?? "",
        yearCode,
        yearName: yearNameOf(yearCode, config),
        value: parseEstatValue(v.$),
        unit: config.unit,
        rank: null as number | null,
      };
    })
    .sort((a, b) =>
      a.yearCode === b.yearCode
        ? a.areaCode.localeCompare(b.areaCode)
        : a.yearCode.localeCompare(b.yearCode),
    );
  assignRanks(rows);
  return { metricKey: config.key, entityKind: "prefecture" as const, rows, meta: buildMeta(rows) };
}

/** 取得 raw values → StatsValues 構造 (city)。areaName(市区町村マスタ join)/unit/yearName/rank を付与。 */
function shapeForCity(config: MetricConfig, values: EstatValue[]) {
  const masters = loadAreaMasters();
  const rows: ShapedRow[] = values
    .filter((v) => isCityCode5(v["@area"]) && inYearRange(v["@time"].slice(0, 4), config))
    .map((v) => {
      const yearCode = v["@time"].slice(0, 4);
      return {
        areaCode: v["@area"],
        areaName: masters.city.get(v["@area"]) ?? "",
        yearCode,
        yearName: yearNameOf(yearCode, config),
        value: parseEstatValue(v.$),
        unit: config.unit,
        rank: null as number | null,
        prefectureCode: v["@area"].slice(0, 2),
      };
    })
    .sort((a, b) =>
      a.yearCode === b.yearCode
        ? a.areaCode.localeCompare(b.areaCode)
        : a.yearCode.localeCompare(b.yearCode),
    );
  assignRanks(rows);
  return { metricKey: config.key, entityKind: "city" as const, rows, meta: buildMeta(rows) };
}

interface ProcessResult {
  key: string;
  ok: boolean;
  message: string;
  rows?: number;
}

async function processOne(
  config: MetricConfig,
  appId: string,
  dryRun: boolean,
): Promise<ProcessResult> {
  if (config.source.kind === "calculated") {
    return { key: config.key, ok: false, message: "calculated metric skipped (deps required)" };
  }
  if (config.source.kind === "external" || config.source.kind === "mlit") {
    return { key: config.key, ok: false, message: `${config.source.kind} source skipped (fetcher not implemented yet)` };
  }
  // kakei-chousa は e-Stat API の通常テーブル (statsDataId + cdCat01/cdCat02 filter)。
  // filter に格納されたパラメータを estat source と同形に写して同一経路で fetch する。
  let src: Extract<SourceConfig, { kind: "estat" }>;
  if (config.source.kind === "kakei-chousa") {
    const filter = (config.source.filter ?? {}) as {
      statsDataId?: string;
      cdCat01?: string;
      cdCat02?: string;
    };
    if (!filter.statsDataId) {
      return { key: config.key, ok: false, message: "kakei-chousa missing filter.statsDataId skipped" };
    }
    src = {
      kind: "estat",
      statsDataId: filter.statsDataId,
      cdCat01: filter.cdCat01,
      cdCat02: filter.cdCat02,
    };
  } else {
    src = config.source;
  }
  const wantPref = config.entities.includes("prefecture");
  const wantCity = config.entities.includes("city");
  if (!wantPref && !wantCity) {
    return { key: config.key, ok: false, message: "no prefecture/city entity skipped (port/migration not in scope)" };
  }

  try {
    const notes: string[] = [];
    let totalRows = 0;

    if (wantPref) {
      const raw = await fetchEstatData(appId, src);
      const values = config.source.kind === "kakei-chousa" ? remapKakeiAreas(raw) : raw;
      const payload = shapeForPrefecture(config, values);
      if (!dryRun) {
        const outPath = resolve(R2_LOCAL, `app/stats/${config.key}/values.json`);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, JSON.stringify(payload));
      }
      notes.push(`pref=${payload.rows.length}`);
      totalRows += payload.rows.length;
    }

    if (wantCity) {
      const cityStatsDataId = prefToCityStatsDataId(src.statsDataId);
      if (!cityStatsDataId) {
        notes.push("city=skip(no-city-table)");
      } else {
        const values = await fetchEstatData(appId, { ...src, statsDataId: cityStatsDataId });
        const payload = shapeForCity(config, values);
        if (!dryRun) {
          const outPath = resolve(R2_LOCAL, `app/stats/${config.key}/cities.json`);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, JSON.stringify(payload));
        }
        notes.push(`city=${payload.rows.length}`);
        totalRows += payload.rows.length;
      }
    }

    return {
      key: config.key,
      ok: true,
      message: `${dryRun ? "would write" : "wrote"} ${notes.join(",")}`,
      rows: totalRows,
    };
  } catch (e) {
    return { key: config.key, ok: false, message: (e as Error).message };
  }
}

async function main() {
  const args = parseArgs();
  const appId = readAppId();
  const all = listAllMetrics();
  console.log(`[batch] registry size: ${all.length}`);

  let targets = all;
  const isExplicitMetric = Boolean(args.metric);
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
  if (args.kind) targets = targets.filter((c) => c.entities.includes(args.kind as MetricConfig["entities"][number]));
  if (args.since) {
    const sinceMs = new Date(args.since).getTime();
    targets = targets.filter((c) => {
      const mtime = getR2FileMtime(`app/stats/${c.key}/values.json`);
      return mtime == null || mtime < sinceMs;
    });
  }

  console.log(`[batch] targets after filter: ${targets.length}`);
  if (args.dryRun) {
    const sample = targets.slice(0, 10).map((c) => c.key).join(", ");
    console.log(`[dry-run] first 10: ${sample}`);
    return;
  }

  let ok = 0;
  let fail = 0;
  let skip = 0;
  const failedKeys: string[] = [];

  // concurrency-limited execution
  const queue = [...targets];
  const workers = Array.from({ length: args.concurrency }, async () => {
    while (queue.length > 0) {
      const c = queue.shift();
      if (!c) break;
      const result = await processOne(c, appId, false);
      if (result.ok) {
        ok++;
        if (ok % 20 === 0) console.log(`  ok=${ok} fail=${fail} skip=${skip} remaining=${queue.length}`);
      } else if (result.message.includes("skipped")) {
        skip++;
      } else {
        fail++;
        failedKeys.push(result.key);
        console.error(`  [fail] ${result.key}: ${result.message}`);
      }
    }
  });
  await Promise.all(workers);

  console.log(`\n[done] ok=${ok}, fail=${fail}, skip=${skip}`);
  if (failedKeys.length > 0) {
    console.log(`[done] failed keys (${failedKeys.length}): ${failedKeys.join(", ")}`);
  }
  console.log(
    `Next: npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats`,
  );

  // silent partial failure の再発防止 (2026-07-27 障害): 従来は fail>0 でも exit 0 を返し、
  // CI (data-refresh.yml) が成功と誤認していた (55 metric 中 25 件失敗しても workflow green)。
  // --metric 明示指定 (特定キーの復旧目的の実行) は 1 件でも fail したら exit 1。
  // 全量実行 (metric 未指定 = 月次 cron) は fail 比率が 10% を超えたら exit 1
  // (少数の恒常的失敗だけで毎月 cron を赤くしないための閾値)。
  if (isExplicitMetric && fail > 0) {
    console.error(
      `[fatal] --metric 指定実行で ${fail} 件失敗しました (復旧対象キーが未完了です)`,
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
