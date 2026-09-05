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
 * 地方ごとに順位の良い順で並べた表 (プロンプト埋め込み用)。
 * 「地方内で最も高い/低い」の主張が同じ地方の 2 県で矛盾する誤りを、モデルの記憶ではなく提供データで防ぐ
 * (2026-09-05 batch2 で critic が検出した事実誤り)。括弧を使わない (paren-number を実演しない)。
 * 県名の対応付けが 9 割未満なら空文字を返し、誤った表を出さない。
 */
function buildRegionRankText(rows: RankingContentInput["allPrefectures"]): string {
  const prefectures = fetchPrefectures();
  const codeToName = new Map(prefectures.map((p) => [p.prefCode, p.prefName]));
  const byName = new Map(rows.map((r) => [r.areaName, r]));
  let matched = 0;
  const lines = REGIONS.map((region) => {
    const members = region.prefectures
      .map((code) => byName.get(codeToName.get(code) ?? ""))
      .filter((r): r is NonNullable<typeof r> => Boolean(r))
      .sort((a, b) => a.rank - b.rank);
    matched += members.length;
    return `- ${region.regionName}: ${members.map((r) => `${r.areaName} ${r.rank}位`).join(", ") || "該当県なし"}`;
  });
  if (rows.length === 0 || matched < rows.length * 0.9) return "";
  return lines.join("\n");
}

export interface RankingContentPromptOptions {
  /**
   * NotebookLM 等から取得した追加コンテキスト（白書・政府統計の出典等）。
   * 指定時はプロンプトの絶対ルール直後に「補強コンテキスト」section として prepend される。
   * /enhance-ranking-ai-content スキルが NotebookLM 横断クエリ結果を渡すために使う。
   *
   * 注意: 提供データの数値・順位は variable に保ち、文体・社会的背景・事例の言葉づかいの
   * 「再構成」素材としてのみ使用する旨を LLM 側で誘導している (転記禁止)。
   */
  extraContext?: string;
}

/**
 * ランキングページ向けAIコンテンツ生成プロンプトを構築する。
 * 出力: JSON（FaqContent, regionalAnalysis Markdown, insights Markdown）
 *
 * @param input ランキングデータ (必須)
 * @param options 追加オプション (extraContext で NotebookLM 出典を注入可能)
 */
