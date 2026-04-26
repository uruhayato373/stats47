import "server-only";

/**
 * 相関考察に渡す各 counterpart 指標の情報。
 * findHighlyCorrelated の結果から組み立てる想定。
 */
export interface CorrelationInputItem {
  /** 相手側ランキングのタイトル（人間向け表記） */
  title: string;
  /** ピアソン相関係数 */
  pearsonR: number;
  /** 人口を統制した偏相関 */
  partialRPopulation: number | null;
  /** 面積を統制した偏相関 */
  partialRArea: number | null;
  /** 高齢化率を統制した偏相関 */
  partialRAging: number | null;
  /** 人口密度を統制した偏相関 */
  partialRDensity: number | null;
}

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
  /**
   * 相関分析の上位 counterpart（v3.0 から）。
   * 空配列 / undefined の場合は相関考察を含めず「特異な変化」軸で記述する。
   */
  correlations?: CorrelationInputItem[];
  /**
   * EXCLUDED_CORRELATION_KEYS に該当するか（v3.0 から）。
   * true の場合、相関考察を書かず除外理由を insights / faq に記す。
   */
  isExcludedFromCorrelation?: boolean;
}

function formatPartial(label: string, r: number | null): string | null {
  if (r === null || !Number.isFinite(r)) return null;
  return `${label}偏相関 ${r.toFixed(2)}`;
}

function formatCorrelationLine(item: CorrelationInputItem): string {
  const partials = [
    formatPartial("人口", item.partialRPopulation),
    formatPartial("面積", item.partialRArea),
    formatPartial("高齢化", item.partialRAging),
    formatPartial("密度", item.partialRDensity),
  ].filter((p): p is string => p !== null);
  const partialText = partials.length > 0 ? `（${partials.join(" / ")}）` : "";
  return `- ${item.title}: r=${item.pearsonR.toFixed(2)}${partialText}`;
}

/**
 * ランキングページ向けAIコンテンツ生成プロンプトを構築する（v3.0）。
 * 出力: JSON（FaqContent, regionalAnalysis Markdown, insights Markdown）
 *
 * v3.0 の主な変更:
 *   - regional_analysis を 7 地方区分 → 3 セクション分析（上位帯 / 下位帯 / 相関構造 or 特異な変化）に変更
 *   - 相関データ（correlations）を入力に追加し、相関構造セクションで活用
 *   - EXCLUDED_CORRELATION_KEYS（人口・絶対数指標）は相関考察を省略し除外理由を明記
 */
