/**
 * NSM メトリクスリーダー（週次レビュー用）
 *
 * GA4 + GSC + PageSpeed Insights から今週・前週のデータを取得し、週次レビューに
 * 組み込むためのサマリ + 差分を計算する。`/weekly-review` スキル Phase 1 から呼ばれる。
 *
 * stats47 の NSM は「週間エンゲージドセッション数」(GA4 engagedSessions)。
 * 定義は `[Critical Review] North Star Metric` Issue を参照（`gh issue list --label critical-review`）。
 *
 * 必要な資源:
 *   - stats47-*.json サービスアカウント鍵（リポジトリルート、gitignored）
 *   - PSI_API_KEY env（任意、指定すれば PSI を取得）
 *
 * CLI 使用:
 *   node .claude/scripts/lib/metrics-reader.mjs [--json]
 */

import { google } from "googleapis";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = process.cwd();
const KEY_CANDIDATES = [
  "stats47-f6b5dae19196.json",
  "stats47-31b18ee67144.json",
];
const GA4_PROPERTY_ID = "463218070";
const GSC_SITE_URL = "sc-domain:stats47.jp";
const GSC_DELAY_DAYS = 3;
const PSI_TARGET_URL = "https://stats47.jp/";

// ── Date helpers ─────────────────────────────────────────────────

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

export function computeWeekRanges() {
  const today = new Date();
  const ga4End = new Date(today);
  ga4End.setDate(ga4End.getDate() - 1);
  const ga4Start = new Date(ga4End);
  ga4Start.setDate(ga4Start.getDate() - 6);
  const ga4PrevEnd = new Date(ga4Start);
  ga4PrevEnd.setDate(ga4PrevEnd.getDate() - 1);
  const ga4PrevStart = new Date(ga4PrevEnd);
  ga4PrevStart.setDate(ga4PrevStart.getDate() - 6);

  const gscEnd = new Date(today);
  gscEnd.setDate(gscEnd.getDate() - GSC_DELAY_DAYS);
  const gscStart = new Date(gscEnd);
  gscStart.setDate(gscStart.getDate() - 6);
  const gscPrevEnd = new Date(gscStart);
  gscPrevEnd.setDate(gscPrevEnd.getDate() - 1);
  const gscPrevStart = new Date(gscPrevEnd);
  gscPrevStart.setDate(gscPrevStart.getDate() - 6);

  return {
    ga4: {
      this: { start: formatDate(ga4Start), end: formatDate(ga4End) },
      prev: { start: formatDate(ga4PrevStart), end: formatDate(ga4PrevEnd) },
    },
    gsc: {
      this: { start: formatDate(gscStart), end: formatDate(gscEnd) },
      prev: { start: formatDate(gscPrevStart), end: formatDate(gscPrevEnd) },
    },
  };
}

// ── Auth ─────────────────────────────────────────────────────────

function resolveKeyFile() {
  for (const name of KEY_CANDIDATES) {
    const full = path.join(REPO_ROOT, name);
    if (existsSync(full)) return full;
  }
  throw new Error(
    `サービスアカウント鍵が見つかりません: ${KEY_CANDIDATES.join(" / ")} をリポジトリルートに配置してください`,
  );
}

function createAuth(scopes) {
  return new google.auth.GoogleAuth({ keyFile: resolveKeyFile(), scopes });
}

// ── GA4 ───────────────────────────────────────────────────────────

async function runGa4Report(auth, body) {
  const analyticsdata = google.analyticsdata({ version: "v1beta", auth });
  const { data } = await analyticsdata.properties.runReport({
    property: `properties/${GA4_PROPERTY_ID}`,
    requestBody: body,
  });
  return data;
}

