import { writeFileSync, mkdirSync, statSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { statsR2Key } from "@stats47/r2-storage/keys";
import { sourceEvidence } from "../../scripts/lib/estat-table-reader.js";
import { classifyEmptyOutcome } from "../expected-empty.js";
import { relabelYearNames, type YearNamedRow } from "../year-names";
// 既知破損 allowlist。★書いてよいかの判定には使わず、run を fail させるかだけに使う
import { EXPECTED_SHAPE_ANOMALY } from "../../../../data/metrics/quality/shape-exceptions";
import { PREFECTURE_COUNT, classifyShape, findExpectedShapeAnomaly, hasShapeError, summarizeShape,
  type ClassifyShapeInput, type ShapeSummary, type ShapeViolation } from "../shape-gate.js";
import type { MetricConfig, SourceConfig } from "../types.js";
import { R2_LOCAL } from "./batch-context.js";
import { fetchEstatData, type EstatFetchResult } from "./estat-fetch.js";
import { kakeiEstatSource, remapKakeiAreas, fetchCityData } from "./city-source.js";
import { applySupplements, fetchSampleCounts, shapeForPrefecture, shapeForCity, type ShapedRow } from "./shape.js";

// known-broken は「公開済みの欠陥を認知している」だけなので新規書き込みを許可しない。
// legitimate は統計の定義上正しい形であり、重症度ラチェットの範囲内なら書き込んでよい。
const LEGITIMATE_SHAPE_ANOMALIES = EXPECTED_SHAPE_ANOMALY.filter(
  (entry) => entry.disposition === "legitimate",
);

/** 取り込み時に適用してよいのは、既知破損ではなく定義上正当と確認済みの例外だけ。 */
export function classifyIngestShape(
  input: Omit<ClassifyShapeInput, "allowlist">,
): ShapeViolation[] {
  return classifyShape({ ...input, allowlist: LEGITIMATE_SHAPE_ANOMALIES });
}

/**
 * 全量更新は公開対象 (`isActive !== false`) だけを処理する。
 *
 * 退役済み metric は過去データの参照や個別診断のため registry に残るが、全量更新の
 * 成否を左右させてはいけない。`--metric` 明示時だけは退役済みも再検証できるよう残す。
 */
export function filterActiveRefreshTargets(
  configs: readonly MetricConfig[],
  isExplicitMetric: boolean,
): MetricConfig[] {
  return isExplicitMetric ? [...configs] : configs.filter((config) => config.isActive !== false);
}

/** R2 file 最終更新時刻を取得 (since フィルタ用) */
/**
 * 指標を名指しした書き込みありの実行で、R2 へ上げるものが 1 件も無かったか。
 * 全部飛ばしたのに成功で終わると、次の push の段が「置き場が無い」で落ち、理由がログに残らない
 * (2026-11-26 run 45820634459: 港の 9 指標が skip=9 のまま成功扱いになった)。
 * 名指しなしの全量実行と dry-run は対象外 (全量は e-Stat 以外の年名の付け直しが乗る)。
 */
export function hasNothingToPublish(
  results: readonly Pick<ProcessResult, "status" | "relabeled">[],
  options: { isExplicitMetric: boolean; dryRun: boolean },
): boolean {
  if (!options.isExplicitMetric || options.dryRun || results.length === 0) return false;
  return results.every((result) => result.status === "skip" && !result.relabeled);
}

export function getR2FileMtime(key: string): number | null {
  const filePath = resolve(R2_LOCAL, key);
  if (!existsSync(filePath)) return null;
  return statSync(filePath).mtimeMs;
}

type ProcessStatus =
  | "ok"
  | "fail"
  | "skip"
  | "empty"
  | "empty-allowed"
  /** 形状が壊れている (重複行 / 打ち切り / 単位矛盾 / 県の欠損)。書かずに既存を温存した */
  | "shape"
  /** 形状違反はあるが allowlist で許可済み */
  | "shape-allowed";

interface ProcessResult {
  key: string;
  ok: boolean;
  /**
   * 明示的な結果種別。
   *
   * 旧実装は `result.message.includes("skipped")` の文字列一致で skip を判定しており
   * (文言を変えると静かに壊れる)、さらに「0 件」を表す種別が無かったため
   * rows=0 が ok に紛れて exit code に一切現れなかった (2026-07-29 の 6 件事故)。
   */
  status: ProcessStatus;
  message: string;
  rows?: number;
  /** skip した指標で、公開中の値の年名を定義にそろえて書いた行数 (取得はしないが R2 へ上げるものがある) */
  relabeled?: number;
  /** 空だった artifact の説明 (ログ用) */
  emptyNotes?: string[];
  /** 形状違反の説明 (ログ用) */
  shapeNotes?: string[];
}

/**
 * 公開済み R2 の同 artifact の rowCount を読む (0 件になったときだけ呼ぶ)。
 *
 * 「既存データを空で潰す」= regression を判定するためだけの照会なので、空は稀 =
 * 全体コストは無視できる。R2_PUBLIC_FETCH_URL は data-refresh.yml の env に既にある。
 * 取得できない (未設定 / 404 / ネットワーク断) 場合は null を返し、
 * regression ではなく first-empty として扱わせる (誤って「破壊」と誇張しない)。
 */
async function readPublishedRowCount(key: string, entity: "prefecture" | "city"): Promise<number | null> {
  const base = process.env.R2_PUBLIC_FETCH_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/${statsR2Key(key, entity)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { meta?: { rowCount?: number }; rows?: unknown[] };
    return json.meta?.rowCount ?? json.rows?.length ?? null;
  } catch {
    return null;
  }
}

/**
 * API で取り直さない指標は、定義の年の形式を変えても公開中の values.json の年名が古いまま残る。
 * 値は変えず、年名だけを定義にそろえて R2 へ上げ直す (diff-push が差分だけを上げる)。戻り値は直した行数。
 */
async function relabelPublishedYearNames(config: MetricConfig): Promise<number> {
  const base = process.env.R2_PUBLIC_FETCH_URL;
  if (!base || !config.entities.includes("prefecture")) return 0;
  const res = await fetch(`${base}/${statsR2Key(config.key, "prefecture")}`);
  if (!res.ok) return 0;
  const payload = (await res.json()) as { rows: YearNamedRow[] };
  const { rows, relabeled } = relabelYearNames(payload.rows, config.yearFormat);
  if (relabeled === 0) return 0;
  const outPath = resolve(R2_LOCAL, statsR2Key(config.key, "prefecture"));
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify({ ...payload, rows }));
  return relabeled;
}

