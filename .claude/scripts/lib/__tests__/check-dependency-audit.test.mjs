import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { EXCEPTIONS_PATH, evaluateAudit } from "../check-dependency-audit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const BRACES = "GHSA-vfj7-8cjw-p6xm";

// npm audit --json の形 (via は advisory か、上流の依存名)
const advisory = (id, severity = "high") => ({ source: 1, url: `https://github.com/advisories/${id}`, severity });
const devChain = {
  vulnerabilities: {
    braces: { severity: "high", via: [advisory(BRACES)] },
    micromatch: { severity: "high", via: ["braces"] },
    "fast-glob": { severity: "high", via: ["micromatch"] },
  },
};
const noRuntime = { vulnerabilities: {} };
const exception = { id: BRACES, scope: "dev", reason: "修正版なし・dev のみ", expiresAt: "2027-01-10" };

test("例外の advisory と、それだけに由来する派生の行は通す", () => {
  const r = evaluateAudit({ all: devChain, runtime: noRuntime, exceptions: [exception], today: "2026-10-10" });
  assert.deepEqual(r.blocking, []);
  assert.deepEqual(r.errors, []);
  assert.equal(r.excepted.length, 3);
});

test("例外が無ければ dev 依存の high も止める", () => {
  const r = evaluateAudit({ all: devChain, runtime: noRuntime, exceptions: [], today: "2026-10-10" });
  assert.equal(r.blocking.length, 3);
});

test("例外の無い別の advisory が同じ行に混ざれば止める", () => {
  const all = { vulnerabilities: { ...devChain.vulnerabilities, micromatch: { severity: "high", via: ["braces", advisory("GHSA-aaaa-bbbb-cccc")] } } };
  const r = evaluateAudit({ all, runtime: noRuntime, exceptions: [exception], today: "2026-10-10" });
  assert.ok(r.blocking.some((line) => line.startsWith("micromatch")));
});

test("例外の advisory が runtime 依存に現れたら失敗する (runtime は例外にしない)", () => {
  const r = evaluateAudit({ all: devChain, runtime: devChain, exceptions: [exception], today: "2026-10-10" });
  assert.ok(r.errors.some((e) => e.includes("runtime")));
  assert.equal(r.blocking.length, 3);
});

test("期限を過ぎた例外・scope が dev でない例外・理由の無い例外は失敗する", () => {
  const expired = evaluateAudit({ all: devChain, runtime: noRuntime, exceptions: [exception], today: "2027-01-11" });
  assert.ok(expired.errors.some((e) => e.includes("期限")));
  assert.equal(expired.blocking.length, 3);
  for (const bad of [{ ...exception, scope: "runtime" }, { ...exception, reason: "" }, { ...exception, expiresAt: undefined }]) {
    const r = evaluateAudit({ all: devChain, runtime: noRuntime, exceptions: [bad], today: "2026-10-10" });
    assert.equal(r.errors.length, 1);
    assert.equal(r.blocking.length, 3);
  }
});

test("moderate 以下はこのゲートの対象外 (runtime 全件ゲートは別 step)", () => {
  const all = { vulnerabilities: { x: { severity: "moderate", via: [advisory("GHSA-aaaa-bbbb-cccc", "moderate")] } } };
  assert.deepEqual(evaluateAudit({ all, runtime: noRuntime, exceptions: [], today: "2026-10-10" }).blocking, []);
});

test("本物の例外台帳: dev のみ・理由あり・期限は決めた日から 6 か月以内", () => {
  const { exceptions } = JSON.parse(readFileSync(join(ROOT, EXCEPTIONS_PATH), "utf8"));
  assert.ok(exceptions.length > 0);
  for (const e of exceptions) {
    assert.equal(e.scope, "dev", e.id);
    assert.ok(e.reason && e.reason.length >= 20, `${e.id} の理由が短い`);
    const days = (Date.parse(e.expiresAt) - Date.parse(e.decidedAt)) / 86_400_000;
    assert.ok(days > 0 && days <= 183, `${e.id} の期限が長すぎる (${days} 日)。再評価日を 6 か月以内に置く`);
  }
});