async function fetchGa4Weekly(ranges) {
  const auth = createAuth([
    "https://www.googleapis.com/auth/analytics.readonly",
  ]);

  // 同一期間内で 2 期間比較するため、2 回 API を叩いて合算する
  const [thisRes, prevRes] = await Promise.all([
    runGa4Report(auth, {
      dateRanges: [{ startDate: ranges.this.start, endDate: ranges.this.end }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
      ],
      limit: 20,
    }),
    runGa4Report(auth, {
      dateRanges: [{ startDate: ranges.prev.start, endDate: ranges.prev.end }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "engagedSessions" },
        { name: "engagementRate" },
      ],
      limit: 20,
    }),
  ]);

  const toChannelMap = (res) => {
    const map = {};
    for (const row of res.rows || []) {
      const channel = row.dimensionValues?.[0]?.value || "(unknown)";
      map[channel] = {
        users: parseFloat(row.metricValues?.[0]?.value || "0"),
        sessions: parseFloat(row.metricValues?.[1]?.value || "0"),
        engagedSessions: parseFloat(row.metricValues?.[2]?.value || "0"),
        engagementRate: parseFloat(row.metricValues?.[3]?.value || "0"),
      };
    }
    return map;
  };

  const thisMap = toChannelMap(thisRes);
  const prevMap = toChannelMap(prevRes);
  const allChannels = new Set([
    ...Object.keys(thisMap),
    ...Object.keys(prevMap),
  ]);

  const channels = [...allChannels].map((channel) => {
    const t = thisMap[channel] || {
      users: 0,
      sessions: 0,
      engagedSessions: 0,
      engagementRate: 0,
    };
    const p = prevMap[channel] || {
      users: 0,
      sessions: 0,
      engagedSessions: 0,
      engagementRate: 0,
    };
    return {
      channel,
      thisUsers: t.users,
      prevUsers: p.users,
      userDelta: t.users - p.users,
      userDeltaPct:
        p.users > 0 ? ((t.users - p.users) / p.users) * 100 : null,
      thisSessions: t.sessions,
      prevSessions: p.sessions,
      thisEngagedSessions: t.engagedSessions,
      prevEngagedSessions: p.engagedSessions,
      thisEngagementRate: t.engagementRate,
    };
  });
  channels.sort((a, b) => b.thisUsers - a.thisUsers);

  const total = channels.reduce(
    (acc, c) => ({
      thisUsers: acc.thisUsers + c.thisUsers,
      prevUsers: acc.prevUsers + c.prevUsers,
      thisSessions: acc.thisSessions + c.thisSessions,
      prevSessions: acc.prevSessions + c.prevSessions,
      thisEngagedSessions: acc.thisEngagedSessions + c.thisEngagedSessions,
      prevEngagedSessions: acc.prevEngagedSessions + c.prevEngagedSessions,
    }),
    {
      thisUsers: 0,
      prevUsers: 0,
      thisSessions: 0,
      prevSessions: 0,
      thisEngagedSessions: 0,
      prevEngagedSessions: 0,
    },
  );
  total.userDelta = total.thisUsers - total.prevUsers;
  total.userDeltaPct =
    total.prevUsers > 0 ? (total.userDelta / total.prevUsers) * 100 : null;
  total.engagedSessionDelta =
    total.thisEngagedSessions - total.prevEngagedSessions;
  total.engagedSessionDeltaPct =
    total.prevEngagedSessions > 0
      ? (total.engagedSessionDelta / total.prevEngagedSessions) * 100
      : null;

  const organic = channels.find((c) => c.channel === "Organic Search") || null;

  return { channels, total, organic };
}

// ── GSC ───────────────────────────────────────────────────────────

async function fetchGscQuery(auth, startDate, endDate, opts = {}) {
  const searchconsole = google.searchconsole({ version: "v1", auth });
  const { data } = await searchconsole.searchanalytics.query({
    siteUrl: GSC_SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: opts.dimensions || [],
      rowLimit: opts.rowLimit || 10,
    },
  });
  return data.rows || [];
}

async function fetchGscWeekly(ranges) {
  const auth = createAuth([
    "https://www.googleapis.com/auth/webmasters.readonly",
  ]);

  const [thisTotal, prevTotal, topQueries] = await Promise.all([
    fetchGscQuery(auth, ranges.this.start, ranges.this.end),
    fetchGscQuery(auth, ranges.prev.start, ranges.prev.end),
    fetchGscQuery(auth, ranges.this.start, ranges.this.end, {
      dimensions: ["query"],
      rowLimit: 10,
    }),
  ]);

  const normalize = (row) =>
    row
      ? {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          position: row.position || 0,
        }
      : { clicks: 0, impressions: 0, ctr: 0, position: 0 };

  const thisData = normalize(thisTotal[0]);
  const prevData = normalize(prevTotal[0]);

  return {
    total: {
      thisClicks: thisData.clicks,
      prevClicks: prevData.clicks,
      clickDelta: thisData.clicks - prevData.clicks,
      clickDeltaPct:
        prevData.clicks > 0
          ? ((thisData.clicks - prevData.clicks) / prevData.clicks) * 100
          : null,
      thisImpressions: thisData.impressions,
      prevImpressions: prevData.impressions,
      impressionDelta: thisData.impressions - prevData.impressions,
      thisCtr: thisData.ctr,
      prevCtr: prevData.ctr,
      thisPosition: thisData.position,
      prevPosition: prevData.position,
    },
    topQueries: topQueries.map((r) => ({
      query: r.keys[0],
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: r.ctr,
      position: r.position,
    })),
  };
}

// ── PSI ──────────────────────────────────────────────────────────

