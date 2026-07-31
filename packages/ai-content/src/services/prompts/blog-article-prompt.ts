/**
 * blog-article-prompt — ブログ記事本文と critic レビューの prompt を組み立てる (純粋関数)。
 *
 * ## 設計方針
 *
 * **制約は prompt の冒頭に置く** (`.claude/rules/model-prompting.md`: 長い prompt の末尾に
 * 埋めた指示は効きが弱い)。ここで守らせるルールは全て `quality-gate.mjs` が決定的に検査する
 * ので、prompt は「ゲートに通る形」を教える役で、品質の床はゲートが握る。
 *
 * **出力例に禁止パターンを混ぜない**。ranking ai-content で実際に踏んだ罠で、出力 JSON の
 * プレースホルダを全角括弧で書いていたためモデルが括弧内数値を量産していた (2026-07-31 是正)。
 * モデルが最も忠実に真似るのは出力形式の例なので、そこに癖が入るとルール文をいくら足しても
 * 直らない。この理由から本ファイルには**禁止パターンの実例を書かない**。
 *
 * **数値は与えたものだけを使わせる**。ground truth に無い数値を書かせない限り、本文の値は
 * data/*.json と一致し `checkArticleFactual` を通る。
 *
 * 正典: .claude/rules/blog-quality-standards.md
 */

/** 記事の型 (blog-quality-standards.md §記事アーキタイプ) */
export type BlogArchetype = "A" | "B" | "C" | "D" | "D2" | "E" | "F" | "G";

export interface GroundTruthRow {
  rank: number;
  areaName: string;
  value: number;
}

export interface GroundTruthMetric {
  rankingKey: string;
  label: string;
  unit: string;
  year: string;
  source: string;
  rows: GroundTruthRow[];
}

export interface BlogArticlePromptInput {
  slug: string;
  archetype: BlogArchetype;
  /** topic-queue の suggestedTitle (そのまま使わせず、参考として渡す) */
  suggestedTitle: string;
  /** 主指標 */
  metrics: GroundTruthMetric[];
  /** 本文に必ず貼らせる画像行 (alt とパスをこちらで固定する) */
  figures: { markdown: string; caption: string }[];
  /** 図の直下に 1 枚だけ置く source-link カード */
  sourceLinkHref: string;
  sourceLinkLabel: string;
  /** 本文で使ってよい内部リンク (実在するものだけを呼び出し側が渡す) */
  allowedLinks: { href: string; label: string }[];
  /** 前回のゲート違反 (再試行時のみ)。何を直すかを具体的に伝える */
  previousBlockers?: string[];
}

/** 型ごとの必須分析視点 (blog-quality-standards.md §各型の章構成テンプレ) */
const ARCHETYPE_GUIDE: Record<BlogArchetype, string> = {
  A: "上位と下位が「なぜ」その順になるのかを、地理・産業構造・歴史から説明します。各図の直後に解釈の段落を置きます。",
  B: "2 つの指標の関係を扱います。見かけの相関と真因を分けて論じ、相関は因果ではないことを明示します。",
  C: "時系列の変化と、その変化が地理的に均一でないことを示します。",
  D: "読者の生活への含意に翻訳します。内訳を別の切り口で分解して真因に迫ります。",
  D2: "食文化・気候・産地・歴史との結びつきで消費差を説明します。関連品目との対比も置きます。",
  E: "テーマの概観を示し、代表指標を通じてカテゴリ全体へ誘導します。",
  F: "同じ県の中の市町村差に踏み込み、財政・人口構造から真因を説明します。",
  G: "どこから来てどこへ去るかの方向性と、年齢構造・都市圏と地方の非対称性を説明します。",
};

function formatRows(m: GroundTruthMetric): string {
  return m.rows
    .map((r) => `${r.rank}位 ${r.areaName} ${r.value.toLocaleString("ja-JP")}${m.unit}`)
    .join("\n");
}

/**
 * 記事本文 (article.md 全体) を書かせる prompt。
 *
 * frontmatter ごと 1 ファイル分を出させる。JSON にせず生の markdown にするのは、長い日本語を
 * JSON 文字列へ入れるとエスケープ崩れで丸ごと落ちるため (ai-content は 47 県 × 短文なので
 * JSON で成立するが、記事は連続した長文で事情が違う)。
 */
