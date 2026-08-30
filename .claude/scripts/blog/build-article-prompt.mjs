#!/usr/bin/env node
/**
 * build-article-prompt.mjs — 接地済みの data/ から執筆プロンプト (article.prompt.txt) を組む。
 *
 * `generate-blog-article.ts` は topic-queue 経由の型 (A/B/C/D/D2) だけを組み立てる。
 * 移動フロー (型G) / 市町村財政 (型F) / テーマハブ (型E) は接地経路が別なので、
 * 同じ絶対ルールと同じ実データ提示でプロンプトを作れるようにする。
 * ルールの文面を書き手ごとに書き分けると、記事ごとに守られる規約が変わってしまう。
 *
 * 数値は data/*.json からしか読まない (プロンプト側で丸めたり補完したりしない)。
 *
 * Usage:
 *   node .claude/scripts/blog/build-article-prompt.mjs --slug <slug> --archetype <F|G|E>
 *     --title-hint "<参考の題>"
 *     --links "/areas/20000|長野県のデータ,/themes/population-dynamics|人口動態のテーマ"
 *     [--source-links "moving-in-excess-rate|転入超過率ランキング"]
 *     [--figures "file.svg|alt,file2.svg|alt2"]   図の順と説明 (省略時は data/ の SVG を名前順)
 *     [--chars 2800-3400] [--base-dir docs/21_ブログ記事原稿]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SLUG = getArg("--slug");
const ARCHETYPE = getArg("--archetype");
const TITLE_HINT = getArg("--title-hint", "");
const LINKS = getArg("--links", "");
const SOURCE_LINKS = getArg("--source-links", "");
const FIGURES = getArg("--figures", "");
const CHARS = getArg("--chars", "2800-3400");
const BASE_DIR = getArg("--base-dir", "docs/21_ブログ記事原稿");
if (!SLUG || !ARCHETYPE) {
  console.error("usage: --slug <slug> --archetype <F|G|E> --title-hint <t> --links <a|b,...> [--source-links ...] [--figures ...] [--chars 2800-3400]");
  process.exit(1);
}

const ARCHETYPE_GUIDE = {
  F: `県内の市区町村のあいだにある差を主題にします。県の平均や全国順位ではなく、
「同じ県の中でここまで違う」を軸に据えます。上位・下位の団体がなぜその位置なのかを、
人口規模・産業・地形・大規模施設の有無から説明します。類似団体平均との比較を必ず一度は使い、
「この県だけの事情なのか、同じ規模の自治体に共通する事情なのか」を切り分けます。`,
  G: `どこから来てどこへ去るのかという方向性を主題にします。差し引きの総数だけで終わらせず、
相手県ごとの向きを読みます。東京圏との関係と、隣接県との関係を分けて説明してください。
純移動は転入から転出を引いた差であり、人の移動そのものの規模ではない点に注意します。`,
  E: `1 つの主題を複数の指標で束ねて見せます。指標ごとに図と解説を置き、
最後に「この主題を追うならどこを見ればよいか」へ読者を送ります。
指標を並べるだけにせず、指標どうしの食い違い (ある指標で上位の県が別の指標では下位、など) を
必ず 1 つは取り上げて、単一のランキングでは見えないことを示します。`,
};
if (!ARCHETYPE_GUIDE[ARCHETYPE]) {
  console.error(`[error] 未対応の型: ${ARCHETYPE} (F/G/E のみ)`);
  process.exit(1);
}

const dir = path.join(PROJECT_ROOT, BASE_DIR, SLUG);
const dataDir = path.join(dir, "data");
if (!fs.existsSync(dataDir)) {
  console.error(`[error] 接地データが無い: ${path.relative(PROJECT_ROOT, dataDir)}`);
  process.exit(1);
}

const fmt = (v) => (typeof v === "number" ? v.toLocaleString("ja-JP", { maximumFractionDigits: 4 }) : String(v));

/** data/*.json を人間可読なグラウンドトゥルースに展開する。値は一切加工しない。 */
function renderData() {
  const out = [];
  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".source.json"))
    .sort();
  for (const f of files) {
    const j = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
    const unit = j.unit ?? "";
    out.push(`## ${j.title ?? f}`);
    if (j.source) out.push(`- 出典: ${j.source}`);
    if (j.year) out.push(`- 年: ${j.year}`);
    out.push(`- 単位: ${unit || "(なし)"}`);
    if (Array.isArray(j.series)) {
      for (const s of j.series) {
        out.push(`- 系列「${s.label}」: ${s.data.map((d) => `${d.year}年 ${fmt(d.value)}${unit}`).join(" / ")}`);
      }
    } else if (Array.isArray(j.data)) {
      const rows = j.data;
      out.push(`- 全${rows.length}件:`);
      rows.forEach((r, i) => {
        const rank = r.rank ?? i + 1;
        out.push(`${rank}位 ${r.areaName ?? r.pref} ${fmt(r.value)}${unit}`);
      });
    } else if (Array.isArray(j.points)) {
      out.push(`- 全${j.points.length}点 (x=${j.xLabel} / y=${j.yLabel}):`);
      j.points.forEach((p) => out.push(`${p.label} x=${fmt(p.x)} y=${fmt(p.y)}`));
    }
    out.push("");
  }
  return out.join("\n");
}

