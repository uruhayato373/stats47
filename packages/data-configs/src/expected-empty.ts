/**
 * 観測値が **0 件** になったときの扱いを決める単一ソース。
 *
 * 取り込み (page-data-batch)・配信 snapshot 生成 (generate-ranking-values 系)・
 * 週次 live 監査 (audit-ranking-data-integrity) の 3 箇所が**同じ定義**を import する
 * (`scripts/lib/normalized-fixtures.ts` と同じ「両端で同一定義」パターン)。
 *
 * ## なぜ必要か (2026-07-29 実測)
 *
 * active 2,179 metric のうち **6 件**の正典 `app/stats/<key>/values.json` が `rowCount: 0` の
 * まま本番公開されていた。原因は取り込みの全層が「0 件」を成功として扱っていたこと:
 *
 * - `page-data-batch.ts` は行数を見ずに 0 件 payload を**無条件で上書き**し `ok:true` を返す
 * - exit 1 の条件は `fail` 件数のみで、0 件は永久に対象外
 * - ログは 20 件ごとの集計行だけなので画面上は無音
 * - 配信側 `app/ranking/<key>/values.json` には旧データが残るため**ページは正常に見える**
 *
 * 引き金は座標ミス (入院と外来が同一 cdCat01) だったが、0 件になる経路は他にもある
 * (area コード形式・年範囲・limit 打ち切り)。**経路ごとに塞ぐのではなく「0 件を成功にしない」**
 * を不変条件にする。
 */

/** 0 件が正当だと**明示的に**認めたエントリ */
export interface ExpectedEmptyEntry {
  /** metric key */
  key: string;
  /** 対象 entity。未指定なら全 entity */
  entities?: ReadonlyArray<"prefecture" | "city">;
  /** なぜ 0 件が正当なのか (推測でなく事実を書く) */
  reason: string;
  /** 追跡先 (backlog ID / issue 番号)。放置を防ぐため必須 */
  issue: string;
  /**
   * 失効日 (YYYY-MM-DD)。**必須**。
   *
   * これが無いと allowlist 自身が第二の沈黙になる (「一時的に許可」が永久に残る)。
   * 期限を過ぎたエントリは allowlist として扱われず、通常どおり違反に戻る。
   */
  until: string;
}

/**
 * 現在 0 件が許容されている metric。
 *
 * ★エントリを足すときは「なぜ 0 件で正しいのか」を実測で確かめてから書くこと。
 * 「まだ調べていない」を許可に使わない (それは調査中の未解決課題であって正当な 0 件ではない)。
 */
export const EXPECTED_EMPTY: readonly ExpectedEmptyEntry[] = [
  // 2026-07-29 実測: 下記 6 件は app/stats が rowCount:0 (generatedAt 2026-07-05 の同一バッチ)。
  // 5 件が患者調査系で cdCat01 が全て "1" (入院と外来が同一座標 = 明らかな誤り)。
  // 座標修正は [DATA-PATIENT-SURVEY-01] の担当範囲。ゲート導入時に CI を赤にしないため
  // 既知分として登録し、期限を切って追跡する。
  {
    key: "inpatient-rate-per-100k",
    reason: "statsDataId 0004026104 + cdCat01 '1' が誤座標 (外来・年齢別と完全同一)。要 e-Stat メタ再確認",
    issue: "DATA-PATIENT-SURVEY-01",
    until: "2026-10-31",
  },
  {
    key: "outpatient-rate-per-100k",
    reason: "同上 (入院と同一座標)",
    issue: "DATA-PATIENT-SURVEY-01",
    until: "2026-10-31",
  },
  {
    key: "patient-receiving-rate-by-age",
    reason: "同上 (入院・外来と同一座標)",
    issue: "DATA-PATIENT-SURVEY-01",
    until: "2026-10-31",
  },
  {
    key: "patient-receiving-rate-by-disease",
    reason: "statsDataId 0004026105 + cdCat01 '1'。3 軸表だが cdCat03 未指定",
    issue: "DATA-PATIENT-SURVEY-01",
    until: "2026-10-31",
  },
  {
    key: "inpatient-rate-by-bedtype",
    reason: "statsDataId 0004002555 + cdCat01 '1'。3 軸表だが cdCat03 未指定",
    issue: "DATA-PATIENT-SURVEY-01",
    until: "2026-10-31",
  },
  {
    key: "emergency-hospital-general-clinic-count-per-100k",
    reason: "statsDataId 0000010209 + cdCat01 '#I11101' (SSDS 正規形式だが 0 件)。別系統として要調査",
    issue: "DATA-PATIENT-SURVEY-01",
    until: "2026-10-31",
  },
];

