import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

import {
  AGENT_BY_DESIGN_TTL_DAYS,
  findUnhandled,
  insertCards,
  isFixLive,
  observeFindings,
  chartFixGuide,
  planUiCards,
  staleBatchFiles,
  syncFindings,
} from "../lib/ui-findings.ts";

const require = createRequire(import.meta.url);
const { parseBacklog } = require("../../lib/backlog-lib.cjs");

const AUDIT_AT = "2026-10-03T18:40:00.000Z";
const violation = (over = {}) => ({
  url: "https://stats47.jp/",
  template: "home",
  metric_key: "overlapping_tap_targets",
  comparison: "absolute",
  operator: "<=",
  threshold: 0,
  actual: 3,
  previous: null,
  severity: "warning",
  ...over,
});
const agent = (over = {}) => ({
  template: "geo-analysis",
  device: "desktop-1440",
  severity: "medium",
  location: "分析カード",
  issue: "地図プレビューが表示されない",
  suggestion: "取得元を直す",
  ...over,
});
const ctx = (over = {}) => ({
  today: "2026-10-04",
  auditAt: AUDIT_AT,
  mainDeployedAt: null,
  openCardIds: [],
  agentReviewed: true,
  ...over,
});
const finding = (over = {}) => ({
  key: "machine|https://stats47.jp/|overlapping_tap_targets",
  source: "machine",
  template: "home",
  url: "https://stats47.jp/",
  metric_key: "overlapping_tap_targets",
  severity: "warning",
  detail: "overlapping_tap_targets = 3 (閾値 <= 0)",
  status: "pending",
  first_seen: "2026-09-27",
  last_seen: "2026-09-27",
  fixed_at: null,
  resolved_at: null,
  resolved_by: null,
  card: null,
  note: "",
  ...over,
});
const statusOf = (queue, key) => queue.find((f) => f.key === key)?.status;

test("UI の機械検出だけを取り込み、Claude の指摘はページの種類ごとに 1 件へまとめる", () => {
  const observed = observeFindings(
    { violations: [violation(), violation({ metric_key: "html_bytes", template: "ranking" })] },
    [agent(), agent({ device: "mobile-390", severity: "high", issue: "余白が崩れる" }), agent({ template: "theme" })],
  );
  assert.deepEqual(observed.map((o) => o.key).sort(), [
    "agent|geo-analysis",
    "agent|theme",
    "machine|https://stats47.jp/|overlapping_tap_targets",
  ]);
  const geo = observed.find((o) => o.key === "agent|geo-analysis");
  assert.equal(geo.severity, "high");
  assert.equal(geo.detail.split("\n").length, 2);
});

test("新規は pending、今週消えた pending は done (not-observed)", () => {
  const stale = finding({ key: "machine|https://stats47.jp/areas/13000|degraded_images", template: "prefecture-detail" });
  const { queue, counts } = syncFindings([stale], observeFindings({ violations: [violation()] }, []), ctx());
  assert.equal(statusOf(queue, "machine|https://stats47.jp/|overlapping_tap_targets"), "pending");
  assert.equal(statusOf(queue, stale.key), "done");
  assert.equal(queue.find((f) => f.key === stale.key).resolved_by, "not-observed");
  assert.deepEqual([counts.added, counts.resolved], [1, 1]);
});

test("直した指摘は、本番反映前なら再検出されても fixed のまま、反映後に再検出されたら pending に戻す", () => {
  const fixed = finding({ status: "fixed", fixed_at: "2026-09-29T10:00:00.000Z", note: "矢印を外へ出した" });
  const observed = observeFindings({ violations: [violation()] }, []);
  // main の最新マージが修正より前 = まだ本番に出ていない
  const before = syncFindings([fixed], observed, ctx({ mainDeployedAt: "2026-09-28T00:00:00Z" }));
  assert.equal(before.queue[0].status, "fixed");
  // 修正後にマージされ、週次監査までにデプロイが終わっている
  const after = syncFindings([fixed], observed, ctx({ mainDeployedAt: "2026-10-01T00:00:00Z" }));
  assert.equal(after.queue[0].status, "pending");
  assert.match(after.queue[0].note, /本番反映後も/);
  assert.equal(after.counts.reopened, 1);
});

