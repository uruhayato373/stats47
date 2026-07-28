import assert from "node:assert/strict";
import test from "node:test";

import {
  isBlocked,
  resolveVertical,
  isDuplicate,
  rewardNorm,
  gapBonus,
  scoreProgram,
  scoreAndRank,
  canTransition,
  transition,
  upsertCandidates,
  upsertApproved,
  confirmedEpc,
  computePriority,
  summarize,
  entriesByStatus,
  loadCurated,
} from "../lib/a8-scout-core.mjs";

const curated = loadCurated();

const coverage = {
  gapVerticals: ["health"],
  thinVerticals: ["population", "energy", "furusato", "education", "mobility"],
};

test("curated: 係数と blocklist が読める", () => {
  assert.equal(typeof curated.weeklyApplyMax, "number");
  assert.ok(Array.isArray(curated.blocklistKeywords));
  assert.equal(curated.scoreWeights.reward, 0.4);
});

test("isBlocked: NG ジャンルを検出", () => {
  assert.equal(isBlocked({ name: "占い師の館", genre: "占い" }, curated), true);
  assert.equal(isBlocked({ name: "情報商材で稼ぐ", genre: "情報商材" }, curated), true);
  assert.equal(isBlocked({ name: "マダムライブチャットレディ募集", genre: "求人" }, curated), true);
  // 副業「紹介」だけ NG。副業・フリーランスエンジニア (正当候補) は通す。
  assert.equal(isBlocked({ name: "副業・フリーランスエンジニアプラットフォーム", genre: "IT" }, curated), false);
  assert.equal(isBlocked({ name: "じゃらん", genre: "旅行" }, curated), false);
});

test("resolveVertical: ジャンル/名前 → 10軸", () => {
  assert.equal(resolveVertical({ name: "看護師転職ナビ", genre: "転職" }, curated), "labor");
  assert.equal(resolveVertical({ name: "楽天トラベル", genre: "旅行" }, curated), "travel");
  assert.equal(resolveVertical({ name: "自動車保険一括見積", genre: "自動車保険" }, curated), "mobility");
  assert.equal(resolveVertical({ name: "謎のサービス", genre: "その他" }, curated), null);
});

// 2026-07-27 実測: 「置くだけ簡単Wi-Fi【SoftBank Air】」が keyword "wifi" に一致せず
// pending-vertical のまま確定EPC 評価から漏れていた。大文字小文字・全角・ハイフン差を吸収する。
test("resolveVertical: 表記ゆれ (大文字小文字/全角/ハイフン) を吸収する", () => {
  for (const name of ["置くだけ簡単Wi-Fi", "WIFI ルーター", "Ｗｉ－Ｆｉ 契約"]) {
    assert.equal(resolveVertical({ name, genre: name }, curated), "energy", name);
  }
});

// 空白と「・」は除去してはならない。除去すると「郷土 地域」が housing の "土地" に誤マッチする。
test("resolveVertical: 空白をまたぐ誤マッチを作らない", () => {
  assert.equal(resolveVertical({ name: "郷土 地域の統計", genre: "その他" }, curated), null);
});

// カタカナ長音「ー」(U+30FC) をハイフンとして削らないこと (「スカパー」等の語形を壊さない)。
test("resolveVertical: 長音符を削らない", () => {
  assert.equal(resolveVertical({ name: "モバイル回線", genre: "モバイル" }, curated), "energy");
});

test("isBlocked: 表記ゆれを吸収して blocklist に当てる", () => {
  assert.equal(isBlocked({ name: "【A8.net】成果反映用プログラム", genre: "テスト" }, curated), true);
  assert.equal(isBlocked({ name: "MLM 勧誘", genre: "mlm" }, curated), true);
  assert.equal(isBlocked({ name: "都道府県統計データ", genre: "統計" }, curated), false);
});

test("isDuplicate: a8mat / title 一致で重複", () => {
  const existing = [
    { title: "イオン九州オンライン", htmlContent: "https://px.a8.net/svt/ejp?a8mat=4AZA46+97MGQA+5I2U+60H7L" },
  ];
  assert.equal(isDuplicate({ name: "別名", a8mat: "4AZA46+97MGQA+5I2U+60H7L" }, existing), true);
  assert.equal(isDuplicate({ name: "イオン九州オンライン", a8mat: "OTHER" }, existing), true);
  assert.equal(isDuplicate({ name: "新規案件", a8mat: "NEWTOKEN" }, existing), false);
});

