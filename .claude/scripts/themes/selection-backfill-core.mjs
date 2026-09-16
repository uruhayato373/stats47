/**
 * selection-backfill-core.mjs — ThemeCatalog の選定根拠 (selection) を一次資料で裏付ける backfill の純粋部。
 *
 * THEME-SELECTION-BACKFILL-01 (.claude/todo/backlog.md)。CLI は selection-backfill.mjs、夜間 driver は
 * run-selection-backfill.sh。`node --import tsx` で起動する (TS の catalog / registry を直接読む)。
 *
 * 流れ (1 テーマ):
 *   listTargets   … adoptionCriteria 未記入の非 context 指標と、その metric config の事実 (出典・コード・年)
 *   buildPrompt   … モデルに渡す指示。**モデルはファイルを触らず JSON を返すだけ** (tools は WebFetch/WebSearch のみ)
 *   gateEntries   … 決定的検査 (対象内 / 定型文 / https 到達 / 引用の実在 / コード一致 / 基準の語彙)
 *   applySelections … 通過分だけ書く。インライン定義は <theme>.ts の selection を置換、
 *                    expanded.ts 由来 (tuple) は selection-evidence.ts を丸ごと再生成
 *
 * 禁止 (カードの規定): role 変更・rejectedCandidates への追加・gate 未通過の書き込み。
 * role の推奨は report に出すだけで書かない。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { THEME_CATALOGS } from "../../../packages/data-configs/src/theme-catalog/index.ts";
import {
  ADOPTION_CRITERIA,
  SELECTION_BOILERPLATE_PHRASES,
  SELECTION_STAT_CODE_RE,
} from "../../../packages/data-configs/src/theme-catalog/types.ts";
import { METRICS_REGISTRY } from "../../../packages/data-configs/src/registry.ts";
import { loadPulled } from "../lib/estat-catalog/pulled.mjs";

const __filename = fileURLToPath(import.meta.url);
export const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
export const CATALOG_DIR = path.join(PROJECT_ROOT, "packages/data-configs/src/theme-catalog");
export const EVIDENCE_FILE = path.join(CATALOG_DIR, "selection-evidence.ts");
export const ESTAT_PULL_DIR = path.join(PROJECT_ROOT, ".local/estat-catalog");

const CRITERIA_LABELS = {
  representativeness: "代表性 (テーマの主要な問いを直接表す)",
  comparability: "比較可能性 (都道府県間・時系列で同一基準)",
  complementarity: "補完性 (他の採用指標と異なる角度)",
  dataQuality: "データ品質 (欠損・改定が少ない)",
  readerValue: "読者への有用性 (読者の意思決定に直接役立つ)",
};

const RATIONALE_MIN = 40;
const RATIONALE_MAX = 400;
const QUOTE_MIN = 10;
const QUOTE_MAX = 160;

// ---------------------------------------------------------------------------
// 1. 対象と事実
// ---------------------------------------------------------------------------

function yearsSummary(years) {
  if (years === "all") return "全年";
  if (!years || typeof years !== "object") return "不明";
  if (Array.isArray(years.years)) {
    const ys = years.years;
    return ys.length <= 1 ? `${ys[0] ?? "?"} (単年)` : `${ys[0]}〜${ys[ys.length - 1]} (${ys.length} 年分)`;
  }
  if (typeof years.from === "number" && typeof years.to === "number") {
    return years.from === years.to ? `${years.from} (単年)` : `${years.from}〜${years.to}`;
  }
  return "不明";
}

/** metric config から、モデルと gate が使う事実だけを抜く (値は含めない)。 */
export function metricFacts(rankingKey, registry = METRICS_REGISTRY) {
  const m = registry[rankingKey];
  if (!m) return null;
  const src = m.source ?? {};
  return {
    rankingKey,
    title: m.title,
    subtitle: m.subtitle ?? "",
    description: m.description ?? "",
    unit: m.unit ?? "",
    years: yearsSummary(m.years),
    source: {
      kind: src.kind ?? "unknown",
      displayName: src.displayName ?? "",
      url: src.url ?? "",
      statsDataId: src.kind === "estat" ? (src.statsDataId ?? "") : "",
      cdCat01: src.kind === "estat" ? (src.cdCat01 ?? "") : "",
    },
    className: "",
  };
}

function needsBackfill(metric) {
  if (metric.role === "context") return false;
  return !metric.selection || !metric.selection.adoptionCriteria?.length;
}

/**
 * テーマごとの backfill 対象。`theme` 指定なしで全テーマ (対象 0 のテーマは除く)。
 * 返す順は残件の多い順 (夜間に「大きいテーマから」片付ける)。
 */
