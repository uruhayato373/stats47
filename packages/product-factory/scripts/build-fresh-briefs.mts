#!/usr/bin/env -S npx tsx
/**
 * fresh 章 (書き下ろし) の執筆ブリーフを書籍ごとに機械生成する。
 *
 * ★なぜ要るか (2026-08-12)
 *   S2/S3/S4 の 20 冊は書き下ろし比率が 3〜7% しかなく、KDP の「Web で無料入手可能な
 *   コンテンツ」規定に備えた 30% を満たしていない (実測: 追加で約 30 万字が要る)。
 *   執筆は agent 艦隊で回すが、**何を根拠に書くか**を渡さないと捏造が混ざる。
 *   ここで「その書籍が実際に載せる指標の実データ」をブリーフに焼き込む。
 *
 * ★捏造を防ぐ設計
 *   ブリーフに入れる数値は R2 の values.json から取った実測値だけ。agent は
 *   ブリーフの数値しか使えない (それ以外の数値を書けば audit-book-facts が弾く)。
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/build-fresh-briefs.mts --book K-S2-02
 *   npx tsx packages/product-factory/scripts/build-fresh-briefs.mts --all --out .local/fresh-briefs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";
import { BOOK_RANKING_KEYS } from "../src/channels/kindle/book-ranking-keys";
import { fetchRankingValues } from "../src/data/load-ranking-values";
import { PREFECTURE_BY_CODE5 } from "../src/data/prefectures";
import { METRICS_REGISTRY } from "@stats47/data-configs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const KNOWN_FLAGS = new Set(["--book", "--all", "--out", "--concurrency"]);
function assertKnownFlags(): void {
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`未知のフラグ: ${unknown.join(", ")}\n使えるのは ${[...KNOWN_FLAGS].join(" / ")} です。`);
    process.exit(2);
  }
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const fmt = (n: number): string =>
  Math.abs(n) >= 100 ? Math.round(n).toLocaleString("ja-JP") : n.toLocaleString("ja-JP", { maximumFractionDigits: 2 });

/** 1 指標の「本文で使ってよい事実」を実データから組む。 */
async function factLine(key: string): Promise<string | null> {
  const cfg = (METRICS_REGISTRY as Record<string, { title?: string; unit?: string; subtitle?: string } | undefined>)[key];
  let f;
  try {
    f = await fetchRankingValues(key);
  } catch {
    return null;
  }
  const rows = f.values
    .filter((v): v is { code5: string; value: number } => v.value !== null)
    .map((v) => ({ name: PREFECTURE_BY_CODE5.get(v.code5)?.name ?? v.code5, value: v.value }))
    .sort((a, b) => b.value - a.value);
  if (rows.length < 20) return null;
  const avg = rows.reduce((s, r) => s + r.value, 0) / rows.length;
  const unit = cfg?.unit ?? "";
  const title = cfg?.subtitle ? `${cfg.title}（${cfg.subtitle}）` : (cfg?.title ?? key);
  const top3 = rows.slice(0, 3).map((r, i) => `${i + 1}位 ${r.name} ${fmt(r.value)}${unit}`).join(" / ");
  const bot3 = rows.slice(-3).map((r, i) => `${rows.length - 2 + i}位 ${r.name} ${fmt(r.value)}${unit}`).join(" / ");
  return `- **${title}**（${f.year}年）: ${top3} … ${bot3} / 全国平均 ${fmt(avg)}${unit}`;
}

