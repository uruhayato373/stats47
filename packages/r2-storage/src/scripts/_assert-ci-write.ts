/**
 * R2 への書き込み (push / delete / cleanup) は CI / クラウドからのみ許可する方針のガード。
 *
 * 完全DBレス運用では SSOT は git TS と R2 のみ。R2 反映 (書き込み) はレビュー済みの
 * git 状態から CI が行い、ローカルからの誤 push / 誤削除を防ぐ。読み取りは公開 URL
 * 経由で認証不要なのでローカルでも自由に行える (本ガードの対象外)。
 *
 * - CI (GitHub Actions) では CI=true / GITHUB_ACTIONS=true が立つので素通り。
 * - どうしてもローカルから実行する場合のみ ALLOW_LOCAL_R2_WRITE=1 で明示上書き (非推奨)。
 * - dryRun の場合は書き込まないので常に許可。
 *
 * 方針: .claude/rules/local-environment.md / .claude/rules/r2-storage-design.md
 *       (R2 読み取り = 公開 URL で認証不要 / 書き込み = CI・クラウド専用)
 */
export function assertR2WriteAllowed(opts: { op?: string; dryRun?: boolean } = {}): void {
  const { op = "R2 write", dryRun = false } = opts;
  if (dryRun) return; // dry-run は R2 に書き込まないので許可

  const inCI =
    process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  const override = process.env.ALLOW_LOCAL_R2_WRITE === "1";
  if (inCI || override) return;

  console.error(
    [
      "",
      `⛔ ${op} はローカルから実行できません (R2 書き込みは CI / クラウド専用)。`,
      "",
      "  R2 反映は GitHub Actions から実行してください:",
      "    • snapshot 再生成 + push  → 'Sync Snapshots → R2' (sync-snapshots.yml) を workflow_dispatch",
      "    • blog 公開               → publish-blog.yml",
      "    • e-Stat → R2 データ更新  → data-refresh.yml",
      "",
      "  ローカルの R2 読み取りは認証不要 (公開 URL):",
      "    R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server'",
      "",
      "  どうしてもローカルから書き込む場合のみ (非推奨): ALLOW_LOCAL_R2_WRITE=1 を付与。",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
