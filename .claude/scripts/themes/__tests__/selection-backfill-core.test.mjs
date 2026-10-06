// selection-backfill-core の契約テスト。`node --import tsx --test` で走らせる (TS の catalog を読むため)。
//   node --import tsx --test .claude/scripts/themes/__tests__/selection-backfill-core.test.mjs
//
// 固定したいこと:
//   1. gate は「捏造 (引用不在)・定型文・コード誤記・全基準列挙・対象外・重複」を落とし、通過分だけ返す
//   2. writer は data/themes/catalogs/<theme>.json の該当指標の selection だけを書き、他のフィールド (role 等) を触らない
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
  quoteMatch,
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

describe("quoteMatch / htmlToText", () => {
  it("数値実体参照 (&#8594; 等) を復号する", () => {
    assert.equal(htmlToText("<p>平成22年&#8594;令和元年 &#x2192; &amp;</p>").trim(), "平成22年→令和元年 → &");
  });

  it("文の一部を省いた抜粋は 12 文字以上の連続一致なら found-partial、短い断片や無関係は not-found", () => {
    const text = normalizeForQuote("主たる診療科が「13小児科」と「31産婦人科」「32産科」及び「外科※」の医師数をみると、「13小児科」は18,009人となっており");
    assert.equal(quoteMatch(text, normalizeForQuote("「13小児科」は18,009人となっており")), "found");
    assert.equal(quoteMatch(text, normalizeForQuote("主たる診療科が「13小児科」の医師数は18,009人となっており、前年より増えている")), "found-partial");
    assert.equal(quoteMatch(text, normalizeForQuote("小児科の医師数は18,009人")), "not-found");
    assert.equal(quoteMatch(text, normalizeForQuote("この文章は資料に存在しない捏造であり、十二文字以上の長さを持っている。")), "not-found");
  });
});

describe("normalizeForQuote", () => {
  it("空白・全角半角・引用符のゆれを畳む", () => {
    assert.equal(normalizeForQuote("秋田 39.5%・東京　22.7％"), normalizeForQuote("秋田39.5%東京22.7%"));
  });
});

// data/themes/catalogs/<theme>.json と同じ形 (2 スペース・末尾改行)
const THEME_FIXTURE = {
  key: "test-theme",
  metrics: [
    {
      rankingKey: "ratio-65-plus",
      shortLabel: "高齢化率",
      role: "primary",
      selection: {
        proposedBy: "全テーマ構成監査",
        surveyedAt: "2026-09-08",
        rationale: "高齢化率は主問に直接答える見出し指標として残す。",
      },
    },
    { rankingKey: "no-selection-yet", shortLabel: "未記入", role: "secondary" },
    { rankingKey: "aging-index", shortLabel: "老年化指数", role: "context" },
  ],
  charts: [],
  rejectedCandidates: [{ rankingKey: "zzz", reason: "r" }],
};

function writeFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sel-apply-"));
  fs.writeFileSync(path.join(dir, "test-theme.json"), `${JSON.stringify(THEME_FIXTURE, null, 2)}\n`);
  return dir;
}

const SEL = {
  proposedBy: "令和7年版 高齢社会白書",
  sourceUrl: "https://example.go.jp/w",
  surveyedAt: "2026-09-16",
  rationale: "根拠",
  adoptionCriteria: ["representativeness"],
};

describe("applySelections (data/themes/catalogs の JSON へ書く)", () => {
  it("該当指標の selection だけを置換し、role・他の指標・rejectedCandidates は変えない", () => {
    const dir = writeFixture();
    const written = applySelections("test-theme", { "ratio-65-plus": SEL }, { themesDir: dir });
    assert.deepEqual(written, ["ratio-65-plus"]);
    const raw = fs.readFileSync(path.join(dir, "test-theme.json"), "utf8");
    const out = JSON.parse(raw);
    assert.deepEqual(out.metrics[0], { rankingKey: "ratio-65-plus", shortLabel: "高齢化率", role: "primary", selection: SEL });
    assert.deepEqual(out.metrics.slice(1), THEME_FIXTURE.metrics.slice(1));
    assert.deepEqual(out.rejectedCandidates, THEME_FIXTURE.rejectedCandidates);
    assert.equal(raw, `${JSON.stringify(out, null, 2)}\n`, "整形は 2 スペース・末尾改行");
  });

  it("selection が無い指標には足し、項目は決まった順に並べる", () => {
    const dir = writeFixture();
    const shuffled = { adoptionCriteria: SEL.adoptionCriteria, rationale: SEL.rationale, proposedBy: SEL.proposedBy, surveyedAt: SEL.surveyedAt, sourceUrl: SEL.sourceUrl };
    applySelections("test-theme", { "no-selection-yet": shuffled }, { themesDir: dir });
    const out = JSON.parse(fs.readFileSync(path.join(dir, "test-theme.json"), "utf8"));
    assert.deepEqual(Object.keys(out.metrics[1].selection), ["proposedBy", "sourceUrl", "surveyedAt", "rationale", "adoptionCriteria"]);
    assert.equal(out.metrics[0].selection.proposedBy, "全テーマ構成監査", "他の指標の selection は不変");
  });

  it("テーマに無い rankingKey は書かずに例外にする", () => {
    const dir = writeFixture();
    const before = fs.readFileSync(path.join(dir, "test-theme.json"), "utf8");
    assert.throws(() => applySelections("test-theme", { nope: SEL }, { themesDir: dir }), /nope/);
    assert.equal(fs.readFileSync(path.join(dir, "test-theme.json"), "utf8"), before);
  });

  it("dryRun は書かない", () => {
    const dir = writeFixture();
    const before = fs.readFileSync(path.join(dir, "test-theme.json"), "utf8");
    assert.deepEqual(applySelections("test-theme", { "ratio-65-plus": SEL }, { themesDir: dir, dryRun: true }), ["ratio-65-plus"]);
    assert.equal(fs.readFileSync(path.join(dir, "test-theme.json"), "utf8"), before);
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
