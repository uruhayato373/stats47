#!/usr/bin/env tsx
/**
 * ranking_ai_content の R2 snapshot を書き出す。
 *
 * 通常は AI content 生成バッチ完了時 / sync 時に呼ばれるが、
 * 手動で最新化したいときにも単独実行できる。
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     packages/ai-content/src/scripts/export-snapshot.ts
 */

import { exportRankingAiContentSnapshot } from "../exporters/ranking-ai-content-snapshot";

async function main() {
  console.log("ai-content snapshot を R2 に書き出します…");
  const result = await exportRankingAiContentSnapshot();
  console.log(`✅ ai_content: files=${result.files} / ${result.durationMs}ms`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
