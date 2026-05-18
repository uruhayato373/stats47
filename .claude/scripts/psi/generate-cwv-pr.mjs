#!/usr/bin/env node
/**
 * PSI 違反 URL → LCP 改修案 PR 自動起票 CLI (Phase 3 sprint 5)
 *
 * Flow:
 *   1. suggest-cwv-candidates.mjs --url X --format json --max 3 を呼ぶ
 *   2. 「dynamic import」hint を持つ候補を優先採用 (なければ先頭)
 *   3. ANTHROPIC_API_KEY チェック → 無ければ prompt 構築のみ表示
 *   4. Anthropic SDK で Claude API 呼び出し (unified diff 形式の改修案)
 *   5. --dry-run: stdout に diff 表示 / --execute: branch+commit+gh pr create --draft
 *
 * Usage:
 *   node .claude/scripts/psi/generate-cwv-pr.mjs --url https://stats47.jp/... --dry-run
 *   node .claude/scripts/psi/generate-cwv-pr.mjs --url https://stats47.jp/... --execute
 *
 * scope: LCP / dynamic import のみ。CLS/FCP は次フェーズ。
 *        起票 PR は draft 必須 (LLM 改修案の正確性保証なし、人手レビュー必須)。
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

// -------- arg parse --------
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const URL_ARG = getArg("--url");
const DRY_RUN = !args.includes("--execute");
const MAX_TOKENS = Number(getArg("--max-tokens") || 2000);
const MODEL = getArg("--model") || "claude-sonnet-4-6";

if (!URL_ARG) {
  console.error(
    "Usage: --url <URL> [--dry-run|--execute] [--max-tokens 2000] [--model claude-sonnet-4-6]"
  );
  process.exit(1);
}

const log = (...a) => console.log(...a);
const warn = (...a) => console.warn(...a);

// -------- 1. suggest-cwv-candidates 呼び出し --------
log(`[1/5] suggest-cwv-candidates --url ${URL_ARG} --format json --max 3`);
const suggestScript = path.join(__dirname, "suggest-cwv-candidates.mjs");
const suggestRes = spawnSync(
  "node",
  [suggestScript, "--url", URL_ARG, "--format", "json", "--max", "3"],
  { cwd: PROJECT_ROOT, encoding: "utf8" }
);
if (suggestRes.status !== 0) {
  console.error("suggest-cwv-candidates failed:", suggestRes.stderr);
  process.exit(1);
}

let candidatesJson;
try {
  candidatesJson = JSON.parse(suggestRes.stdout);
} catch (e) {
  console.error("Failed to parse candidates JSON:", e.message);
  console.error("Raw output:", suggestRes.stdout.slice(0, 500));
  process.exit(1);
}

const entry = candidatesJson[0];
if (!entry || !entry.candidates || entry.candidates.length === 0) {
  console.error("No candidates found for URL:", URL_ARG);
  process.exit(1);
}
log(`[1/5] -> 候補 ${entry.candidates.length} 件取得 (totalFound=${entry.totalFound})`);

// -------- 2. 候補選定: dynamic import hint 優先、なければ先頭 --------
const picked =
  entry.candidates.find((c) => /dynamic import/i.test(c.hint || "")) ||
  entry.candidates[0];
log(`[2/5] 採用候補: ${picked.file} (hint: ${picked.hint})`);

// -------- 3. 候補ファイル読み込み --------
const targetAbs = path.join(PROJECT_ROOT, picked.file);
let fileBody;
try {
  fileBody = readFileSync(targetAbs, "utf8");
} catch (e) {
  console.error(`Failed to read ${picked.file}:`, e.message);
  process.exit(1);
}
log(`[3/5] ファイル読み込み完了 (${fileBody.split("\n").length} lines, ${fileBody.length} chars)`);

// -------- 4. prompt 構築 --------
const systemPrompt = `あなたは Next.js (App Router) + Cloudflare Pages 環境の LCP 改善エキスパートです。
以下のコンポーネントに対し、LCP < 3.5s (mobile) を達成するための改修案を unified diff 形式 (\`diff --git a/...\` から始まる形式) で提案してください。

採用してよい技術:
- next/dynamic + ssr: false で重い子コンポーネントを遅延ロード
- skeleton placeholder で CLS を 0 に保つ
- import { Suspense } によるストリーミング
- 画像は next/image + priority / sizes
- d3 / leaflet / chart 系は必ず dynamic import

NG:
- CSS-in-JS 追加 (バンドル肥大)
- アーキテクチャ大幅変更 (server→client 切替等)
- 既存 props 互換性破壊

出力は \`\`\`diff ... \`\`\` の 1 ブロックのみ。説明文は前後に書かない。`;

const userPrompt = `URL: ${URL_ARG}
改修対象ファイル: ${picked.file}
過去施策ヒント: ${picked.hint}

---
\`\`\`tsx
${fileBody}
\`\`\`
---

LCP 改善目標: mobile < 3.5s。上記コンポーネントに対する unified diff を提示してください。`;

log(`[4/5] prompt 構築完了 (system: ${systemPrompt.length} chars, user: ${userPrompt.length} chars)`);

// -------- 5. ANTHROPIC_API_KEY チェック --------
if (!process.env.ANTHROPIC_API_KEY) {
  log("");
  log("[skip] ANTHROPIC_API_KEY not set, 構築した prompt を表示:");
  log("=".repeat(60));
  log("--- SYSTEM PROMPT ---");
  log(systemPrompt);
  log("");
  log("--- USER PROMPT (head 800 chars) ---");
  log(userPrompt.slice(0, 800) + (userPrompt.length > 800 ? "\n... (truncated)" : ""));
  log("=".repeat(60));
  log(`[skip] 実 API 呼び出しは ANTHROPIC_API_KEY を設定後に再実行してください`);
  log(`[skip] model=${MODEL} max_tokens=${MAX_TOKENS} dry_run=${DRY_RUN}`);
  process.exit(0);
}

// -------- 6. Anthropic SDK 動的 import (未 install なら警告) --------
let Anthropic;
try {
  const mod = await import("@anthropic-ai/sdk");
  Anthropic = mod.default;
} catch (e) {
  warn("[warn] @anthropic-ai/sdk 未インストール。npm i @anthropic-ai/sdk で導入してください");
  warn("[warn] 本セッションでは prompt 構築のみで終了します");
  process.exit(0);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

log(`[5/5] Claude API 呼び出し (model=${MODEL}, max_tokens=${MAX_TOKENS})`);
const response = await client.messages.create({
  model: MODEL,
  max_tokens: MAX_TOKENS,
  system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: userPrompt }],
});

const responseText = response.content
  .filter((b) => b.type === "text")
  .map((b) => b.text)
  .join("\n");

// -------- diff 抽出 --------
const diffMatch = responseText.match(/```diff\n([\s\S]*?)```/);
const diff = diffMatch ? diffMatch[1] : responseText;
log("");
log("--- Claude 改修案 (unified diff) ---");
log(diff);
log("--- end of diff ---");

if (DRY_RUN) {
  log("");
  log("[dry-run] PR 起票はスキップ。--execute で実行してください");
  process.exit(0);
}

// -------- 7. branch + commit + PR --------
const today = new Date().toISOString().slice(0, 10);
const slug = (entry.pathname || "/")
  .replace(/^\/+|\/+$/g, "")
  .replace(/\//g, "-")
  .replace(/[^a-z0-9-]/gi, "-")
  .toLowerCase() || "root";
const branchName = `feature/cwv-auto-${today}-${slug}`;

log(`[exec] git checkout -b ${branchName}`);
execSync(`git checkout -b ${branchName}`, { cwd: PROJECT_ROOT, stdio: "inherit" });

// diff 適用試行 (失敗時はファイル全体上書きは行わず error 報告)
const diffFile = path.join(PROJECT_ROOT, ".tmp-cwv.diff");
writeFileSync(diffFile, diff);
const applyCheck = spawnSync("git", ["apply", "--check", diffFile], {
  cwd: PROJECT_ROOT,
  encoding: "utf8",
});
if (applyCheck.status !== 0) {
  warn("[warn] git apply --check 失敗:", applyCheck.stderr);
  warn("[warn] diff を PR description に貼り付けるのみ (ファイル変更なし)");
} else {
  execSync(`git apply ${diffFile}`, { cwd: PROJECT_ROOT, stdio: "inherit" });
  execSync(`git add ${picked.file}`, { cwd: PROJECT_ROOT, stdio: "inherit" });
}
execSync(`rm -f ${diffFile}`, { cwd: PROJECT_ROOT });

const commitMsg = `feat(cwv): [auto] LCP 改修案 for ${entry.pathname}\n\n対象: ${picked.file}\nURL: ${URL_ARG}\nhint: ${picked.hint}\n\n[skip ci] auto-generated`;
try {
  execSync(`git commit -m ${JSON.stringify(commitMsg)} --allow-empty`, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
} catch (e) {
  warn("[warn] commit failed (probably nothing staged), continuing with empty commit");
}

log(`[exec] git push -u origin ${branchName}`);
execSync(`git push -u origin ${branchName}`, { cwd: PROJECT_ROOT, stdio: "inherit" });

const prBody = `## Auto-generated CWV improvement PR

**警告**: この PR は LLM (${MODEL}) が自動生成しました。merge 前に人手レビュー必須。

- **URL**: ${URL_ARG}
- **対象ファイル**: \`${picked.file}\`
- **過去施策ヒント**: ${picked.hint}
- **目標**: LCP < 3.5s (mobile)

### 改修案 (Claude 出力)

\`\`\`diff
${diff.slice(0, 3000)}${diff.length > 3000 ? "\n... (truncated)" : ""}
\`\`\`

### レビュー観点

- [ ] diff が意図通り apply されている
- [ ] dynamic import の skeleton が適切
- [ ] 既存 props 互換性が維持されている
- [ ] PSI で LCP 改善を実測 (mobile < 3.5s)

🤖 Generated by \`.claude/scripts/psi/generate-cwv-pr.mjs\``;

const prBodyFile = path.join(PROJECT_ROOT, ".tmp-pr-body.md");
writeFileSync(prBodyFile, prBody);
log(`[exec] gh pr create --draft --label cwv-auto --base develop`);
execSync(
  `gh pr create --draft --label cwv-auto --base develop --title ${JSON.stringify(
    `feat(cwv): [auto] LCP 改修案 for ${entry.pathname}`
  )} --body-file ${prBodyFile}`,
  { cwd: PROJECT_ROOT, stdio: "inherit" }
);
execSync(`rm -f ${prBodyFile}`, { cwd: PROJECT_ROOT });
log("[done] PR 起票完了");