/**
 * 公開済み R2 の同 artifact の県カバレッジを読む (**47 県に満たない年があるときだけ呼ぶ**)。
 *
 * 「以前 47 県あった年が減った」= 欠損の発生を判定するためだけの照会。
 * 全 metric で呼ぶと R2 GET が metric 数だけ増えるので、shortfall を検出したときに限る
 * (実測で該当は 2,179 件中 24 件なのでコストは無視できる)。
 * 取得できない場合は null を返し、warn 止まりにさせる (誤って「欠損発生」と誇張しない)。
 */
async function readPublishedCoverage(
  key: string,
  entity: "prefecture" | "city",
): Promise<Pick<ShapeSummary, "perYearAreaCount"> | null> {
  const base = process.env.R2_PUBLIC_FETCH_URL;
  if (!base) return null;
  try {
    const res = await fetch(`${base}/${statsR2Key(key, entity)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { rows?: { areaCode: string; yearCode: string }[] };
    if (!json.rows) return null;
    const areasByYear = new Map<string, Set<string>>();
    for (const row of json.rows) {
      let set = areasByYear.get(row.yearCode);
      if (!set) {
        set = new Set();
        areasByYear.set(row.yearCode, set);
      }
      set.add(row.areaCode);
    }
    const perYearAreaCount: Record<string, number> = {};
    for (const [year, areas] of areasByYear) perYearAreaCount[year] = areas.size;
    return { perYearAreaCount };
  } catch {
    return null;
  }
}

export async function processOne(
  config: MetricConfig,
  appId: string,
  dryRun: boolean,
  allowEmpty: ReadonlySet<string> = new Set(),
  allowShape: ReadonlySet<string> = new Set(),
): Promise<ProcessResult> {
  // 県が外部資料でも独立したcitySourceは更新する。正準configはhash照合のため保持する。
  const independentCity = (config.source.kind === "external" || config.source.kind === "mlit")
    && config.entities.includes("city") && Boolean(config.citySource);
  if (config.source.kind === "calculated") {
    return { key: config.key, ok: false, status: "skip", message: "calculated metric skipped (deps required)" };
  }
  if (!independentCity && (config.source.kind === "external" || config.source.kind === "mlit")) {
    const relabeled = dryRun ? 0 : await relabelPublishedYearNames(config);
    return { key: config.key, ok: false, status: "skip", relabeled, message: `${config.source.kind} source skipped (fetcher not implemented yet)${relabeled ? ` yearName=${relabeled}` : ""}` };
  }
  let src: Extract<SourceConfig, { kind: "estat" }>;
  if (config.source.kind === "kakei-chousa") {
    const mapped = kakeiEstatSource(config.source);
    if (!mapped) {
      return { key: config.key, ok: false, status: "skip", message: "kakei-chousa missing filter.statsDataId skipped" };
    }
    src = mapped;
  } else if (config.source.kind === "estat") {
    src = config.source;
  } else {
    src = config.citySource!;
  }
  const wantPref = !independentCity && config.entities.includes("prefecture");
  const wantCity = config.entities.includes("city");
  if (!wantPref && !wantCity) {
    return { key: config.key, ok: false, status: "skip", message: "no prefecture/city entity skipped (port/migration not in scope)" };
  }

  try {
    const notes: string[] = [];
    const emptyNotes: string[] = [];
    const shapeNotes: string[] = [];
    let totalRows = 0;
    let hardEmpty = false;
    let softEmpty = false;
    let hardShape = false;
    let softShape = false;
    const supplementCache = new Map<string, Promise<EstatFetchResult>>();

    /**
     * 形状 (重複行 / 打ち切り / 単位と値の矛盾 / 県のカバレッジ) を判定し、書いてよいかを返す。
     *
     * `gateEmpty` と同じく **error なら書かない**。壊れたデータで上書きするより、
     * 古いデータが残る方がまし (diff-push-r2 は .local/r2 を walk するだけなので
     * 書かなければ R2 の既存データが温存される)。
     *
     * 2026-07-30 導入。それまで「行が多すぎる」側は全層で無検証で、
     * 分類軸の絞り忘れで 194 metric が壊れた数値を配信していた。
     */
    async function gateShape(
      entity: "prefecture" | "city",
      payload: { rows: ShapedRow[] },
      raw: { totalNumber: number; toNumber: number },
    ): Promise<boolean> {
      const summary = summarizeShape(payload.rows);

      // 47 県に満たない年があるときだけ公開済みを引く (縮小専用ラチェットの基準)。
      // 全 metric で引くと R2 GET が metric 数だけ増えるため遅延評価にする。
      const hasShortfall =
        entity === "prefecture" &&
        Object.values(summary.perYearAreaCount).some((n) => n < PREFECTURE_COUNT);
      const priorSummary = hasShortfall ? await readPublishedCoverage(config.key, entity) : null;

      const violations = classifyIngestShape({
        key: config.key,
        entity,
        summary,
        unit: config.unit,
        raw,
        priorSummary,
        now: new Date(),
        // ★取り込み時は known-broken allowlist を **書いてよいかの判定には使わない**。
        //
        //   allowlist の意味は「**いま R2 にある公開済みデータ**が壊れているのを知っている」
        //   であって「新しく取ってくるデータも壊れていてよい」ではない。ここで適用すると、
        //   config を是正したのに分子分母を取り違えた、といった**新しい壊れ方**が
        //   `allowed` に落ちてそのまま書き込まれる (2026-07-30 に空き家率の陰性対照で
        //   実際に確認: 1076% が allowlist の重症度 896500 を下回るため素通りした)。
        //   重症度ラチェットは「悪化」しか見ないので、この穴は塞げない。
        //
        //   known-broken は下で **run を fail させるかどうか**にだけ使う (既知の破損で
        //   毎晩 CI を赤くしない)。意図的な書き込み例外は --allow-shape で 1 回ずつ明示する。
        //   一方 legitimate は定義上正しい形なので、上の限定集合だけを渡し、観測済み重症度を
        //   超えない場合に限って error を降格して書き込みを許可する。
        cliAllowed: allowShape,
      });
      if (violations.length === 0) return true;

      for (const v of violations) {
        // 既知の破損か = run を fail させないでよいか。**書くかどうかとは別の判断**。
        // 既知か = run を fail させないでよいか。**書くかどうかとは別の判断**。
        const allow = v.isError
          ? findExpectedShapeAnomaly(EXPECTED_SHAPE_ANOMALY, config.key, v.check, entity, new Date())
          : null;
        if (v.isError && !allow) {
          hardShape = true;
          console.error(`  [shape] ${v.message}`);
        } else if (v.isError) {
          softShape = true;
          // ★disposition をそのまま出す。legitimate を known-broken と表示すると
          //   「壊れている」と誤読させる (2026-07-31)。
          console.warn(
            `  [shape:${allow!.disposition}] ${v.message} (allowlist 済のため run は継続。` +
              `書き込みはしない — allowlist は fail 判定専用で、書き込み例外は --allow-shape)`,
          );
        } else if (v.allowedBy) {
          softShape = true;
          console.warn(
            `  [shape:${v.allowedBy.disposition}] ${v.message} (統計の定義上正当なため書き込み可)`,
          );
        } else {
          softShape = true;
          console.warn(`  [shape:allowed] ${v.message}`);
        }
        shapeNotes.push(`${entity}:${v.check}${v.isError ? (allow ? `:${allow.disposition}` : "") : ":allowed"}`);
      }
      // ★既知でも壊れていれば書かない (R2 の既存データが温存されるだけ)
      return !hasShapeError(violations);
    }

    /**
     * 0 件の artifact を判定し、書いてよいかを返す。
     *
     * ★rows=0 のとき **書かない**のが要点。書かなければ diff-push-r2 は .local/r2 を
     * walk するだけなので R2 の既存データが自動的に温存される (データ破壊の防止)。
     * artifact 単位で判定するのは、pref=0 / city=1900 のような部分欠落が
     * 合算値では素通りするため (旧実装の totalRows はこれを見逃した)。
     */
    async function gateEmpty(
      entity: "prefecture" | "city",
      rawCount: number,
      rowCount: number,
    ): Promise<boolean> {
      if (rowCount > 0) {
        // allowlist に残っているのに復活した場合を知らせる (fatal にはしない)
        const revived = classifyEmptyOutcome({
          key: config.key, entity, rawCount, rowCount, priorRowCount: null, now: new Date(),
        });
        if (revived.outcome === "stale-allowlist") console.warn(`  [stale-allowlist] ${revived.message}`);
        return true;
      }
      const priorRowCount = await readPublishedRowCount(config.key, entity);
      const verdict = classifyEmptyOutcome({
        key: config.key, entity, rawCount, rowCount,
        priorRowCount, now: new Date(), cliAllowed: allowEmpty,
      });
      if (verdict.isError) {
        hardEmpty = true;
        console.error(`  [empty] ${verdict.message}`);
      } else {
        softEmpty = true;
        console.warn(`  [empty:allowed] ${verdict.message}`);
      }
      emptyNotes.push(`${entity}:${verdict.outcome}`);
      return false; // 0 件は書かない (既存データを温存する)
    }

    if (wantPref) {
      const fetched = await applySupplements(
        appId, config, await fetchEstatData(appId, src), supplementCache, notes, "prefecture",
      );
      const values =
        config.source.kind === "kakei-chousa" ? remapKakeiAreas(fetched.values) : fetched.values;
      const sampleSpec = config.source.kind === "estat" ? config.source.sampleCount : undefined;
      const counts = sampleSpec ? await fetchSampleCounts(appId, src, sampleSpec) : null;
      const sample = sampleSpec && counts ? { counts, spec: sampleSpec } : undefined;
      const payload = shapeForPrefecture(config, values, sample, sourceEvidence([...fetched.sources, ...(counts?.sources ?? [])]));
      if (sample) notes.push(`reference=${payload.rows.filter((r) => r.reference).length}`);
      const notEmpty = await gateEmpty("prefecture", values.length, payload.rows.length);
      // 0 件なら形状は見ない (expected-empty の担当。二重に鳴らさない)
      const shapeOk = notEmpty
        ? await gateShape("prefecture", payload, fetched.raw)
        : true;
      const writable = notEmpty && shapeOk;
      if (!dryRun && writable) {
        const outPath = resolve(R2_LOCAL, statsR2Key(config.key, "prefecture"));
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, JSON.stringify(payload));
      }
      notes.push(`pref=${payload.rows.length}`);
      totalRows += payload.rows.length;
    }

    if (wantCity) {
      const city = await fetchCityData(appId, config, src);
      if (!city) {
        notes.push("city=skip(no-city-table)");
      } else {
        if (!config.citySource && city.source.cdCat01 !== src.cdCat01)
          notes.push(`city-cat01=${src.cdCat01}->${city.source.cdCat01}`);
        const fetched = await applySupplements(appId, config, city, supplementCache, notes, "city");
        const values = fetched.values;
        const payload = shapeForCity(config, values, city.source);
        payload.meta.source = sourceEvidence(fetched.sources);
        const notEmpty = await gateEmpty("city", values.length, payload.rows.length);
        const shapeOk = notEmpty
          ? await gateShape("city", payload, fetched.raw)
          : true;
        const writable = notEmpty && shapeOk;
        if (!dryRun && writable) {
          const outPath = resolve(R2_LOCAL, statsR2Key(config.key, "city"));
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, JSON.stringify(payload));
        }
        notes.push(`city=${payload.rows.length}`);
        totalRows += payload.rows.length;
      }
    }

    // 重い順に判定する。empty (データ消失) > shape (壊れたデータ) > 許可済み > ok。
    const status: ProcessStatus = hardEmpty
      ? "empty"
      : hardShape
        ? "shape"
        : softEmpty
          ? "empty-allowed"
          : softShape
            ? "shape-allowed"
            : "ok";
    return {
      key: config.key,
      ok: status !== "empty" && status !== "shape",
      status,
      message: `${dryRun ? "would write" : "wrote"} ${notes.join(",")}`,
      rows: totalRows,
      ...(emptyNotes.length > 0 ? { emptyNotes } : {}),
      ...(shapeNotes.length > 0 ? { shapeNotes } : {}),
    };
  } catch (e) {
    return { key: config.key, ok: false, status: "fail", message: (e as Error).message };
  }
}