async function fetchPsiSummary(targetUrl = PSI_TARGET_URL) {
  if (!process.env.PSI_API_KEY) {
    return { skipped: true, reason: "PSI_API_KEY 未設定" };
  }
  const params = new URLSearchParams({
    url: targetUrl,
    strategy: "mobile",
    key: process.env.PSI_API_KEY,
  });
  for (const c of ["performance", "accessibility", "best-practices", "seo"]) {
    params.append("category", c);
  }
  const endpoint = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`PSI ${res.status}`);
  const data = await res.json();

  const categories = data.lighthouseResult?.categories || {};
  const audits = data.lighthouseResult?.audits || {};
  const pick = (k) =>
    categories[k]?.score != null
      ? Math.round(categories[k].score * 100)
      : null;
  const lab = (k) => audits[k]?.numericValue ?? null;

  return {
    url: targetUrl,
    strategy: "mobile",
    scores: {
      performance: pick("performance"),
      accessibility: pick("accessibility"),
      best_practices: pick("best-practices"),
      seo: pick("seo"),
    },
    lab_data: {
      LCP_ms: lab("largest-contentful-paint"),
      TBT_ms: lab("total-blocking-time"),
      CLS: lab("cumulative-layout-shift"),
      FCP_ms: lab("first-contentful-paint"),
      TTI_ms: lab("interactive"),
    },
  };
}

// ── Main entry ────────────────────────────────────────────────────

export async function fetchWeeklyNsmMetrics() {
  const ranges = computeWeekRanges();

  const [ga4, gsc, psi] = await Promise.all([
    fetchGa4Weekly(ranges.ga4).catch((e) => ({
      error: `GA4 取得失敗: ${e.message}`,
    })),
    fetchGscWeekly(ranges.gsc).catch((e) => ({
      error: `GSC 取得失敗: ${e.message}`,
    })),
    fetchPsiSummary().catch((e) => ({ error: `PSI 取得失敗: ${e.message}` })),
  ]);

  return {
    generated_at: new Date().toISOString(),
    ranges,
    ga4,
    gsc,
    psi,
    notes: [
      `GSC データは 3 日遅延のため、直近期間は ${ranges.gsc.this.start} 〜 ${ranges.gsc.this.end} を採用`,
      "NSM = 週間エンゲージドセッション数 (GA4 engagedSessions 全チャネル合計)",
      "NSM 定義: [Critical Review] North Star Metric Issue (gh issue list --label critical-review)",
    ],
  };
}

// ── Markdown formatter ───────────────────────────────────────────

function fmtDelta(delta, pct) {
  if (delta == null) return "-";
  const sign = delta > 0 ? "+" : "";
  const pctStr = pct != null ? ` (${sign}${pct.toFixed(1)}%)` : "";
  return `${sign}${delta}${pctStr}`;
}

