import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";

import { extractDomSize } from "../fetch-psi-audit.mjs";

/**
 * PSI batch へ DOM 規模を保存する契約。
 *
 * 経緯: PERF-AREA-DOM-01 の完了条件が「DOM 9,101 から 70% 以上削減」だったのに、
 * PSI batch は LCP_ms / TBT_ms / CLS / FCP_ms / TTI_ms / SI_ms / TTFB_ms しか
 * 保存しておらず、この値をどの自動パイプラインでも検証できなかった (2026-08-05)。
 *
 * 2026-09-07: 保存を足したのに **実データでは一度も値が入っていなかった**
 * (2026-08-05〜09-06 の 37 batch すべてで dom_size:null)。下の 2 つの合成検体は
 * どちらも旧 `dom-size` 形状で、実際の PSI が返す insights モードの形 (dom-size が
 * 無く dom-size-insight がある) を一度も通していなかったため、テストは全 PASS の
 * まま欠陥を保護していた。実形状の fixture を下に追加してある。
 *
 * 削除条件: 旧 dom-size 形状の検体 2 つ (MODERN / LEGACY) と extractDomSize の
 * dom-size fallback は、実 batch で dom-size-insight から値が入ることを確認し、
 * かつ fallback が使われた batch が 1 つも無いと言えた時点でまとめて削除する。
 */

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const readFixture = (name) =>
  JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf-8"));

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

// --- 実形状 (PSI insights モード) ---------------------------------------
// この節が本命。上の合成テストは全 PASS のまま 1 か月欠測を通していた。

test("実形状: insights モードの dom-size-insight から 3 値すべてを取る", () => {
  const { audits } = readFixture("psi-audits-insights-v13.json");

  assert.deepEqual(extractDomSize(audits), {
    total_elements: 3120,
    max_depth: 21,
    max_child_elements: 178,
  });
});

test("実形状: fixture には dom-size が無い (旧 id 固定だと必ず null になる)", () => {
  const { audits } = readFixture("psi-audits-insights-v13.json");

  // fixture の前提そのものを固定する。ここが崩れると上のテストが
  // 「旧 id でも通る」形になり、回帰を検出できなくなる。
  assert.equal(audits["dom-size"], undefined);
  assert.ok(audits["dom-size-insight"], "dom-size-insight があること");

  // 是正前の実装と同じ参照。実データでは必ず undefined だった。
  assert.equal(extractDomSize({ "dom-size": audits["dom-size"] }), null);
});

test("実形状: insight のラベルで depth / child を引ける", () => {
  // numericValue が無くても statistic ラベルから拾えること。
  // insight 版のラベルは旧版と別表記なので、旧表記だけに一致させると取れない。
  const audits = {
    "dom-size-insight": {
      details: {
        items: [
          { statistic: "Total elements", value: { type: "numeric", value: 3120 } },
          { statistic: "DOM depth", value: { type: "numeric", value: 21 } },
          { statistic: "Most children", value: { type: "numeric", value: 178 } },
        ],
      },
    },
  };

  assert.deepEqual(extractDomSize(audits), {
    total_elements: 3120,
    max_depth: 21,
    max_child_elements: 178,
  });
});

test("insight audit が値を返さなかったら null (全 null オブジェクトを作らない)", () => {
  // maxDepth / maxChildren が取れないと insight は details も numericValue も返さない。
  // 全 null のオブジェクトを返すと「計測できている」ように見えるため null に倒す。
  assert.equal(extractDomSize({ "dom-size-insight": { score: null } }), null);
  assert.equal(
    extractDomSize({ "dom-size-insight": { details: { items: [] } } }),
    null,
  );
});
