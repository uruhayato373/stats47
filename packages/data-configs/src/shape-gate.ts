/**
 * 観測値の **形状** が壊れているときの扱いを決める単一ソース。
 *
 * 取り込み (page-data-batch)・週次 live 監査 (audit-ranking-data-integrity)・
 * 走査スクリプト (scan-stats-shape) の 3 箇所が**同じ関数**を import する
 * (`expected-empty.ts` / `normalized-fixtures.ts` と同じ「両端で同一定義」パターン)。
 * これにより「書き込み時に通ったものが監査で落ちる」食い違いが起きない。
 *
 * ## なぜ必要か (2026-07-30 実測)
 *
 * `expected-empty.ts` が 2026-07-29 に塞いだのは「0 件」= **行が少なすぎる**側だけだった。
 * その逆側 (行が多すぎる・県が欠ける・単位と値が矛盾する) は全層で無検証で、
 * active 2,179 metric のうち **194 件が壊れた数値を配信していた**:
 *
 * - `sports-participation-rate-swimming` は cdCat03 (スポーツの種類 24 件) 未指定で
 *   24 種目すべてを取得。1,128 行になり rank が通し番号になっていた。
 *   ページは 1 位 74.5% と表示していたが、これは水泳ではない別種目の値 (正しくは 8.6%)
 * - `vacant-housing-rate` は unit が「％」なのに値が空き家戸数 (東京 896,500)
 * - `smartphone-usage-students` は 97,916 行 (本来 47 行)
 *
 * **検知に必要な情報は書き込み時点で揃っていた**。`buildMeta` は既に rowCount /
 * areaCount / yearRange を計算しており、`1128 ≠ 47 × 1年` は自明だった。誰も見ていなかっただけ。
 *
 * 既存の週次監査 (`audit-ranking-data-integrity.ts`) も同日に実行して違反 0 件 = ✓ OK を返した。
 * 存在・rowCount 0・年整合・正規化値域は見るが、形状を見ていなかった。
 *
 * ## 設計方針
 *
 * **誤検知を出さない側に倒す。** 誤検知を出すゲートは運用で無効化される。判断がつかないものは
 * warn に落とし、確実に欠陥と言えるものだけ error にする。実例として「47 県必須」という
 * 素朴なルールは `port-*` / `fishery-*` の 15 件を誤検知する — 港湾統計に内陸 8 県が
 * 無いのは正当で、`port-cargo-total` の欠落県は内陸 8 県と完全一致することを実測で確認した。
 * よって coverage は既定 warn とし、**同じ年の県数が前より減ったときだけ** error に昇格させる
 * (起点が 47 でなくてもよい。39 → 34 も劣化として捕まえる)。
 */

import { PREFECTURE_AREA_CODES } from "@stats47/area";

/** 検査の種類 */
export type ShapeCheck =
  /** 同一 (areaCode, yearCode) に 2 行以上 = 分類軸の絞り忘れ */
  | "duplicate-area-year"
  /** e-Stat の応答が limit で切られた */
  | "raw-truncated"
  /** unit が % なのに値が百分率の範囲を大きく外れる */
  | "percent-out-of-range"
  /** 都道府県が 47 に満たない年がある */
  | "area-coverage"
  /** ある年の全県が同じ値 = 順位が存在しない (全件ゼロを含む) */
  | "constant-value"
  /** ある年のほぼ全県が 0 */
  | "zero-heavy"
  /** 個数を数える unit なのに負値がある */
  | "negative-count";

