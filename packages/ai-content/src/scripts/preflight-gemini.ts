/**
 * Gemini テキストモデルの preflight (生成前の実在確認)。
 *
 *   npx tsx packages/ai-content/src/scripts/preflight-gemini.ts
 *   GEMINI_TEXT_MODEL=gemini-3-flash npx tsx .../preflight-gemini.ts   # 候補を試すとき
 *
 * ListModels を 1 回叩くだけで生成は行わない (課金ゼロ)。設定中のモデルが `generateContent` を
 * 提供していなければ、実在モデルの候補を出して **exit 1** する。
 *
 * 2026-07-30 の障害 (日次 cron が全件 HTTP 404 / それでも success) の再発防止。
 * 正典: .claude/rules/ranking-content-standards.md §生成パイプライン
 */

import {
  GeminiTextError,
  listGenerateContentModels,
  resolveTextModel,
} from "../services/gemini-text-client";
import { evaluateModelAvailability } from "../services/model-preflight";

async function main() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    process.stderr.write(
      "[preflight] GEMINI_API_KEY が未設定です (CI は Secrets、ローカルは .env.local)\n",
    );
    process.exit(1);
  }

  const configured = resolveTextModel();
  process.stdout.write(`[preflight] 設定モデル: ${configured}\n`);

  let models: string[];
  try {
    models = await listGenerateContentModels({ apiKey });
  } catch (e) {
    // GeminiTextError は分類 + HTTP status だけを持つ (キー・本文は含まない)
    const detail = e instanceof GeminiTextError ? e.message : "unknown";
    process.stderr.write(
      `[preflight] ListModels に失敗: ${detail}\n` +
        "  bad-request (400) / auth (401/403) はキーが無効か Generative Language API が未有効\n" +
        "    (無効キーでの実測は 400 = API_KEY_INVALID。2026-07-30 確認)。\n" +
        "  network/timeout なら一時障害の可能性があるので再実行する。\n",
    );
    process.exit(1);
  }

  process.stdout.write(
    `[preflight] generateContent 可能なモデル ${models.length} 件:\n` +
      models.map((m) => `  - ${m}`).join("\n") +
      "\n",
  );

  const verdict = evaluateModelAvailability(configured, models);
  if (verdict.ok) {
    process.stdout.write(`[preflight] ✅ ${configured} は利用可能\n`);
    return;
  }

  process.stderr.write(
    `[preflight] ❌ ${configured} は generateContent を提供していない (これが HTTP 404 の正体)\n` +
      "  代替候補 (良い順・自動では切り替えない):\n" +
      verdict.suggestions
        .slice(0, 8)
        .map((m) => `    - ${m}`)
        .join("\n") +
      "\n  復旧: workflow の env GEMINI_TEXT_MODEL に候補を設定するか、" +
      "gemini-text-client.ts の GEMINI_TEXT_MODEL 既定値を更新する。\n",
  );
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(
    `[preflight] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(2);
});
