#!/usr/bin/env node
/**
 * build-ai-content-queue.mjs — ranking ai-content 是正キュー (状態付き SSOT) を R2 + GSC から再導出する。
 *
 * blog の build-remediation-queue.mjs と同型の設計思想:
 *   「done か」は手動ログでなく **R2 の ai-content が決定的ゲート auditRow を通る (blocker 0) か** で判定する。
 *   = R2 が真実源、キューは毎回 R2+GSC から再構築する派生ビュー。手動ログのドリフトが起きない。
 *   → どのセッション・どの PC からでも、本スクリプトを実行すれば「今 done な集合 / 次にやるべき集合」が
 *     決定的に分かる。後日途中から再開しても安全 (中断耐性)。
 *
 * 対象スコープは 2 種 (`--scope`):
 *   - `gsc` (既定): **GSC 流入のある /ranking/ ページ**。SEO 優先順位の母集団。impressions 降順で優先
 *   - `all`        : **R2 の active ranking 全件** (app/ranking-items/all.json の isActive)。
 *                    「全件を完成させる」量産フェーズ用。GSC 流入が無いキーは impressions 0 として末尾に並ぶ
 *
 * どちらのスコープでも実行のたびに `progress-history.csv` へ 1 行追記し、
 * 消化ペースと残件数から完了見込みを LATEST.md に出す (日次 cron の進捗管理)。
 *
 * 判定:
 *   - missing      : ai-content.json が R2 に無い → needs-regen
 *   - blocker      : ある が auditRow で blocker>0 (旧プロンプト由来の括弧数値等) → needs-regen
 *   - incomplete   : 4フィールドのいずれか欠落 (auditRow が missing-insights / missing-pref-commentary 等で blocker) → needs-regen
 *   - done         : ある かつ auditRow.ok (blocker 0)
 *   - not-eligible : **観測値そのものが順位として成立しない** (全県同値 / 県重複 / 47超 / 0行)。
 *                    生成しても読者価値が無いので `--next` に出さない (下記)
 *
 * 接地データの健全性 (2026-08-04 追加):
 *   auditRow は **生成物しか見ない**。「そもそも論じるに足るデータか」は誰も見ておらず、
 *   全 47 県が 0 の `bowling-alley-public` に FAQ 5 問 + 県別解説 47 件が生成・公開された。
 *   → values.json も取得して `checkValueHealth` (lib/value-health.mjs) に通す。
 *   **生成時ではなくここで落とすのが要点**: 生成時に弾くと needs-regen のまま翌日また上位に
 *   並び、毎日 1 枠を食い潰す (livelock)。
 *   done でも接地が不健全な key は `dataBlockers` を付けて可視化する (公開済みの是正対象)。
 *
 * 出力:
 *   .claude/state/ai-content/remediation-queue.json  (機械可読・per-key status + impressions + reason + checkedAt)
 *   .claude/state/ai-content/LATEST.md               (人間向けサマリ)
 *
 * Usage:
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs            # 再構築 (GSC 流入スコープ)
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs --scope all # 再構築 (active 全件・量産フェーズ)
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10  # 次にやるべき needs-regen 上位10 (impressions順)
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs --json     # サマリ JSON
 *   node .claude/scripts/ai-content/build-ai-content-queue.mjs --no-build --next 10  # 既存キューJSONから --next だけ
 *
 * 関連: audit-ai-content.mjs (auditRow) / build-input.ts / generate-parallel.ts /
 *       .claude/todo/backlog.md [AICONTENT-DBLESS-REBUILD]
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { auditRow } from "./audit-ai-content.mjs";
import { checkValueHealth, latestPartition } from "./lib/value-health.mjs";
import { loadFailureState, quarantinedKeys } from "./record-generation-outcome.mjs";
import { isAnchorRow } from "../gsc/analyze-ctr-seesaw.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..", "..");
const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const GSC_SNAP_DIR = join(ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
const STATE_DIR = join(ROOT, ".claude/state/ai-content");
const QUEUE_JSON = join(STATE_DIR, "remediation-queue.json");
const LATEST_MD = join(STATE_DIR, "LATEST.md");
const HISTORY_CSV = join(STATE_DIR, "progress-history.csv");
const FAILURES_JSON = join(STATE_DIR, "generation-failures.json");

/**
 * critic に繰り返し落ちた常習キー集合。verify (partial-publish) が失敗を記録し、
 * ここで `--next` の自動ピックから外す。放置すると doomed key が毎回バッチの 1 枠と
 * 生成コストを食い潰す (2026-08-07)。SSOT: record-generation-outcome.mjs。
 */
