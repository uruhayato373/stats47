#!/usr/bin/env node
/**
 * analyze-x-winning-patterns.mjs — X 投稿の勝ち要因抽出 (blog analyze-winning-patterns.mjs の X 版)
 *
 * posts.json の X 投稿 (template あり・impressions>0) を winners/losers に分割し、
 * feature (template / category / 時間帯 / 曜日) ごとに lift・confidence を出す。
 * 結果は投稿生成 (post-x-batch ③) が参照する `.claude/state/sns/x-winning-patterns.json` と
 * 人間向け `docs/04_レビュー/<date>-x-winning-patterns.md` に書く。
 *
 * ★実証ベース (evidence-based-judgment.md):
 *   - 実測 impressions を outcome にする (推測しない)。
 *   - サンプルが閾値未満なら `dataSufficient:false` と明示し、暫定は競合知見 (感情喚起テーマ) を注記。
 *   - `template_inferred` の行 (backfill 推定) は confidence を 1 段下げる。
 *
 * Usage:
 *   node .claude/scripts/sns/analyze-x-winning-patterns.mjs [--min-samples 20] [--date YYYY-MM-DD]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const store = require(path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"));

const STATE_PATH = path.join(PROJECT_ROOT, ".claude/state/sns/x-winning-patterns.json");
const INDEX_PATH = path.join(PROJECT_ROOT, ".claude/state/sns/metric-discovery-index.json");

function arg(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : def;
}

function loadCategoryMap() {
  if (!fs.existsSync(INDEX_PATH)) return new Map();
  const payload = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  return new Map((payload.entries || []).map((e) => [e.key, e.category]));
}

function jstParts(post) {
  const raw = post.scheduled_at || post.posted_at || post.created_at || "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return { hour: null, dow: null };
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return { hour: jst.getUTCHours(), dow: jst.getUTCDay() }; // 0=日
}

const DOW_LABEL = ["日", "月", "火", "水", "木", "金", "土"];

function timeBucket(hour) {
  if (hour == null) return "unknown";
  if (hour >= 7 && hour < 10) return "07-09";
  if (hour >= 10 && hour < 12) return "10-11";
  if (hour >= 12 && hour < 14) return "12-13";
  if (hour >= 18 && hour < 21) return "18-20";
  if (hour >= 21 && hour <= 23) return "21-23";
  return "other";
}

function main() {
  const minSamples = Number(arg("--min-samples", "20"));
  const today = arg("--date", new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10));
  const catByKey = loadCategoryMap();

  const all = store.loadAll().filter((p) => p.platform === "x" && !p.deleted_at);
  const withImp = all.filter((p) => Number(p.impressions) > 0 && p.template);

  const state = {
    generatedAt: new Date().toISOString(),
    outcome: "impressions",
    sampleSize: {
      totalX: all.length,
      withTemplate: all.filter((p) => p.template).length,
      withImpressions: withImp.length,
      inferred: all.filter((p) => p.template_inferred).length,
    },
    dataSufficient: withImp.length >= minSamples,
    featureSignals: [],
    recommendation: [],
  };

  if (!state.dataSufficient) {
    state.recommendation.push(
      `データ不足 (impressions>0 かつ template ありが ${withImp.length} 件 < ${minSamples})。` +
        `勝ちパターンは未確定。まず update-sns-metrics --platform x で X メトリクスを再収集する ` +
        `(2026-04 以降 X の計測が凍結)。それまでの暫定は競合知見 (感情喚起テーマ: 財布/地元愛/子育て/格差/意外性) を §2 の重みに使う。`,
    );
  } else {
    // impressions 中央値で winners/losers 分割
    const imps = withImp.map((p) => Number(p.impressions)).sort((a, b) => a - b);
    const median = imps[Math.floor(imps.length / 2)];
    state.medianImpressions = median;
    const isWinner = (p) => Number(p.impressions) >= median;
    const winnerTotal = withImp.filter(isWinner).length;
    const baseRate = winnerTotal / withImp.length;

    const feature = (name, valueOf) => {
      const groups = new Map();
      for (const p of withImp) {
        const v = valueOf(p);
        if (v == null) continue;
        if (!groups.has(v)) groups.set(v, { winners: 0, losers: 0, inferred: 0 });
        const g = groups.get(v);
        if (isWinner(p)) g.winners++;
        else g.losers++;
        if (p.template_inferred) g.inferred++;
      }
      for (const [value, g] of groups) {
        const n = g.winners + g.losers;
        if (n < 3) continue; // 弱すぎる信号は出さない
        const rate = g.winners / n;
        const lift = baseRate > 0 ? rate / baseRate : 0;
        let confidence = n >= 10 ? "hi" : n >= 5 ? "mid" : "lo";
        // 推定 (backfill) が過半なら confidence を 1 段下げる
        if (g.inferred > n / 2) {
          confidence = confidence === "hi" ? "mid" : confidence === "mid" ? "lo" : "lo";
        }
        state.featureSignals.push({
          feature: name,
          value,
          n,
          winners: g.winners,
          lift: Number(lift.toFixed(2)),
          confidence,
          inferredShare: Number((g.inferred / n).toFixed(2)),
        });
      }
    };

    feature("template", (p) => p.template);
    feature("category", (p) => catByKey.get(p.content_key) || null);
    feature("timeBucket", (p) => timeBucket(jstParts(p).hour));
    feature("dayOfWeek", (p) => {
      const d = jstParts(p).dow;
      return d == null ? null : DOW_LABEL[d];
    });

    state.featureSignals.sort((a, b) => b.lift - a.lift);
    const top = state.featureSignals.filter((s) => s.confidence !== "lo" && s.lift > 1.1).slice(0, 5);
    if (top.length) {
      state.recommendation.push(
        "効いている可能性 (confidence hi/mid・lift>1.1): " +
          top.map((s) => `${s.feature}=${s.value} (lift ${s.lift})`).join(" / ") +
          "。定性裏取りの上で §2-10 承認ゲート経由でカタログ重みに反映。",
      );
    } else {
      state.recommendation.push("有意な勝ち信号なし (lift>1.1 かつ confidence hi/mid が 0)。サンプル拡充を継続。");
    }
  }

  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));

  // 人間向けレビュー md
  const md = [
    "---",
    "type: x-winning-patterns",
    `date: ${today}`,
    `data_sufficient: ${state.dataSufficient}`,
    "---",
    "",
    `# X 勝ちパターン分析 (${today})`,
    "",
    `- サンプル: X 全 ${state.sampleSize.totalX} 件 / template あり ${state.sampleSize.withTemplate} / ` +
      `impressions>0 ${state.sampleSize.withImpressions} / うち推定(backfill) ${state.sampleSize.inferred}`,
    `- outcome: impressions${state.medianImpressions ? ` (中央値 ${state.medianImpressions})` : ""}`,
    `- データ十分: ${state.dataSufficient ? "はい" : "**いいえ (未確定)**"}`,
    "",
    "## 推奨",
    ...state.recommendation.map((r) => `- ${r}`),
    "",
    "## feature signals (lift 降順)",
    "",
    "| feature | value | n | winners | lift | confidence | 推定率 |",
    "|---|---|---:|---:|---:|---|---:|",
    ...state.featureSignals.map(
      (s) => `| ${s.feature} | ${s.value} | ${s.n} | ${s.winners} | ${s.lift} | ${s.confidence} | ${s.inferredShare} |`,
    ),
    "",
    "> lift>1 = そのフィーチャを持つ投稿が中央値以上になりやすい。confidence lo と 推定率>0.5 は鵜呑みにしない。",
    "> カタログ (§2) への反映は §2-10 の人間承認ゲート経由。",
    "",
  ].join("\n");
  const mdPath = path.join(PROJECT_ROOT, "docs/04_レビュー", `${today}-x-winning-patterns.md`);
  fs.mkdirSync(path.dirname(mdPath), { recursive: true });
  fs.writeFileSync(mdPath, md);

  console.log(
    `[analyze-x-winning-patterns] dataSufficient=${state.dataSufficient} ` +
      `signals=${state.featureSignals.length} → ${path.relative(PROJECT_ROOT, STATE_PATH)} + ${path.relative(PROJECT_ROOT, mdPath)}`,
  );
}

main();
