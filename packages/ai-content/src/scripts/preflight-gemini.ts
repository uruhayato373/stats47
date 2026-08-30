import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { GEMINI_CRITIC_RESPONSE_SCHEMA } from "../services/gemini-content-schemas";
import {
  GeminiTextError,
  generateContentText,
  listGenerateContentModels,
  resolveTextModel,
  type GeminiQuotaDetails,
  type GeminiTokenUsage,
} from "../services/gemini-text-client";
import { runModelPreflight, type SmokeResult } from "../services/model-preflight";

const SMOKE_PROMPT = 'Return this review JSON: {"verdict":"PASS","issues":[]}';
const ZERO_USAGE: GeminiTokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  thinkingTokens: 0,
  totalTokens: 0,
};

function argValue(name: string): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function writeReport(
  reportPath: string | undefined,
  report: {
    model: string;
    targets: number;
    ok: boolean;
    classification?: string;
    status?: number;
    requests: number;
    usage: GeminiTokenUsage;
    quota?: GeminiQuotaDetails;
  },
) {
  if (!reportPath) return;
  const absolute = path.resolve(reportPath);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(
    absolute,
    `${JSON.stringify({ version: 1, completedAt: new Date().toISOString(), resolvedModel: report.model, ...report }, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const reportPath = argValue("--report");
  const targets = Number(argValue("--targets") ?? 0);
  if (!Number.isInteger(targets) || targets < 0) {
    throw new Error("--targets は 0 以上の整数です");
  }
  const configured = resolveTextModel();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    writeReport(reportPath, {
      model: configured,
      targets,
      ok: false,
      classification: "auth",
      requests: 0,
      usage: { ...ZERO_USAGE },
    });
    process.stderr.write("[preflight] GEMINI_API_KEY が未設定です\n");
    process.exitCode = 1;
    return;
  }

  let requests = 0;
  let usage = { ...ZERO_USAGE };
  let quota: GeminiQuotaDetails | undefined;
  let status: number | undefined;
  process.stdout.write(`[preflight] model=${configured}\n`);
  const report = await runModelPreflight({
    configured,
    smoke: async (): Promise<SmokeResult> => {
      try {
        requests += 1;
        const result = await generateContentText({
          prompt: SMOKE_PROMPT,
          apiKey,
          responseJsonSchema: GEMINI_CRITIC_RESPONSE_SCHEMA,
          maxOutputTokens: 256,
          // quota 限界ならその日は停止する。preflight で無料リクエストを重ねない。
          maxAttempts: 1,
          timeoutMs: 60_000,
          temperature: 0,
          onAttempt: ({ quota: attemptQuota }) => {
            if (!attemptQuota) return;
            // maxAttempts=1 なので最後に観測した quota がこの run の停止理由。
            // 生成本文やレスポンス本文は report に含めない。
            quota = attemptQuota;
            process.stdout.write(
              `[preflight] quota metric=${attemptQuota.metric ?? "?"} limit=${attemptQuota.limit ?? "?"} ` +
                `retryAfter=${attemptQuota.retryAfter ?? "?"}\n`,
            );
          },
        });
        usage = result.usage;
        return { ok: true };
      } catch (error) {
        if (error instanceof GeminiTextError) {
          status = error.status;
          quota = error.quota;
          return {
            ok: false,
            classification: error.classification,
            status: error.status,
          };
        }
        return { ok: false, classification: "unknown" };
      }
    },
    listModels: () => listGenerateContentModels({ apiKey }),
  });

  for (const message of report.messages) process.stdout.write(`[preflight] ${message}\n`);
  writeReport(reportPath, {
    model: configured,
    targets,
    ok: report.ok,
    classification: report.classification,
    status,
    requests,
    usage,
    quota,
  });
  if (report.ok) return;
  if (report.suggestions.length > 0) {
    process.stderr.write(
      `[preflight] 代替候補（自動切替しない）: ${report.suggestions.slice(0, 8).join(", ")}\n`,
    );
  }
  process.exitCode =
    report.classification === "billing" || report.classification === "rate-limit" ? 3 : 1;
}

main().catch((error) => {
  process.stderr.write(`[preflight] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(2);
});