export function listTargets({ theme, catalogs = THEME_CATALOGS, registry = METRICS_REGISTRY } = {}) {
  const out = [];
  for (const c of Object.values(catalogs)) {
    if (theme && c.key !== theme) continue;
    const metrics = c.metrics
      .filter(needsBackfill)
      .map((m) => ({
        rankingKey: m.rankingKey,
        shortLabel: m.shortLabel,
        role: m.role,
        currentSelection: m.selection ?? null,
        facts: metricFacts(m.rankingKey, registry),
      }));
    if (metrics.length === 0) continue;
    out.push({
      themeKey: c.key,
      themeTitle: c.title,
      themeDescription: c.description,
      sections: (c.sections ?? []).map((s) => s.title),
      evidenceQuestions: (c.evidenceTopics ?? []).map((t) => `${t.title}: ${t.question}`),
      metrics,
    });
  }
  return out.sort((a, b) => b.metrics.length - a.metrics.length || a.themeKey.localeCompare(b.themeKey));
}

/** pull 済み e-Stat カタログ (`catalog.mjs pull`) の分類行索引。無ければ null (gate はコード解決を skip して記録する)。 */
export function loadClassIndex(pullDir = ESTAT_PULL_DIR) {
  if (!fs.existsSync(path.join(pullDir, "manifest.json"))) return null;
  const { tables } = loadPulled(pullDir);
  const statCodeById = new Map(tables.map((t) => [t.statsDataId, t.statCode]));
  const shardCache = new Map();
  return {
    /** statsDataId + code → 分類行 (無ければ null) */
    resolve(statsDataId, code) {
      const statCode = statCodeById.get(statsDataId);
      if (!statCode) return null;
      if (!shardCache.has(statCode)) {
        const p = path.join(pullDir, `index/classes/${statCode}.json`);
        shardCache.set(statCode, fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : []);
      }
      return shardCache.get(statCode).find((r) => r.statsDataId === statsDataId && r.code === code) ?? null;
    },
  };
}

/** 対象の facts に e-Stat 分類名を足す (prompt に「このコードはこの名前」を渡し、モデルの誤記を減らす)。 */
export function attachClassNames(target, classIndex) {
  if (!classIndex) return target;
  for (const m of target.metrics) {
    const f = m.facts;
    if (!f || !f.source.statsDataId || !f.source.cdCat01) continue;
    const row = classIndex.resolve(f.source.statsDataId, f.source.cdCat01);
    if (row) f.className = row.name;
  }
  return target;
}

// ---------------------------------------------------------------------------
// 2. prompt / schema
// ---------------------------------------------------------------------------

export const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["theme", "entries", "skipped", "roleRecommendations"],
  properties: {
    theme: { type: "string" },
    entries: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rankingKey", "proposedBy", "sourceUrl", "sourceKind", "evidenceQuote", "rationale", "adoptionCriteria"],
        properties: {
          rankingKey: { type: "string" },
          proposedBy: { type: "string" },
          sourceUrl: { type: "string" },
          sourceKind: { type: "string", enum: ["html", "pdf"] },
          evidenceQuote: { type: "string" },
          rationale: { type: "string" },
          adoptionCriteria: { type: "array", items: { type: "string", enum: [...ADOPTION_CRITERIA] } },
          readerQuestion: { type: "string" },
          targetReaderOrDecision: { type: "string" },
        },
      },
    },
    skipped: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rankingKey", "reason"],
        properties: { rankingKey: { type: "string" }, reason: { type: "string" } },
      },
    },
    roleRecommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["rankingKey", "currentRole", "suggestedRole", "reason"],
        properties: {
          rankingKey: { type: "string" },
          currentRole: { type: "string" },
          suggestedRole: { type: "string", enum: ["primary", "secondary", "context"] },
          reason: { type: "string" },
        },
      },
    },
  },
};

export const SYSTEM_PROMPT =
  "あなたは統計テーマの指標選定根拠を一次資料で裏付ける調査員です。ユーザーメッセージの指示だけに従い、" +
  "WebSearch / WebFetch で実際に読んだ資料だけを根拠にして、要求された JSON を返してください。" +
  "前置き・補足説明・確認の質問は書かないでください。";

