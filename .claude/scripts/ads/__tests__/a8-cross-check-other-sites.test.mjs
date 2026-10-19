/**
 * A8 の専用案件の突合に、口座の他サイト登録のクリックを上限として入れる (A8-CROSSCHECK-EXCEED-01・2026-10-19 オーナー判断)。
 * 口座には stats47・doboku-note のほかに doboku-note(note)・X・kazu-note のサイト登録があり、そこで使われた
 * stats47 と同じ案件のリンクのクリックが「stats47 専用」に混ざる。10 月の実測では専用 276 > サイト 261 で止まっていた。
 * 守ること: 上限はサイト別レポートの実測だけで決める / 1 件でも超えたら止める / 件数・金額は従来どおり厳しく止める。
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { A8_REPORT_AUTOMATION } from "../../../../config/paths.mjs";
import { crossCheckAgainstSite, normalizeA8Csv, unexplainedOtherSiteClicks } from "../lib/a8-report-csv.mjs";

const ROOT = fileURLToPath(new URL("../../../../", import.meta.url));
const SHARED = ["s00000024757004"];
const site = (clicks, extra = {}) => ({ site: "統計で見る都道府県", clicks, conversions: 0, grossRevenueYen: 0, approved: 0, revenueYen: 0, ...extra });
const program = (programId, clicks, extra = {}) => ({ programId, program: `af_${programId}`, clicks, conversions: 0, grossRevenueYen: 0, approved: 0, revenueYen: 0, ...extra });

// 2026-10 の実測 (run 2026-10-19T05-00-50Z): 専用 276・共用 66・未写像 11 (doboku-note のみ 4 を含む)・サイト 261・他サイト登録 92
const OCTOBER = {
  siteRow: site(261),
  allowlisted: [program("s00000000000001", 276), program("s00000024757004", 66)],
  otherSiteRows: [{ site: "doboku-note", clicks: 56 }, { site: "doboku-note（note）", clicks: 7 }, { site: "KAZU（X）", clicks: 20 }, { site: "KAZU（kazu-note）", clicks: 9 }],
  unmappedRows: [{ programId: "s00000022413004", clicks: 4 }, { programId: "s00000027681001", clicks: 7 }],
};

test("他サイト登録のクリックから共用と未写像を引いた分が、専用案件に混ざりうる上限になる", () => {
  const rows = OCTOBER.allowlisted.filter((r) => SHARED.includes(r.programId));
  assert.equal(unexplainedOtherSiteClicks({ otherSiteRows: OCTOBER.otherSiteRows, sharedRows: rows, unmappedRows: OCTOBER.unmappedRows }), 15);
});

test("10 月の実測は上限の内側なので超過にしない (専用 276 ≦ サイト 261 + 15)", () => {
  const result = crossCheckAgainstSite(OCTOBER.siteRow, OCTOBER.allowlisted, {
    sharedProgramIds: SHARED,
    otherSiteRows: OCTOBER.otherSiteRows,
    unmappedRows: OCTOBER.unmappedRows,
  });
  assert.equal(result.exceeded, false);
  assert.equal(result.hasShortfall, false);
  assert.equal(result.deltas.clicks.tolerance, 15);
  assert.equal(result.deltas.clicks.toleranceBasis, "other-site-clicks");
  assert.equal(result.deltas.clicks.otherSiteClicks, 92);
});

test("上限を 1 件でも超えたら超過にする", () => {
  const allowlisted = [program("s00000000000001", 277), program("s00000024757004", 66)];
  const result = crossCheckAgainstSite(OCTOBER.siteRow, allowlisted, {
    sharedProgramIds: SHARED,
    otherSiteRows: OCTOBER.otherSiteRows,
    unmappedRows: OCTOBER.unmappedRows,
  });
  assert.equal(result.exceeded, true);
});

test("他サイト登録の行が無い記録では従来の許容差 max(3, ceil(サイト×2%)) に戻る", () => {
  const result = crossCheckAgainstSite(OCTOBER.siteRow, OCTOBER.allowlisted, { sharedProgramIds: SHARED, otherSiteRows: null });
  assert.equal(result.deltas.clicks.tolerance, 6);
  assert.equal(result.deltas.clicks.toleranceBasis, "fixed-ratio");
  assert.equal(result.exceeded, true);
});

test("他サイト登録のクリックがあっても、専用案件の成果件数がサイトを超えたら超過にする", () => {
  const allowlisted = [program("s00000000000001", 270, { conversions: 1 }), program("s00000024757004", 66)];
  const result = crossCheckAgainstSite(OCTOBER.siteRow, allowlisted, {
    sharedProgramIds: SHARED,
    otherSiteRows: OCTOBER.otherSiteRows,
    unmappedRows: OCTOBER.unmappedRows,
  });
  assert.equal(result.exceeded, true);
});

test("正規化はサイト別レポートの他サイト登録の行を rows に入れず otherSiteRows で返す", () => {
  const cfg = JSON.parse(readFileSync(join(ROOT, A8_REPORT_AUTOMATION), "utf8"));
  const csv = [
    '"サイト","imp数","click数","CTR","発生件数","発生金額","CVR","確定件数","確定金額","確定率","キャンセル件数","キャンセル金額","未確定件数","未確定金額"',
    '"doboku-note",363326,56,0.02,1,13534,1.79,0,0,"-",0,0,1,13534',
    `"${cfg.a8.targetSite}",132639,261,0.20,0,0,0,0,0,"-",0,0,0,0`,
  ].join("\n");
  const result = normalizeA8Csv(csv, { reportKey: "site-summary", cfg });
  assert.equal(result.fatal, null);
  assert.deepEqual(result.rows.map((r) => [r.site, r.clicks]), [[cfg.a8.targetSite, 261]]);
  assert.deepEqual(result.otherSiteRows.map((r) => [r.site, r.clicks]), [["doboku-note", 56]]);
});