export function buildBlogArticlePrompt(input: BlogArticlePromptInput): string {
  const {
    slug,
    archetype,
    suggestedTitle,
    metrics,
    figures,
    sourceLinkHref,
    sourceLinkLabel,
    allowedLinks,
    previousBlockers,
  } = input;

  const retry =
    previousBlockers && previousBlockers.length > 0
      ? [
          "## 前回の出力はゲートに落ちました。次の指摘を必ず直してください",
          ...previousBlockers.map((b) => `- ${b}`),
          "",
        ].join("\n")
      : "";

  return `あなたは日本の都道府県統計サイト stats47.jp の記事執筆者です。
与えられた実データだけを使って、公開できる品質の記事を 1 本書いてください。

${retry}# 絶対ルール (これを破ると機械チェックで弾かれ、記事は公開されません)

1. **文体はですます調に統一します。** 「である。」「だ。」「だった。」「ではない。」「だろう。」
   および動詞の終止形 (「〜する。」「〜なる。」) を使いません。全ての文を「です・ます」で終えます。
2. **都道府県名の直後に括弧を置いて、その中に数値を書きません。** 値も順位も散文に開いて書きます。
   「◯◯県は 123 円で 4 位です」のように、県名・値・順位を文として並べてください。
   年・単位・出典を示す括弧は使ってかまいません。
3. **表 (markdown table) を一切使いません。** 縦棒と区切り行による表を書きません。
   データは図で見せ、列挙は箇条書きにします。
4. **数値は下の「実データ」に載っている値だけを使います。** 載っていない数値・順位・年を書きません。
   概算や丸めもしません。書いた数値は機械が実データと突合します。
5. **図は下で指定した画像行をそのまま貼ります。** 別のパスや別の画像を作りません。
6. **本文に「関連記事」「関連ランキング」の見出しを作りません。** サイト側が自動で出します。
7. **HTML の svg タグを書きません。**

# 記事の型: ${archetype}

${ARCHETYPE_GUIDE[archetype]}

# 実データ (これが唯一の数値の出どころ)

${metrics
  .map(
    (m) => `## ${m.label}
- 出典: ${m.source}
- 年: ${m.year}年
- 単位: ${m.unit}
- 全${m.rows.length}件:
${formatRows(m)}`,
  )
  .join("\n\n")}

# 本文に必ず含めるもの

## 図 (この行をそのまま貼り、前後に解説の段落を置きます)

${figures.map((f) => `- ${f.caption}: \`${f.markdown}\``).join("\n")}

## ランキングへの導線 (1 枚だけ。1 つ目の図の直後に置きます)

\`<source-link href="${sourceLinkHref}">${sourceLinkLabel}</source-link>\`

同じ href のカードを 2 枚以上置かないでください。カードは 1 枚だけです。

## 内部リンク (本文中に 3 本以上。下のリンクだけを使います)

${allowedLinks.map((l) => `- [${l.label}](${l.href})`).join("\n")}

## 注記 (callout) を 3 個

\`> [!NOTE]\` に指標の定義や集計単位の注意、\`> [!WARNING]\` にデータの限界、
\`> [!TIP]\` に読み解くコツを書きます。全記事で使い回せる定型文ではなく、
**この指標に固有の注意**を書いてください。読者が数字を読み違えないための知識です。

# 構成と分量

- 見出し (##) を 4 つ以上
- 地の文の合計は 2800〜3400 文字。図の直後には必ず 2〜3 段落の解釈を置きます
- 末尾に \`## データ出典\` を置き、出典名と年を書きます

# 出力形式

article.md の中身をそのまま出力してください。前置き・後書き・コードフェンスは書きません。
1 行目から次の形で始めます。

---
title: <17〜28文字。疑問形・逆説・倍率のいずれか 1 つだけを含めます。煽り語は使いません>
seoTitle: "<検索向けの題。指標名を含めます>"
description: <50文字以上。緊張感のある一文から始め、記事が何を明らかにするかを書きます>
slug: ${slug}
publishedAt: 未定
published: false
tags: []
---

参考の題 (そのまま使わず、より良い題を考えてかまいません): ${suggestedTitle}`;
}

/**
 * critic レビューの prompt。
 *
 * **記事本文だけを渡し、執筆時の文脈 (ground truth・型の指示・再試行履歴) は渡しません。**
 * これが `blog-quality-standards.md` の「書いた本人が自己採点して公開してはならない」を
 * 満たす仕掛けで、同じモデルでも文脈が違えば独立した読者として読めます。
 *
 * 機械で測れること (文字数・callout 数・リンク数) は critic に判定させません。それは
 * quality-gate が既に握っており、二重に判定させると critic の注意が意味の審査から逸れます。
 */
export function buildBlogCriticPrompt(articleMarkdown: string): string {
  return `あなたは統計記事の編集者です。読者にとっての価値だけを審査してください。
文字数・見出し数・リンク数は別の仕組みが検査済みなので、数えないでください。

# 見るところ

1. 図の直後の解説が、その図から読み取れること以上の何かを言えているか
   (図に書いてある数字を文章で繰り返しているだけなら価値がありません)
2. 「なぜその分布なのか」の説明が、根拠のある推論になっているか
   (相関を因果として断定していないか)
3. 注記 (callout) が、その指標に固有の読み違い防止になっているか
   (どの記事にも書ける一般論なら価値がありません)
4. 題と本文が一致しているか。題が煽っているのに中身が伴わないものは落とします
5. 同じ内容の繰り返しで分量を稼いでいないか

# 出力形式

次の形式で出力してください。前置きは書きません。

---
reviewer: gemini-critic
verdict: PASS または REVISE
date: <今日の日付 YYYY-MM-DD 形式>
---
## 評価サマリ
<読者価値の総括を 3〜5 文。何が良く、何が足りないかを具体的に書きます>

## 指摘
- [blocker|major|minor] <具体的な箇所と、どう直すかの提案>

## 判定理由
<PASS か REVISE かの根拠を 2〜3 文>

blocker が 1 件でもあれば verdict は REVISE です。
評価サマリと判定理由は合わせて 200 文字以上書いてください。

# 審査対象の記事

${articleMarkdown}`;
}