function metricBlock(m) {
  const f = m.facts;
  const lines = [
    `- rankingKey: ${m.rankingKey}`,
    `  役割: ${m.role} / カタログ上の短縮名: ${m.shortLabel}`,
  ];
  if (!f) {
    lines.push("  (metric config 不在 — skipped に理由「config 不在」で入れる)");
    return lines.join("\n");
  }
  lines.push(`  正式名: ${f.title}${f.subtitle ? ` (${f.subtitle})` : ""} / 単位: ${f.unit || "不明"} / 年: ${f.years}`);
  if (f.description) lines.push(`  定義: ${f.description}`);
  const s = f.source;
  const srcParts = [s.displayName || s.kind];
  if (s.statsDataId) srcParts.push(`statsDataId ${s.statsDataId}`);
  if (s.cdCat01) srcParts.push(`cdCat01 ${s.cdCat01}${f.className ? ` = ${f.className}` : ""}`);
  if (s.url) srcParts.push(s.url);
  lines.push(`  データ出典: ${srcParts.join(" / ")}`);
  return lines.join("\n");
}

/** モデルへの指示。Task Capsule + OUTPUT FORMAT を冒頭に置く (.claude/rules/agent-output-contract.md)。 */
export function buildPrompt(target, { surveyedAt }) {
  const criteria = ADOPTION_CRITERIA.map((k) => `  - ${k}: ${CRITERIA_LABELS[k]}`).join("\n");
  const boiler = SELECTION_BOILERPLATE_PHRASES.map((p) => `「${p}」`).join(" ");
  return `<task>
  <goal>テーマ「${target.themeTitle}」(${target.themeKey}) の指標 ${target.metrics.length} 件それぞれについて、白書・省庁の公式解説・統計の公表資料など**一次資料**を実際に読み、「なぜこの指標がこのテーマに要るか」を資料に基づいて書く</goal>
  <scope>下記の指標だけ。指標の追加・削除・role の変更はしない (role の意見は roleRecommendations に書くだけ)。ファイルは触らない。JSON を返すだけ</scope>
  <sources>WebSearch と WebFetch で実際に取得したページだけ。取得できなかった資料・推測した URL・記憶だけの引用は使わない。候補の探し方: 「<指標名> 白書 都道府県」「<統計名> 結果の概要」「<省庁名> <指標名> 解説」。省庁 (go.jp) と e-Stat・国立研究機関を優先し、まとめサイトは使わない</sources>
  <done_when>各指標が entries (根拠あり) か skipped (一次資料を見つけられなかった) のどちらかに 1 回だけ現れる。entries の各 evidenceQuote は取得したページの本文に**一字一句そのまま**含まれる</done_when>
  <authorization>読み取りのみ。書き込み・投稿・購入は一切しない</authorization>
</task>
<output_format>
JSON 1 個のみ (前後に文章を書かない)。スキーマ:
{
  "theme": "${target.themeKey}",
  "entries": [{
    "rankingKey": "対象の rankingKey",
    "proposedBy": "資料名 (発行主体・年版・章節まで。例: 令和7年版 高齢社会白書 第1章第1節4「地域別に見た高齢化」（内閣府）)",
    "sourceUrl": "実際に WebFetch した https URL (リダイレクト後の最終 URL)",
    "sourceKind": "html" | "pdf",
    "evidenceQuote": "そのページ本文からの逐語引用 (${QUOTE_MIN}〜${QUOTE_MAX} 字。要約・言い換え禁止。pdf のときは本文の 1 文をそのまま)",
    "rationale": "${RATIONALE_MIN}〜${RATIONALE_MAX} 字。資料がこの指標をどう位置付けているか (地域比較の中心指標か・政策目標か・注意すべき定義か) と、それがテーマの問いにどう繋がるか。完全な文で書く",
    "adoptionCriteria": ["満たす基準だけ 1〜4 個"],
    "readerQuestion": "任意。読者がこの指標 1 件に尋ねる具体的な問い (1 文)",
    "targetReaderOrDecision": "任意。対象読者、またはこの指標が支える意思決定 (1 文)"
  }],
  "skipped": [{ "rankingKey": "...", "reason": "探した語と見た URL を含めて 1〜2 文" }],
  "roleRecommendations": [{ "rankingKey": "...", "currentRole": "...", "suggestedRole": "primary|secondary|context", "reason": "1 文" }]
}
</output_format>

BEHAVIOR CONTRACT (命令):
- 結論先行・捏造禁止: 取得していない資料を entries に書かない。見つからなければ skipped に入れる (skipped が多くても失敗ではない。捏造が最悪の失敗)。
- evidenceQuote は機械照合される (ページ本文に無ければその entry は破棄される)。改行・空白の違いは許容するが、語順・語句の変更は不可。
- 統計指標コード (#A03503 のような #英字+数字) は、下の「データ出典」に書かれた cdCat01 と**完全一致するものだけ**書く。違うコードを書いた entry は破棄される。コードを書かなくてもよい。
- 次の定型文を rationale / proposedBy に使わない (使うと破棄): ${boiler}
- adoptionCriteria は満たす基準だけ。5 基準すべては不可。
- 1 指標 1 entry。対象外の rankingKey は書かない。
- 同じ資料が複数指標の根拠になってよい (例: 白書の 1 節で 3 指標を扱う) が、evidenceQuote は指標ごとにその指標に言及する箇所を選ぶ。

採用基準の語彙:
${criteria}

テーマの説明: ${target.themeDescription}
${target.sections.length ? `テーマの章立て: ${target.sections.join(" / ")}` : ""}
${target.evidenceQuestions.length ? `既に登録済みの論点 (参考):\n${target.evidenceQuestions.map((q) => `  - ${q}`).join("\n")}` : ""}
調査日 (surveyedAt はこちらで ${surveyedAt} を入れる): ${surveyedAt}

対象指標 (${target.metrics.length} 件):
${target.metrics.map(metricBlock).join("\n")}
`;
}

