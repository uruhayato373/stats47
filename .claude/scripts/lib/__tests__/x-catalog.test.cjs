"use strict";

/**
 * X の量産カタログ (投稿上限・テンプレ・相性・画像種) の正本が台帳 sns.x-catalog であることを固定する
 * (X-CATALOG-RULES-PARSE-01)。以前は .claude/rules/sns-content-standards.md の表をパースしていたので、
 * 文書の体裁を直すだけで投稿の上限やテンプレの割り付けが変わりえた。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const catalog = require("../x-catalog.cjs");
const { datasetPath } = require("../../../../config/datasets.mjs");

const ROOT = path.resolve(__dirname, "../../../..");
const RULE_PATH = path.join(ROOT, ".claude/rules/sns-content-standards.md");

function readLedger() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, datasetPath("sns.x-catalog")), "utf8"));
}

/** 台帳の写しを書き換えて一時ファイルに置き、その写しを読むカタログで fn を呼ぶ */
function withEditedLedger(edit, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "x-catalog-test-"));
  try {
    const doc = readLedger();
    edit(doc);
    const file = path.join(dir, "x-catalog.json");
    fs.writeFileSync(file, JSON.stringify(doc));
    return fn(catalog.createCatalog(file));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("読む先は台帳 sns.x-catalog で、返す値は台帳の中身と一致する", () => {
  const ledger = readLedger();
  assert.equal(catalog.CATALOG_PATH, path.join(ROOT, datasetPath("sns.x-catalog")));
  assert.deepEqual(catalog.getQuota(), ledger.quota);
  assert.deepEqual(
    catalog.getTemplates().map((t) => t.template),
    ledger.templates.map((t) => t.id),
  );
  assert.deepEqual(
    catalog.getImageKinds().map((k) => k.imageKind),
    ledger.imageKinds.map((k) => k.id),
  );
  assert.deepEqual(catalog.getAffinity(), ledger.affinity);
  assert.equal(catalog.selfCheck().ok, true);
});

test("台帳を書き換えると、上限・テンプレ・相性・画像種の出力が変わる", () => {
  withEditedLedger(
    (doc) => {
      doc.quota.dailyMax = 7;
      doc.templates[0].charMax = 99;
      doc.affinity.economy["結論"] = "△";
      doc.imageKinds[0].outPath = ".local/r2/sns/ranking/<key>/x/stills/changed.png";
    },
    (edited) => {
      const ledger = readLedger();
      assert.equal(edited.getQuota().dailyMax, 7);
      assert.equal(edited.getTemplate(ledger.templates[0].id).charMax, 99);
      assert.equal(edited.getAffinity().economy["結論"], "△");
      assert.equal(
        edited.getImageKind(ledger.imageKinds[0].id).outPath,
        ".local/r2/sns/ranking/<key>/x/stills/changed.png",
      );
    },
  );
});

test("rule の Markdown には機械が読む表を置かず、台帳の id を指す", () => {
  const rule = fs.readFileSync(RULE_PATH, "utf8");
  // アンカーが残っていると、表を直せば挙動が変わると読めてしまう。読む口も rule のパスを持たない
  assert.doesNotMatch(rule, /<!-- x-catalog:/);
  assert.match(rule, /sns\.x-catalog/);
  assert.equal("RULES_PATH" in catalog, false);
});

test("形の契約に合わない台帳は、既定値を返さず例外にする", () => {
  // 上限が欠けたまま読めると、頻度ガードの比較が常に偽になり、上限なしで通ってしまう
  withEditedLedger(
    (doc) => {
      delete doc.quota.dailyMax;
    },
    (edited) => assert.throws(() => edited.getQuota(), /dataset_shape_mismatch/),
  );
});

test("テンプレが台帳に無い画像種を指していたら selfCheck が止める", () => {
  withEditedLedger(
    (doc) => {
      doc.templates[0].imageKind = "no-such-kind";
    },
    (edited) => assert.throws(() => edited.selfCheck(), /no-such-kind/),
  );
});