test("直した指摘が本番の週次で消えたら done (weekly-audit) にする", () => {
  const fixed = finding({ status: "fixed", fixed_at: "2026-09-29T10:00:00.000Z", note: "直した" });
  const { queue, counts } = syncFindings([fixed], [], ctx());
  assert.equal(queue[0].status, "done");
  assert.equal(queue[0].resolved_by, "weekly-audit");
  assert.equal(counts.confirmedFixed, 1);
});

test("監査の直前 (デプロイ完了前) のマージは本番反映とみなさない", () => {
  assert.equal(isFixLive("2026-10-01T00:00:00Z", "2026-10-03T18:20:00Z", AUDIT_AT), false);
  assert.equal(isFixLive("2026-10-01T00:00:00Z", "2026-10-03T17:00:00Z", AUDIT_AT), true);
  assert.equal(isFixLive("2026-10-01T00:00:00Z", null, AUDIT_AT), false);
});

test("done の指摘が再び出たら再発として pending に戻す", () => {
  const done = finding({ status: "done", resolved_at: "2026-09-27", resolved_by: "weekly-audit" });
  const { queue } = syncFindings([done], observeFindings({ violations: [violation()] }, []), ctx());
  assert.equal(queue[0].status, "pending");
  assert.match(queue[0].note, /再発/);
});

test("手動カードが担当する指摘は、カードが開いている間は起票せず、閉じた後も残っていれば pending に戻す", () => {
  const owned = finding({ status: "owner", card: "CAROUSEL-ARROW-OVERLAP-01", note: "手動カードで対応" });
  const observed = observeFindings({ violations: [violation()] }, []);
  assert.equal(syncFindings([owned], observed, ctx({ openCardIds: ["CAROUSEL-ARROW-OVERLAP-01"] })).queue[0].status, "owner");
  assert.equal(syncFindings([owned], observed, ctx({ openCardIds: [] })).queue[0].status, "pending");
  // カードが開いたまま指摘が消えたら、カードに任せて据え置く
  assert.equal(syncFindings([owned], [], ctx({ openCardIds: ["CAROUSEL-ARROW-OVERLAP-01"] })).queue[0].status, "owner");
  // 担当カードの無い owner は誰も拾わないので pending に戻す
  assert.equal(syncFindings([{ ...owned, card: null }], observed, ctx()).queue[0].status, "pending");
});

test("Claude の確認が走らなかった週は、Claude の指摘を消えた扱いにしない", () => {
  const pendingAgent = finding({ key: "agent|geo-analysis", source: "agent", template: "geo-analysis", url: null, metric_key: null });
  const { queue } = syncFindings([pendingAgent], [], ctx({ agentReviewed: false }));
  assert.equal(queue[0].status, "pending");
});

test("Claude の指摘の by-design は期限付き、機械検出の by-design は観測中は保つ", () => {
  const observed = observeFindings({ violations: [violation()] }, [agent()]);
  const agentDesign = (resolvedAt) =>
    finding({ key: "agent|geo-analysis", source: "agent", template: "geo-analysis", status: "by-design", resolved_at: resolvedAt, note: "撮影タイミング" });
  const machineDesign = finding({ status: "by-design", resolved_at: "2026-06-01", note: "意図どおり" });
  const fresh = syncFindings([agentDesign("2026-09-27"), machineDesign], observed, ctx()).queue;
  assert.equal(statusOf(fresh, "agent|geo-analysis"), "by-design");
  assert.equal(statusOf(fresh, machineDesign.key), "by-design");
  const expired = syncFindings([agentDesign("2026-09-01")], observed, ctx()).queue;
  assert.equal(statusOf(expired, "agent|geo-analysis"), "pending");
  assert.ok(AGENT_BY_DESIGN_TTL_DAYS <= 28);
});

test("カードの gate は pending と理由なしの処理を未処理として返し、消えた指摘は処理済みとする", () => {
  const queue = [
    finding({ key: "a", status: "pending" }),
    finding({ key: "b", status: "fixed", note: "直した" }),
    finding({ key: "c", status: "by-design", note: "" }),
    finding({ key: "d", status: "done" }),
  ];
  assert.deepEqual(findUnhandled(queue, ["a", "b", "c", "d", "gone"]), ["a", "c"]);
});

