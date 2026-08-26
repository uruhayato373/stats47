#!/usr/bin/env node
/**
 * ai-content 決定的監査ゲート (ranking ページの 考察/地域傾向/FAQ/県別解説)
 *
 * プロンプト (packages/ai-content/src/services/prompts/ranking-content-prompt.ts) の
 * 出力ルールを「生成後 / 公開前」に事後検証する。生成側の指示だけでは守られない
 * (実証: 2026-06-21 annual-clear-days の regionalAnalysis が、プロンプトが禁止する
 *  「都道府県名 + 括弧内数値」の列挙 (例「東京都が4位(29日)」) のまま本番公開されていた)。
 *
 * blog の quality-gate.mjs に相当する ai-content 版の機械フロア。意味的品質
 * (重複・読者価値・トーン) は ranking-content-critic が担う第②層。
 *
 * 担当: ranking-content-author (生成後の自己検査) / ranking-content-critic (意味レビュー前の床)
 *
 * Usage (CLI):
 *   node .claude/scripts/ai-content/audit-ai-content.mjs <rankingKey>        # R2 公開URLから取得
 *   node .claude/scripts/ai-content/audit-ai-content.mjs --file <path.json>  # ローカルJSON
 *   node .claude/scripts/ai-content/audit-ai-content.mjs <rankingKey> --json # 機械可読出力
 *
 * Usage (import / 再入可能):
 *   import { auditRow } from "./audit-ai-content.mjs";
 *   const { blockers, warns, ok } = auditRow(row);   // row = AiContentSnapshotRow
 *   → build-ai-content-queue.mjs 等が「同一判定」で done 判定するために使う (drift 防止)
 *
 *   // 実データ照合まで含める場合 (CLI は既定でこれを行う)
 *   const allowed = await loadAllowedNumbers({ key, yearCode });
 *   auditRow(row, { allowedNumbers: allowed });
 *
 * 数値照合オプション (CLI):
 *   --no-number-check   実データ照合を行わない (オフライン検査)
 *   --numbers-warn      照合の不一致を blocker ではなく warn にする
 *
 * exit code (CLI): blocker が 1 件でもあれば 1、なければ 0 (warn のみは 0)。
 *
 * 対象スキーマ (AiContentSnapshotRow / packages/ai-content/src/types/snapshot.ts):
 *   { rankingKey, yearCode, faq(JSON文字列), regionalAnalysis(md|null),
 *     insights(md|null), prefectureCommentary(JSON文字列|null) }
 */

import {
  buildValueContext,
  findOutOfRangeNumbers,
  findPrefectureMismatches,
} from "./lib/number-audit.mjs";

const R2_PUBLIC = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

// --- ルール定数 (プロンプトと同期。変更時は ranking-content-prompt.ts も確認) ---
const NG_WORDS = ["ワースト", "ベスト", "激減", "急増", "衝撃"];
const FAQ_SPECULATION = [
  "と考えられます", "と思われます", "でしょう", "かもしれません",
  "と推測", "の可能性があります", "と見られます",
];
const CAUSAL_HINTS = ["のため", "が原因", "によって", "ため、", "影響で"];
// 括弧 (全角/半角) の中身を取り出す。中身に数字を含めば「括弧数値挿入」候補
// (プロンプトは「括弧による数値挿入を全面禁止」。隣接 (県(42日)) も非隣接 (東京都が4位(29日)) も対象)
const PAREN_RE = /[（(]([^（()）]*)[）)]/g;
const YEAR_PAREN_RE = /^\s*\d{4}\s*年度?\s*$/; // (2020年度) は許容
const PAREN_ALLOW_PREFIX = /^\s*(?:出典|参考|注|注記|※)/; // (出典…) 等は許容
// 字数の目安 (warn)
const LEN = {
  insights: { min: 400, max: 700 },
  regionalAnalysis: { min: 700, max: 1000 },
};
const PREF_COMMENTARY_LEN = { min: 60, max: 120 };
const EXPECTED_PREF_COUNT = 47;

function jpLen(s) {
  return (s ?? "").replace(/\s/g, "").length;
}

/** オブジェクトを再帰的に走査し、key が "answer" の文字列値を集める */
function collectAnswers(node, out = []) {
  if (node == null) return out;
  if (Array.isArray(node)) { node.forEach((n) => collectAnswers(n, out)); return out; }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (k === "answer" && typeof v === "string") out.push(v);
      else collectAnswers(v, out);
    }
  }
  return out;
}