export function buildRankingContentPrompt(
  input: RankingContentInput,
  options?: RankingContentPromptOptions,
): string {
  const allPrefText = input.allPrefectures
    .map((r) => `${r.rank}位 ${r.areaName}: ${r.value.toLocaleString()}${input.unit}`)
    .join("\n");

  const regionMapText = buildRegionMapText();
  // FAQ の「平均を上回る県数」をモデルに数えさせない (batch2 で 2 件が誤集計・critic MAJOR)。機械計算して渡す
  const aboveAverage = input.allPrefectures.filter((r) => r.value > input.average).length;
  const belowAverage = input.allPrefectures.filter((r) => r.value < input.average).length;
  const regionRankText = buildRegionRankText(input.allPrefectures);
  const regionRankSection = regionRankText
    ? `

## 地方別の順位（順位の良い順。「地方の中で最も高い / 低い」はここで確認する）
${regionRankText}`
    : "";

  const extraContextSection = options?.extraContext
    ? `

## 補強コンテキスト (外部出典、文体・背景の素材として再構成して活用)

以下は NotebookLM 等で収集した白書・政府統計の出典情報です。**文言をそのまま転記してはいけません**。背景・社会的文脈・事例の **言葉づかいの素材** として再構成してください。提供データの数値・順位を上書きすることは禁止です。

${options.extraContext}
`
    : "";

  return `あなたは日本の公的統計データを正確に読み解く統計アナリストです。
以下の「${input.rankingName}」の都道府県別ランキングデータ（${input.yearCode}年度）を分析し、Webページに掲載するコンテンツを生成してください。

## 絶対ルール（違反は不可）

1. **提供データのみ使用**: 以下に記載された数値・順位のみを使うこと。プロンプトに含まれないデータ、外部統計、他指標への言及は一切禁止
2. **因果関係の推測禁止**: 「〜が原因」「〜のおかげ」等の因果推論は書かない。「〜と相関がある可能性がある」「〜が背景にあると考えられる」程度の示唆に留める
3. **煽り表現禁止**: 「衝撃」「危機」「非常事態」「跳ね上がる」等の感情的表現は使わない。客観的・中立的なトーンを維持する
4. **データ外の知識を混ぜない**: 特定の施設名、政策名、制度名、企業名への言及は禁止（提供データに含まれていない限り）
5. **括弧の中に数値を書かない**: 全セクション共通。決定的ゲートが機械検出して公開を止める最頻の違反。
   - NG:「愛知県（746.0万人）が4位」「石川県（2.5人、31位）」
   - OK:「愛知県は4位」「石川県は31位で全国平均をやや下回る」
   - 許容されるのは「（2020年度）」のような年度表記と「（出典…）」のみ。詳細は末尾の文体ルール参照${extraContextSection}

## ランキングデータ（全${input.totalCount}都道府県）

- 指標: ${input.rankingName}
- 単位: ${input.unit}
- 年度: ${input.yearCode}年度
- 平均値: ${input.average.toLocaleString()}${input.unit}
- 最大値: ${input.max.toLocaleString()}${input.unit}
- 最小値: ${input.min.toLocaleString()}${input.unit}
- 平均を上回る県: ${aboveAverage} 県 / 平均を下回る県: ${belowAverage} 県（平均と同値の県は含めない。FAQ ではこの数をそのまま使い、自分で数え直さない）

${allPrefText}

## 7地方区分
${regionMapText}${regionRankSection}

## 出力形式

以下のJSON形式で出力してください。**\`prefectureCommentary.items\` は必ず ${input.totalCount} 件すべて含めること**（順位順、欠落不可）。

\`\`\`json
{
  "faq": {
    "items": [
      {
        "question": "<${input.rankingName}で1位の都道府県は？という趣旨の自然な質問文>",
        "answer": "<1位の県名・数値・年度を含む簡潔な回答。1〜2文>",
        "type": "top_ranking"
      },
      {
        "question": "<最下位の都道府県は？という趣旨の質問文>",
        "answer": "<最下位の県名・数値を含む簡潔な回答。1〜2文>",
        "type": "bottom_ranking"
      },
      {
        "question": "<全国平均はいくつ？という趣旨の質問文>",
        "answer": "<平均値と、上の「平均を上回る県 / 下回る県」の県数をそのまま使った回答。自分で数え直さない>",
        "type": "average"
      },
      {
        "question": "<地域ごとの傾向は？という趣旨の質問文>",
        "answer": "<上位・下位に多い地方の傾向を数値付きで回答>",
        "type": "regional"
      },
      {
        "question": "<1位と最下位の差は？という趣旨の質問文>",
        "answer": "<具体的な倍率や差を含む回答>",
        "type": "custom"
      }
    ]
  },
  "regionalAnalysis": "<Markdown形式。後述のルール参照>",
  "insights": "<Markdown形式。後述のルール参照>",
  "prefectureCommentary": {
    "items": [
      {
        "areaCode": "<提供データの順位リストに含まれる5桁都道府県コードを推定。北海道=01000, 青森=02000, ..., 沖縄=47000>",
        "areaName": "<都道府県名>",
        "rank": 1,
        "value": 12345,
        "commentary": "<60〜120字。順位の位置づけ、属する地方区分内での傾向、全国平均との比較を述べる>"
      }
    ]
  }
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
  - 中位帯の厚み（平均付近に何県が集まるか、分布は偏っているか）
  - 上位県・下位県に共通する地理的特徴（太平洋側/日本海側、都市部/地方部 等）
- **regionalAnalysis と同じ結論を別の言葉で繰り返さない**。「どの地方が高く、どの地方が低いか」は
  regionalAnalysis の担当。insights は地方単位ではなく、全国横断の集計・分布・格差の読みに徹する
- 「なぜそうなるか」の因果は書かない。「〜という傾向が見られます」で止める

### FAQ のルール

- question は検索ユーザーが実際に検索窓に入力しそうな自然な日本語にする
- answer は提供データの数値のみで回答する。「〜と考えられます」等の推測は含めない
- 各 answer は1〜3文で簡潔に

### prefectureCommentary のルール（最重要 - 必ず ${input.totalCount} 件すべて含める）

- 提供されたランキングリストに含まれる全 ${input.totalCount} 都道府県について、1 件ずつ commentary を作成する
- 各 commentary は **60〜120 字**。短すぎても長すぎてもいけない。59 字以下は不合格。
  「順位帯の位置づけ」と「地方内での相対位置または全国平均との比較」の 2 文で組むと 60 字を下回らない
- 47 件で同じ文型を繰り返さない。書き出し（「全国◯位の水準で」等）と述部を県ごとに変え、
  同順位帯の県でも着眼点（地方内の位置 / 平均との距離 / 隣接県との対比）を入れ替える
- 内容: 「順位帯（上位 / 中位 / 下位）」は必ず入れる。それに加えて次の視点から **県ごとに 1〜2 つを選び、
  47 件で組み合わせを入れ替える**（全県に同じ 3 要素を同じ順で書くと定型の穴埋めになり不合格）:
  - 属する地方区分（北海道・東北 / 関東 / 中部 / 近畿 / 中国 / 四国 / 九州・沖縄）の中での相対位置
  - 全国平均（${input.average.toLocaleString()}${input.unit}）との距離感（大きく上回る / わずかに下回る 等）
  - 同地方または隣接する 1 県との対比（引用は 1 県まで）
  - その順位帯の密集度（僅差で並ぶ帯にいるのか、前後と差が開いているのか）
- 文型の例（これらを混ぜ、同じ書き出しを連続させない）:
  - 「○○地方の中では最上位に近く、全国でも上位帯に入ります。平均との差は小さくありません。」
  - 「順位は中位ですが、前後の県と僅差で並ぶ帯にあります。地方内では△△県に次ぐ位置です。」
  - 「全国平均を下回る下位帯です。同じ地方の□□県とは対照的な位置にあります。」
- **書き出しの回し方**: 「○○地方の中では」で始める解説は ${input.totalCount} 件中 12 件以下にする。残りは順位帯・
  平均との距離・隣接県との対比・順位帯の密集度のどれかから書き始める。読者は自県の 1 件しか読まないが、
  レビューは ${input.totalCount} 件を並べて読む
- 「地方の中で最も高い / 最も低い」と書く前に「地方別の順位」で確認する。同じ地方の 2 県に「最も低い」と書くのは事実誤り
- 長さは 2 文で合計 60〜100 字を目安にする（1 文だけの解説は 60 字に届かない）
- **禁止事項**:
  - 数値を 2 つ以上列挙しない（順位と値はテンプレで表示するため、commentary 文内で繰り返さない）
  - 「〜のため」「〜が原因」などの因果推測
  - 「ワースト」「ベスト」「衝撃」等の感情的表現
  - 他県名を 2 県以上引用しない（同地方の代表として 1 県までは可）
- 文体は中立・客観的。読者が「自分の県」を検索した時に「ふむふむ」と納得できるトーン
- areaCode は提供リスト中の都道府県名から正しく対応付ける。間違えると地図上で別の県にひも付くため致命的

### 文体ルール（全セクション共通）

- **ですます調で統一する**: insights / regionalAnalysis / FAQ / commentary のすべての文を「〜です」「〜ます」で終える。
  「〜である」「〜だ」「〜見られる。」「〜表れている。」のような常体で文を終えない（見出しは除く）
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
