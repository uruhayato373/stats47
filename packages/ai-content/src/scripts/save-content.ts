#!/usr/bin/env tsx
/**
 * Gemini CLI が生成した AI コンテンツを DB に保存する。
 *
 * Usage:
 *   echo '<json>' | npx tsx packages/ai-content/src/scripts/save-content.ts \
 *     --key <rankingKey> --year <yearCode>
 *
 * stdin: Claude が生成した JSON（{ faq, regionalAnalysis, insights }）
 */

import "dotenv/config";
import { upsertRankingAiContent } from "../repositories/upsert-ranking-ai-content";
import type { FaqContent } from "../types";

const AREA_TYPE = "prefecture";
const PROMPT_VERSION = "1.0.0";

function parseArgs(): { key: string; year: string; model: string } {
  const argv = process.argv.slice(2);
  let key = "";
  let year = "";
  let model = "gemini";

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--key" && argv[i + 1]) key = argv[++i];
    else if (argv[i] === "--year" && argv[i + 1]) year = argv[++i];
    else if (argv[i] === "--model" && argv[i + 1]) model = argv[++i];
  }

  if (!key || !year) {
    process.stderr.write("Error: --key and --year are required\n");
    process.exit(1);
  }

  return { key, year, model };
}

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  return match ? match[1].trim() : text.trim();
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data.trim()));
    process.stdin.on("error", reject);
  });
}

async function main() {
  const { key, year, model } = parseArgs();

  const raw = await readStdin();
  if (!raw) {
    process.stderr.write("Error: No JSON received from stdin\n");
    process.exit(1);
  }

  const stripped = stripCodeFence(raw);

  let parsed: { faq?: FaqContent; regionalAnalysis?: string; insights?: string };
  try {
    parsed = JSON.parse(stripped);
  } catch {
    process.stderr.write("Error: Failed to parse JSON from stdin\n");
    process.stderr.write(stripped.slice(0, 300) + "\n");
    process.exit(1);
  }

  await upsertRankingAiContent({
    rankingKey: key,
    areaType: AREA_TYPE,
    faq: parsed.faq ? JSON.stringify(parsed.faq) : null,
    regionalAnalysis: parsed.regionalAnalysis ?? null,
    insights: parsed.insights ?? null,
    yearCode: year,
    aiModel: model,
    promptVersion: PROMPT_VERSION,
    generatedAt: new Date().toISOString(),
    isActive: true,
  });

  process.stdout.write(`[OK] Saved AI content for ${key} (${year})\n`);
}

main().catch((e) => {
  process.stderr.write(`Error: ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
