/**
 * 「観測値ゼロ」アラームの判定 (純関数)。
 *
 * generator 本体 (`generate-ranking-values.ts`) は R2 writer を import するため
 * `server-only` に触れる。判定だけをここに置いてテスト可能にする
 * (`scripts/lib/normalized-fixtures.ts` と同じ「純粋ロジックは lib に出す」パターン)。
 */

/** 観測値が 0 件だったキー (アラート判定の入力)。 */
export interface EmptyCandidate {
  key: string;
  /** その metric が公開対象か (config.isActive) */
  isActive: boolean;
}

/**
 * 「観測値ゼロ」のうち**本当に異常なもの**だけを返す。
 *
 * このアラームが守りたいのは「**公開されているのにチャートが空のページ**」であって、
 * 「観測値をまだ持たない metric が存在すること」ではない。
 *
 * ★2026-07-31 実測: 全件 refresh が `prefectural-income-per-capita` /
 * `station-passengers-annual-total` の 2 件で exit 1 になった。どちらも
 * **isActive:false の未確定プレースホルダ** (前者は statsDataId が TBD と config に明記、
 * 後者は MLIT S12 由来で配信は `app/station-passengers/` 側) で、観測値が無いのが正しい状態。
 * generator は isActive で対象を絞らない (公開前に生成しておく方が安全) ため、
 * **判定側で公開対象に絞る**。絞らないと未公開の下書き metric を作るたびに
 * EXPECTED_EMPTY へ「期限付きの言い訳」を積むことになり、allowlist が第二の沈黙になる。
 *
 * @param isExpectedEmpty EXPECTED_EMPTY 照合 (期限切れは false を返す実装を渡す)
 */
export function selectUnexpectedEmpties(
  candidates: readonly EmptyCandidate[],
  isExpectedEmpty: (key: string) => boolean,
): string[] {
  return candidates.filter((c) => c.isActive && !isExpectedEmpty(c.key)).map((c) => c.key);
}