/** key (+entity) に対して**有効な** allowlist エントリを返す。期限切れは null */
export function findExpectedEmpty(
  key: string,
  entity: "prefecture" | "city",
  now: Date,
): ExpectedEmptyEntry | null {
  const entry = EXPECTED_EMPTY.find(
    (e) => e.key === key && (e.entities === undefined || e.entities.includes(entity)),
  );
  if (!entry) return null;
  const expiry = Date.parse(`${entry.until}T23:59:59Z`);
  if (!Number.isFinite(expiry) || now.getTime() > expiry) return null; // 期限切れ = 許可しない
  return entry;
}

export type EmptyOutcome =
  /** 0 件でない = 正常 */
  | "ok"
  /** 既存データがあったのに 0 件になった = データ破壊。最も重い */
  | "regression"
  /** 初回から 0 件 (既存データ無し) */
  | "first-empty"
  /** allowlist で明示的に許可済み */
  | "allowed"
  /** allowlist にあるが実際はデータがある = 掃除の合図 (fatal ではない) */
  | "stale-allowlist";

export interface ClassifyEmptyInput {
  key: string;
  entity: "prefecture" | "city";
  /** e-Stat から受け取った生の行数 (フィルタ前) */
  rawCount: number;
  /** フィルタ後に書き出す行数 */
  rowCount: number;
  /** R2 に既にある同 artifact の rowCount。未取得/不在なら null */
  priorRowCount: number | null;
  now: Date;
  /** `--allow-empty` で明示的に許可されたキー */
  cliAllowed?: ReadonlySet<string>;
}

export interface ClassifyEmptyResult {
  outcome: EmptyOutcome;
  /** true なら exit code を汚す */
  isError: boolean;
  /** 人間が原因を切り分けられる 1 行 */
  message: string;
}

/**
 * 0 件の重大度を判定する純関数 (I/O なし = ネットワークも App ID も不要でテストできる)。
 *
 * `rawCount` と `rowCount` を**区別して報告する**のが要点:
 * - `rawCount > 0 && rowCount === 0` → フィルタで全落ち (cdCat 不一致 / area コード形式 / 年範囲)
 * - `rawCount === 0` → 座標そのものが誤り (statsDataId / cdCat)
 *
 * 6 件の事故はこの 1 行が出ていれば「3 件が同一座標」に即日気づけた。
 */
export function classifyEmptyOutcome(input: ClassifyEmptyInput): ClassifyEmptyResult {
  const { key, entity, rawCount, rowCount, priorRowCount, now, cliAllowed } = input;
  const allow = findExpectedEmpty(key, entity, now);

  if (rowCount > 0) {
    if (allow) {
      return {
        outcome: "stale-allowlist",
        isError: false,
        message: `${key} (${entity}): データが復活 (rows=${rowCount})。EXPECTED_EMPTY から削除してください (issue: ${allow.issue})`,
      };
    }
    return { outcome: "ok", isError: false, message: "" };
  }

  // ここから rowCount === 0
  const cause =
    rawCount === 0
      ? "e-Stat が 0 行を返した (statsDataId / cdCat の座標を要確認)"
      : `取得 ${rawCount} 行が全てフィルタ落ち (cdCat 不一致 / area コード形式 / config.years 範囲外を要確認)`;
  const truncated = rawCount >= 100_000 ? " [truncated? limit=100000 に到達しページング未実装]" : "";
  const base = `${key} (${entity}): rows=0 raw=${rawCount} — ${cause}${truncated}`;

  if (cliAllowed?.has(key)) {
    return { outcome: "allowed", isError: false, message: `${base} [--allow-empty 指定により警告のみ]` };
  }
  if (allow) {
    return {
      outcome: "allowed",
      isError: false,
      message: `${base} [EXPECTED_EMPTY: ${allow.reason} / ${allow.issue} / 期限 ${allow.until}]`,
    };
  }
  if (priorRowCount !== null && priorRowCount > 0) {
    return {
      outcome: "regression",
      isError: true,
      message: `${base} ★既存 ${priorRowCount} 行が消失するため書き込みを中止 (データ破壊防止)`,
    };
  }
  return { outcome: "first-empty", isError: true, message: base };
}