function loadQuarantinedKeys() {
  return quarantinedKeys(loadFailureState(FAILURES_JSON));
}

function actionableQuarantinedKeys(queue, allQuarantined = loadQuarantinedKeys()) {
  const pendingKeys = new Set(
    queue.entries
      .filter((entry) => entry.status === "needs-regen")
      .map((entry) => entry.rankingKey),
  );
  return new Set([...allQuarantined].filter((key) => pendingKeys.has(key)));
}
const RANKING_ITEMS_URL = `${R2_PUBLIC}/app/ranking-items/all.json`;
const CONCURRENCY = 16;

function latestGscPagesCsv() {
  if (!existsSync(GSC_SNAP_DIR)) return null;
  const weeks = readdirSync(GSC_SNAP_DIR)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d))
    .sort()
    .reverse();
  for (const w of weeks) {
    const p = join(GSC_SNAP_DIR, w, "pages.csv");
    if (existsSync(p)) return { week: w, path: p };
  }
  return null;
}

function parseRankingKeysFromGsc(csvPath) {
  const lines = readFileSync(csvPath, "utf8").trim().split("\n");
  const out = new Map(); // key -> {impressions, clicks, position}
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const page = cols[0] ?? "";
    // ranking key へ畳むとアンカー imp を二重加算するため、ページ需要からは除外。
    if (isAnchorRow(page)) continue;
    const m = page.match(/\/ranking\/([^/?#]+)/);
    if (!m) continue;
    const key = m[1];
    const clicks = Number(cols[1] ?? 0);
    const impressions = Number(cols[2] ?? 0);
    const position = Number(cols[4] ?? 0);
    const prev = out.get(key);
    // 同一 key が複数行 (末尾スラッシュ違い等) のとき impressions を合算
    if (prev) {
      prev.impressions += impressions;
      prev.clicks += clicks;
    } else {
      out.set(key, { impressions, clicks, position });
    }
  }
  return out;
}

async function fetchAiContent(key) {
  const url = `${R2_PUBLIC}/app/ranking/${encodeURIComponent(key)}/ai-content.json?cb=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (res.status === 404) return { present: false, row: null };
    if (!res.ok) return { present: false, row: null, fetchError: res.status };
    // R2 last-modified を「いつ修正したか」の真実源として取り込む (content の updatedAt より権威がある)
    const lastModified = res.headers.get("last-modified") || null;
    return { present: true, row: await res.json(), lastModified };
  } catch (e) {
    return { present: false, row: null, fetchError: String(e).slice(0, 60) };
  }
}

/**
 * 観測値 (values.json) の最新年を取得して健全性を判定する。
 *
 * 取得できないときは **null を返して判定をスキップする** (fail-open)。R2 の一時障害で
 * 全件 not-eligible にすると、その日の生成が丸ごと止まる。「見られなかった」と
 * 「壊れている」は区別する。
 */
async function fetchValueHealth(key) {
  const url = `${R2_PUBLIC}/app/ranking/${encodeURIComponent(key)}/values.json?cb=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (res.status === 404) {
      return { checked: true, yearCode: null, health: { ok: false, blockers: [{ code: "no-values", message: "values.json が R2 に無い" }], warns: [] } };
    }
    if (!res.ok) return null;
    const { yearCode, rows } = latestPartition(await res.json());
    return { checked: true, yearCode, health: checkValueHealth(rows) };
  } catch {
    return null;
  }
}

/**
 * R2 の ranking_items snapshot から active な rankingKey を全件取得する。
 *
 * `readActiveRankingKeysFromR2` (TS) と同じ真実源・同じ条件 (areaType 一致 + isActive) を
 * .mjs から直接 fetch する。TS パッケージを import できないための再実装なので、
 * **条件を変えるときは両方を合わせる**こと。
 */
async function fetchActiveRankingKeys(areaType = "prefecture") {
  const res = await fetch(`${RANKING_ITEMS_URL}?cb=${Date.now()}`);
  if (!res.ok) throw new Error(`ranking_items snapshot 取得失敗 ${res.status}: ${RANKING_ITEMS_URL}`);
  const snapshot = await res.json();
  const items = snapshot?.items ?? [];
  return items
    .filter((it) => it.areaType === areaType && it.isActive)
    .map((it) => it.rankingKey);
}

/**
 * 接地データの判定を entry に反映する。
 *
 * - needs-regen だった → `not-eligible` (生成対象から外す)
 * - done だった        → done のまま `dataBlockers` を付ける (公開済みの是正対象として可視化)
 *
 * 判定できなかった (values 取得失敗) 場合は何もしない。
 */
function applyValueHealth(entry, valueHealth) {
  if (!valueHealth?.checked) return entry;
  const { health, yearCode } = valueHealth;
  if (health.warns.length > 0) entry.dataWarns = health.warns.map((w) => w.code);
  if (health.ok) return entry;
  const codes = health.blockers.map((b) => b.code);
  entry.dataBlockers = codes;
  entry.dataReason = health.blockers.map((b) => b.message).join(" / ");
  entry.dataYear = yearCode;
  if (entry.status === "needs-regen") {
    entry.status = "not-eligible";
    entry.reason = `data:${codes.join(",")}`;
  }
  return entry;
}

function classify(key, gsc, fetched) {
  const base = {
    rankingKey: key,
    impressions: gsc.impressions,
    clicks: gsc.clicks,
    position: gsc.position,
  };
  if (!fetched.present) {
    return { ...base, status: "needs-regen", reason: fetched.fetchError ? `fetch-error:${fetched.fetchError}` : "missing", blockers: [] };
  }
  const audit = auditRow(fetched.row);
  if (audit.ok) {
    // lastModified = R2 上で「いつ修正/反映されたか」(ISO でなく HTTP-date)。updatedAt は content 自己申告 (null の場合あり)
    return {
      ...base,
      status: "done",
      reason: "ok",
      blockers: [],
      warns: audit.warns.map((w) => w.code),
      lastModified: fetched.lastModified ?? null,
      updatedAt: fetched.row?.updatedAt ?? null,
    };
  }
  const codes = audit.blockers.map((b) => b.code);
  // incomplete (フィールド欠落) と blocker (内容違反) を reason で区別
  const incompleteCodes = ["missing-insights", "missing-pref-commentary", "faq-parse", "pref-parse", "no-content"];
  const isIncomplete = codes.some((c) => incompleteCodes.includes(c));
  return {
    ...base,
    status: "needs-regen",
    reason: isIncomplete ? "incomplete" : "blocker",
    blockers: codes,
  };
}

async function buildQueue(scope = "gsc") {
  const gsc = latestGscPagesCsv();
  if (!gsc) throw new Error(`GSC pages.csv が見つかりません (${GSC_SNAP_DIR})`);
  const keyMap = parseRankingKeysFromGsc(gsc.path);

  let keys;
  if (scope === "all") {
    // 全件スコープ: active 全キー。GSC に無いキーは impressions 0 で末尾に並ぶ
    const active = await fetchActiveRankingKeys();
    keys = active;
    process.stderr.write(
      `[build-queue] scope=all: active ${keys.length} 件 (GSC 流入あり ${keys.filter((k) => keyMap.has(k)).length} 件) を R2 で判定中…\n`,
    );
  } else {
    keys = [...keyMap.keys()];
    process.stderr.write(`[build-queue] GSC ${gsc.week}: /ranking/ key ${keys.length} 件を R2 で判定中…\n`);
  }
  const gscOf = (k) => keyMap.get(k) ?? { impressions: 0, clicks: 0, position: 0 };

  const entries = [];
  for (let i = 0; i < keys.length; i += CONCURRENCY) {
    const batch = keys.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (k) => {
        // ai-content (生成物) と values (接地データ) を同時に取る。直列にすると倍の時間がかかる。
        const [content, valueHealth] = await Promise.all([fetchAiContent(k), fetchValueHealth(k)]);
        return applyValueHealth(classify(k, gscOf(k), content), valueHealth);
      }),
    );
    entries.push(...results);
  }
  entries.sort((a, b) => b.impressions - a.impressions);

  const done = entries.filter((e) => e.status === "done");
  const needs = entries.filter((e) => e.status === "needs-regen");
  const notEligible = entries.filter((e) => e.status === "not-eligible");
  const doneUnhealthy = done.filter((e) => e.dataBlockers?.length);
  const byReason = needs.reduce((acc, e) => ((acc[e.reason] = (acc[e.reason] ?? 0) + 1), acc), {});

  // 自動量産は Gemini 日次 CI (author + 別リクエスト critic) か、ローカルの headless claude CLI
  // (run-claude-batch.sh。同じ監査・critic を通す)。GSC 流入上位 N 件だけ、自動失敗が続いたときの
  // 手動 agent (Agent tool 経路・高コスト) 是正候補として機械表示する。reviewTier の値名は互換のため維持。
  const MANUAL_ESCALATION_TOP_N = 30;
  needs.forEach((e, i) => {
    e.reviewTier = i < MANUAL_ESCALATION_TOP_N ? "manual-escalation" : "gemini-auto";
  });

  const queue = {
    generatedAt: new Date().toISOString(),
    gscSnapshot: gsc.week,
    scopeKind: scope,
    scope:
      scope === "all"
        ? "R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)"
        : "GSC流入のある /ranking/ ページ (SEO優先母集団)",
    doneCriteria: "R2 の ai-content が auditRow を通る (blocker 0)",
    summary: {
      total: entries.length,
      done: done.length,
      needsRegen: needs.length,
      needsByReason: byReason,
      // 観測値が順位として成立しない = 生成対象にしない (lib/value-health.mjs)
      notEligible: notEligible.length,
      notEligibleByCode: notEligible.reduce(
        (acc, e) => ((e.dataBlockers ?? []).forEach((c) => (acc[c] = (acc[c] ?? 0) + 1)), acc),
        {},
      ),
      // 既に公開済みだが接地が不健全 = 是正対象 (削除 or metric 修正の判断が要る)
      doneButUnhealthy: doneUnhealthy.length,
      doneImpressions: done.reduce((s, e) => s + e.impressions, 0),
      needsImpressions: needs.reduce((s, e) => s + e.impressions, 0),
      manualEscalationTier: needs.filter((e) => e.reviewTier === "manual-escalation").length,
      geminiDailyLimit: 3,
    },
    entries,
  };

  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(QUEUE_JSON, JSON.stringify(queue, null, 2) + "\n");
  const progress = appendHistory(queue);
  writeLatestMd(queue, progress);
  return queue;
}

