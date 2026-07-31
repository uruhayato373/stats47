/**
 * Gemini テキストモデルの preflight (生成前の使用可否確認)。
 *
 *   npx tsx packages/ai-content/src/scripts/preflight-gemini.ts
 *   GEMINI_TEXT_MODEL=gemini-3.5-flash npx tsx .../preflight-gemini.ts   # 候補を試すとき
 *
 * **極小の生成を 1 回だけ試す** (出力数十トークン = 実質無料)。失敗したときだけ ListModels を
 * 呼んで代替候補を出し、**exit 1** する。
 *
 * ★ListModels に載っていることは「使える」証明にならない (2026-07-31 CI 実測):
 *   `gemini-2.5-flash` は一覧に載り generateContent を supportedGenerationMethods に持つのに、
 *   実際に叩くと 404 だった。だから合否は実生成だけで決める。
 *
 * 2026-07-30 の障害 (日次 cron が全件 HTTP 404 / それでも success) の再発防止。
 * 正典: .claude/rules/ranking-content-standards.md §生成パイプライン
 */

import {
  GeminiTextError,
  generateContentText,
  listGenerateContentModels,
  resolveTextModel,
} from "../services/gemini-text-client";
import { runModelPreflight, type SmokeResult } from "../services/model-preflight";

/** 本番と同じ request 形 (responseMimeType: application/json) を通す極小プロンプト */
const SMOKE_PROMPT = 'Return exactly this JSON and nothing else: {"ok":true}';

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

  const report = await runModelPreflight({
    configured,
    smoke: async (): Promise<SmokeResult> => {
      try {
        // maxOutputTokens は本番既定のまま (課金は実出力トークンで決まるため小さいプロンプトなら安い)。
        // 再試行は 2 回まで — 一時的な 429 / 5xx で preflight を落として cron を止めない。
        await generateContentText({
          prompt: SMOKE_PROMPT,
          apiKey,
          maxAttempts: 2,
          timeoutMs: 60_000,
        });
        return { ok: true };
      } catch (e) {
        if (e instanceof GeminiTextError) {
          if (e.quota) {
            // 「40 件/日が成り立つのか」を判断できるよう実測値を出す (機密は含まない)
            process.stdout.write(
              `[preflight]   quota: metric=${e.quota.metric ?? "?"} ` +
                `limit=${e.quota.limit ?? "?"} retryAfter=${e.quota.retryAfter ?? "?"}\n`,
            );
          }
          if (!e.quota && e.debugSnippet) {
            // Google が構造化 quota を返さない 429 もある (クレジット枯渇はこれ)。
            // その場合は判断材料が本文の自由文しかないのでそのまま見せる
            process.stdout.write(
              `[preflight]   429 本文 (構造化 quota なし): ${e.debugSnippet.replace(/\s+/g, " ")}\n`,
            );
          }
          return { ok: false, classification: e.classification, status: e.status };
        }
        return { ok: false, classification: "unknown" };
      }
    },
    listModels: () => listGenerateContentModels({ apiKey }),
  });

  if (report.ok) {
    process.stdout.write(`[preflight] ${report.messages.join("\n")}\n`);
    return;
  }

  // クレジット枯渇はモデルの問題ではないので、モデル復旧の一般論を足さない
  // (足すと「モデルを変えれば直る」と読めてしまい、実際には直らない)
  const modelHint =
    report.classification === "billing"
      ? ""
      : (report.suggestions.length > 0
          ? "  代替候補 (良い順・自動では切り替えない):\n" +
            report.suggestions
              .slice(0, 8)
              .map((m) => `    - ${m}`)
              .join("\n") +
            "\n"
          : "") +
        "  復旧: リポジトリ変数 GEMINI_TEXT_MODEL に候補を設定するか、" +
        "gemini-text-client.ts の GEMINI_TEXT_MODEL 既定値を更新する。\n" +
        "  bad-request (400) / auth (401/403) はキーが無効か Generative Language API が未有効\n" +
        "    (無効キーでの実測は 400 = API_KEY_INVALID。2026-07-30 確認)。\n";

  process.stderr.write(
    report.messages.map((m) => `[preflight] ${m}`).join("\n") + "\n" + modelHint,
  );
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(
    `[preflight] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(2);
});