export function formatNsmSection(metrics) {
  const lines = [];
  lines.push("## NSM（週間エンゲージドセッション数）");
  lines.push("");

  if (metrics.ga4.error) {
    lines.push(`⚠️ GA4: ${metrics.ga4.error}`);
    lines.push("");
  } else {
    const r = metrics.ranges.ga4;
    lines.push(
      `### GA4 (${r.this.start} 〜 ${r.this.end} vs ${r.prev.start} 〜 ${r.prev.end})`,
    );
    lines.push("");
    lines.push("| 指標 | 今週 | 前週 | 増減 |");
    lines.push("|---|---:|---:|---:|");
    const t = metrics.ga4.total;
    lines.push(
      `| **engagedSessions (★NSM)** | **${t.thisEngagedSessions}** | ${t.prevEngagedSessions} | ${fmtDelta(t.engagedSessionDelta, t.engagedSessionDeltaPct)} |`,
    );
    lines.push(
      `| activeUsers | ${t.thisUsers} | ${t.prevUsers} | ${fmtDelta(t.userDelta, t.userDeltaPct)} |`,
    );
    const sessDelta = t.thisSessions - t.prevSessions;
    const sessPct =
      t.prevSessions > 0 ? (sessDelta / t.prevSessions) * 100 : null;
    lines.push(
      `| sessions | ${t.thisSessions} | ${t.prevSessions} | ${fmtDelta(sessDelta, sessPct)} |`,
    );
    lines.push("");
    lines.push("#### チャネル別");
    lines.push("| channel | users | prev | delta | engaged | engagement rate |");
    lines.push("|---|---:|---:|---:|---:|---:|");
    for (const c of metrics.ga4.channels) {
      lines.push(
        `| ${c.channel} | ${c.thisUsers} | ${c.prevUsers} | ${fmtDelta(c.userDelta, c.userDeltaPct)} | ${c.thisEngagedSessions} | ${(c.thisEngagementRate * 100).toFixed(1)}% |`,
      );
    }
    lines.push("");
  }

  if (metrics.gsc.error) {
    lines.push(`⚠️ GSC: ${metrics.gsc.error}`);
    lines.push("");
  } else {
    const r = metrics.ranges.gsc;
    lines.push(
      `### GSC (${r.this.start} 〜 ${r.this.end} vs ${r.prev.start} 〜 ${r.prev.end})`,
    );
    lines.push("");
    lines.push("| 指標 | 今週 | 前週 | 増減 |");
    lines.push("|---|---:|---:|---:|");
    const t = metrics.gsc.total;
    lines.push(
      `| clicks | ${t.thisClicks} | ${t.prevClicks} | ${fmtDelta(t.clickDelta, t.clickDeltaPct)} |`,
    );
    const imprPct =
      t.prevImpressions > 0
        ? (t.impressionDelta / t.prevImpressions) * 100
        : null;
    lines.push(
      `| impressions | ${t.thisImpressions} | ${t.prevImpressions} | ${fmtDelta(t.impressionDelta, imprPct)} |`,
    );
    lines.push(
      `| CTR | ${(t.thisCtr * 100).toFixed(2)}% | ${(t.prevCtr * 100).toFixed(2)}% | ${((t.thisCtr - t.prevCtr) * 100).toFixed(2)}pt |`,
    );
    lines.push(
      `| 平均順位 | ${t.thisPosition.toFixed(1)} | ${t.prevPosition.toFixed(1)} | ${(t.thisPosition - t.prevPosition).toFixed(1)} |`,
    );
    lines.push("");

    if (metrics.gsc.topQueries.length > 0) {
      lines.push("#### トップクエリ（今週）");
      lines.push("| # | query | clicks | impr | CTR | pos |");
      lines.push("|---:|---|---:|---:|---:|---:|");
      metrics.gsc.topQueries.forEach((q, i) => {
        lines.push(
          `| ${i + 1} | ${q.query} | ${q.clicks} | ${q.impressions} | ${(q.ctr * 100).toFixed(1)}% | ${q.position.toFixed(1)} |`,
        );
      });
      lines.push("");
    }
  }

  if (metrics.psi) {
    if (metrics.psi.error) {
      lines.push(`⚠️ PSI: ${metrics.psi.error}`);
      lines.push("");
    } else if (metrics.psi.skipped) {
      lines.push(`_PSI: ${metrics.psi.reason}_`);
      lines.push("");
    } else {
      lines.push(
        `### PageSpeed Insights (${metrics.psi.url}, ${metrics.psi.strategy})`,
      );
      lines.push("");
      lines.push("| カテゴリ | スコア |");
      lines.push("|---|---:|");
      const s = metrics.psi.scores;
      lines.push(`| Performance | ${s.performance ?? "N/A"} |`);
      lines.push(`| Accessibility | ${s.accessibility ?? "N/A"} |`);
      lines.push(`| Best Practices | ${s.best_practices ?? "N/A"} |`);
      lines.push(`| SEO | ${s.seo ?? "N/A"} |`);
      lines.push("");
      const lab = metrics.psi.lab_data;
      lines.push("| Core Web Vitals (Lab) | 値 | 判定 |");
      lines.push("|---|---:|---|");
      const verdict = (ms, good, ok) =>
        ms == null ? "N/A" : ms <= good ? "✓" : ms <= ok ? "⚠" : "✗";
      lines.push(
        `| LCP | ${lab.LCP_ms != null ? Math.round(lab.LCP_ms) + " ms" : "N/A"} | ${verdict(lab.LCP_ms, 2500, 4000)} |`,
      );
      lines.push(
        `| TBT | ${lab.TBT_ms != null ? Math.round(lab.TBT_ms) + " ms" : "N/A"} | ${verdict(lab.TBT_ms, 200, 600)} |`,
      );
      const clsVerdict =
        lab.CLS == null
          ? "N/A"
          : lab.CLS <= 0.1
            ? "✓"
            : lab.CLS <= 0.25
              ? "⚠"
              : "✗";
      lines.push(
        `| CLS | ${lab.CLS != null ? lab.CLS.toFixed(3) : "N/A"} | ${clsVerdict} |`,
      );
      lines.push("");
    }
  }

  if (metrics.notes?.length) {
    lines.push("> 備考:");
    for (const n of metrics.notes) lines.push(`> - ${n}`);
    lines.push("");
  }

  return lines.join("\n");
}

// CLI 直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const mode = process.argv.includes("--json") ? "json" : "markdown";
  const metrics = await fetchWeeklyNsmMetrics();
  if (mode === "json") {
    console.log(JSON.stringify(metrics, null, 2));
  } else {
    console.log(formatNsmSection(metrics));
  }
}