/**
 * 進捗履歴を 1 行追記し、消化ペースと完了見込みを返す。
 *
 * 同じ日・同じ scope の行は上書きする (日次 cron が複数回走っても 1 日 1 行に保つ)。
 * ペースは「同一 scope の最古行との done 差 ÷ 経過日数」。行が 1 本だけならペースは null。
 */
function appendHistory(queue) {
  // notEligible は 2026-08-04 追加。**末尾に足す**ので既存行 (7 列) の索引はずれない。
  const header = "date,scope,total,done,needsRegen,missing,incomplete,blocker,notEligible";
  const s = queue.summary;
  const r = s.needsByReason ?? {};
  const missing = Object.entries(r)
    .filter(([k]) => k === "missing" || k.startsWith("fetch-error"))
    .reduce((acc, [, v]) => acc + v, 0);
  const date = queue.generatedAt.slice(0, 10);
  const scope = queue.scopeKind ?? "gsc";
  const row = [date, scope, s.total, s.done, s.needsRegen, missing, r.incomplete ?? 0, r.blocker ?? 0, s.notEligible ?? 0].join(",");

  let rows = [];
  if (existsSync(HISTORY_CSV)) {
    // 列を増やしたときに **旧ヘッダ行がデータ行として残らない**よう、`date,` 始まりを全て落とす
    // (`l !== header` だけだと新ヘッダとしか一致せず、旧ヘッダが 1 行のゴミとして混ざる)
    rows = readFileSync(HISTORY_CSV, "utf8")
      .trim()
      .split("\n")
      .filter((l) => l && !l.startsWith("date,"));
  }
  rows = rows.filter((l) => {
    const c = l.split(",");
    return !(c[0] === date && (c[1] ?? "gsc") === scope);
  });
  rows.push(row);
  rows.sort();
  writeFileSync(HISTORY_CSV, [header, ...rows].join("\n") + "\n");

  // 同一 scope の履歴から消化ペースを出す
  const same = rows
    .map((l) => l.split(","))
    .filter((c) => (c[1] ?? "gsc") === scope)
    .map((c) => ({ date: c[0], done: Number(c[3]), needs: Number(c[4]) }));
  if (same.length < 2) return { perDay: null, etaDays: null, remaining: s.needsRegen, history: same.length };
  const first = same[0];
  const last = same[same.length - 1];
  const days = Math.max(
    1,
    Math.round((new Date(last.date) - new Date(first.date)) / 86_400_000),
  );
  const perDay = (last.done - first.done) / days;
  const etaDays = perDay > 0 ? Math.ceil(s.needsRegen / perDay) : null;
  return { perDay, etaDays, remaining: s.needsRegen, history: same.length, sinceDate: first.date };
}

