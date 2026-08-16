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
  // 2026-07-30: 6 件とも **config は是正済み**。残るのは R2 の再生成だけ。
  //
  // 真因は当初の診断「cdCat01 の誤座標」ではなく **表の形**だった:
  //   - 患者調査 5 件: 都道府県が area 軸ではなく cat 軸 (連番 1=全国 2=北海道…) に入る表。
  //     `@area` を読む通常経路では構造的に 0 行。→ source.areaAxis を新設
  //   - 救急告示病院数: 3 年ごとの調査で 2021 年のデータが無いのに years を 2021 単年に固定。
  //     取得 1008 行が全てフィルタ落ち。→ years:"all"
  //
  // ★このエントリを消してよいのは **R2 再生成後**。消すと監査 (i) が赤くなる。
  //   再生成すれば rowCount>0 になり classifyEmptyOutcome が stale-allowlist で
  //   「削除してください」と教えてくれる。

  // 2026-08-16: SSDS の指標コードがカタログから消滅した 2 件。
  //
  // 実測: statsDataId 0000010205 の cat01 は現在 59 コードで、config が指定する
  //   #E0910101 (幼稚園) / #E0910102 (保育所) は 1 件も存在しない。getStatsData も
  //   STATUS:1「該当データはありません」を返す (同表の実在コード #E0110104 は 1392 行を
  //   正常返却するので、statsDataId 自体と API 疎通には問題がない)。
  //   名称に「普及」を含むコードも 59 件中 0 件で、`#E091xxxx` という命名帯自体が
  //   現行カタログに無い (残っているのは `#E09211` など桁数の異なる別体系)。
  //
  // 既存の配信データ (1,664 / 1,615 行) は生きているのでページは正常に見える。
  // 代替コードが見つかっていないため退役はせず、期限付きで 0 件を許容する。
  // 期限までに SSDS の改番履歴を追って代替を特定するか、見つからなければ退役へ切り替える。
  {
    key: "kindergarten-education-diffusion-rate",
    reason:
      "SSDS 0000010205 の cat01 から #E0910101 が消滅 (現行 59 コードに該当なし・getStatsData が STATUS:1)。同表の他コードは正常取得できるため表の廃止ではなく指標コードの改廃",
    issue: "docs/todo/06_指標バックログ.md#SSDS-EDU-DIFFUSION-CODE-01",
    until: "2026-11-30",
  },
  {
    key: "nursery-education-diffusion-rate",
    reason:
      "SSDS 0000010205 の cat01 から #E0910102 が消滅 (同上)。`#E091xxxx` の命名帯自体が現行カタログに存在しない",
    issue: "docs/todo/06_指標バックログ.md#SSDS-EDU-DIFFUSION-CODE-01",
    until: "2026-11-30",
  },
];

/** key (+entity) に対して**有効な** allowlist エントリを返す。期限切れは null */
export function findExpectedEmpty(
  key: string,
  entity: "prefecture" | "city",
  now: Date,
  /** 差し替え可能にするのはテスト用 (EXPECTED_EMPTY は空になりうる) */
  entries: readonly ExpectedEmptyEntry[] = EXPECTED_EMPTY,
): ExpectedEmptyEntry | null {
  const entry = entries.find(
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
  /** 差し替え可能にするのはテスト用 (EXPECTED_EMPTY は空になりうる) */
  allowlist?: readonly ExpectedEmptyEntry[];
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
  const allow = findExpectedEmpty(key, entity, now, input.allowlist ?? EXPECTED_EMPTY);

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