/**
 * 値の分布を見る検査 (2026-08-04 追加)。
 *
 * ## なぜ形状だけでは足りなかったか
 *
 * 既存 4 検査は「行が多すぎる / 県が欠ける / 単位と値が矛盾する」= **器の形**を見ていた。
 * だが `bowling-alley-public` (公共ボウリング場数) は 47 行 1 系列で器の形は完璧なまま、
 * **全 47 県の値が 0** だった。順位が存在しないので ranking ページとして成立しないが、
 * 取り込み・週次監査・走査のどれも素通りし、AI コンテンツ生成 (FAQ 5 問 + 県別解説 47 件) まで
 * 進んで公開された。`summarizeShape` は valueMin/valueMax を既に計算しており
 * `min === max` は 1 行で判定できたのに、誰も見ていなかった。
 *
 * ## per-year で判定する (★グローバル min/max では捕まらない)
 *
 * `bowling-alley-public` は全年通算だと 2008-18 年に値 1 の県が数件あるので distinct=2 になり、
 * **グローバル min/max 比較ではすり抜ける**。年ごとに distinct を数えて初めて
 * 「最新年 (2021) の 47 県が全部 0」を捕まえられる。
 *
 * ## 閾値の根拠 (2026-08-04・active 2,176 metric 全件の実測)
 *
 * | 検査 | 該当 | tier |
 * |---|---|---|
 * | latest 年の全県同値 | **3 件 = 既知の欠陥と完全一致**・誤検知 0 | error |
 * | 過去年のみ同値 | 4 件 (統計の初期年に多い) | warn |
 * | ゼロ率 ≥90% | 2 件 (46/47・41/44 でどちらも要調査) | warn |
 * | ゼロ率 50-90% | 16 件 — 地熱発電所・原発・植物園など**正当が優勢** | 検知しない |
 * | 個数 unit の負値 | 1 件 (既知の壊れ) | warn |
 *
 * ゼロ率 50-90% を弾かないのは、「原発がある県は数県だけ」のような**正当なデータ**が
 * 多数派だから。設計方針どおり誤検知を出さない側に倒す。
 */
/** ある年の全県が同値のとき、それが最新年なら error・過去年だけなら warn */
const CONSTANT_VALUE_SEVERITY = 1;

/**
 * ゼロ率がこれ以上なら warn。
 *
 * 0.9 は実測から決めた。0.5 まで下げると地熱発電所 (40/47 が 0) や原子力発電所 (32/47) といった
 * **正当なデータ 16 件**を巻き込む。46/47 や 41/44 は「1 県だけ値がある」状態で、
 * 集計軸の取り違えを疑う水準。
 */
const ZERO_HEAVY_THRESHOLD = 0.9;

/**
 * 負値がありえない unit。「個数を数えるもの」だけを保守的に列挙する。
 *
 * ％ / ‰ / ℃ / 円 / 人 は入れない — 増減率・転入超過数・気温・収支差額で負が正当にありうる。
 * 実測で負値を持つ 25 metric のうち 24 件はこれらの unit だった。
 */
export const COUNT_UNITS: readonly string[] = [
  "店",
  "施設",
  "件",
  "か所",
  "ヶ所",
  "箇所",
  "館",
  "校",
  "園",
  "台",
  "隻",
  "戸",
  "棟",
];

/**
 * 値の分布を見る検査。器の形を見る既存 4 検査と区別する。
 *
 * allowlist のラチェットをファミリーごとに分けるために使う (`expected-shape-anomaly.ts`)。
 * 2026-08-04 に検査を増やしたぶんを既存ラチェット `MAX_KNOWN_BROKEN` の枠に混ぜると、
 * 「上限を上げた」のか「新しい壊れ方を足した」のかが区別できなくなる。
 */
export const VALUE_CHECKS: readonly ShapeCheck[] = [
  "constant-value",
  "zero-heavy",
  "negative-count",
];

/**
 * 構造上 **error になりえない** 検査。
 *
 * 何も fail させないので allowlist に載せる意味がなく、載せると本当の欠陥が埋もれる
 * (`area-coverage` を allowlist から外しているのと同じ理由)。`--emit-allowlist` の除外に使う。
 */
export const WARN_ONLY_CHECKS: readonly ShapeCheck[] = ["zero-heavy", "negative-count"];

/** 都道府県の総数。coverage 判定の基準。`@stats47/area` の 47 県コードから導出する */
export const PREFECTURE_COUNT = PREFECTURE_AREA_CODES.length;

/**
 * unit が % のときの値域しきい値。
 *
 * 100 をわずかに超える値は「対前年比 120%」「増減率」等で正当にありうるので error にしない。
 * 桁が違う (1000 超) ものだけを実害とみなす。`vacant-housing-rate` の 896,500 はここに入る。
 */
