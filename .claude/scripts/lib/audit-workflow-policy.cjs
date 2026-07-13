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
  let workflow;
  try {
    workflow = YAML.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return [{ code: "YAML_PARSE", file: relative, message: String(error) }];
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