/** 書籍 1 冊のブリーフ本文を組む。 */
async function buildBrief(bookId: string, concurrency: number): Promise<string> {
  const book = KINDLE_BOOKS.find((b) => b.id === bookId);
  if (!book) throw new Error(`書籍が見つからない: ${bookId}`);
  const keys = BOOK_RANKING_KEYS[bookId] ?? [];

  const facts: string[] = [];
  for (let i = 0; i < keys.length; i += concurrency) {
    const batch = keys.slice(i, i + concurrency);
    for (const line of await Promise.all(batch.map(factLine))) if (line) facts.push(line);
  }

  const isRegion = bookId.startsWith("K-S3-");
  const chapters = isRegion
    ? [
        ["00-intro.md", 2500, "はじめに — この地域を統計で読む", "地域の輪郭を、読者が自分の暮らしと結びつけられる形で示す。旅行ガイドではなく統計の本であることを明確にする。"],
        ["10-how-to-read.md", 2000, "第1章 地域データの読み方", "全国順位と地域内順位の違い、人口規模が順位に効く指標とそうでない指標の見分け方、基準年のずれの扱い。"],
        ["20-profile-a.md", 2500, "県別プロフィール（前半）", "地域内の県を前半分、実データを根拠に一県ずつ描く。産業・人口・暮らしの特徴を数字で裏づける。"],
        ["30-profile-b.md", 2500, "県別プロフィール（後半）", "残りの県を同様に描く。前半との対比を意識する。"],
        ["40-inside-gap.md", 3000, "地域内の落差を読む", "同じ地域の中で県ごとに大きく分かれる指標を3つ前後選び、なぜ同じ地域なのに差が出るのかを地理・産業構造・人口規模で説明する。「地域でひとくくりにできない」ことを示す章。"],
        ["50-national-position.md", 2800, "全国の中でのこの地域", "この地域が全国順位のどこに位置するか（上位に集まる指標／下位に沈む指標）を整理し、他地域との違いを述べる。地域単位の強みと弱みを読者が持ち帰れる形にする。"],
        ["90-synthesis.md", 3500, "終章 — この地域に共通する構造", "章横断で、この地域を貫く構造を3つ前後に整理する。地理・産業史・人口動態のどれで説明できるかを述べる。"],
      ]
    : [
        ["00-intro.md", 2500, "はじめに — このテーマを47都道府県で読む", "テーマの見取り図。読者が自分の県を探したくなる導入にする。"],
        ["10-how-to-read.md", 2000, "第1章 この分野の統計の読み方", "指標の定義・分母・基準年の落とし穴。相関と因果を取り違えないための注意。"],
        ["20-bridge-a.md", 2300, "部扉 — 前半の指標群をつなぐ", "前半の指標が何を測っているかを束ね、読者が章を横断して読めるようにする。"],
        ["30-bridge-b.md", 2300, "部扉 — 後半の指標群をつなぐ", "後半の指標群について同様に。前半との関係を述べる。"],
        ["50-cross-analysis.md", 6000, "章横断の合成分析", "複数の指標を突き合わせて初めて見える構造を論じる。**本書の書き下ろしの中核**。"],
        ["60-regional-view.md", 4000, "地方ブロックで見る", "北海道・東北・関東・中部・近畿・中国・四国・九州沖縄のブロック単位でこのテーマを読み直す。県単位の順位表では見えない、地域のまとまりとしての傾向を論じる。"],
        ["90-synthesis.md", 5500, "終章 — このテーマの全体像", "全体を総括し、読者の意思決定にどう効くかを述べる。"],
      ];

  const total = chapters.reduce((s, c) => s + (c[1] as number), 0);

  return `# 執筆ブリーフ: ${bookId} ${book.title}

> このファイルは \`build-fresh-briefs.mts\` が実データから機械生成したものです。
> **本文に書いてよい数値は下の「使ってよい事実」だけ**です。ここに無い数値を書くと
> \`audit-book-facts\` が SSOT と突合して弾きます (捏造防止)。

## 書籍の性格

- **コンセプト**: ${book.concept}
- **想定読者**: 自分の県がどの位置にあるかを知りたい一般読者。統計の専門家ではない
- **価格**: ${book.priceYen}円

## 書くファイル (${chapters.length} 本 / 合計 約${total.toLocaleString()}字)

配置先: \`packages/product-factory/src/channels/kindle/manuscripts/${bookId}/\`

| ファイル | 目安字数 | 章タイトル | 内容 |
|---|---|---|---|
${chapters.map((c) => `| \`${c[0]}\` | ${(c[1] as number).toLocaleString()}字 | ${c[2]} | ${c[3]} |`).join("\n")}

## 文体 (K-S1 系列に合わせる)

- **ですます調**。断定を避けず、しかし推測は推測と明示する
- 読者に語りかける。「引っ越しをした人なら一度は経験があるはずです」のような具体から入る
- **漢数字を使わない** (算用数字に統一。「一位」ではなく「1位」)
- 見出しは \`#\` (章題) と \`##\` (節) のみ。\`###\` 以下は使わない
- 「ワースト」「衝撃」「激減」などの煽り語を使わない
- 相関を因果と書かない。「〜が原因で」ではなく「〜と関係している可能性があります」

## 使ってよい事実 (R2 の実データ・${facts.length} 指標)

${facts.join("\n")}

## 禁止

- 上のリストに無い数値を書かない (全国平均・順位・値のいずれも)
- 「約」を付けて範囲を曖昧にして未確認の数字を出さない
- 出典を「政府統計」以上に特定しない (個別の調査名は metric config が持つ)
`;
}

async function main(): Promise<void> {
  assertKnownFlags();
  const only = arg("book");
  const all = process.argv.includes("--all");
  const outDir = resolve(REPO_ROOT, arg("out") ?? ".local/fresh-briefs");
  const concurrency = Number(arg("concurrency") ?? 8);

  const ids = only
    ? [only]
    : all
      ? KINDLE_BOOKS.filter((b) => !b.id.startsWith("K-S1-")).map((b) => b.id)
      : [];
  if (ids.length === 0) {
    console.error("--book <id> か --all を指定する");
    process.exit(2);
  }

  mkdirSync(outDir, { recursive: true });
  for (const id of ids) {
    const md = await buildBrief(id, concurrency);
    const p = join(outDir, `${id}.md`);
    writeFileSync(p, md);
    console.log(`✅ ${p} (${md.length.toLocaleString()} 字)`);
  }
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