const PERCENT_ERROR_THRESHOLD = 1000;
const PERCENT_WARN_THRESHOLD = 100;

/** 形状を判定するのに必要な最小限の行の形 */
export interface ShapeRow {
  areaCode: string;
  yearCode: string;
  value: number | null;
}

/** ある 1 年ぶんの値の分布 */
export interface YearValueStats {
  /** 有限な数値の件数 (null / NaN / Infinity を除く) */
  finite: number;
  /** 相異なる値の数。1 なら全県同値 */
  distinct: number;
  /** 値がちょうど 0 の件数 */
  zeroCount: number;
  /** 負値の件数 */
  negativeCount: number;
  /** finite が 0 のときは null。全県同値の判定メッセージに使う */
  sample: number | null;
}

export interface ShapeSummary {
  rowCount: number;
  /** 同一 (areaCode, yearCode) が 2 行以上あった組の数 */
  duplicatePairCount: number;
  /** 最も重複している組の行数。1 なら重複なし */
  maxMultiplicity: number;
  /** yearCode → その年の distinct areaCode 数 */
  perYearAreaCount: Record<string, number>;
  /** 年の数 */
  yearCount: number;
  valueMax: number | null;
  valueMin: number | null;
  /**
   * yearCode → その年の値の分布。
   *
   * **年ごとに持つのが要点**。通算の valueMin/valueMax では「最新年だけ全県同値」を
   * 捕まえられない (型冒頭の per-year の説明を参照)。
   */
  perYearValueStats: Record<string, YearValueStats>;
  /**
   * yearCode の最大 (数値比較)。行が無ければ null。
   *
   * 「最新年が壊れているか」で tier を分けるのに使う。過去年の欠陥は既に配信されていて
   * 今さら書き込みを止めても直らないが、最新年は次の取り込みで直せる。
   */
  latestYearCode: string | null;
}

/**
 * 行配列から形状サマリを作る純関数。
 *
 * 取り込み側は書き出す直前の rows を、監査側は R2 から読んだ rows を渡す。
 * どちらも同じサマリになるので判定がぶれない。
 */
export function summarizeShape(rows: readonly ShapeRow[]): ShapeSummary {
  const multiplicity = new Map<string, number>();
  const areasByYear = new Map<string, Set<string>>();
  const distinctByYear = new Map<string, Set<number>>();
  const statsByYear = new Map<string, YearValueStats>();
  let valueMax: number | null = null;
  let valueMin: number | null = null;

  for (const row of rows) {
    const pairKey = `${row.areaCode} ${row.yearCode}`;
    multiplicity.set(pairKey, (multiplicity.get(pairKey) ?? 0) + 1);

    let areas = areasByYear.get(row.yearCode);
    if (!areas) {
      areas = new Set();
      areasByYear.set(row.yearCode, areas);
    }
    areas.add(row.areaCode);

    if (row.value !== null && Number.isFinite(row.value)) {
      if (valueMax === null || row.value > valueMax) valueMax = row.value;
      if (valueMin === null || row.value < valueMin) valueMin = row.value;

      // 年ごとの分布。通算の min/max では「最新年だけ全県同値」を捕まえられない
      let distinct = distinctByYear.get(row.yearCode);
      if (!distinct) {
        distinct = new Set();
        distinctByYear.set(row.yearCode, distinct);
      }
      distinct.add(row.value);

      let stat = statsByYear.get(row.yearCode);
      if (!stat) {
        stat = { finite: 0, distinct: 0, zeroCount: 0, negativeCount: 0, sample: row.value };
        statsByYear.set(row.yearCode, stat);
      }
      stat.finite++;
      if (row.value === 0) stat.zeroCount++;
      if (row.value < 0) stat.negativeCount++;
    }
  }

  let duplicatePairCount = 0;
  let maxMultiplicity = 0;
  for (const count of multiplicity.values()) {
    if (count > 1) duplicatePairCount++;
    if (count > maxMultiplicity) maxMultiplicity = count;
  }

  const perYearAreaCount: Record<string, number> = {};
  for (const [year, areas] of areasByYear) perYearAreaCount[year] = areas.size;

  const perYearValueStats: Record<string, YearValueStats> = {};
  for (const [year, stat] of statsByYear) {
    perYearValueStats[year] = { ...stat, distinct: distinctByYear.get(year)?.size ?? 0 };
  }

  return {
    rowCount: rows.length,
    duplicatePairCount,
    maxMultiplicity,
    perYearAreaCount,
    yearCount: areasByYear.size,
    valueMax,
    valueMin,
    perYearValueStats,
    latestYearCode: latestYearOf(areasByYear.keys()),
  };
}