const figures = FIGURES
  ? FIGURES.split(",").map((s) => {
      const [file, alt] = s.split("|");
      return { file: file.trim(), alt: (alt ?? file).trim() };
    })
  : fs
      .readdirSync(dataDir)
      .filter((f) => f.endsWith(".svg") && !f.endsWith("-ig.svg"))
      .sort()
      .map((f) => ({ file: f, alt: f.replace(/\.svg$/, "") }));

for (const fig of figures) {
  if (!fs.existsSync(path.join(dataDir, fig.file))) {
    console.error(`[error] 図が無い: data/${fig.file}`);
    process.exit(1);
  }
}

const parsePairs = (raw) =>
  raw
    ? raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const [href, label] = s.split("|");
          return { href: href.trim(), label: (label ?? href).trim() };
        })
    : [];

const links = parsePairs(LINKS);
const sourceLinks = parsePairs(SOURCE_LINKS);
if (links.length < 3) {
  console.error(`[error] 内部リンクが ${links.length} 本しかない (ゲートは 3 本以上を要求する)`);
  process.exit(1);
}

const prompt = `あなたは日本の都道府県統計サイト stats47.jp の記事執筆者です。
与えられた実データだけを使って、公開できる品質の記事を 1 本書いてください。

# 絶対ルール (これを破ると機械チェックで弾かれ、記事は公開されません)

1. **文体はですます調に統一します。** 「である。」「だ。」「だった。」「ではない。」「だろう。」
   および動詞の終止形 (「〜する。」「〜なる。」) を使いません。全ての文を「です・ます」で終えます。
2. **地名の直後に括弧を置いて、その中に数値を書きません。** 値も順位も散文に開いて書きます。
   「◯◯市は 0.84 で 1 位です」のように、地名・値・順位を文として並べてください。
   年・単位・出典を示す括弧は使ってかまいません。
3. **表 (markdown table) を一切使いません。** 縦棒と区切り行による表を書きません。
   データは図で見せ、列挙は箇条書きにします。
4. **数値は下の「実データ」に載っている値だけを使います。** 載っていない数値・順位・年を書きません。
   概算や丸めもしません。書いた数値は機械が実データと突合します。
5. **図は下で指定した画像行をそのまま貼ります。** 別のパスや別の画像を作りません。
6. **本文に「関連記事」「関連ランキング」の見出しを作りません。** サイト側が自動で出します。
7. **HTML の svg タグを書きません。**

# 記事の型: ${ARCHETYPE}

${ARCHETYPE_GUIDE[ARCHETYPE]}

# 実データ (これが唯一の数値の出どころ)

${renderData()}
# 本文に必ず含めるもの

## 図 (この行をそのまま貼り、前後に解説の段落を置きます)

${figures.map((f) => `- \`![${f.alt}](data/${f.file})\``).join("\n")}

${
  sourceLinks.length
    ? `## ランキングへの導線 (図の直後に 1 枚ずつ。同じ href を 2 枚以上置きません)

${sourceLinks.map((s) => `\`<source-link href="/ranking/${s.href}">${s.label}</source-link>\``).join("\n")}
`
    : `## ランキングカードは使いません

この記事の数値に対応する 1 本のランキングページが無いため、\`<source-link>\` は置きません。
深掘りへの導線は下の内部リンクで作ります。
`
}
## 内部リンク (本文中に 3 本以上。下のリンクだけを使います)

${links.map((l) => `- [${l.label}](${l.href})`).join("\n")}

## 注記 (callout) を 3 個

\`> [!NOTE]\` に指標の定義や集計単位の注意、\`> [!WARNING]\` にデータの限界、
\`> [!TIP]\` に読み解くコツを書きます。全記事で使い回せる定型文ではなく、
**この指標に固有の注意**を書いてください。読者が数字を読み違えないための知識です。

# 構成と分量

- 見出し (##) を 4 つ以上
- 地の文の合計は ${CHARS} 文字。図の直後には必ず 2〜3 段落の解釈を置きます
- 末尾に \`## データ出典\` を置き、出典名と年を書きます

# 出力形式

article.md の中身をそのまま出力してください。前置き・後書き・コードフェンスは書きません。
1 行目から次の形で始めます。

---
title: <17〜28文字。疑問形・逆説・倍率のいずれか 1 つだけを含めます。煽り語は使いません>
seoTitle: "<検索向けの題。主題を含めます>"
description: <50文字以上。緊張感のある一文から始め、記事が何を明らかにするかを書きます>
slug: ${SLUG}
publishedAt: 未定
published: false
tags: []
---

参考の題 (そのまま使わず、より良い題を考えてかまいません): ${TITLE_HINT}
`;

const outFile = path.join(dir, "article.prompt.txt");
fs.writeFileSync(outFile, prompt);
console.error(
  `[ok] ${SLUG} (型${ARCHETYPE}) — 図 ${figures.length} 枚 / 内部リンク ${links.length} 本 / カード ${sourceLinks.length} 枚\n` +
    `     → ${path.relative(PROJECT_ROOT, outFile)} (${prompt.length.toLocaleString()} 文字)`,
);
