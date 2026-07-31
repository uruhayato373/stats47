/**
 * 生成バッチの終了コード判定 (純関数)。
 *
 * ## なぜ要るか (2026-07-30 の障害)
 *
 * `generate-parallel.ts` は全件失敗しても exit 0 を返していた。日次 cron は初回実行で
 * **OK 0 / FAIL 40** だったのに workflow は success となり、毎晩失敗し続けても誰も気づかない
 * 状態だった (silent green)。CLAUDE.md 行動原則 12「失敗を隠さない」に反する。
 *
 * 判定の考え方:
 *   - **部分的な失敗は成功扱い** — 安いモデルは一定率で JSON 崩れ・ゲート落ちを出す。1 件でも
 *     公開まで届けば前進しており、残りは次回のキューが拾う。ここで落とすと運用が止まる
 *   - **1 件も出せなかったのは systematic failure** — API・認証・モデル名・R2 のいずれかが壊れている。
 *     人が見るべき状態なので run を失敗させる
 */

export interface GenerationCounters {
  ok: number;
  fail: number;
  skip: number;
  rejected: number;
}

export interface OutcomeDecision {
  exitCode: 0 | 1;
  /** run 失敗時に ::error:: で出す一文。成功時は情報行 */
  reason: string;
}

/**
 * 集計から終了コードを決める。
 *
 * @param targets 処理対象として選ばれた件数 (0 ならやることが無かった = 成功)
 */
export function decideOutcome(
  counters: GenerationCounters,
  targets: number,
  opts: { dryRun: boolean } = { dryRun: false },
): OutcomeDecision {
  if (opts.dryRun) {
    return { exitCode: 0, reason: "dry-run (LLM 未呼び出し)" };
  }
  if (targets === 0) {
    return { exitCode: 0, reason: "対象 0 件 (キューに needs-regen なし)" };
  }
  if (counters.ok > 0) {
    return {
      exitCode: 0,
      reason:
        `OK ${counters.ok} 件を公開経路へ (REJECT ${counters.rejected} / ` +
        `FAIL ${counters.fail} / SKIP ${counters.skip} は次回のキューが拾う)`,
    };
  }

  // ここから先は 1 件も出せていない = systematic failure
  if (counters.fail > 0 && counters.rejected === 0 && counters.skip === 0) {
    return {
      exitCode: 1,
      reason:
        `対象 ${targets} 件すべてが FAIL で生成 0 件。API 呼び出しが成立していない ` +
        `(モデル名・API キー・ネットワークを確認する。HTTP 404 ならモデル提供終了を疑い ` +
        `preflight-gemini.ts で実在モデルを実測する)`,
    };
  }
  if (counters.skip > 0 && counters.fail === 0 && counters.rejected === 0) {
    return {
      exitCode: 1,
      reason:
        `対象 ${targets} 件すべてが SKIP で生成 0 件。プロンプト入力 (R2 の item / 観測値) を ` +
        `読めていない可能性がある`,
    };
  }
  if (counters.rejected > 0 && counters.fail === 0 && counters.skip === 0) {
    return {
      exitCode: 1,
      reason:
        `対象 ${targets} 件すべてが決定的ゲート落ちで生成 0 件。ゲートは緩めず、` +
        `プロンプト側かモデル選択を見直す`,
    };
  }
  return {
    exitCode: 1,
    reason:
      `対象 ${targets} 件を処理して生成 0 件 ` +
      `(FAIL ${counters.fail} / REJECT ${counters.rejected} / SKIP ${counters.skip})`,
  };
}
