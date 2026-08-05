import assert from "node:assert/strict";
import test from "node:test";

import { extractDomSize } from "../fetch-psi-audit.mjs";

/**
 * PSI batch へ DOM 規模を保存する契約。
 *
 * 経緯: PERF-AREA-DOM-01 の完了条件が「DOM 9,101 から 70% 以上削減」だったのに、
 * PSI batch は LCP_ms / TBT_ms / CLS / FCP_ms / TTI_ms / SI_ms / TTFB_ms しか
 * 保存しておらず、この値をどの自動パイプラインでも検証できなかった (2026-08-05)。
 */

// Lighthouse 10+ の形
const MODERN = {
  "dom-size": {
    numericValue: 9101,
    details: {
      items: [
        { statistic: "Total DOM Elements", value: { type: "numeric", value: 9101 } },
        { statistic: "Maximum DOM Depth", value: { type: "numeric", value: 18 } },
        { statistic: "Maximum Child Elements", value: { type: "numeric", value: 873 } },
      ],
    },
  },
};

// 旧 Lighthouse は value が素の数値
const LEGACY = {
  "dom-size": {
    numericValue: 1606,
    details: {
      items: [
        { statistic: "Total DOM Elements", value: 1606 },
        { statistic: "Maximum DOM Depth", value: 14 },
        { statistic: "Maximum Child Elements", value: 24 },
      ],
    },
  },
};

test("Lighthouse 10+ の dom-size を読む", () => {
  assert.deepEqual(extractDomSize(MODERN), {
    total_elements: 9101,
    max_depth: 18,
    max_child_elements: 873,
  });
});

test("value が素の数値の旧形式も読む", () => {
  assert.deepEqual(extractDomSize(LEGACY), {
    total_elements: 1606,
    max_depth: 14,
    max_child_elements: 24,
  });
});

test("audit が無ければ null を返す (欠測を 0 と誤らせない)", () => {
  assert.equal(extractDomSize({}), null);
  assert.equal(extractDomSize(undefined), null);
});

test("details が欠けても numericValue から総数を拾う", () => {
  const audits = { "dom-size": { numericValue: 500 } };
  assert.deepEqual(extractDomSize(audits), {
    total_elements: 500,
    max_depth: null,
    max_child_elements: null,
  });
});

test("統計項目が欠けている場合は 0 ではなく null にする", () => {
  const audits = {
    "dom-size": {
      details: { items: [{ statistic: "Total DOM Elements", value: 42 }] },
    },
  };
  assert.deepEqual(extractDomSize(audits), {
    total_elements: 42,
    max_depth: null,
    max_child_elements: null,
  });
});
