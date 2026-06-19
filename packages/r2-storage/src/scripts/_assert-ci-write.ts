/**
 * R2 への書き込み (push / delete / cleanup) のガード。
 *
 * 完全DBレス運用では SSOT は git TS と R2 のみ。ローカル / CI 両方から
 * remote R2 へ読み書きできる（remote が唯一の真実源）。
 * ローカル書き込み時は R2 S3 creds (.env.local の R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY /
 * R2_S3_ENDPOINT) または wrangler 認証が必要。
 *
 * - dryRun の場合は R2 に書き込まないので常に許可。
 * - ローカル実行時は console.warn で 1 行通知してそのまま続行する。
 *
 * 方針: .claude/rules/local-environment.md / .claude/rules/r2-storage-design.md
 *       (ローカル / CI 両方から remote R2 へ読み書き可。remote が SSOT)
 */
export function assertR2WriteAllowed(opts: { op?: string; dryRun?: boolean } = {}): void {
  const { op = "R2 write", dryRun = false } = opts;
  if (dryRun) return; // dry-run は R2 に書き込まないので許可

  const inCI =
    process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  if (!inCI) {
    console.warn(
      `⚠️ ローカルから R2 へ書き込みます (remote が唯一の真実源)。S3 認証情報 (R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_S3_ENDPOINT) または wrangler 認証が必要です。[${op}]`,
    );
  }
}
