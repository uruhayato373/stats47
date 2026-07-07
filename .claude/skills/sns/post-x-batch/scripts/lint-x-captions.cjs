/**
 * lint-x-captions.cjs — X 量産キャプションの決定的品質ゲート
 *
 * ③執筆フェーズ (LLM) が書いた captions.json を検査する。PASS したものだけ
 * register-drafts.cjs が台帳に登録できる (自己採点での登録を構造的に不能にする)。
 *
 * 冒頭で必ず x-catalog --check 相当 (catalog.selfCheck) を実行し、カタログ md の
 * ドリフト・アンカー欠落を先に検出する。
 *
 * 入力 captions.json (select-candidates の各要素に `caption` を足したもの):
 *   [{ key, template, category, caption, ... }]
 * caption 規約:
 *   - URL は本文に直書きせず `{{url}}` トークン 1 個 (register が UTM URL へ置換)
 *   - ハッシュタグ 3-5 個
 *   - URL・改行を除く本文が template.char_max 以下
 *   - NG 語なし / 既存・同バッチとの類似度 < 0.8
 *
 * Usage:
 *   node .claude/skills/sns/post-x-batch/scripts/lint-x-captions.cjs --in <captions.json>
 * exit: 0 = 全 PASS / 1 = FAIL あり (行ごとに理由を表示)
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const catalog = require(
  path.join(PROJECT_ROOT, ".claude/scripts/lib/x-catalog.cjs"),
);
const store = require(
  path.join(PROJECT_ROOT, ".claude/scripts/lib/sns-posts-store.cjs"),
);

const NG_WORDS = [
  "のはず",
  "おそらく",
  "と思われる",
  "と言われています",
  "だろう",
  "と考えられる",
  "かもしれません", // 推測。実測ベース判定に反する
];

function parseArgs(argv) {
  const args = argv.slice(2);
  const i = args.indexOf("--in");
  return {
    in: i >= 0 ? args[i + 1] : path.join(PROJECT_ROOT, ".local/r2/sns/_queue/captions.json"),
  };
}

/** 本文の実効文字数 (URL・{{url}}・改行を除く)。 */
function effectiveLength(caption) {
  return caption
    .replace(/\{\{url\}\}/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s/g, "")
    .length;
}

function countHashtags(caption) {
  return (caption.match(/(^|\s)#[^\s#]+/g) || []).length;
}

function countUrlTokens(caption) {
  return (caption.match(/\{\{url\}\}/g) || []).length;
}

function countRawUrls(caption) {
  return (caption.match(/https?:\/\/\S+/g) || []).length;
}

/** 文字 bigram の Jaccard 類似度 (0-1)。 */
function bigrams(s) {
  const t = s.replace(/\s/g, "");
  const set = new Set();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}
function jaccard(a, b) {
  const A = bigrams(a);
  const B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function main() {
  const opts = parseArgs(process.argv);
  catalog.selfCheck(); // ドリフト検出 (失敗は throw)
  const templatesById = Object.fromEntries(
    catalog.getTemplates().map((t) => [t.template, t]),
  );

  if (!fs.existsSync(opts.in)) {
    console.error(`[lint-x-captions] 入力が見つかりません: ${opts.in}`);
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(opts.in, "utf8"));
  if (!Array.isArray(items) || items.length === 0) {
    console.error("[lint-x-captions] captions.json が空です");
    process.exit(1);
  }

  // 既存 X キャプション (類似度の比較対象)
  const existingCaptions = store
    .loadAll()
    .filter((p) => p.platform === "x" && p.caption)
    .map((p) => String(p.caption));

  let failCount = 0;
  const batchCaptions = [];
  for (const it of items) {
    const errs = [];
    const cap = String(it.caption || "");
    const tmpl = templatesById[it.template];
    if (!cap.trim()) errs.push("caption 空");
    if (!tmpl) errs.push(`未知の template: ${it.template}`);
    // 文字数
    if (tmpl) {
      const len = effectiveLength(cap);
      if (len > tmpl.charMax) errs.push(`本文 ${len}字 > 上限 ${tmpl.charMax}字`);
    }
    // ハッシュタグ 3-5
    const tags = countHashtags(cap);
    if (tags < 3 || tags > 5) errs.push(`ハッシュタグ ${tags} 個 (3-5 が必要)`);
    // URL トークン: {{url}} ちょうど 1、生 URL 0
    const urlTok = countUrlTokens(cap);
    if (urlTok !== 1) errs.push(`{{url}} が ${urlTok} 個 (ちょうど 1 個必要)`);
    if (countRawUrls(cap) > 0) errs.push("生 URL 直書き禁止 ({{url}} を使う)");
    // NG 語
    for (const w of NG_WORDS) {
      if (cap.includes(w)) errs.push(`NG語: 「${w}」`);
    }
    // 類似度 (既存 + 同バッチ既出)
    let maxSim = 0;
    let simRef = "";
    for (const ex of existingCaptions.concat(batchCaptions)) {
      const s = jaccard(cap, ex);
      if (s > maxSim) {
        maxSim = s;
        simRef = ex;
      }
    }
    if (maxSim >= 0.8) errs.push(`類似度 ${maxSim.toFixed(2)} ≥ 0.8 (重複): "${simRef.slice(0, 30)}…"`);

    batchCaptions.push(cap);
    if (errs.length) {
      failCount++;
      console.log(`❌ [${it.template}] ${it.key}`);
      for (const e of errs) console.log(`     - ${e}`);
    } else {
      console.log(`✅ [${it.template}] ${it.key}  (${effectiveLength(cap)}字, #${tags})`);
    }
  }

  console.log(
    `\n[lint-x-captions] ${items.length - failCount}/${items.length} PASS` +
      (failCount ? ` — ${failCount} 件 FAIL (修正して再 lint)` : ""),
  );
  process.exit(failCount ? 1 : 0);
}

try {
  main();
} catch (e) {
  console.error(`[lint-x-captions] ${e.message}`);
  process.exit(1);
}