test("rewardNorm: 定額と定率の正規化", () => {
  assert.equal(rewardNorm({ rewardType: "fixed", rewardYen: 5000 }, curated), 0.5); // 5000/10000
  assert.equal(rewardNorm({ rewardType: "fixed", rewardYen: 20000 }, curated), 1); // cap
  assert.equal(rewardNorm({ rewardType: "rate", rewardRatePct: 25 }, curated), 0.5); // 25/50
  assert.equal(rewardNorm({}, curated), 0);
});

test("gapBonus: gap=1.0 / thin=0.7 / other=0.2 / null=other", () => {
  assert.equal(gapBonus("health", coverage, curated), 1.0);
  assert.equal(gapBonus("population", coverage, curated), 0.7);
  assert.equal(gapBonus("travel", coverage, curated), 0.2);
  assert.equal(gapBonus(null, coverage, curated), 0.2);
});

test("scoreProgram: 高単価×gap は高スコア", () => {
  const hi = scoreProgram(
    { rewardType: "fixed", rewardYen: 20000, epcYen: 500, confirmRatePct: 100 },
    "health",
    coverage,
    curated,
  );
  const lo = scoreProgram(
    { rewardType: "fixed", rewardYen: 500, epcYen: 10, confirmRatePct: 10 },
    "travel",
    coverage,
    curated,
  );
  assert.ok(hi > lo);
  assert.ok(hi <= 1 && lo >= 0);
});

test("scoreAndRank: blocked/duplicate を分離し score 降順", () => {
  const programs = [
    { programId: "p1", name: "看護師転職", genre: "転職", rewardType: "fixed", rewardYen: 8000, epcYen: 300, confirmRatePct: 80 },
    { programId: "p2", name: "占いの館", genre: "占い", rewardType: "fixed", rewardYen: 9000 },
    { programId: "p3", name: "じゃらん", genre: "旅行", a8mat: "DUPTOKEN", rewardType: "rate", rewardRatePct: 2 },
    { programId: "p4", name: "格安SIM乗換", genre: "格安SIM", rewardType: "fixed", rewardYen: 6000, epcYen: 200, confirmRatePct: 60 },
  ];
  const existingAds = [{ title: "既存", htmlContent: "a8mat=DUPTOKEN" }];
  const r = scoreAndRank(programs, { coverage, existingAds, curated });
  assert.equal(r.blocked.length, 1);
  assert.equal(r.blocked[0].programId, "p2");
  assert.equal(r.duplicates.length, 1);
  assert.equal(r.duplicates[0].programId, "p3");
  // candidates は score 降順
  for (let i = 1; i < r.candidates.length; i++) {
    assert.ok(r.candidates[i - 1].score >= r.candidates[i].score);
  }
  // vertical が解決されている
  const p1 = r.candidates.find((c) => c.programId === "p1");
  assert.equal(p1.vertical, "labor");
});

test("scoreAndRank: 閾値未満は belowThreshold に理由付きで残す (捨てたことを見えるようにする)", () => {
  // 単価が極端に低い案件は minScore を下回る。ここに沈んだことが見えないと
  // 「需要はあるのに候補ゼロ」の原因が追えない (ふるさと納税で実際に起きた)。
  const programs = [
    { programId: "hi", name: "看護師転職", genre: "転職", rewardType: "fixed", rewardYen: 20000, epcYen: 800, confirmRatePct: 90 },
    { programId: "lo", name: "ふるさと納税サイト", genre: "その他", rewardType: "fixed", rewardYen: 100, epcYen: 1, confirmRatePct: 1 },
  ];
  const r = scoreAndRank(programs, { coverage, existingAds: [], curated });
  assert.ok(Array.isArray(r.belowThreshold));
  const lo = r.belowThreshold.find((p) => p.programId === "lo");
  assert.ok(lo, "低単価案件が belowThreshold に入る");
  assert.equal(lo.reason, "below-min-score");
  assert.ok(typeof lo.score === "number", "score を保持し何点で落ちたか分かる");
  assert.ok(!r.candidates.some((c) => c.programId === "lo"), "candidates には入らない");
  assert.ok(r.candidates.some((c) => c.programId === "hi"));
});