/**
 * 市区町村ランキングの公開キー数 (git TS SSOT: KNOWN_MUNICIPALITY_RANKING_KEYS)。
 * このキューは都道府県 (app/ranking) 専用で、市区町村は対象外 — その事実を LATEST.md に
 * 明示するためだけに数える。件数はスコープ境界の表示であって処理対象ではない。
 * 素の node からは TS を import できないので tsx eval で実モジュールを読む。
 * 取れなければ null (「不明」表示) にする — 黙って 0 と書くと「対象が無い」と誤読される。
 */
function countPublishedMunicipalityKeys() {
  try {
    const out = execSync(
      `npx tsx -e "import('@stats47/data-configs/geo-scope').then(m => { const k = m.KNOWN_MUNICIPALITY_RANKING_KEYS ?? m.default?.KNOWN_MUNICIPALITY_RANKING_KEYS; console.log(k.size); })"`,
      { cwd: ROOT, encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    const n = Number(out.split("\n").pop());
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function writeLatestMd(queue, progress = null) {
  const s = queue.summary;
  const top = queue.entries.filter((e) => e.status === "needs-regen").slice(0, 20);
  // done を「いつ修正したか」(R2 last-modified) 降順に。新しく直したものが上。
  const recentDone = queue.entries
    .filter((e) => e.status === "done" && e.lastModified)
    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
    .slice(0, 15);
  const notEligible = queue.entries.filter((e) => e.status === "not-eligible");
  const doneUnhealthy = queue.entries.filter(
    (e) => e.status === "done" && e.dataBlockers?.length,
  );
  const failureState = loadFailureState(FAILURES_JSON);
  const quarantined = actionableQuarantinedKeys(queue, quarantinedKeys(failureState));
  const municipalityKeyCount = countPublishedMunicipalityKeys();
  const lines = [
    `# ranking ai-content 是正キュー (LATEST)`,
    ``,
    `- 生成: ${queue.generatedAt}`,
    `- GSC snapshot: ${queue.gscSnapshot} / スコープ: ${queue.scope}`,
    `- done 判定: ${queue.doneCriteria}`,
    `- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 ${municipalityKeyCount ?? "不明"} key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)`,
    ``,
    `## サマリ (${queue.scopeKind === "all" ? "active ranking 全件" : "GSC流入 /ranking/ ページ"} ${s.total} 件)`,
    ``,
    `- ✅ done: ${s.done} 件 (${((s.done / Math.max(1, s.total)) * 100).toFixed(1)}% / impressions 計 ${s.doneImpressions})`,
    `- ⏳ needs-regen: ${s.needsRegen} 件 (impressions 計 ${s.needsImpressions})`,
    `  - 内訳: ${Object.entries(s.needsByReason).map(([k, v]) => `${k} ${v}`).join(" / ") || "—"}`,
    `- 🚫 not-eligible: ${s.notEligible ?? 0} 件 — 観測値が順位として成立しないので生成しない`,
    ...((s.notEligible ?? 0) > 0
      ? [`  - 内訳: ${Object.entries(s.notEligibleByCode ?? {}).map(([k, v]) => `${k} ${v}`).join(" / ")}`]
      : []),
    ``,
    ...(notEligible.length > 0
      ? [
          `## 生成しない (接地データが不成立)`,
          ``,
          `\`--next\` から除外している。metric 側の是正 (軸の絞り込み) か isActive の見直しが要る。`,
          ``,
          `| key | year | 理由 |`,
          `|---|---|---|`,
          ...notEligible.map((e) => `| ${e.rankingKey} | ${e.dataYear ?? "-"} | ${e.dataReason} |`),
          ``,
        ]
      : []),
    ...(quarantined.size > 0
      ? [
          `## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (${quarantined.size} 件)`,
          ``,
          `\`--next\` から除外している。生成しても critic を通らないため。手動 agent での再是正か、`,
          `プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。`,
          ``,
          `| key | 連続失敗 | 直近理由 | 最終失敗日 |`,
          `|---|---|---|---|`,
          ...[...quarantined].map((k) => {
            const v = failureState.keys[k] ?? {};
            return `| ${k} | ${v.failCount ?? "?"} | ${v.lastReason ?? "-"} | ${v.lastFailedAt ?? "-"} |`;
          }),
          ``,
        ]
      : []),
    ...(doneUnhealthy.length > 0
      ? [
          `## ⚠️ 公開済みだが接地データが不成立 (${doneUnhealthy.length} 件)`,
          ``,
          `既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。`,
          ``,
          `| key | year | impressions | 理由 |`,
          `|---|---|---|---|`,
          ...doneUnhealthy.map(
            (e) => `| ${e.rankingKey} | ${e.dataYear ?? "-"} | ${e.impressions} | ${e.dataReason} |`,
          ),
          ``,
        ]
      : []),
    ...(progress
      ? [
          `## 進捗 (progress-history.csv より)`,
          ``,
          progress.perDay == null
            ? `- 履歴 ${progress.history} 点。ペース算出には 2 日以上の履歴が必要`
            : `- 消化ペース: **${progress.perDay.toFixed(1)} 件/日** (${progress.sinceDate} からの平均)`,
          progress.etaDays == null
            ? `- 残り ${progress.remaining} 件 (完了見込みは未算出)`
            : `- 残り ${progress.remaining} 件 → **完了見込み 約 ${progress.etaDays} 日**`,
          ``,
        ]
      : []),
    `## いつ修正したか (done を R2 last-modified 降順・上位15)`,
    ``,
    `| R2 last-modified | key | impressions |`,
    `|---|---|---|`,
    ...recentDone.map((e) => `| ${e.lastModified} | ${e.rankingKey} | ${e.impressions} |`),
    ``,
    `## 次にやるべき上位20 (impressions 降順)`,
    ``,
    `| impressions | key | reason | review | blockers |`,
    `|---|---|---|---|---|`,
    ...top.map((e) => `| ${e.impressions} | ${e.rankingKey} | ${e.reason} | ${e.reviewTier === "manual-escalation" ? "🟠手動是正候補" : "Gemini自動"} | ${(e.blockers || []).join(",") || "-"} |`),
    ``,
    `> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、`,
    `> 既定 ${queue.summary.geminiDailyLimit ?? 3}件を outbox 経由で R2 へ公開する。個別の独自考察改善はローカルの headless author+critic、`,
    `> 大規模な構造補完は \`ai:backfill\` + 全件監査 + 境界サンプル意味レビューを使う。Agent tool 経路の Claude は例外是正のみ。`,
    `> 🟠手動是正候補は GSC 流入上位${queue.summary.manualEscalationTier ?? 30}件。自動失敗が続いた場合だけ agent で是正する。`,
  ];
  writeFileSync(LATEST_MD, lines.join("\n") + "\n");
}

function loadQueue() {
  if (!existsSync(QUEUE_JSON)) throw new Error(`キューが未生成。先に --no-build 無しで実行してください: ${QUEUE_JSON}`);
  return JSON.parse(readFileSync(QUEUE_JSON, "utf8"));
}

async function main() {
  const argv = process.argv.slice(2);
  const noBuild = argv.includes("--no-build");
  const asJson = argv.includes("--json");
  const nextIdx = argv.indexOf("--next");
  const nextN = nextIdx >= 0 ? Number(argv[nextIdx + 1]) : null;
  const scopeIdx = argv.indexOf("--scope");
  const scope = scopeIdx >= 0 ? argv[scopeIdx + 1] : "gsc";
  if (!["gsc", "all"].includes(scope)) {
    throw new Error(`--scope は gsc | all のみ (指定: ${scope})`);
  }

  const queue = noBuild ? loadQueue() : await buildQueue(scope);

  if (nextN != null) {
    // critic に繰り返し落ちる常習キーは自動ピックから外す (毎回バッチを道連れにするのを防ぐ)。
    const quarantined = actionableQuarantinedKeys(queue);
    const eligible = queue.entries.filter(
      (e) => e.status === "needs-regen" && !quarantined.has(e.rankingKey),
    );
    const next = eligible.slice(0, nextN);
    if (asJson) {
      process.stdout.write(JSON.stringify(next, null, 2) + "\n");
    } else {
      for (const e of next) process.stdout.write(`${e.rankingKey}\n`);
      process.stderr.write(
        `\n[next ${nextN}] needs-regen ${queue.summary.needsRegen} 件` +
          (quarantined.size ? ` (quarantine ${quarantined.size} 件除外)` : "") +
          ` 中 上位 ${next.length} (impressions ${next[0]?.impressions ?? 0}〜${next[next.length - 1]?.impressions ?? 0})\n`,
      );
    }
    return;
  }

  if (asJson) {
    process.stdout.write(JSON.stringify(queue.summary, null, 2) + "\n");
  } else {
    const s = queue.summary;
    process.stdout.write(
      `=== ranking ai-content 是正キュー (GSC ${queue.gscSnapshot}) ===\n` +
        `総 ${s.total} / ✅done ${s.done} / ⏳needs-regen ${s.needsRegen} / 🚫not-eligible ${s.notEligible ?? 0}\n` +
        `needs 内訳: ${Object.entries(s.needsByReason).map(([k, v]) => `${k} ${v}`).join(" / ") || "—"}\n` +
        ((s.doneButUnhealthy ?? 0) > 0
          ? `⚠️ 公開済みだが接地データが不成立: ${s.doneButUnhealthy} 件 (LATEST.md 参照)\n`
          : "") +
        `→ ${QUEUE_JSON}\n→ ${LATEST_MD}\n`,
    );
  }
}

main().catch((e) => {
  process.stderr.write(`[build-ai-content-queue] ${e instanceof Error ? e.message : String(e)}\n`);
  process.exit(1);
});