/**
 * 純関数の監査本体 (再入可能)。row を受け取り {rankingKey, blockers, warns, ok} を返す。
 * findings は呼び出しローカル (module-level state を持たない) ので並列・反復呼び出し安全。
 */
export function auditRow(row, options = {}) {
  const findings = [];
  const add = (level, code, msg) => findings.push({ level, code, msg });

  // 実データ照合 (valueContext 未提供なら判定しない = オフライン検査でも動く)
  const { valueContext = null, numbersLevel = "blocker" } = options;
  const checkNumbers = (label, text) => {
    if (!text || !valueContext) return;
    const bad = findOutOfRangeNumbers(text, valueContext);
    if (bad.length) {
      add(
        numbersLevel,
        "out-of-range-number",
        `${label}: 実データの範囲外の数値 ${bad.length} 件 (提供データの値のみ使用)。例: ${bad
          .slice(0, 3)
          .map((b) => b.raw)
          .join(" / ")}`,
      );
    }
  };

  const checkParenNumbers = (label, text) => {
    if (!text) return;
    const bad = [];
    let m;
    PAREN_RE.lastIndex = 0;
    while ((m = PAREN_RE.exec(text)) !== null) {
      const c = m[1];
      if (!/[0-9０-９]/.test(c)) continue;      // 数字を含まない括弧は対象外
      if (YEAR_PAREN_RE.test(c)) continue;      // (2020年度) は許容
      if (PAREN_ALLOW_PREFIX.test(c)) continue; // (出典…) 等は許容
      bad.push(`(${c.trim()})`);
    }
    if (bad.length) {
      add("blocker", "paren-number",
        `${label}: 括弧内数値挿入 ${bad.length} 件 (プロンプト全面禁止)。例: ${bad.slice(0, 3).join(" / ")}`);
    }
  };

  const checkNgWords = (label, text) => {
    if (!text) return;
    const hit = NG_WORDS.filter((w) => text.includes(w));
    if (hit.length) add("blocker", "ng-word", `${label}: NGワード ${hit.join("・")} (上位/下位/最も多い 等に置換)`);
  };

  const checkLen = (label, text, bounds) => {
    if (!text) return;
    const n = jpLen(text);
    if (n < bounds.min) add("warn", "length-short", `${label}: ${n}字 (目安 ${bounds.min}-${bounds.max})`);
    else if (n > bounds.max) add("warn", "length-long", `${label}: ${n}字 (目安 ${bounds.min}-${bounds.max})`);
  };

  if (!row || typeof row !== "object") {
    add("blocker", "no-content", "ai-content が空 / 不正");
    const blockers = findings.filter((f) => f.level === "blocker");
    return { rankingKey: undefined, blockers, warns: [], ok: false };
  }

  const { insights, regionalAnalysis, faq, prefectureCommentary, rankingKey } = row;

  // 必須フィールドの存在
  if (!insights) add("blocker", "missing-insights", "insights (データの考察) が空");
  if (!regionalAnalysis) add("warn", "missing-regional", "regionalAnalysis (地域別の傾向) が空");
  if (!faq) add("warn", "missing-faq", "faq が空");

  // 括弧数値列挙 / NGワード (本文系)
  checkParenNumbers("insights", insights);
  checkParenNumbers("regionalAnalysis", regionalAnalysis);
  checkNgWords("insights", insights);
  checkNgWords("regionalAnalysis", regionalAnalysis);
  checkNumbers("insights", insights);
  checkNumbers("regionalAnalysis", regionalAnalysis);

  // 因果表現 (insights は因果禁止 → warn。誤検知を避け blocker にしない)
  if (insights) {
    const causal = CAUSAL_HINTS.filter((w) => insights.includes(w));
    if (causal.length) add("warn", "causal-insights", `insights: 因果表現の可能性 ${causal.join("・")} (「傾向が見られる」で止める)`);
  }

  // 字数 (warn)
  checkLen("insights", insights, LEN.insights);
  checkLen("regionalAnalysis", regionalAnalysis, LEN.regionalAnalysis);

  // FAQ: 推測表現禁止 (answer のみ)
  if (faq) {
    let faqObj = null;
    try { faqObj = typeof faq === "string" ? JSON.parse(faq) : faq; }
    catch { add("blocker", "faq-parse", "faq の JSON parse 失敗"); }
    if (faqObj) {
      const answers = collectAnswers(faqObj);
      if (!answers.length) add("warn", "faq-empty", "faq に answer が見当たらない");
      const speculative = answers.filter((ans) => FAQ_SPECULATION.some((w) => ans.includes(w)));
      if (speculative.length) {
        add("blocker", "faq-speculation",
          `faq: 推測表現 ${speculative.length} 件 (回答は提供データの数値のみ)。例: ${speculative[0].slice(0, 40)}…`);
      }
      checkNgWords("faq", answers.join(" "));
      checkParenNumbers("faq", answers.join(" "));
      checkNumbers("faq", answers.join(" "));
    }
  }

  // prefectureCommentary: 件数 + 各字数
  if (!prefectureCommentary) {
    add("blocker", "missing-pref-commentary", "prefectureCommentary (県別解説) が空");
  } else {
    let pc = null;
    try { pc = typeof prefectureCommentary === "string" ? JSON.parse(prefectureCommentary) : prefectureCommentary; }
    catch { add("blocker", "pref-parse", "prefectureCommentary の JSON parse 失敗"); }
    if (pc) {
      const items = Array.isArray(pc) ? pc : (pc.items ?? []);
      // 実データ照合時は、その年に観測された県数が正典。知事選のように同一年へ全47県が
      // そろわない統計や、港湾・漁業の対象外県を47件へ水増ししない。値を取得できない
      // オフライン監査だけは従来どおり47件を期待し、誤って少ない生成物を見逃さない。
      const expectedCount = valueContext?.count ?? EXPECTED_PREF_COUNT;
      if (items.length !== expectedCount) {
        add(
          "warn",
          "pref-count",
          `prefectureCommentary ${items.length} 件 (照合対象の観測値は ${expectedCount} 件)`,
        );
      }
      const lenOut = items.filter((it) => {
        const n = jpLen(it?.commentary);
        return n < PREF_COMMENTARY_LEN.min || n > PREF_COMMENTARY_LEN.max;
      });
      if (lenOut.length) {
        add("warn", "pref-len", `prefectureCommentary: ${lenOut.length}/${items.length} 件が ${PREF_COMMENTARY_LEN.min}-${PREF_COMMENTARY_LEN.max}字 外`);
      }
      // 括弧数値 (commentary 内)
      const joined = items.map((it) => it?.commentary ?? "").join(" ");
      checkParenNumbers("prefectureCommentary", joined);
      checkNgWords("prefectureCommentary", joined);
      checkNumbers("prefectureCommentary", joined);

      // 構造フィールド (areaCode / rank / value) を実データと厳密照合。
      // ここは地図・数値表示に直結するため、テキストと違い完全一致を要求する。
      if (valueContext) {
        const mism = findPrefectureMismatches(items, valueContext);
        // 値・順位・県コードの食い違いは捏造 (blocker)。
        // 観測値が無い県 (未収録・対象外) は別事象なので warn に留める。
        const wrong = mism.filter((m) => m.field !== "unknown-area");
        const unknown = mism.filter((m) => m.field === "unknown-area");
        if (wrong.length) {
          const sample = wrong
            .slice(0, 3)
            .map((m) => `${m.areaName}.${m.field}: ${m.actual} (実データ ${m.expected})`)
            .join(" / ");
          // values.json の partition に同じ県名が複数行ある場合、どの行が正なのか
          // 決定できないため照合結果を信頼できない (実測 2026-07-30: 13/153 件が該当。
          // areaType=prefecture・同一年なのに 94 行あり rank が 200 超まで及ぶ)。
          // ai-content ではなく観測値側の問題なので、blocker にせず両方を warn で可視化する。
          if (valueContext.hasDuplicateAreas) {
            add(
              "warn",
              "values-duplicate-areas",
              `values.json の partition に同名の県が複数行あり照合できない (${valueContext.count} 行)。観測値側の要調査。不一致 ${wrong.length} 件: ${sample}`,
            );
          } else {
            add(
              numbersLevel,
              "pref-data-mismatch",
              `prefectureCommentary: 実データ不一致 ${wrong.length} 件。例: ${sample}`,
            );
          }
        }
        if (unknown.length) {
          add(
            "warn",
            "pref-unknown-area",
            `prefectureCommentary: 観測値が無い県 ${unknown.length} 件 (未収録/対象外の可能性)。例: ${unknown
              .slice(0, 3)
              .map((m) => m.areaName)
              .join("・")}`,
          );
        }
      }
    }
  }

  const blockers = findings.filter((f) => f.level === "blocker");
  const warns = findings.filter((f) => f.level === "warn");
  return { rankingKey, blockers, warns, ok: blockers.length === 0 };
}