/**
 * yearCode の最大を数値比較で返す。
 *
 * 文字列ソートに頼らない — 年は 4 桁で揃っている前提だが、揃っていない日に静かに
 * 別の年を最新とみなすのを避ける。数値化できない年は無視する。
 */
function latestYearOf(years: Iterable<string>): string | null {
  let best: string | null = null;
  let bestNum = Number.NEGATIVE_INFINITY;
  for (const y of years) {
    const n = Number(y);
    if (!Number.isFinite(n)) continue;
    if (n > bestNum) {
      bestNum = n;
      best = y;
    }
  }
  return best;
}

/* ------------------------------------------------------------------------ */
/* allowlist                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * 形状違反を**明示的に**認めたエントリ。
 *
 * `expected-empty.ts` の `ExpectedEmptyEntry` と同じ規律 (理由・追跡先・失効日が必須) に加えて、
 * **観測済みの重症度**を持つ。現在値がこれ以下のときだけ降格するので、
 * allowlist が「新たな悪化」を隠さない。
 */
export interface ExpectedShapeAnomalyEntry {
  key: string;
  check: ShapeCheck;
  /** 対象 entity。未指定なら全 entity */
  entities?: ReadonlyArray<"prefecture" | "city">;
  /**
   * `legitimate` — 統計の性質上その形が正しい (是正しない)。
   * `known-broken` — 実際に壊れているが是正待ち (期限内は配信更新を止めない)。
   */
  disposition: "legitimate" | "known-broken";
  /**
   * 観測済みの重症度。**大きいほど悪い**。検査ごとに意味が違う:
   * - `duplicate-area-year`: maxMultiplicity (1 組あたりの最大行数)
   * - `percent-out-of-range`: valueMax
   * - `area-coverage`: 47 - その metric の最小県数 (= 欠落県数)
   * - `raw-truncated`: 0 (重症度の概念なし)
   */
  observedSeverity: number;
  /** なぜこの形なのか (推測でなく実測を書く) */
  reason: string;
  /** 追跡先 (backlog ID / issue 番号)。放置を防ぐため必須 */
  issue: string;
  /** 失効日 (YYYY-MM-DD)。期限を過ぎたら allowlist として扱わない */
  until: string;
}

/** key + check (+entity) に対して**有効な** allowlist エントリを返す。期限切れは null */
export function findExpectedShapeAnomaly(
  entries: readonly ExpectedShapeAnomalyEntry[],
  key: string,
  check: ShapeCheck,
  entity: "prefecture" | "city",
  now: Date,
): ExpectedShapeAnomalyEntry | null {
  const entry = entries.find(
    (e) =>
      e.key === key &&
      e.check === check &&
      (e.entities === undefined || e.entities.includes(entity)),
  );
  if (!entry) return null;
  const expiry = Date.parse(`${entry.until}T23:59:59Z`);
  if (!Number.isFinite(expiry) || now.getTime() > expiry) return null; // 期限切れ = 許可しない
  return entry;
}

/* ------------------------------------------------------------------------ */
/* 判定                                                                       */
/* ------------------------------------------------------------------------ */

export interface ShapeViolation {
  check: ShapeCheck;
  /** true なら exit code を汚す (書き込みを中止する) */
  isError: boolean;
  /** 実測された重症度。allowlist の observedSeverity と比較される */
  severity: number;
  /** 人間が原因を切り分けられる 1 行 */
  message: string;
  /** allowlist で降格された場合その理由 */
  allowedBy?: ExpectedShapeAnomalyEntry;
}