test("canTransition: 正当な遷移のみ true", () => {
  assert.equal(canTransition(null, "candidate"), true);
  assert.equal(canTransition("candidate", "applied"), true);
  assert.equal(canTransition("applied", "approved"), true);
  assert.equal(canTransition("harvested", "registered"), true);
  assert.equal(canTransition("harvested", "pending-vertical"), true);
  // 不正
  assert.equal(canTransition("candidate", "published"), false);
  assert.equal(canTransition("published", "candidate"), false);
  assert.equal(canTransition("rejected", "applied"), false); // 再申請しない
});

test("transition: 不正遷移で throw / 正当で history 追記", () => {
  const e = { status: "candidate", history: [] };
  const applied = transition(e, "applied", { at: "2026-07-19T00:00:00Z" });
  assert.equal(applied.status, "applied");
  assert.equal(applied.history.length, 1);
  assert.equal(applied.history[0].to, "applied");
  assert.throws(() => transition(e, "published"), /invalid transition/);
});

test("upsertCandidates: 新規は candidate / 既存 status は巻き戻さない", () => {
  let catalog = { entries: {} };
  catalog = upsertCandidates(catalog, [{ programId: "x", name: "A", vertical: "labor", score: 0.8 }], { at: "t1" });
  assert.equal(catalog.entries.x.status, "candidate");
  // x を applied に進める
  catalog.entries.x = transition(catalog.entries.x, "applied", { at: "t2" });
  // 再 scout で同 programId が来ても status は applied のまま (score だけ更新)
  catalog = upsertCandidates(catalog, [{ programId: "x", name: "A", vertical: "labor", score: 0.9 }], { at: "t3" });
  assert.equal(catalog.entries.x.status, "applied");
  assert.equal(catalog.entries.x.score, 0.9);
});

test("upsertApproved: EPC/確定率/報酬を保存 (新規は全保存・既存は欠損補完のみ)", () => {
  let cat = { entries: {} };
  cat = upsertApproved(cat, [{ programId: "m1", name: "A", vertical: "health", epcYen: 9.53, confirmRatePct: 100, rewardType: "rate", rewardRatePct: 60 }], { at: "t" });
  assert.equal(cat.entries.m1.epcYen, 9.53);
  assert.equal(cat.entries.m1.confirmRatePct, 100);
  assert.equal(cat.entries.m1.rewardRatePct, 60);
  // 既存の手調整値は上書きしない (欠損補完のみ)
  cat.entries.m1.confirmRatePct = 50; // 手調整
  cat = upsertApproved(cat, [{ programId: "m1", confirmRatePct: 100, epcYen: 20 }], { at: "t2" });
  assert.equal(cat.entries.m1.confirmRatePct, 50); // 上書きされない
  assert.equal(cat.entries.m1.epcYen, 9.53); // 既存あり → 補完しない
  // 欠損フィールドは補完される
  cat.entries.m2 = { programId: "m2", name: "B", status: "approved", history: [] };
  cat = upsertApproved(cat, [{ programId: "m2", epcYen: 300 }], { at: "t3" });
  assert.equal(cat.entries.m2.epcYen, 300);
});

test("upsertApproved: 新規は approved / 既存 candidate は昇格 / registered は据え置き", () => {
  let cat = { entries: {} };
  // 新規の既存提携 → approved
  cat = upsertApproved(cat, [{ programId: "e1", name: "Surfshark", vertical: "energy" }], { at: "t", note: "existing" });
  assert.equal(cat.entries.e1.status, "approved");
  assert.equal(cat.entries.e1.source, "existing-partnership");
  // candidate だったものは approved に昇格
  cat.entries.c1 = { programId: "c1", name: "X", status: "candidate", history: [] };
  cat = upsertApproved(cat, [{ programId: "c1", vertical: "labor" }], { at: "t2" });
  assert.equal(cat.entries.c1.status, "approved");
  // registered は据え置き
  cat.entries.r1 = { programId: "r1", name: "Y", status: "registered", vertical: "economy", history: [] };
  cat = upsertApproved(cat, [{ programId: "r1", vertical: "housing" }], { at: "t3" });
  assert.equal(cat.entries.r1.status, "registered");
  assert.equal(cat.entries.r1.vertical, "economy"); // 巻き戻さない
});

