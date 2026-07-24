#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const WORKFLOW_ROOT = path.join(ROOT, ".github/workflows");
const isStrict = process.argv.includes("--strict");
const isJson = process.argv.includes("--json");

function workflowFiles() {
  return fs.readdirSync(WORKFLOW_ROOT)
    .filter((file) => /\.ya?ml$/.test(file))
    .map((file) => path.join(WORKFLOW_ROOT, file))
    .sort();
}

function hasSchedule(onValue) {
  return Boolean(onValue && typeof onValue === "object" && onValue.schedule);
}

function auditFile(file) {
  const relative = path.relative(ROOT, file).split(path.sep).join("/");
  const findings = [];
  const raw = fs.readFileSync(file, "utf8");
  let workflow;
  try {
    workflow = YAML.parse(raw);
  } catch (error) {
    return [{ code: "YAML_PARSE", file: relative, message: String(error) }];
  }

  // ARG_VECTOR_QUOTED: 文字列連結で組んだ引数列 (VAR="$VAR --x" / VAR="--x y" 初期化) を
  // コマンドに "$VAR" と quote 渡しすると全体が 1 トークン化して実行時に壊れる。
  // SC2086 対応の quote 一括追加で発生した実regression (2026-07-14 sync-snapshots)。
  // 可変引数列は bash 配列 (VAR+=(...) と "${VAR[@]}") で組むこと。
  const argVectorVars = new Set();
  // 行頭に限定しない ([ -n ... ] && VAR="$VAR --x" の形を取りこぼさない)
  for (const m of raw.matchAll(/\b([A-Z_][A-Z0-9_]*)="\$\1 /g)) argVectorVars.add(m[1]);
  for (const m of raw.matchAll(/\b([A-Z_][A-Z0-9_]*)="--\S+ /g)) argVectorVars.add(m[1]);
  // 空白区切りの **複数パス** を 1 変数に入れる形 (VAR="a/x.ts b/y.ts") も同じ罠。
  // git diff --quiet -- "$VAR" が「一致なし = 差分なし」で常に early exit し、
  // PR 作成ステップが永久に動かない状態になっていた (2026-07-24 sync-snapshots で実検出)。
  // 「/ を含むトークンが 2 つ以上」に限定して誤検知 (メッセージ文字列等) を避ける。
  for (const m of raw.matchAll(/\b([A-Z_][A-Z0-9_]*)="([^"$\n]+)"/g)) {
    const tokens = m[2].trim().split(/\s+/);
    if (tokens.length >= 2 && tokens.filter((t) => t.includes("/")).length >= 2) {
      argVectorVars.add(m[1]);
    }
  }
  const lines = raw.split("\n");
  for (const name of argVectorVars) {
    // git / bash / node 等どのコマンドでも 1 トークン化は同じように壊れる。
    // ただし次は意図的な使い方なので除外する (誤検知の実例):
    //   - `echo "$VAR" | xargs` — 文字列のまま渡して下流で単語分割させる
    //   - `VAR=$(...)` の右辺 / コメント行
    const marker = `"$${name}"`;
    const flagged = lines.some((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) return false;
      let at = line.indexOf(marker);
      while (at >= 0) {
        const before = line.slice(0, at);
        const after = line.slice(at + marker.length);
        // `VAR=$(echo "$VAR" | xargs)` / `if [ -z "$(echo "$VAR" ...)" ]` のように
        // 引用符・括弧・= が空白なしで前置するので、記号を区切りとして直前の語を取る
        const prevToken = before.split(/[^A-Za-z0-9_./-]+/).filter(Boolean).pop() ?? "";
        const isEchoArg = prevToken === "echo";
        const isAssignmentRhs = /(^|\s)[A-Z_][A-Z0-9_]*=\$?\($/.test(before.trimEnd());
        const isArgPosition = after === "" || /^[\s;)|&]/.test(after);
        if (!isEchoArg && !isAssignmentRhs && isArgPosition) return true;
        at = line.indexOf(marker, at + 1);
      }
      return false;
    });
    if (flagged) {
      findings.push({
        code: "ARG_VECTOR_QUOTED",
        file: relative,
        message: `${name} は複数トークンの引数列だが "$${name}" と単一引数で渡している (1トークン化) — bash 配列 ${name}=(...) と "\${${name}[@]}" に変える`,
      });
    }
  }
  const jobs = workflow?.jobs && typeof workflow.jobs === "object" ? workflow.jobs : {};
  const workflowPermissions = workflow?.permissions;

  if (!workflowPermissions && !Object.values(jobs).every((job) => job?.permissions)) {
    findings.push({
      code: "PERMISSIONS_IMPLICIT",
      file: relative,
      message: "workflow/job permissions are not explicit for every job",
    });
  }
  if (hasSchedule(workflow?.on) && !workflow?.concurrency) {
    findings.push({
      code: "SCHEDULE_NO_CONCURRENCY",
      file: relative,
      message: "scheduled workflow has no concurrency policy",
    });
  }
  for (const [jobId, job] of Object.entries(jobs)) {
    if (!job || typeof job !== "object") continue;
    if (!job["timeout-minutes"]) {
      findings.push({ code: "JOB_NO_TIMEOUT", file: relative, message: `job ${jobId} has no timeout-minutes` });
    }
    for (const step of job.steps || []) {
      if (!step?.uses || typeof step.uses !== "string") continue;
      if (step.uses.startsWith("./") || step.uses.startsWith("docker://")) continue;
      const revision = step.uses.split("@")[1] || "";
      if (!/^[0-9a-f]{40}$/.test(revision)) {
        findings.push({
          code: "ACTION_NOT_SHA_PINNED",
          file: relative,
          message: `${step.uses} is not pinned to a full commit SHA`,
        });
      }
    }
  }
  return findings;
}

const files = workflowFiles();
const findings = files.flatMap(auditFile);
const byCode = Object.fromEntries(
  [...new Set(findings.map((finding) => finding.code))]
    .sort()
    .map((code) => [code, findings.filter((finding) => finding.code === code).length]),
);
const output = { workflows: files.length, findings: findings.length, byCode, details: findings };

if (isJson) console.log(JSON.stringify(output, null, 2));
else {
  console.log(`workflow policy audit: ${output.workflows} workflows / ${output.findings} advisory findings`);
  for (const [code, count] of Object.entries(byCode)) console.log(`  ${code}: ${count}`);
  if (findings.length > 0) console.log("advisory only; run with --strict after remediation/baseline decision");
}
process.exit(isStrict && findings.length > 0 ? 1 : 0);