export interface ClassifyShapeInput {
  key: string;
  entity: "prefecture" | "city";
  summary: ShapeSummary;
  /** metric config の unit (表示都合の値。e-Stat メタとは突き合わせない) */
  unit: string;
  /** e-Stat 応答の RESULT_INF。取得経路以外 (監査など) では undefined */
  raw?: { totalNumber: number; toNumber: number };
  /**
   * R2 に既にある同 artifact のサマリ。coverage の縮小専用ラチェットに使う。
   * 未取得/不在なら null。
   */
  priorSummary?: Pick<ShapeSummary, "perYearAreaCount"> | null;
  now: Date;
  /**
   * 公開済みデータ向けの既知破損 allowlist。**省略可** (呼び出し側が渡す。テストで差し替え可)。
   *
   * ★取り込み (page-data-batch) では渡さない。allowlist は「いま R2 にある
   *   データが壊れている」ことの記録で、「新しく取るデータも壊れていてよい」
   *   ではない。渡すと新しい壊れ方 (是正時の分子分母取り違え等) が
   *   `allowed` に落ちてそのまま書き込まれる。重症度ラチェットは悪化しか
   *   見ないのでこの穴を塞げない。
   */
  allowlist?: readonly ExpectedShapeAnomalyEntry[];
  /** `--allow-shape` で明示的に許可されたキー */
  cliAllowed?: ReadonlySet<string>;
}

/** 判定結果を allowlist と CLI 許可に照らして降格する */
function applyAllowances(
  violation: ShapeViolation,
  input: ClassifyShapeInput,
): ShapeViolation {
  if (!violation.isError) return violation;

  if (input.cliAllowed?.has(input.key)) {
    return {
      ...violation,
      isError: false,
      message: `${violation.message} [--allow-shape 指定により警告のみ]`,
    };
  }

  const allow = findExpectedShapeAnomaly(
    input.allowlist ?? [],
    input.key,
    violation.check,
    input.entity,
    input.now,
  );
  if (!allow) return violation;

  // ★悪化していたら降格しない。allowlist が新たな劣化を隠さないための要。
  if (violation.severity > allow.observedSeverity) {
    return {
      ...violation,
      message:
        `${violation.message} ★allowlist の観測値 ${allow.observedSeverity} から ` +
        `${violation.severity} に悪化したため許可しない (issue: ${allow.issue})`,
    };
  }

  return {
    ...violation,
    isError: false,
    allowedBy: allow,
    message:
      `${violation.message} [${allow.disposition}: ${allow.reason} / ` +
      `${allow.issue} / 期限 ${allow.until}]`,
  };
}

/**
 * 形状の違反を判定する純関数 (I/O なし = ネットワークも App ID も不要でテストできる)。
 *
 * 違反が無ければ空配列。error が 1 件でもあれば呼び出し側は**書かずに既存データを温存する**
 * (`gateEmpty` と同じ扱い。壊れたデータで上書きするより古いデータの方がまし)。
 */