// row を R2 公開 URL / ローカル file から取得 (import 側でも再利用可)
export async function loadRow({ key, file }) {
  if (file) {
    const fs = await import("node:fs");
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }
  if (!key) throw new Error("rankingKey または --file <path> を指定してください");
  const url = `${R2_PUBLIC}/app/ranking/${encodeURIComponent(key)}/ai-content.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`R2 取得失敗 ${res.status}: ${url}`);
  return res.json();
}

/**
 * R2 の ranking values.json から照合コンテキスト (区間 + 県別実データ) を作る。
 *
 * 取得できなければ null を返し、呼び元は実データ照合を行わない (fail-open)。
 * ネットワーク不通で公開を止めないための設計だが、**照合できなかったことは
 * 出力に明示する** (スキップを合格と誤読させない)。
 */
export async function loadValueContext({ key, yearCode }) {
  if (!key) return null;
  const url = `${R2_PUBLIC}/app/ranking/${encodeURIComponent(key)}/values.json`;
  const res = await fetch(url).catch(() => null);
  if (!res || !res.ok) return null;
  const doc = await res.json().catch(() => null);
  const partitions = doc?.partitions ?? [];
  if (!partitions.length) return null;
  // row の年に対応する partition を優先。無ければ最も新しい年
  const target =
    partitions.find((p) => String(p.yearCode) === String(yearCode)) ??
    [...partitions].sort((a, b) =>
      String(b.yearCode).localeCompare(String(a.yearCode)),
    )[0];
  const values = target?.values ?? [];
  if (!values.length) return null;
  return buildValueContext({
    values,
    unit: values[0]?.unit,
    yearCode: target?.yearCode ?? yearCode,
  });
}

function parseArgs(argv) {
  const a = {
    key: null,
    file: null,
    json: false,
    numberCheck: true,
    numbersLevel: "blocker",
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--file") a.file = argv[++i];
    else if (t === "--json") a.json = true;
    else if (t === "--no-number-check") a.numberCheck = false;
    else if (t === "--numbers-warn") a.numbersLevel = "warn";
    else if (!t.startsWith("--")) a.key = t;
  }
  return a;
}

// --- CLI (直接実行時のみ) ---
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith("audit-ai-content.mjs");

if (invokedDirectly) {
  const args = parseArgs(process.argv.slice(2));
  const row = await loadRow(args).catch((e) => {
    console.error(`[audit-ai-content] ${e.message}`);
    process.exit(2);
  });
  const valueContext = args.numberCheck
    ? await loadValueContext({
        key: args.key ?? row?.rankingKey,
        yearCode: row?.yearCode,
      })
    : null;
  const numbersChecked = Boolean(valueContext);
  const { blockers, warns } = auditRow(row, {
    valueContext,
    numbersLevel: args.numbersLevel,
  });
  if (args.json) {
    console.log(JSON.stringify({ rankingKey: row?.rankingKey, numbersChecked, blockers, warns, ok: blockers.length === 0 }, null, 2));
  } else {
    const label = row?.rankingKey ?? args.file ?? "(unknown)";
    console.log(`# ai-content audit: ${label}`);
    if (!numbersChecked) {
      console.log(
        args.numberCheck
          ? "… 数値照合スキップ (values.json 取得不可。合格ではない)"
          : "… 数値照合スキップ (--no-number-check)",
      );
    }
    if (!blockers.length && !warns.length) console.log("✓ 違反なし (blocker 0 / warn 0)");
    for (const f of blockers) console.log(`✗ [BLOCKER:${f.code}] ${f.msg}`);
    for (const f of warns) console.log(`⚠ [WARN:${f.code}] ${f.msg}`);
    console.log(`\n計 blocker ${blockers.length} / warn ${warns.length}`);
  }
  process.exit(blockers.length > 0 ? 1 : 0);
}