export function buildRankingContentPrompt(input: RankingContentInput): string {
  const allPrefText = input.allPrefectures
    .map((r) => `${r.rank}位 ${r.areaName}: ${r.value.toLocaleString()}${input.unit}`)
    .join("\n");

  const hasCorrelations = !input.isExcludedFromCorrelation && (input.correlations?.length ?? 0) > 0;
  const correlationsBlock = hasCorrelations
    ? `## 相関データ（上位 ${input.correlations!.length} 件、ピアソン r 絶対値順）

${input.correlations!.map(formatCorrelationLine).join("\n")}

注意: 偏相関は当該変数を統制した後に残る相関。低下幅が大きい変数は「その交絡変数で説明される部分が大きい」ことを意味する。`
    : "";

  const excludedNote = input.isExcludedFromCorrelation
    ? `## 相関データ取り扱い

本指標は人口規模・絶対数指標のため相関分析対象外（他の絶対数指標と自明に正相関するため、人口・面積・密度などとの相関を集計しても示唆が得られない）。
相関考察は書かず、insights 末尾に「相関データの取扱い」見出しでこの旨を明記すること。`
    : "";

  const thirdSectionRule = input.isExcludedFromCorrelation
    ? "「## 特異な変化」または「## 構造的特徴」見出しで、本指標固有の時系列変化・順位逆転・地理的偏りなどを 250〜350 字で考察する。相関には触れない。"
    : hasCorrelations
      ? "「## 相関構造」見出しで、上記の相関データを引用し『何と相関するか / 偏相関でどう変化するか / 何が主因と読めるか』を 250〜400 字で考察する。具体的な r の数値を 3〜5 個引用すること。"
      : "「## 特異な変化」または「## 構造的特徴」見出しで、本指標固有の時系列変化や地理的偏りを 200〜300 字で考察する。";

  const insightsThirdRule = input.isExcludedFromCorrelation
    ? `第 4 項目は **「## 相関データの取扱い」** 見出しで、本指標が人口規模指標のため相関分析対象外である旨を 100〜180 字で説明する（学校数・産出額など多くの指標が人口に比例して動くため、人口を相関軸に置くと自明な結果しか得られない、という主旨）。`
    : hasCorrelations
      ? `第 3 項目は **「## 〜（相関を象徴する短い見出し）」** とし、相関データから読み取れる『人口を統制しても残る関係』『面積を統制しても残る関係』を 200〜350 字で考察する。具体的な r の数値を引用してよいが、テーブルではなく流れる文章で記述する。`
      : `第 3 項目は通常通り集計・比較からの示唆を 150〜250 字で記述する。`;

  const faqExtraItem = input.isExcludedFromCorrelation
    ? `      ,{
        "question": "（この指標が他の指標と何と相関するか？という趣旨の質問）",
        "answer": "（本指標は人口規模指標のため相関分析対象外。他の絶対数指標と自明に正相関する旨を簡潔に説明）",
        "type": "custom"
      }`
    : hasCorrelations
      ? `      ,{
        "question": "（${input.rankingName}は何と相関しますか？という趣旨の質問）",
        "answer": "（提供された相関データから、強い正相関 1〜2 件と偏相関での変化を 1〜2 文で要約）",
        "type": "custom"
      }`
      : "";

  return `あなたは日本の公的統計データを正確に読み解く統計アナリストです。
以下の「${input.rankingName}」の都道府県別ランキングデータ（${input.yearCode}年度）を分析し、Webページに掲載するコンテンツを生成してください。

## 絶対ルール（違反は不可）

1. **提供データのみ使用**: 以下に記載された数値・順位・相関データのみを使うこと。プロンプトに含まれないデータ、外部統計、未記載の指標への言及は一切禁止
2. **因果関係の推測禁止**: 「〜が原因」「〜のおかげ」等の因果推論は書かない。「〜と相関がある」「〜が背景にあると考えられる」程度の示唆に留める
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

${correlationsBlock}${excludedNote}

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
${faqExtraItem}
    ]
  },
  "regionalAnalysis": "（Markdown形式。後述のルール参照）",
  "insights": "（Markdown形式。後述のルール参照）"
}
\`\`\`

### regionalAnalysis のルール（v3.0 = 3 セクション構成）

3 つの \`## 見出し\` セクションで構成する。各セクション 200〜350 字、全体で 700〜1,000 字程度。

1. **第 1 セクション**: \`## 上位帯：（上位帯を象徴する短いラベル）\` 見出し。上位 5 県の傾向を分析する。地理的クラスタリング（東北・首都圏・西日本など）、産業特性、共通する地理的条件などを述べる。1 位の数値、上位 5 県のシェア（合計 / 全国 = X%）、1〜3 位の県名と数値を本文に自然に組み込む。
2. **第 2 セクション**: \`## 下位帯：（下位帯を象徴する短いラベル）\` 見出し。下位 5 県の傾向を分析する。最下位の数値、最下位〜下位 3 位の県名、上位との倍率（X 倍格差）を含める。
3. **第 3 セクション**: ${thirdSectionRule}

文体ルール:
- 都道府県名を箇条書きや羅列で並べない。1 文に複数県を数値付きで列挙しない
- 数値引用は本文の流れに自然に組み込む（括弧連打 NG）
- セクション 1, 2 では具体的な県名 5〜7 個を引用してよい（ただし価値ある分析と組み合わせること）

### insights のルール（v3.0 = 3〜4 項目）

\`## 見出し\` で項目を分ける。${input.isExcludedFromCorrelation ? "4 項目" : "3 項目"}構成。各項目 150〜350 字、全体で 600〜900 字程度。

1. **第 1 項目**: 集中度（上位 N 県のシェア）または 1 位のシェアを軸に分析。CV（変動係数 ≒ 標準偏差/平均）の概念に触れてよいが、数値計算は提供データから推定可能な範囲に留める。
2. **第 2 項目**: X 倍格差（最大値 / 最小値）と他の格差（人口格差 26.7 倍など）との比較。義務的最低水準・地理的下限など格差を制限する要因に触れてよい。
3. ${insightsThirdRule}

文体ルール:
- **個別都道府県の数値羅列は禁止**: チャート・テーブルで確認できるため、テキストでは集計・比較から導かれるパターン・傾向のみ記述
- 「なぜそうなるか」の因果は断定せず、「〜という傾向が見られる」「〜が背景にあると考えられる」で止める
- 数値を出す場合は提供データから直接読める / 計算できるものに限る

### FAQ のルール

- question は検索ユーザーが実際に検索窓に入力しそうな自然な日本語にする
- answer は提供データの数値のみで回答する。「〜と考えられます」等の推測は含めない
- 各 answer は 1〜3 文で簡潔に
- ${input.isExcludedFromCorrelation ? "6 番目に「相関分析の対象外である理由」を必ず含める" : hasCorrelations ? "6 番目に「相関する指標」項目を必ず含める" : "FAQ は 5 項目"}

### 文体ルール（全セクション共通）

- **数値の羅列・列挙は禁止**: 同じページにチャートとテーブルがあるため、テキストの役割は「データを読み解いた分析」を提供すること
- **括弧による数値挿入を全面禁止**: 都道府県名の直後に括弧で値・順位を入れてはならない
  - NG:「愛知県（746.0万人）が4位」「石川県（2.5人、31位）」「鹿児島県（2.6人）が25位」
  - NG:「福井県（73.9万人）や山梨県（79.1万人）は〜」← 括弧付き都道府県を連続させるのも禁止
  - OK:「愛知県は4位で、中部地方の中核を担っている」「石川県は31位で全国平均をやや下回る」
  - OK:「中部地方では愛知県が4位と突出しているが、県ごとの差が大きい」
- **1 文に複数の都道府県を数値付きで並べない**
- 数値を引用する場合は、傾向を裏付ける代表例として最小限に留め、文章の流れの中に自然に組み込む
- 年度を参照する場合は「${input.yearCode}年度」と表記する
- 「ワースト」「ベスト」「激減」「急増」は使わない。「上位」「下位」「最も多い」「最も少ない」を使う`;
}