test("pending をページの種類ごとに 1 枚のカードにし、開いているカードがある種類は出さない", () => {
  const queue = [
    finding(),
    finding({ key: "machine|https://stats47.jp/category/population|overlapping_tap_targets", template: "category" }),
    finding({ key: "agent|theme", source: "agent", template: "theme", status: "fixed", note: "x" }),
  ];
  const cards = planUiCards({
    queue,
    openIds: ["UI-FIX-CATEGORY-20260927"],
    today: "2026-10-04",
    screenshotBaseUrl: "https://storage.stats47.jp",
  });
  assert.deepEqual(cards.map((c) => c.id), ["UI-FIX-HOME-20261004"]);
  assert.deepEqual(cards[0].keys, ["machine|https://stats47.jp/|overlapping_tap_targets"]);
});

// ループ (build-backlog-queue) はバックログのパーサーでカードを読む。読めない形で起票すると誰も処理しない。
test("起票したカードはバックログのパーサーで ID・sweep 実行・検証コマンドが読める", () => {
  const [card] = planUiCards({ queue: [finding()], openIds: [], today: "2026-10-04", screenshotBaseUrl: "https://storage.stats47.jp" });
  const backlog = "# backlog\n\n## 🔴 急ぎ\n\n## 🟡 通常\n\n### [OTHER-01] 既存\n\nタグ: [種類:改善] [実行:対話]\n";
  const { text, inserted } = insertCards(backlog, [card]);
  assert.deepEqual(inserted, [card.id]);
  const parsed = parseBacklog(text).find((c) => c.id === card.id);
  assert.ok(parsed, "カードがパースされない");
  assert.equal(parsed.executor, "sweep");
  assert.match(parsed.verify, /ui-findings\.ts --assert-handled \.claude\/state\/page-quality\/backlog-batches\/UI-FIX-HOME-20261004\.txt/);
  assert.deepEqual(staleBatchFiles(["UI-FIX-HOME-20261004.txt", "UI-FIX-THEME-20260927.txt", "README.md"], [card.id]), [
    "UI-FIX-THEME-20260927.txt",
  ]);
});

// ループは 3 か所の配線で閉じる。どれかが外れると、起票されない・印が消えて毎週同じ指摘が再起票される、のどちらかになる。
test("週次監査が同期と起票を行い、週次と backlog-loop の両方がキューを commit する", async () => {
  const { readFileSync } = await import("node:fs");
  const root = new URL("../../../../", import.meta.url);
  const weekly = readFileSync(new URL(".github/workflows/page-quality-audit-weekly.yml", root), "utf8");
  assert.match(weekly, /ui-findings\.ts "\$\{ARGS\[@\]\}"/);
  assert.match(weekly, /ARGS=\(--sync /);
  assert.match(weekly, /--main-deployed-at/);
  assert.match(weekly, /git add \.claude\/state\/page-quality\/ \.claude\/todo\/backlog\.md/);
  const loop = readFileSync(new URL(".github/workflows/backlog-loop-daily.yml", root), "utf8");
  assert.match(loop, /git add -- [^\n]*\.claude\/state\/page-quality/);
});

// チャートの文字の指摘は直し方が分かれる (部品を直す agent / 作り直すだけのスクリプト)。
// 手順がカードに無いと、ループが SVG を 1 枚ずつ手で直したり R2 へ勝手に反映したりする。
test("チャートの文字の指摘を含むカードには、種類ごとの振り分け手順を書く", () => {
  const blog = finding({ key: "machine|https://stats47.jp/blog/beer|blog_svg_text_issues", metric_key: "blog_svg_text_issues", template: "blog-detail" });
  const d3 = finding({ key: "machine|https://stats47.jp/areas/13000|chart_text_issues", metric_key: "chart_text_issues", template: "area" });
  const [blogCard] = planUiCards({ queue: [blog], openIds: [], today: "2026-10-04", screenshotBaseUrl: "https://storage.stats47.jp" });
  assert.match(blogCard.markdown, /plan-svg-text-fix\.ts @\.claude\/state\/page-quality\/backlog-batches\/UI-FIX-BLOG-DETAIL-20261004\.txt/);
  assert.match(blogCard.markdown, /regen-fixes.*オーナー承認.*\[実行:ユーザー\]/);
  assert.match(blogCard.markdown, /generator-fix.*packages\/svg-builder/);
  const [areaCard] = planUiCards({ queue: [d3], openIds: [], today: "2026-10-04", screenshotBaseUrl: "https://storage.stats47.jp" });
  assert.match(areaCard.markdown, /packages\/visualization\/src\/d3\/components/);
  assert.doesNotMatch(areaCard.markdown, /plan-svg-text-fix/);
  // チャート以外の指摘だけのカードには足さない
  assert.deepEqual(chartFixGuide([finding()], "x.txt"), []);
});
