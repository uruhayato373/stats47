/**
 * 保存済み計測結果 (AuditRun JSON) のschema検証。
 *
 * Usage:
 *   tsx .claude/scripts/page-quality/validate-schema.ts [path]
 *   (省略時は .claude/state/metrics/page-quality/latest.json)
 *
 * Exit code: 0 = valid / 1 = invalid
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { AuditRun, PageAuditResult, Violation } from "./types";
import { LATEST_JSON } from "./lib/storage";

export interface ValidationError {
  path: string;
  message: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function validateResult(r: unknown, index: number, errors: ValidationError[]): void {
  const prefix = `results[${index}]`;
  if (!isRecord(r)) {
    errors.push({ path: prefix, message: "not an object" });
    return;
  }
  const result = r as Partial<PageAuditResult>;
  if (typeof result.url !== "string") errors.push({ path: `${prefix}.url`, message: "must be string" });
  if (typeof result.path !== "string") errors.push({ path: `${prefix}.path`, message: "must be string" });
  if (typeof result.template !== "string") errors.push({ path: `${prefix}.template`, message: "must be string" });
  if (result.http_status !== null && typeof result.http_status !== "number") {
    errors.push({ path: `${prefix}.http_status`, message: "must be number or null" });
  }
  if (typeof result.fetched_at !== "string") errors.push({ path: `${prefix}.fetched_at`, message: "must be ISO string" });
  if (typeof result.expected_redirect_or_gone !== "boolean") {
    errors.push({ path: `${prefix}.expected_redirect_or_gone`, message: "must be boolean" });
  }
  if (result.error !== null && typeof result.error !== "string") {
    errors.push({ path: `${prefix}.error`, message: "must be string or null" });
  }
  if (!isRecord(result.metrics)) errors.push({ path: `${prefix}.metrics`, message: "must be object" });
  else {
    for (const [key, value] of Object.entries(result.metrics)) {
      const ok =
        typeof value === "number" ||
        typeof value === "boolean" ||
        (isRecord(value) && value.value === null && typeof value.reason === "string");
      if (!ok) errors.push({ path: `${prefix}.metrics.${key}`, message: "must be number, boolean, or {value:null,reason}" });
    }
  }
}

function validateViolation(v: unknown, index: number, errors: ValidationError[]): void {
  const prefix = `violations[${index}]`;
  if (!isRecord(v)) {
    errors.push({ path: prefix, message: "not an object" });
    return;
  }
  const violation = v as Partial<Violation>;
  if (typeof violation.url !== "string") errors.push({ path: `${prefix}.url`, message: "must be string" });
  if (typeof violation.metric_key !== "string") errors.push({ path: `${prefix}.metric_key`, message: "must be string" });
  if (violation.severity !== "error" && violation.severity !== "warning") {
    errors.push({ path: `${prefix}.severity`, message: "must be error|warning" });
  }
  if (typeof violation.actual !== "number") errors.push({ path: `${prefix}.actual`, message: "must be number" });
}

export function validateAuditRun(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isRecord(data)) return [{ path: "$", message: "not an object" }];
  const run = data as Partial<AuditRun>;

  if (run.schemaVersion !== 1) errors.push({ path: "schemaVersion", message: "must be 1" });
  if (run.mode !== "representative" && run.mode !== "full") {
    errors.push({ path: "mode", message: "must be representative|full" });
  }
  if (typeof run.generated_at !== "string") errors.push({ path: "generated_at", message: "must be ISO string" });
  if (!Array.isArray(run.results)) errors.push({ path: "results", message: "must be array" });
  else run.results.forEach((r, i) => validateResult(r, i, errors));
  if (!Array.isArray(run.violations)) errors.push({ path: "violations", message: "must be array" });
  else run.violations.forEach((v, i) => validateViolation(v, i, errors));

  return errors;
}

function main() {
  const path = process.argv[2] ?? LATEST_JSON;
  const data = JSON.parse(readFileSync(path, "utf-8"));
  const errors = validateAuditRun(data);
  if (errors.length === 0) {
    console.log(`[page-quality] ✓ ${path} はschemaに適合`);
    process.exit(0);
  }
  console.error(`[page-quality] ✗ ${path} はschema不正 (${errors.length}件):`);
  for (const e of errors) console.error(`  ${e.path}: ${e.message}`);
  process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
