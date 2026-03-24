import "server-only";

import { REGIONS, fetchPrefectures } from "@stats47/area";

export interface RankingContentInput {
  rankingName: string;
  unit: string;
  yearCode: string;
  top10: { rank: number; areaName: string; value: number }[];
  bottom10: { rank: number; areaName: string; value: number }[];
  allPrefectures: { rank: number; areaName: string; value: number }[];
  average: number;
  min: number;
  max: number;
  totalCount: number;
}

/**
 * 7地方区分テキストを生成する（プロンプト埋め込み用）
 */
function buildRegionMapText(): string {
  const prefectures = fetchPrefectures();
  const codeToName = new Map(prefectures.map((p) => [p.prefCode, p.prefName]));
  return REGIONS.map((region) => {
    const names = region.prefectures.map((code) => codeToName.get(code) ?? code);
    return `- ${region.regionName}: ${names.join(", ")}`;
  }).join("\n");
}

/**
 * ランキングページ向けAIコンテンツ生成プロンプトを構築する。
 * 出力: JSON（FaqContent, regionalAnalysis Markdown, insights Markdown）
 */
export function buildRankingContentPrompt(input: RankingContentInput): string {
  const allPrefText = input.allPrefectures
    .map((r) => `${r.rank}位 ${r.areaName}: ${r.value.toLocaleString()}${input.unit}`)
    .join("\n");

  const regionMapText = buildRegionMapText();

  return `あなたは日本の公的統計データを正確に読み解く統計アナリストです。
以下の「${input.rankingName}」の都道府県別ランキングデータ（${input.yearCode}年度）を分析し、Webページに掲載するコンテンツを生成してください。

## 絶対ルール（違反は不可）

1. **提供データのみ使用**: 以下に記載された数値・順位のみを使うこと。プロンプトに含まれないデータ、外部統計、他指標への言及は一切禁止
2. **因果関係の推測禁止**: 「〜が原因」「〜のおかげ」等の因果推論は書かない。「〜と相関がある可能性がある」「〜が背景にあると考えられる」程度の示唆に留める
3. **煽り表現禁止**: 「衝撃」「危機」「非常事態」「跳ね上がる」等の感情的表現は使わない。客観的・中立的なトーンを維持する
4. **データ外の知識を混ぜない**: 特定の施設名、政策名、制度名、企業名への言及は禁止（提供データに含まれていない限り）

## ランキングデータ（全${input.totalCount}都道府県）

- 指標: ${input.rankingName}
- 単位: ${input.unit}
- 年度: ${input.yearCode}年度
- 平均値: ${input.average.toLocaleString()}${input.unit}
- 最大値: ${input.max.toLocaleString()}${input.unit}
- 最小値: ${input.min.toLocaleString()}${input.unit}

${allPrefText}

## 7地方区分
${regionMapText}

## 出力形式

以下のJSON形式で出力してください。

\`\`\`json
{
  "faq": {
    "items": [
      {
        "question": "（${input.rankingName}で1位の都道府県は？という趣旨の自然な質問文）",
        "answer": "（1位の県名・数値・年度を含む簡潔な回答。1〜2文）",
        "type": "top_ranking"
      },
      {
        "question": "（最下位の都道府県は？という趣旨の質問文）",
        "answer": "（最下位の県名・数値を含む簡潔な回答。1〜2文）",
        "type": "bottom_ranking"
      },
      {
        "question": "（全国平均はいくつ？という趣旨の質問文）",
        "answer": "（平均値と、平均を上回る県数・下回る県数を含む回答）",
        "type": "average"
      },
      {
        "question": "（地域ごとの傾向は？という趣旨の質問文）",
        "answer": "（上位・下位に多い地方の傾向を数値付きで回答）",
        "type": "regional"
      },
      {
        "question": "（1位と最下位の差は？という趣旨の質問文）",
        "answer": "（具体的な倍率や差を含む回答）",
        "type": "custom"
      }
    ]
  },
  "regionalAnalysis": "（Markdown形式。後述のルール参照）",
  "insights": "（Markdown形式。後述のルール参照）"
}
\`\`\`

### regionalAnalysis のルール

- 7地方区分ごとに \`## 北海道・東北\`, \`## 関東\`, \`## 中部\`, \`## 近畿\`, \`## 中国\`, \`## 四国\`, \`## 九州・沖縄\` の見出しで始める
- **個別の都道府県名・数値・順位を網羅的に列挙しない**。数値はチャートやテーブルで確認できるため、テキストでは地方ごとの「傾向」「パターン」「特徴」を述べる
- 具体的な数値を引用するのは、傾向を裏付ける代表例として1地方あたり最大1県に留める。2県以上の数値を並べない
- 地方内での上位・下位の偏り、全国平均との乖離、隣接地方との対比など「分析的な視点」を提供する
- 都道府県を列挙する箇条書き風の文体にしない。地方全体の傾向→代表例1県という流れで書く
- 各地方100〜150字。全体で700〜1000字程度

### insights のルール

- \`## 見出し\` で3〜4項目に分けて記述する
- 各項目100〜200字。全体で400〜700字程度
- **個別都道府県の数値列挙は禁止**。数値はチャート・テーブルで確認できるため、テキストでは集計・比較から導かれるパターンや傾向のみ記述する
- 書くべき内容の例:
  - 上位5県の値の合計が全体の何%を占めるか（集中度）
  - 1位と47位の倍率（格差の大きさ）
  - 地方ブロック間の平均値比較
  - 上位県・下位県に共通する地理的特徴（太平洋側/日本海側、都市部/地方部 等）
- 「なぜそうなるか」の因果は書かない。「〜という傾向が見られる」で止める

### FAQ のルール

- question は検索ユーザーが実際に検索窓に入力しそうな自然な日本語にする
- answer は提供データの数値のみで回答する。「〜と考えられます」等の推測は含めない
- 各 answer は1〜3文で簡潔に

### 文体ルール（全セクション共通）

- **数値の羅列・列挙は禁止**: 同じページにチャートとテーブルがあるため、テキストの役割は「データを読み解いた分析」を提供すること。都道府県名と数値を並べるだけの文章は価値がない
- **括弧による数値挿入を全面禁止**: 都道府県名の直後に括弧で値・順位を入れてはならない。
  - NG:「愛知県（746.0万人）が4位」「石川県（2.5人、31位）」「鹿児島県（2.6人）が25位」
  - NG:「福井県（73.9万人）や山梨県（79.1万人）は〜」← 括弧付き都道府県を連続させるのも禁止
  - OK:「愛知県は4位で、中部地方の中核を担っている」「石川県は31位で全国平均をやや下回る」
  - OK:「中部地方では愛知県が4位と突出しているが、県ごとの差が大きい」
- **1文に複数の都道府県を数値付きで並べない**: 個別県のデータ紹介が続くと箇条書きと変わらなくなる。代わりに地方単位やグループ単位の傾向を述べ、代表例として1県だけ引用する
- 数値を引用する場合は、傾向を裏付ける代表例として最小限（1地方あたり1県）に留め、文章の流れの中に自然に組み込む
- 年度を参照する場合は「${input.yearCode}年度」と表記する
- 「ワースト」「ベスト」「激減」「急増」は使わない。「上位」「下位」「最も多い」「最も少ない」を使う`;
}
