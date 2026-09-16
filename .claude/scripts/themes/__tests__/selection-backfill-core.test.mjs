// selection-backfill-core の契約テスト。`node --import tsx --test` で走らせる (TS の catalog を読むため)。
//   node --import tsx --test .claude/scripts/themes/__tests__/selection-backfill-core.test.mjs
//
// 固定したいこと:
//   1. gate は「捏造 (引用不在)・定型文・コード誤記・全基準列挙・対象外・重複」を落とし、通過分だけ返す
//   2. writer はインライン定義の selection だけを置換し、他のフィールド (role 等) を触らない
//   3. expanded.ts 由来は selection-evidence.ts の生成形式で読み書きできる (round-trip)
//   4. prompt に metric の事実 (statsDataId / cdCat01 / 分類名) と禁止定型文が載る
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applySelections,
  buildPrompt,
  gateEntries,
  htmlToText,
  listTargets,
  normalizeForQuote,
  patchInlineSelection,
  readEvidenceFile,
  serializeEvidenceFile,
} from "../selection-backfill-core.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const PAGE = `<html><head><meta charset="utf-8"><title>白書</title></head><body>
<script>var x = "秋田39.5%";</script>
<p>白書が地域比較の中心指標として<b>都道府県別の高齢化率</b>（秋田39.5%・東京22.7%）を掲げている。</p>
</body></html>`;

function fakeFetcher(map) {
  return async (url) => {
    const hit = map[url];
    if (!hit) return { ok: false, status: 404, finalUrl: url, contentType: "", isPdf: false, text: "" };
    if (hit === "pdf") return { ok: true, status: 200, finalUrl: url, contentType: "application/pdf", isPdf: true, text: null };
    if (hit.startsWith("pdf:")) return { ok: true, status: 200, finalUrl: url, contentType: "application/pdf", isPdf: true, text: hit.slice(4) };
    return { ok: true, status: 200, finalUrl: url, contentType: "text/html", isPdf: false, text: htmlToText(hit) };
  };
}

const target = {
  themeKey: "test-theme",
  themeTitle: "テスト",
  themeDescription: "説明",
  sections: [],
  evidenceQuestions: [],
  metrics: [
    {
      rankingKey: "ratio-65-plus",
      shortLabel: "高齢化率",
      role: "primary",
      currentSelection: null,
      facts: {
        rankingKey: "ratio-65-plus",
        title: "65歳以上人口割合",
        subtitle: "",
        description: "",
        unit: "％",
        years: "1980〜2023",
        source: { kind: "estat", displayName: "社会・人口統計体系", url: "https://www.stat.go.jp/x", statsDataId: "0000010201", cdCat01: "#A03503" },
        className: "#A03503_65歳以上人口割合",
      },
    },
    {
      rankingKey: "other-metric",
      shortLabel: "別指標",
      role: "secondary",
      currentSelection: null,
      facts: { rankingKey: "other-metric", title: "別", subtitle: "", description: "", unit: "", years: "不明", source: { kind: "external", displayName: "", url: "", statsDataId: "", cdCat01: "" }, className: "" },
    },
  ],
};

const GOOD = {
  rankingKey: "ratio-65-plus",
  proposedBy: "令和7年版 高齢社会白書 第1章第1節4",
  sourceUrl: "https://example.go.jp/whitepaper",
  sourceKind: "html",
  evidenceQuote: "白書が地域比較の中心指標として都道府県別の高齢化率（秋田39.5%・東京22.7%）を掲げている",
  rationale: "白書が地域比較の中心指標として都道府県別の高齢化率を掲げており、テーマの主問に直接答える見出し指標である。社会生活統計指標#A03503と定義が一致する。",
  adoptionCriteria: ["representativeness", "readerValue"],
  readerQuestion: "自分の県の高齢化率は全国のどの位置か。",
};

const classIndex = {
  resolve: (id, code) => (id === "0000010201" && code === "#A03503" ? { name: "#A03503_65歳以上人口割合" } : null),
};

describe("gateEntries", () => {
  const fetchSource = fakeFetcher({
    "https://example.go.jp/whitepaper": PAGE,
    "https://example.go.jp/report.pdf": "pdf",
    "https://example.go.jp/extracted.pdf": "pdf:調査対象︓全国 40 都道府県 678 市区町村\nやぐら型が６割以上を占める。",
  });

  it("引用が本文にある正しい entry を通し、surveyedAt はこちらの値で上書きする", async () => {
    const r = await gateEntries(target, { entries: [GOOD], skipped: [], roleRecommendations: [] }, { fetchSource, classIndex, surveyedAt: "2026-09-16" });
    assert.deepEqual(Object.keys(r.accepted), ["ratio-65-plus"]);
    assert.equal(r.accepted["ratio-65-plus"].surveyedAt, "2026-09-16");
    assert.deepEqual(r.accepted["ratio-65-plus"].adoptionCriteria, ["representativeness", "readerValue"]);
    assert.equal(r.checks[0].quote, "found");
    assert.deepEqual(r.untouched, ["other-metric"]);
  });

  it("捏造した引用 (本文に無い) は落とす", async () => {
    const r = await gateEntries(target, { entries: [{ ...GOOD, evidenceQuote: "この文章は白書に存在しない捏造である" }] }, { fetchSource, classIndex, surveyedAt: "2026-09-16" });
    assert.equal(Object.keys(r.accepted).length, 0);
    assert.ok(r.rejected[0].reasons.includes("quote-not-found"));
  });

  it("script タグの中身は本文として数えない (引用の実在は本文で判定)", async () => {
    const r = await gateEntries(target, { entries: [{ ...GOOD, evidenceQuote: 'var x = "秋田39.5%"' }] }, { fetchSource, classIndex, surveyedAt: "2026-09-16" });
    assert.ok(r.rejected[0].reasons.includes("quote-not-found"));
  });

  it("定型文・全基準列挙・コード誤記・対象外・重複・到達不能をそれぞれ理由付きで落とす", async () => {
    const output = {
      entries: [
        { ...GOOD, rationale: "高齢化率を都道府県別の実値として比較する。定型文だけで四十字を超えるように埋める文章である。" },
        { ...GOOD, adoptionCriteria: ["representativeness", "comparability", "complementarity", "dataQuality", "readerValue"] },
        { ...GOOD, rationale: `${GOOD.rationale.replace("#A03503", "#A03504")}` },
        { ...GOOD, rankingKey: "not-in-theme" },
        { ...GOOD, sourceUrl: "https://example.go.jp/missing" },
      ],
    };
    const r = await gateEntries(target, output, { fetchSource, classIndex, surveyedAt: "2026-09-16" });
    // 1 件目が ratio-65-plus を消費するので 2・3・5 件目は duplicate-entry。理由の種類を個別に確かめる
    assert.equal(Object.keys(r.accepted).length, 0);
    assert.ok(r.rejected[0].reasons.some((x) => x.startsWith("boilerplate:")));
    assert.ok(r.rejected.find((x) => x.rankingKey === "not-in-theme").reasons.includes("not-a-target"));
    const single = async (entry) => (await gateEntries(target, { entries: [entry] }, { fetchSource, classIndex, surveyedAt: "2026-09-16" })).rejected[0].reasons;
    assert.ok((await single(output.entries[1])).includes("criteria-all"));
    assert.ok((await single(output.entries[2])).some((x) => x.startsWith("code-mismatch:#A03504")));
    assert.ok((await single(output.entries[4])).some((x) => x.startsWith("url-unreachable:404")));
  });

  it("カタログに無いコードは code-not-in-catalog (config と一致していても)", async () => {
    const noHit = { resolve: () => null };
    const r = await gateEntries(target, { entries: [GOOD] }, { fetchSource, classIndex: noHit, surveyedAt: "2026-09-16" });
    assert.ok(r.rejected[0].reasons.includes("code-not-in-catalog:#A03503"));
  });

  it("PDF 本文が取れれば (pdftotext) 引用を照合し、無ければ found/not-found を判定する", async () => {
    const pdfEntry = { ...GOOD, sourceUrl: "https://example.go.jp/extracted.pdf", sourceKind: "pdf", rationale: GOOD.rationale.replace("#A03503", "") };
    const ok = await gateEntries(target, { entries: [{ ...pdfEntry, evidenceQuote: "調査対象：全国40都道府県678市区町村" }] }, { fetchSource, classIndex, surveyedAt: "2026-09-16" });
    assert.equal(ok.checks[0].quote, "found");
    const ng = await gateEntries(target, { entries: [{ ...pdfEntry, evidenceQuote: "この PDF には無い文章を捏造した" }] }, { fetchSource, classIndex, surveyedAt: "2026-09-16" });
    assert.ok(ng.rejected[0].reasons.includes("quote-not-found"));
  });

  it("PDF 本文が取れない環境 (pdftotext 無し) は到達性だけ見て引用照合を skip する", async () => {
    const r = await gateEntries(target, { entries: [{ ...GOOD, sourceUrl: "https://example.go.jp/report.pdf", sourceKind: "pdf", rationale: GOOD.rationale.replace("#A03503", "") }] }, { fetchSource, classIndex, surveyedAt: "2026-09-16" });
    assert.deepEqual(Object.keys(r.accepted), ["ratio-65-plus"]);
    assert.equal(r.checks[0].quote, "skipped-pdf");
  });

  it("role の推奨は返すが accepted には role を含めない (書かない契約)", async () => {
    const r = await gateEntries(
      target,
      { entries: [GOOD], roleRecommendations: [{ rankingKey: "ratio-65-plus", currentRole: "primary", suggestedRole: "secondary", reason: "x" }, { rankingKey: "ratio-65-plus", currentRole: "primary", suggestedRole: "primary", reason: "同じ" }] },
      { fetchSource, classIndex, surveyedAt: "2026-09-16" },
    );
    assert.equal(r.roleRecommendations.length, 1);
    assert.equal("role" in r.accepted["ratio-65-plus"], false);
  });
});

describe("normalizeForQuote", () => {
  it("空白・全角半角・引用符のゆれを畳む", () => {
    assert.equal(normalizeForQuote("秋田 39.5%・東京　22.7％"), normalizeForQuote("秋田39.5%東京22.7%"));
  });
});

const INLINE_FIXTURE = `import type { ThemeCatalog } from "./types";