export function classifyShape(input: ClassifyShapeInput): ShapeViolation[] {
  const { key, entity, summary, unit, raw, priorSummary } = input;
  const out: ShapeViolation[] = [];

  // --- (1) 重複行 ---------------------------------------------------------
  // 同一 (areaCode, yearCode) の一意性は都道府県表・市区町村表とも例外がない。
  // 破れているなら分類軸 (cdCat01-05 / tab) か時間粒度の絞り忘れが確定している。
  if (summary.duplicatePairCount > 0) {
    const expected = Object.values(summary.perYearAreaCount).reduce((a, b) => a + b, 0);
    out.push(
      applyAllowances(
        {
          check: "duplicate-area-year",
          isError: true,
          severity: summary.maxMultiplicity,
          message:
            `${key} (${entity}): 同一 (県, 年) に最大 ${summary.maxMultiplicity} 行の重複 ` +
            `(重複組 ${summary.duplicatePairCount} / 全 ${summary.rowCount} 行、` +
            `期待 ${expected} 行) — 分類軸 (cdCat01-05 / cdTab) か timeScope の絞り忘れ`,
        },
        input,
      ),
    );
  }

  // --- (2) 打ち切り -------------------------------------------------------
  // limit で切られた応答をそのまま配信すると「一部の県だけ」「一部の年だけ」の
  // 中途半端なデータになる。e-Stat は RESULT_INF で総数を返すので確実に判定できる。
  if (raw && raw.totalNumber > raw.toNumber) {
    out.push(
      applyAllowances(
        {
          check: "raw-truncated",
          isError: true,
          severity: 0,
          message:
            `${key} (${entity}): e-Stat 応答が打ち切られた ` +
            `(全 ${raw.totalNumber} 件中 ${raw.toNumber} 件のみ取得) — ` +
            `分類軸を絞るかページングが要る`,
        },
        input,
      ),
    );
  }

  // --- (3) 単位と値の矛盾 -------------------------------------------------
  // config.unit は表示都合の値で e-Stat の @unit と一致しない正当な例が多いため、
  // メタとの突合はしない (誤検知の温床)。値域だけを見て実害を捕まえる。
  const isPercent = unit === "%" || unit === "％";
  if (isPercent && summary.valueMax !== null && summary.valueMax > PERCENT_WARN_THRESHOLD) {
    const isError = summary.valueMax > PERCENT_ERROR_THRESHOLD;
    out.push(
      applyAllowances(
        {
          check: "percent-out-of-range",
          isError,
          severity: summary.valueMax,
          message:
            `${key} (${entity}): unit が「${unit}」なのに最大値 ${summary.valueMax}` +
            (isError
              ? " — 率ではなく実数が入っている可能性が高い"
              : " — 対前年比などで正当な場合もあるため警告に留める"),
        },
        input,
      ),
    );
  }

  // --- (4) 県のカバレッジ -------------------------------------------------
  // 素朴な「47 県必須」は port-* / fishery-* を誤検知する (内陸県に港湾は無い)。
  // 既定 warn とし、**同じ年の県数が前より減ったときだけ** error に昇格させる
  // (縮小専用ラチェット)。これで正当な欠落は allowlist すら要らない。
  //
  // ★「以前 47 だった年だけ」を条件にしてはならない (2026-07-30 実測)。
  //   port-cargo-total は元から 39 県 (内陸 8 県が無い) で、分類軸を pin した結果
  //   34 県に減った。47 起点しか見ないとこの 5 県の欠落を見逃す。
  //   起点が何であれ「同じ年のデータが減った」のは劣化なので error にする。
  if (entity === "prefecture") {
    const short = Object.entries(summary.perYearAreaCount)
      .filter(([, count]) => count < PREFECTURE_COUNT)
      .sort(([a], [b]) => a.localeCompare(b));

    if (short.length > 0) {
      const regressed = priorSummary
        ? short.filter(([year, count]) => {
            const prior = priorSummary.perYearAreaCount[year];
            return prior !== undefined && prior > count;
          })
        : [];
      const worstMissing = Math.max(...short.map(([, count]) => PREFECTURE_COUNT - count));
      const sample = short
        .slice(0, 5)
        .map(([year, count]) => `${year}:${count}`)
        .join(" ");

      out.push(
        applyAllowances(
          {
            check: "area-coverage",
            isError: regressed.length > 0,
            severity: worstMissing,
            message:
              `${key} (${entity}): 47 県に満たない年が ${short.length} 件 (${sample}` +
              (short.length > 5 ? " …" : "") +
              ")" +
              (regressed.length > 0
                ? ` ★うち ${regressed
                    .slice(0, 5)
                    .map(([y, c]) => `${y}:${priorSummary?.perYearAreaCount[y]}→${c}`)
                    .join(" ")} は前より減っている (欠損の発生)`
                : " — 統計の性質上正当な場合があるため警告に留める"),
          },
          input,
        ),
      );
    }
  }

  // --- (5) 全県が同じ値 ---------------------------------------------------
  // 器の形 ((1)-(4)) が完璧でも、値が全部同じなら順位が存在しない。
  // **最新年**が壊れているときだけ error にする — 過去年の欠陥は既に配信済みで、
  // 今から書き込みを止めても直らない。最新年なら次の取り込みで直せる。
  // finite が 1 件のときは「全部同じ」が自明に成立するだけで欠陥の証拠にならない
  // (比べる相手がいない)。2 件以上ある年だけを見る。
  const constantYears = Object.entries(summary.perYearValueStats)
    .filter(([, s]) => s.finite >= 2 && s.distinct === 1)
    .sort(([a], [b]) => a.localeCompare(b));

  if (constantYears.length > 0) {
    const latest = summary.latestYearCode;
    const latestEntry = latest ? constantYears.find(([y]) => y === latest) : undefined;
    const sample = (latestEntry ?? constantYears[constantYears.length - 1])[1];
    const years = constantYears.map(([y]) => y);
    out.push(
      applyAllowances(
        {
          check: "constant-value",
          isError: latestEntry !== undefined,
          severity: CONSTANT_VALUE_SEVERITY,
          message:
            `${key} (${entity}): 全 ${sample.finite} 県が同じ値 (${sample.sample}) の年がある ` +
            `[${years.slice(0, 6).join(" ")}${years.length > 6 ? " …" : ""}] — 順位が成立しない` +
            (latestEntry !== undefined
              ? ` ★最新年 ${latest} が該当`
              : " — 過去年のみなので警告に留める"),
        },
        input,
      ),
    );
  }

  // --- (6) ほぼ全県がゼロ -------------------------------------------------
  // (5) に至らなくても 46/47 が 0 なら集計軸の取り違えを疑う。ただし「原発がある県は
  // 数県だけ」のような正当なデータが多数派なので、閾値は 0.9 と高くし warn に留める
  // (0.5 まで下げると正当な 16 件を巻き込む・実測)。
  const latestStats = summary.latestYearCode
    ? summary.perYearValueStats[summary.latestYearCode]
    : undefined;
  if (
    latestStats &&
    latestStats.finite > 0 &&
    latestStats.distinct > 1 &&
    latestStats.zeroCount / latestStats.finite >= ZERO_HEAVY_THRESHOLD
  ) {
    out.push(
      applyAllowances(
        {
          check: "zero-heavy",
          isError: false,
          severity: latestStats.zeroCount,
          message:
            `${key} (${entity}): 最新年 ${summary.latestYearCode} の ` +
            `${latestStats.zeroCount}/${latestStats.finite} 県が 0 ` +
            `(${Math.round((latestStats.zeroCount / latestStats.finite) * 100)}%) — ` +
            `集計軸の取り違えか、実際にごく一部の県にしか無い指標か要確認`,
        },
        input,
      ),
    );
  }

  // --- (7) 個数なのに負値 -------------------------------------------------
  // ％/‰/℃/円/人 は増減率・収支・気温で負が正当にありうるので対象外。
  // 「数えるもの」だけを COUNT_UNITS に保守的に列挙している。
  if (COUNT_UNITS.includes(unit)) {
    const negativeYears = Object.entries(summary.perYearValueStats)
      .filter(([, s]) => s.negativeCount > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    if (negativeYears.length > 0) {
      const worst = Math.max(...negativeYears.map(([, s]) => s.negativeCount));
      out.push(
        applyAllowances(
          {
            check: "negative-count",
            isError: false,
            severity: worst,
            message:
              `${key} (${entity}): unit が「${unit}」なのに負値がある ` +
              `(最大 ${worst} 件/年、該当年 ${negativeYears
                .slice(0, 5)
                .map(([y]) => y)
                .join(" ")}${negativeYears.length > 5 ? " …" : ""}) — ` +
              `増減を表す系列を数量として取り込んでいる可能性`,
          },
          input,
        ),
      );
    }
  }

  return out;
}

/** 違反配列に error が含まれるか */
export function hasShapeError(violations: readonly ShapeViolation[]): boolean {
  return violations.some((v) => v.isError);
}