// ---------------------------------------------------------------------------
// 3. gate
// ---------------------------------------------------------------------------

/** 引用照合用の正規化: 空白・改行を除き、全角英数/記号のゆれを最低限畳む。 */
export function normalizeForQuote(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .replace(/[\s　]+/g, "")
    .replace(/[「」『』“”"'‘’（）()［］\[\]【】・･,.、。:：;；!！?？\-—–―~〜]/g, "");
}

/** HTML → 本文テキスト (script/style 除去・タグ除去・実体参照の最低限)。 */
export function htmlToText(html) {
  return String(html ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|td|th|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // 数値実体参照 (&#8594; = → など。cao.go.jp の白書本文が矢印をこれで書く。2026-09-16 に quote-not-found の誤検知)
    .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

/** 正規化済み本文に引用があるか。完全一致か、正規化後 12 文字以上の連続一致 (モデルが文の一部を省いた抜粋。句読点・空白を除いた密な日本語なので数値を含む 12 文字は十分に固有。実例: 厚労省 PDF の「13小児科」は18,009人となっており) を許す。 */
const QUOTE_PARTIAL_WINDOW = 12;
export function quoteMatch(normalizedText, normalizedQuote) {
  if (!normalizedQuote) return "not-found";
  if (normalizedText.includes(normalizedQuote)) return "found";
  if (normalizedQuote.length >= QUOTE_PARTIAL_WINDOW) {
    for (let i = 0; i + QUOTE_PARTIAL_WINDOW <= normalizedQuote.length; i += 2) {
      if (normalizedText.includes(normalizedQuote.slice(i, i + QUOTE_PARTIAL_WINDOW))) return "found-partial";
    }
  }
  return "not-found";
}

function detectCharset(contentType, bytes) {
  const ct = /charset=([\w-]+)/i.exec(contentType ?? "")?.[1];
  if (ct) return ct.toLowerCase();
  const head = Buffer.from(bytes.slice(0, 4096)).toString("latin1");
  const meta = /charset=["']?([\w-]+)/i.exec(head)?.[1];
  return (meta ?? "utf-8").toLowerCase();
}

function decodeBody(bytes, contentType) {
  const charset = detectCharset(contentType, bytes);
  try {
    return new TextDecoder(charset === "shift_jis" || charset === "sjis" || charset === "x-sjis" ? "shift_jis" : charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

/** pdftotext (poppler) があれば PDF 本文を返す。無ければ null (引用照合は skipped-pdf になる)。 */
export function pdfToText(bytes) {
  const bin = process.env.PDF_TEXT_BIN?.trim() || "pdftotext";
  const tmp = path.join(os.tmpdir(), `stats47-selection-${process.pid}-${Date.now()}.pdf`);
  try {
    fs.writeFileSync(tmp, bytes);
    return execFileSync(bin, ["-layout", "-enc", "UTF-8", tmp, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/**
 * 出典 URL を取得する既定 fetcher。proxy は HTTPS_PROXY 等から undici ProxyAgent で解決する
 * (`.claude/scripts/audit/theme-chart-live-audit.mjs` の resolveDispatcher と同じ)。
 * 返り値: { ok, status, finalUrl, contentType, isPdf, text (html は本文テキスト / pdf は pdftotext があれば本文、無ければ null) }
 */
export function createFetcher({ timeoutMs = 25_000, userAgent = "stats47-selection-backfill/1.0 (+https://stats47.jp)" } = {}) {
  let dispatcher;
  const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy ?? process.env.HTTP_PROXY;
  if (proxy) {
    try {
      const { ProxyAgent } = createRequire(import.meta.url)("undici");
      dispatcher = new ProxyAgent(proxy);
    } catch {
      dispatcher = undefined;
    }
  }
  const cache = new Map();
  return async function fetchSource(url) {
    if (cache.has(url)) return cache.get(url);
    let result;
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": userAgent, accept: "text/html,application/pdf,*/*" },
        signal: AbortSignal.timeout(timeoutMs),
        ...(dispatcher ? { dispatcher } : {}),
      });
      const contentType = res.headers.get("content-type") ?? "";
      const isPdf = /application\/pdf/i.test(contentType) || /\.pdf(\?|$)/i.test(res.url || url);
      let text = "";
      if (res.ok && !isPdf) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        text = htmlToText(decodeBody(bytes, contentType));
      } else if (res.ok) {
        // PDF は pdftotext (poppler) があれば本文を取り、無ければ null (到達性だけ見る)
        text = pdfToText(Buffer.from(await res.arrayBuffer()));
      }
      result = { ok: res.ok, status: res.status, finalUrl: res.url || url, contentType, isPdf, text };
    } catch (e) {
      result = { ok: false, status: 0, finalUrl: url, contentType: "", isPdf: false, text: "", error: String(e?.message ?? e) };
    }
    cache.set(url, result);
    return result;
  };
}

function statCodesIn(entry) {
  const text = [entry.rationale, entry.proposedBy, entry.readerQuestion ?? "", entry.targetReaderOrDecision ?? ""].join("\n");
  return [...new Set(text.match(SELECTION_STAT_CODE_RE) ?? [])];
}

/**
 * モデル出力を決定的に検査し、通過分を MetricSelection に整形する。
 *
 * 返り値: { accepted: { [rankingKey]: MetricSelection }, rejected: [{ rankingKey, reasons[] }],
 *           skipped: [...], roleRecommendations: [...], checks: [{ rankingKey, url, status, quote }] }
 */
export async function gateEntries(target, output, { fetchSource, classIndex = null, surveyedAt }) {
  const targetsByKey = new Map(target.metrics.map((m) => [m.rankingKey, m]));
  const accepted = {};
  const rejected = [];
  const checks = [];
  const seen = new Set();

  for (const raw of Array.isArray(output?.entries) ? output.entries : []) {
    const key = String(raw?.rankingKey ?? "");
    const reasons = [];
    const m = targetsByKey.get(key);
    if (!m) {
      rejected.push({ rankingKey: key, reasons: ["not-a-target"] });
      continue;
    }
    if (seen.has(key)) {
      rejected.push({ rankingKey: key, reasons: ["duplicate-entry"] });
      continue;
    }
    seen.add(key);

    const proposedBy = String(raw.proposedBy ?? "").trim();
    const rationale = String(raw.rationale ?? "").trim();
    const sourceUrl = String(raw.sourceUrl ?? "").trim();
    const quote = String(raw.evidenceQuote ?? "").trim();
    const criteria = [...new Set(Array.isArray(raw.adoptionCriteria) ? raw.adoptionCriteria.map(String) : [])];

    if (!proposedBy) reasons.push("proposedBy-empty");
    if (rationale.length < RATIONALE_MIN || rationale.length > RATIONALE_MAX) {
      reasons.push(`rationale-length:${rationale.length}`);
    }
    for (const phrase of SELECTION_BOILERPLATE_PHRASES) {
      if (proposedBy.includes(phrase) || rationale.includes(phrase)) reasons.push(`boilerplate:${phrase}`);
    }
    if (criteria.length === 0) reasons.push("criteria-empty");
    if (criteria.length >= ADOPTION_CRITERIA.length) reasons.push("criteria-all");
    for (const c of criteria) if (!ADOPTION_CRITERIA.includes(c)) reasons.push(`criteria-unknown:${c}`);

    const own = m.facts?.source?.cdCat01 || "";
    for (const code of statCodesIn({ ...raw, proposedBy, rationale })) {
      if (code !== own) {
        reasons.push(`code-mismatch:${code}≠${own || "(無し)"}`);
      } else if (classIndex && m.facts?.source?.statsDataId) {
        if (!classIndex.resolve(m.facts.source.statsDataId, code)) reasons.push(`code-not-in-catalog:${code}`);
      }
    }

    let check = { rankingKey: key, url: sourceUrl, status: null, quote: "not-checked" };
    if (!/^https:\/\//.test(sourceUrl)) {
      reasons.push("url-not-https");
    } else {
      const res = await fetchSource(sourceUrl);
      check = { rankingKey: key, url: sourceUrl, finalUrl: res.finalUrl, status: res.status, quote: "not-checked" };
      if (!res.ok) {
        reasons.push(`url-unreachable:${res.status || res.error || "error"}`);
      } else if (res.isPdf && res.text === null) {
        check.quote = "skipped-pdf";
        if (quote.length < QUOTE_MIN) reasons.push("quote-too-short");
      } else {
        if (quote.length < QUOTE_MIN || quote.length > QUOTE_MAX) {
          reasons.push(`quote-length:${quote.length}`);
        } else {
          check.quote = quoteMatch(normalizeForQuote(res.text), normalizeForQuote(quote));
          if (check.quote === "not-found") reasons.push("quote-not-found");
        }
      }
    }
    checks.push(check);

    if (reasons.length > 0) {
      rejected.push({ rankingKey: key, reasons });
      continue;
    }
    const selection = {
      proposedBy,
      sourceUrl,
      surveyedAt,
      rationale,
      adoptionCriteria: criteria,
    };
    const rq = String(raw.readerQuestion ?? "").trim();
    const tr = String(raw.targetReaderOrDecision ?? "").trim();
    if (rq && rq.length <= 200) selection.readerQuestion = rq;
    if (tr && tr.length <= 200) selection.targetReaderOrDecision = tr;
    accepted[key] = selection;
  }

  const skipped = (Array.isArray(output?.skipped) ? output.skipped : [])
    .filter((s) => targetsByKey.has(String(s?.rankingKey)) && !accepted[String(s.rankingKey)])
    .map((s) => ({ rankingKey: String(s.rankingKey), reason: String(s.reason ?? "").slice(0, 300) }));
  const roleRecommendations = (Array.isArray(output?.roleRecommendations) ? output.roleRecommendations : [])
    .filter((r) => targetsByKey.has(String(r?.rankingKey)))
    .map((r) => ({
      rankingKey: String(r.rankingKey),
      currentRole: targetsByKey.get(String(r.rankingKey)).role,
      suggestedRole: String(r.suggestedRole ?? ""),
      reason: String(r.reason ?? "").slice(0, 300),
    }))
    .filter((r) => r.suggestedRole && r.suggestedRole !== r.currentRole);
  // モデルが entries にも skipped にも書かなかった指標
  const untouched = target.metrics
    .map((m) => m.rankingKey)
    .filter((k) => !accepted[k] && !rejected.some((r) => r.rankingKey === k) && !skipped.some((s) => s.rankingKey === k));

  return { accepted, rejected, skipped, untouched, roleRecommendations, checks };
}

// ---------------------------------------------------------------------------
// 4. writer
// ---------------------------------------------------------------------------

const SELECTION_FIELD_ORDER = [
  "proposedBy",
  "sourceUrl",
  "surveyedAt",
  "rationale",
  "adoptionCriteria",
  "readerQuestion",
  "targetReaderOrDecision",
];

function orderedSelection(sel) {
  const out = {};
  for (const k of SELECTION_FIELD_ORDER) if (sel[k] !== undefined) out[k] = sel[k];
  return out;
}

/** 文字列リテラルを飛ばしながら `{`/`[` の対応する閉じ位置を返す (開き位置 open を含む index)。 */
export function matchBracket(text, open) {
  const pairs = { "{": "}", "[": "]" };
  const close = pairs[text[open]];
  if (!close) throw new Error(`matchBracket: text[${open}] は括弧でない`);
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error("matchBracket: 閉じ括弧が無い");
}

function findMetricObject(text, rankingKey) {
  const re = new RegExp(`(["']?)rankingKey\\1\\s*:\\s*(["'])${rankingKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\2`);
  const m = re.exec(text);
  if (!m) return null;
  // metrics[] の要素オブジェクトの開始 `{` を後方に探す (rankingKey は要素の先頭キーなので直前の `{`)
  const start = text.lastIndexOf("{", m.index);
  if (start < 0) return null;
  const end = matchBracket(text, start);
  return { start, end, keyIndex: m.index, quoted: m[1] === '"' };
}

function serializeSelection(sel, indent, quoted) {
  const inner = indent + "  ";
  const q = (s) => (quoted ? JSON.stringify(s) : `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`);
  const k = (key) => (quoted ? `"${key}"` : key);
  const lines = [];
  for (const [key, value] of Object.entries(orderedSelection(sel))) {
    const v = Array.isArray(value) ? `[${value.map(q).join(", ")}]` : q(value);
    lines.push(`${inner}${k(key)}: ${v}`);
  }
  return `{\n${lines.join(",\n")}\n${indent}}`;
}

/**
 * `<theme>.ts` のインライン定義の selection を置換する (無ければ role の後に挿入)。
 * 返り値: 新しいテキスト。rankingKey が無ければ null。
 */
export function patchInlineSelection(text, rankingKey, selection) {
  const obj = findMetricObject(text, rankingKey);
  if (!obj) return null;
  const body = text.slice(obj.start, obj.end + 1);
  const selRe = /(\n([ \t]*))(["']?)selection\3\s*:\s*\{/;
  const sm = selRe.exec(body);
  if (sm) {
    const braceAt = obj.start + sm.index + sm[0].length - 1;
    const closeAt = matchBracket(text, braceAt);
    const indent = sm[2];
    return text.slice(0, braceAt) + serializeSelection(selection, indent, obj.quoted) + text.slice(closeAt + 1);
  }
  // selection 無し: role 行の直後に挿入 (role が最後のプロパティなら selection を最後にし、末尾カンマは足さない)
  const roleRe = /(\n([ \t]*))(["']?)role\3\s*:\s*(["'])(primary|secondary|context)\4(,?)/;
  const rm = roleRe.exec(body);
  if (!rm) throw new Error(`${rankingKey}: role 行が見つからず selection を挿入できない`);
  const indent = rm[2];
  const hadComma = rm[6] === ",";
  const insertAt = obj.start + rm.index + rm[0].length;
  const inserted =
    `${rm[0]}${hadComma ? "" : ","}\n${indent}${obj.quoted ? '"selection"' : "selection"}: ${serializeSelection(selection, indent, obj.quoted)}${hadComma ? "," : ""}`;
  return text.slice(0, obj.start + rm.index) + inserted + text.slice(insertAt);
}

const EVIDENCE_HEADER = `import type { MetricSelection } from "./types";

/**
 * 一次資料で裏付けた選定根拠 (selection) の置き場 — \`expanded.ts\` 由来の指標専用。
 *
 * どこに書くかの規則 (混在させない):
 * - 指標が \`packages/data-configs/src/theme-catalog/<theme>.ts\` の \`metrics[]\` に**インラインで**
 *   定義されている → その \`selection\` を直接書く (このファイルには書かない)
 * - 指標が \`expanded.ts\` の spec tuple (31 テーマ) / 既存テーマ拡張 tuple (67 章) で定義されている
 *   → tuple に selection の欄が無いので **ここ** に \`[themeKey][rankingKey]\` で書く。
 *   \`makeCatalog\` / \`extensionMetric\` が定型 selection より優先して読む
 *
 * ★このファイルは \`.claude/scripts/themes/selection-backfill.mjs apply\` が丸ごと再生成する
 *   (JSON 形式の TS)。手で書く場合も同じ形を保つ。規約: \`.claude/rules/theme-catalog-standards.md\` §4
 */
export const SELECTION_EVIDENCE: Record<string, Record<string, MetricSelection>> = `;

/** selection-evidence.ts を JSON として読む (生成物なので `= {…};` の形を前提にする)。 */
export function readEvidenceFile(file = EVIDENCE_FILE) {
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, "utf8");
  const m = /=\s*(\{[\s\S]*\});\s*$/.exec(text);
  if (!m) throw new Error(`${file}: 生成形式 (= {…};) でない。手編集で壊れている`);
  return JSON.parse(m[1]);
}

export function serializeEvidenceFile(evidence) {
  const sorted = {};
  for (const theme of Object.keys(evidence).sort()) {
    sorted[theme] = {};
    for (const key of Object.keys(evidence[theme]).sort()) sorted[theme][key] = orderedSelection(evidence[theme][key]);
  }
  return `${EVIDENCE_HEADER}${JSON.stringify(sorted, null, 2)};\n`;
}

/** インライン定義か (= <theme>.ts に rankingKey がある) の判定。 */
export function isInlineMetric(themeKey, rankingKey, catalogDir = CATALOG_DIR) {
  const file = path.join(catalogDir, `${themeKey}.ts`);
  if (!fs.existsSync(file)) return false;
  return findMetricObject(fs.readFileSync(file, "utf8"), rankingKey) !== null;
}

/**
 * 通過した selection を書く。インラインは <theme>.ts を置換、それ以外は selection-evidence.ts を再生成。
 * dryRun なら書かずに配置先だけ返す。
 */
export function applySelections(themeKey, selections, { catalogDir = CATALOG_DIR, dryRun = false } = {}) {
  const inline = [];
  const evidence = [];
  const themeFile = path.join(catalogDir, `${themeKey}.ts`);
  let themeText = fs.existsSync(themeFile) ? fs.readFileSync(themeFile, "utf8") : null;
  const evidenceFile = path.join(catalogDir, "selection-evidence.ts");
  const evidenceMap = readEvidenceFile(evidenceFile);

  for (const [rankingKey, selection] of Object.entries(selections)) {
    const patched = themeText ? patchInlineSelection(themeText, rankingKey, selection) : null;
    if (patched) {
      themeText = patched;
      inline.push(rankingKey);
    } else {
      evidenceMap[themeKey] ??= {};
      evidenceMap[themeKey][rankingKey] = orderedSelection(selection);
      evidence.push(rankingKey);
    }
  }
  if (!dryRun) {
    if (inline.length > 0) fs.writeFileSync(themeFile, themeText);
    if (evidence.length > 0) fs.writeFileSync(evidenceFile, serializeEvidenceFile(evidenceMap));
  }
  return { inline, evidence };
}

// ---------------------------------------------------------------------------
// 5. report
// ---------------------------------------------------------------------------

/** 1 run の結果 (themes[] を持つ) を翌朝読む markdown にする。 */
export function buildMarkdownReport(run) {
  const lines = [];
  lines.push(`# selection backfill ${run.runId}`);
  lines.push("");
  lines.push(`- 実行: ${run.startedAt} → ${run.finishedAt ?? "(中断)"} / model ${run.model} / concurrency ${run.concurrency}`);
  lines.push(
    `- 対象 ${run.totals.themes} テーマ ${run.totals.targets} 指標 / 通過 ${run.totals.accepted} / gate 不合格 ${run.totals.rejected} / 資料なし skip ${run.totals.skipped} / 未応答 ${run.totals.untouched}`,
  );
  lines.push(`- 停止理由: ${run.stopReason ?? "全対象を処理"}`);
  lines.push(`- 費用 (API 換算) $${(run.totals.costUsd ?? 0).toFixed(2)} / トークン in ${run.totals.inputTokens} out ${run.totals.outputTokens}`);
  lines.push(`- 再現: \`bash .claude/scripts/themes/run-selection-backfill.sh --themes ${run.themes.map((t) => t.themeKey).join(",")}\``);
  lines.push("");
  lines.push("## テーマ別");
  lines.push("");
  lines.push("| theme | 対象 | 通過 | 不合格 | skip | 未応答 | 状態 |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const t of run.themes) {
    lines.push(`| ${t.themeKey} | ${t.targets} | ${t.accepted} | ${t.rejected} | ${t.skipped} | ${t.untouched} | ${t.status} |`);
  }
  const rejected = run.themes.flatMap((t) => (t.rejectedDetail ?? []).map((r) => ({ theme: t.themeKey, ...r })));
  if (rejected.length) {
    lines.push("");
    lines.push("## gate 不合格 (prompt か gate の問題を疑う。30% 超なら停止条件)");
    lines.push("");
    lines.push("| theme | rankingKey | reasons |");
    lines.push("|---|---|---|");
    for (const r of rejected) lines.push(`| ${r.theme} | ${r.rankingKey} | ${r.reasons.join("; ")} |`);
  }
  const skipped = run.themes.flatMap((t) => (t.skippedDetail ?? []).map((s) => ({ theme: t.themeKey, ...s })));
  if (skipped.length) {
    lines.push("");
    lines.push("## 一次資料を見つけられなかった指標 (翌朝: 人が資料を探すか、context への降格を検討)");
    lines.push("");
    lines.push("| theme | rankingKey | モデルの理由 |");
    lines.push("|---|---|---|");
    for (const s of skipped) lines.push(`| ${s.theme} | ${s.rankingKey} | ${s.reason.replace(/\|/g, "／")} |`);
  }
  const roles = run.themes.flatMap((t) => (t.roleRecommendations ?? []).map((r) => ({ theme: t.themeKey, ...r })));
  if (roles.length) {
    lines.push("");
    lines.push("## role の推奨 (夜間バッチは書かない。人が theme-designer 経由で判断)");
    lines.push("");
    lines.push("| theme | rankingKey | 現在 | 推奨 | 理由 |");
    lines.push("|---|---|---|---|---|");
    for (const r of roles) lines.push(`| ${r.theme} | ${r.rankingKey} | ${r.currentRole} | ${r.suggestedRole} | ${r.reason.replace(/\|/g, "／")} |`);
  }
  const errors = run.themes.filter((t) => t.error);
  if (errors.length) {
    lines.push("");
    lines.push("## 実行エラー");
    lines.push("");
    for (const t of errors) lines.push(`- ${t.themeKey}: ${t.error}`);
  }
  lines.push("");
  return lines.join("\n");
}