export const TEST_CATALOG: ThemeCatalog = {
  "key": "test-theme",
  "metrics": [
    {
      "rankingKey": "ratio-65-plus",
      "shortLabel": "高齢化率",
      "role": "primary",
      "selection": {
        "proposedBy": "全テーマ構成監査",
        "surveyedAt": "2026-09-08",
        "rationale": "高齢化率は主問に直接答える見出し指標として残す。"
      }
    },
    {
      "rankingKey": "no-selection-yet",
      "shortLabel": "未記入",
      "role": "secondary"
    },
    {
      "rankingKey": "aging-index",
      "shortLabel": "老年化指数",
      "role": "context",
      "selection": { "proposedBy": "x", "surveyedAt": "2026-09-08", "rationale": "括弧 } を含む文字列 { でも壊れない" }
    }
  ],
  "charts": [],
  "rejectedCandidates": [{ "rankingKey": "zzz", "reason": "r" }]
};
`;

const SEL = {
  proposedBy: "令和7年版 高齢社会白書",
  sourceUrl: "https://example.go.jp/w",
  surveyedAt: "2026-09-16",
  rationale: "根拠",
  adoptionCriteria: ["representativeness"],
};

describe("patchInlineSelection", () => {
  it("該当 metric の selection だけを置換し、role / 他 metric / rejectedCandidates は不変", () => {
    const out = patchInlineSelection(INLINE_FIXTURE, "ratio-65-plus", SEL);
    assert.match(out, /"rankingKey": "ratio-65-plus",\n\s+"shortLabel": "高齢化率",\n\s+"role": "primary",\n\s+"selection": \{\n\s+"proposedBy": "令和7年版 高齢社会白書",\n\s+"sourceUrl"/);
    assert.ok(out.includes('"adoptionCriteria": ["representativeness"]'));
    assert.ok(!out.includes("全テーマ構成監査"));
    // 触っていない部分は byte 一致
    const tail = (s) => s.slice(s.indexOf('"rankingKey": "no-selection-yet"'));
    assert.equal(tail(out), tail(INLINE_FIXTURE));
    assert.equal(out.indexOf("rejectedCandidates") > 0, true);
  });

  it("selection が無い metric には role の直後に挿入する", () => {
    const out = patchInlineSelection(INLINE_FIXTURE, "no-selection-yet", SEL);
    assert.match(out, /"role": "secondary",\n\s+"selection": \{\n\s+"proposedBy": "令和7年版 高齢社会白書"/);
    assert.ok(out.includes('"rationale": "高齢化率は主問に直接答える見出し指標として残す。"'), "他 metric の selection は不変");
  });

  it("文字列内の括弧に惑わされず context 指標も置換できる", () => {
    const out = patchInlineSelection(INLINE_FIXTURE, "aging-index", SEL);
    assert.ok(!out.includes("括弧 } を含む"));
    assert.ok(out.includes('"rejectedCandidates": [{ "rankingKey": "zzz", "reason": "r" }]'));
  });

  it("存在しない rankingKey は null", () => {
    assert.equal(patchInlineSelection(INLINE_FIXTURE, "nope", SEL), null);
  });
});

describe("selection-evidence.ts の生成形式", () => {
  it("serialize → read で round-trip し、テーマ・キーは sort される", () => {
    const text = serializeEvidenceFile({ "b-theme": { "k2": SEL, "k1": { ...SEL, readerQuestion: "q" } }, "a-theme": { x: SEL } });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sel-ev-"));
    const file = path.join(dir, "selection-evidence.ts");
    fs.writeFileSync(file, text);
    const back = readEvidenceFile(file);
    assert.deepEqual(Object.keys(back), ["a-theme", "b-theme"]);
    assert.deepEqual(Object.keys(back["b-theme"]), ["k1", "k2"]);
    assert.equal(back["b-theme"].k1.readerQuestion, "q");
    assert.ok(text.startsWith('import type { MetricSelection } from "./types";'));
  });

  it("applySelections はインラインがあれば <theme>.ts、無ければ selection-evidence.ts に振り分ける", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sel-apply-"));
    fs.writeFileSync(path.join(dir, "test-theme.ts"), INLINE_FIXTURE);
    fs.writeFileSync(path.join(dir, "selection-evidence.ts"), serializeEvidenceFile({}));
    const written = applySelections("test-theme", { "ratio-65-plus": SEL, "from-expanded-tuple": SEL }, { catalogDir: dir });
    assert.deepEqual(written, { inline: ["ratio-65-plus"], evidence: ["from-expanded-tuple"] });
    assert.ok(fs.readFileSync(path.join(dir, "test-theme.ts"), "utf8").includes("令和7年版 高齢社会白書"));
    assert.deepEqual(Object.keys(readEvidenceFile(path.join(dir, "selection-evidence.ts"))["test-theme"]), ["from-expanded-tuple"]);
  });

  it("dryRun は書かない", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sel-dry-"));
    fs.writeFileSync(path.join(dir, "test-theme.ts"), INLINE_FIXTURE);
    applySelections("test-theme", { "ratio-65-plus": SEL }, { catalogDir: dir, dryRun: true });
    assert.equal(fs.readFileSync(path.join(dir, "test-theme.ts"), "utf8"), INLINE_FIXTURE);
    assert.equal(fs.existsSync(path.join(dir, "selection-evidence.ts")), false);
  });
});

describe("buildPrompt / listTargets", () => {
  it("prompt に metric の事実・分類名・禁止定型文・調査日が載る", () => {
    const p = buildPrompt(target, { surveyedAt: "2026-09-16" });
    for (const s of ["0000010201", "#A03503", "#A03503_65歳以上人口割合", "詳細索引に保持し", "2026-09-16", "roleRecommendations", "<task>", "<output_format>"]) {
      assert.ok(p.includes(s), `prompt に ${s} が無い`);
    }
  });

  it("実カタログの対象は context を含まず、adoptionCriteria 済みを含まない", () => {
    const targets = listTargets();
    assert.ok(targets.length > 0);
    for (const t of targets) {
      for (const m of t.metrics) {
        assert.notEqual(m.role, "context");
        assert.ok(!m.currentSelection?.adoptionCriteria?.length);
      }
    }
    // aging-society は 2026-09-16 に全件記入済み
    assert.equal(targets.find((t) => t.themeKey === "aging-society"), undefined);
  });
});