test("confirmedEpc / computePriority: バンド式 + targetRankingKeys ボーナス", () => {
  assert.equal(confirmedEpc({ epcYen: 942, confirmRatePct: 48.97 }).toFixed(1), "461.3");
  assert.equal(confirmedEpc({ epcYen: 0, confirmRatePct: 100 }), 0);
  // バンド境界
  assert.equal(computePriority({ epcYen: 1100, confirmRatePct: 100 }, curated), 80); // 1100≥1000
  assert.equal(computePriority({ epcYen: 700, confirmRatePct: 50 }, curated), 60); // 350≥300
  assert.equal(computePriority({ epcYen: 500, confirmRatePct: 40 }, curated), 40); // 200≥100
  assert.equal(computePriority({ epcYen: 100, confirmRatePct: 40 }, curated), 20); // 40≥30
  assert.equal(computePriority({ epcYen: 10, confirmRatePct: 50 }, curated), 10); // 5 <30
  assert.equal(computePriority({}, curated), 10); // 欠損
  // targetRankingKeys で +5
  assert.equal(computePriority({ epcYen: 700, confirmRatePct: 50, targetRankingKeys: ["x"] }, curated), 65);
});

test("summarize / entriesByStatus", () => {
  const catalog = {
    entries: {
      a: { status: "candidate", score: 0.5 },
      b: { status: "candidate", score: 0.9 },
      c: { status: "applied", score: 0.7 },
    },
  };
  assert.deepEqual(summarize(catalog), { candidate: 2, applied: 1 });
  const cands = entriesByStatus(catalog, "candidate");
  assert.equal(cands.length, 2);
  assert.equal(cands[0].score, 0.9); // 降順
});

// ── upsertCandidates が経済指標を保存する (2026-07-28 追加) ──────────────────
// これが無いと catalog に単価・EPC・確定率が一切残らず「高単価で選ぶ」ができないうえ、
// confirmedEpc / computePriority が常に 0 を見る。

test("upsertCandidates は単価・EPC・確定率を保存する", () => {
  const out = upsertCandidates({ entries: {} }, [
    { programId: "s1", name: "A", score: 0.9, rewardYen: 50000, epcYen: 942, confirmRatePct: 48.97, rewardType: "fixed" },
  ]);
  const e = out.entries.s1;
  assert.equal(e.rewardYen, 50000);
  assert.equal(e.epcYen, 942);
  assert.equal(e.confirmRatePct, 48.97);
  assert.equal(e.rewardType, "fixed");
  assert.equal(confirmedEpc(e).toFixed(1), "461.3");
});

test("再 scout で A8 が '-' を返しても既存の実測値を潰さない", () => {
  const first = upsertCandidates({ entries: {} }, [
    { programId: "s1", name: "A", score: 0.9, rewardYen: 50000, epcYen: 942, confirmRatePct: 48.97 },
  ]);
  // A8 のカードは日によって EPC/確定率が "-" になる → 0 で来る
  const second = upsertCandidates(first, [
    { programId: "s1", name: "A", score: 0.8, epcYen: 0, confirmRatePct: 0, rewardYen: 0 },
  ]);
  const e = second.entries.s1;
  assert.equal(e.rewardYen, 50000, "欠損で単価を潰さない");
  assert.equal(e.epcYen, 942, "欠損で EPC を潰さない");
  assert.equal(e.confirmRatePct, 48.97, "欠損で確定率を潰さない");
  assert.equal(e.score, 0.8, "score は最新に更新する");
});

test("既存 status を巻き戻さずに経済指標だけ更新する", () => {
  const base = { entries: { s1: { programId: "s1", status: "approved", score: 0.5, history: [] } } };
  const out = upsertCandidates(base, [{ programId: "s1", score: 0.7, epcYen: 100, confirmRatePct: 60 }]);
  assert.equal(out.entries.s1.status, "approved");
  assert.equal(out.entries.s1.epcYen, 100);
});
