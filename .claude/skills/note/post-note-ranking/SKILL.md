note ランキング記事（A シリーズ）を DB から自動生成する。テキスト + 画像を一括で出力する量産型スキル。

## 用途

- stats47.jp のランキングデータを note 記事として量産したいとき
- ビュー獲得と stats47.jp への送客を効率的に行いたいとき

## フロー

```
★/post-note-ranking（A シリーズ: 自動生成）
```

B/C/D シリーズの4ステップワークフロー（validate → design → write → edit）は不要。このスキル1つで完結する。

## 引数

- **rankingKey**: ランキングキー（必須）— 例: `annual-sunshine-duration`
- **year**: データ年（省略時: DB の最新年を使用）

## 出力ディレクトリ

```
docs/31_note記事原稿/a-<rankingKey>/
├── note.md              ← 記事本文
├── chart-data.json      ← チャート生成用データ（共通ルール）
├── tags.txt             ← note 投稿時にコピペするタグ（1行1タグ、最大99個）
└── images/              ← Remotion で生成した画像
    ├── cover-1280x670.png
    ├── choropleth-map-1080x1080.png
    ├── chart-x-1200x630.png
    └── boxplot-1200x630.png
```

## 手順

### Phase 1: データ取得

1. ランキングメタデータを取得:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const item = db.prepare(\"SELECT ranking_key, title, unit, category_key, demographic_attr, normalization_basis FROM ranking_items WHERE ranking_key = '<RANKING_KEY>' AND is_active = 1\").get();
console.log(JSON.stringify(item, null, 2));
db.close();
"
```

2. ランキングデータを取得し、偏差値・全国平均を算出:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const rows = db.prepare(\"SELECT area_code, area_name, year, value FROM ranking_data WHERE ranking_key = '<RANKING_KEY>' AND year = <YEAR> ORDER BY value DESC\").all();

// 偏差値・統計量を算出
const values = rows.map(r => r.value);
const mean = values.reduce((a, b) => a + b, 0) / values.length;
const stddev = Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
const result = rows.map((r, i) => ({
  rank: i + 1,
  ...r,
  deviation: Math.round((((r.value - mean) / stddev) * 10 + 50) * 10) / 10,
}));
console.log('=== 統計量 ===');
console.log('全国平均:', Math.round(mean * 100) / 100);
console.log('標準偏差:', Math.round(stddev * 100) / 100);
console.log('1位/47位 倍率:', Math.round((result[0].value / result[result.length - 1].value) * 10) / 10);
console.log('');
console.log('=== 全データ（順位・偏差値付き） ===');
console.log(JSON.stringify(result, null, 2));
db.close();
"
```

3. 関連するブログ記事・ランキングを検索:

```bash
# 同カテゴリのランキング（ranking_data にデータがあるもののみ）
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');
const rows = db.prepare(\"SELECT ri.ranking_key, ri.title FROM ranking_items ri WHERE ri.category_key = '<CATEGORY_KEY>' AND ri.is_active = 1 AND ri.ranking_key != '<RANKING_KEY>' AND EXISTS (SELECT 1 FROM ranking_data rd WHERE rd.category_code = ri.ranking_key) LIMIT 10\").all();
console.log(JSON.stringify(rows, null, 2));
db.close();
"

# 関連ブログ記事
ls .local/r2/blog/ | grep -i '<キーワード>'
```

### Phase 1.5: chart-data.json の保存

Phase 1 で取得したデータを `chart-data.json` として保存する（チャート生成時の DB 再取得を不要にする共通ルール）:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const fs = require('fs');
const slug = 'a-<RANKING_KEY>';
const dir = 'docs/31_note記事原稿/' + slug;
fs.mkdirSync(dir, { recursive: true });

const chartData = {
  _meta: {
    rankingKey: '<RANKING_KEY>',
    year: <YEAR>,
    source: 'post-note-ranking',
    generatedAt: new Date().toISOString()
  },
  summary: {
    mean: <MEAN>,
    stddev: <STDDEV>,
    topBottomRatio: <RATIO>
  },
  data: <PHASE1_RESULT_JSON>
};
fs.writeFileSync(dir + '/chart-data.json', JSON.stringify(chartData, null, 2));
console.log('Saved: ' + dir + '/chart-data.json');
"
```

### Phase 2: 記事テキスト生成

4. 以下のテンプレートで `note.md` を生成する:

#### 記事設計の基本方針

note.com の読者は「格差の分析」よりも「意外な発見」「なぜ？の答え」「自分の県はどうなのか」に興味を持つ。以下の原則で記事を設計する:

- **フック**: 意外性のある事実、読者の常識を覆すデータで興味を引く
- **問いかけ**: 「あなたの県は？」で自分ごと化を促す
- **なぜの解説**: 順位の背景にある理由を丁寧に説明する
- **発見**: 読み終えたときに「へぇ、そうだったのか」と思える知見を提供する

偏差値や倍率は補助的な情報として扱い、文章の主役にしない。

#### 文体の基本方針（硬くなりすぎない工夫）

A シリーズは量産型だが、レポートや辞書のような無機質な文章にしない。以下を意識する:

- **導入はインパクトから**: 定義説明から入らない。驚きの事実・問いかけ・身近なたとえで始め、定義は後から補足する
- **同じ構文を繰り返さない**: 「N位の○○県は偏差値XX.Xで△△%。」を5回連続で書かない。書き出しや文末を変え、体言止め・問いかけ・倒置を混ぜる
- **数字に意味を持たせる**: 「330.8%」だけでなく「年収の3.3倍の借金」のように、読者がイメージできるたとえを添える
- **地域にはストーリーを**: 数値の羅列ではなく「この地域はなぜこうなのか」という視点で語る。全県の順位・数値への言及は維持しつつ、地域の特徴や背景を冒頭に置く
- **文末のバリエーション**: 「〜です」「〜ています」の連続を避ける。3文以上同じ文末が続いたら変える

```markdown
---
title: "【<YEAR>年版】都道府県「<タイトル>」ランキング｜<意外性のあるポイント要約>"
description: "<1位の県名>が<値><単位>で全国1位。最下位の<47位の県名>は<値><単位>で、その差は<倍率>倍。47都道府県の<タイトル>をランキングで紹介します。"
tags:
  - 都道府県ランキング
  - <タイトル関連タグ1>
  - <タイトル関連タグ2>
  - <カテゴリ名>
  - stats47
  - 統計データ
  - 都道府県比較
---

<インパクトのある事実や問いかけで始める。定義から入らない。
例: 「阪神・淡路大震災から30年。兵庫県は今も年収の3.3倍にあたる将来負担を背負い続けています。」
例: 「りんごの産地といえば青森県。でも消費量1位は長野県です。」
数字は身近なたとえに変換し、読者の「へぇ」を引き出す。>

<1位と最下位のデータを自然に紹介。偏差値は補助情報として添える程度。
倍率や格差の大きさは入れるが「その差は実に○倍にのぼります」のような決まり文句は避ける。>

<「なぜ？」を引き出す問いかけ or 意外な事実を1〜2文>

「<指標名>」は<指標の定義を1文で簡潔に>。<データの出所や集計基準の補足（1文）>。

## データハイライト

全国平均: <平均値><単位>

1位: <県名>（<値><単位> / 偏差値 <偏差値>）

47位: <県名>（<値><単位> / 偏差値 <偏差値>）

<全体的な傾向の概要（2〜3文）。意外性のあるパターンや「なぜ？」を引き出す観点で書く>

## 【コロプレス地図】日本全国の分布

<!-- note投稿時: この画像行を削除し、images/choropleth-map-1080x1080.png をアップロード -->
![<タイトル>の都道府県分布](images/choropleth-map-1080x1080.png)

<地図から読み取れる傾向を2〜3段落で記述。意外な県や予想外のパターンに注目し、「なぜこの県が？」という視点で分析する>

## 上位5：分析

<!-- note投稿時: この画像行を削除し、images/chart-x-1200x630.png をアップロード -->
![<タイトル>上位5](images/chart-x-1200x630.png)

<5県それぞれを独立した段落で記述。各県に偏差値・値・背景説明を含める。
ただし書き出しを毎回「N位の○○県は偏差値XX.Xで△△%。」にしない。
以下のようにバリエーションを持たせる:

- 1位は背景のストーリーから入る（例: 「阪神・淡路大震災から30年。兵庫県は330.8%で全国1位です。」）
- 2〜3位は数値から入ってもよいが、文末や接続を変える
- 4〜5位は意外性や他県との対比で書き出す（例: 「意外なのは京都府。観光都市のイメージとは裏腹に…」）
- 背景説明は「なぜこの県が上位なのか」を読者の疑問に答える形で>

## 下位5：分析

<5県それぞれを独立した段落で記述。上位5と同様に書き出しのバリエーションを持たせる。
最下位の県は「なぜ低いのか」のストーリーから入る。>

## 地域別の傾向

<!-- note投稿時: この画像行を削除し、images/boxplot-1200x630.png をアップロード -->
![<タイトル>の地域別傾向](images/boxplot-1200x630.png)

<箱ひげ図から読み取れる地域間の傾向を1〜2文で簡潔に記述。
例: 「近畿と北海道・東北が高く、関東と九州が低い傾向です。」
全県の網羅的な列挙はしない。全47都道府県の順位確認は stats47 へ誘導する。>

## まとめ

<タイトル>の地域差は、<読者に新しい視点を提供する1文>。このデータから以下の洞察が得られます。

**<発見1: 意外性のあるタイトル>**

<1〜2文の説明。「なぜ？」に答える形で。長くなる場合は文ごとに改行する>

**<発見2: 読者が「へぇ」と思うタイトル>**

<1〜2文の説明>

**<発見3: 実生活に結びつくタイトル>**

<1〜2文の説明>

## もっと詳しく知りたい方へ

全47都道府県の順位や、グラフ・地図での可視化は stats47 で見ることができます。

### <タイトル>ランキング 全都道府県版

https://stats47.jp/ranking/<RANKING_KEY>

### <関連ランキング1タイトル>

https://stats47.jp/ranking/<RELATED_KEY1>

### <関連ランキング2タイトル>

https://stats47.jp/ranking/<RELATED_KEY2>

### <関連ランキング3タイトル>

https://stats47.jp/ranking/<RELATED_KEY3>

### <関連ブログ記事タイトル>（stats47ブログ）

https://stats47.jp/blog/<SLUG>

---

**stats47** は、e-Stat の公的統計データを47都道府県別に可視化するサービスです。
ランキング・散布図・時系列チャートで、地域の違いがひと目でわかります。

https://stats47.jp
```

5. `tags.txt` を生成する（note 投稿時にコピペ用、最大99個）:

```
都道府県ランキング
<タイトル>
<タイトル関連キーワード1>
<タイトル関連キーワード2>
...（類義語・表記揺れ・略称を網羅）
<カテゴリ名>
統計データ
都道府県比較
stats47
地域格差
データ分析
<1位の県名>
<47位の県名>
<上位で特徴的な県名>
<○○ランキング>
<○○ 都道府県>
<○○ 1位>
<○○ 全国>
...（99個を目指して網羅的に生成）
```

タグ選定ルール（最大99個）:
- 固定タグ: `都道府県ランキング`, `統計データ`, `都道府県比較`, `stats47`, `地域格差`, `データ分析`
- テーマタグ: タイトルそのもの + 関連キーワード（表記揺れ・類義語・略称を含め幅広く）
- カテゴリタグ: `人口`, `経済`, `気象` 等のカテゴリ名
- 地域タグ: 上位・下位で特徴的な都道府県名
- ロングテールタグ: 「○○ランキング」「○○ 都道府県」「○○ 1位」等の検索されそうな複合ワード
- note で検索されやすい一般的なワードを優先する
- 99個を目指して網羅的に生成する

**テンプレート適用ルール:**

- **文体ルール（厳守）:**
  - 数値情報は（）を使わず、文中に自然に組み込む
  - 悪い例: `京都府（73.0%・偏差値73.6）が全国1位`
  - 良い例: `全国1位の京都府は偏差値73.6で73.0%`
  - 悪い例: `北海道（35位・51.5%）は全国平均を下回る`
  - 良い例: `35位の北海道は51.5%で全国平均を下回っています`
- **導入部の設計:**
  - インパクトのある事実・問いかけ・身近なたとえから始める（定義から入らない）
  - 指標の定義は導入の最後に簡潔に補足する
  - 1位・最下位の値と偏差値を自然に紹介するが、文の主役は「意外な事実」や「なぜ？」
- 「データハイライト」で全国平均・1位・最下位を偏差値付きで提示する
- **「上位5：分析」「下位5：分析」では各県の偏差値と値を記載し、「なぜその順位なのか」を地理的・気候的・社会的背景から丁寧に解説する**
  - 各県を独立した段落で扱い、1県につき偏差値・値・背景説明を記述
  - 偏差値は補助情報として自然に組み込む
  - **書き出しを5県とも同じ構文にしない**。ストーリーから入る、意外性で始める、対比で始めるなどバリエーションを持たせる
- **「地域別の傾向」は箱ひげ図の読み取りを1〜2文で簡潔に**。全県の網羅的な列挙はしない
- **「まとめ」は3つの発見をボールドタイトル付きで記述する**
  - ボールドタイトルと本文は改行で分離する（`**タイトル**: 本文` ではなく `**タイトル**` + 改行 + 本文）
  - 本文も長くなる場合は1文ごとに改行する
  - 洞察のタイトルは「なぜ？」に答える形、または読者が「へぇ」と思う発見を表現
- **考察・分析の制約（厳守）:**
  - **許可される記述:**
    - ランキングデータから直接観察できるパターン（「上位に太平洋側が集中」「日本海側が低い」等）
    - 一般的に広く知られた地理的・気候的事実に基づく説明（「日本海側は冬期に降雪・曇天が多い」「内陸性気候は晴天日が多い」「盆地特有の気候で〜」等）
    - 社会的な一般常識に基づく考察（「都市化が進んだ地域では…」「農業が盛んな地域では…」等）
  - **禁止される記述:**
    - このランキングと**他のランキング**との相関の主張（「〇〇が高い県は△△も高い傾向がある」等）— A シリーズには相関分析データがないため裏付け不可
    - 裏付けのない独自の因果関係の主張（一般常識や定説でないもの）
  - 理由: A シリーズは `/investigate-note-data` を経由しないため、相関データによる裏付けがない。他ランキングとの関係性の主張は誤情報リスクが高い（B-3 の教訓）
- 上位5・下位5のデータは DB の実データを使用
- 偏差値は小数第1位まで（例: 70.7）
- 倍率は小数第1位まで（例: 1.4倍）
- 「もっと詳しく知りたい方へ」で関連ランキング・ブログ記事へのリンクを5本程度掲載（Phase 1 で取得した同カテゴリランキング・ブログ記事を使用）
- B シリーズ考察記事がある場合は「この記事の考察版もあります」で相互リンク（なければセクションごと省略）
- stats47.jp リンクはすべて素 URL（UTM パラメータなし）で記載する。`### 見出し` + 直下に素 URL の形式にすることで、note.com がブログカードとして埋め込み表示する。Markdown リンク記法 `[テキスト](URL)` は使わない
- 「もっと詳しく知りたい方へ」に本ランキング + 関連ランキング3〜4本 + ブログ記事（あれば）を掲載
- note からの流入は GA4 のリファラー（note.com）で判別可能なため、UTM は不要
- リンクパスは `/ranking/`（`/rankings/` ではない）

### Phase 3: 画像生成

5. SNS データファイルの準備（`.local/r2/sns/ranking/<rankingKey>/` に data.json がない場合）:

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite');

const rankingKey = '<RANKING_KEY>';
const item = db.prepare('SELECT title, unit, category_key, demographic_attr, normalization_basis FROM ranking_items WHERE ranking_key = ? AND is_active = 1').get(rankingKey);
const rows = db.prepare('SELECT area_code, area_name, year, value FROM ranking_data WHERE ranking_key = ? AND year = <YEAR> ORDER BY value DESC').all(rankingKey);

const dir = '.local/r2/sns/ranking/' + rankingKey;
fs.mkdirSync(dir + '/instagram', { recursive: true });
fs.mkdirSync(dir + '/note/images', { recursive: true });

// data.json
const data = {
  categoryName: item.title,
  yearName: '<YEAR>年',
  unit: item.unit,
  data: rows.map((r, i) => ({
    rank: i + 1,
    areaCode: String(r.area_code).padStart(2, '0'),
    areaName: r.area_name,
    value: r.value,
  })),
};
fs.writeFileSync(dir + '/data.json', JSON.stringify(data, null, 2));

// ranking_items.json
const itemMeta = {
  title: item.title,
  unit: item.unit,
  demographicAttr: item.demographic_attr || undefined,
  normalizationBasis: item.normalization_basis || undefined,
};
fs.writeFileSync(dir + '/ranking_items.json', JSON.stringify(itemMeta, null, 2));

// caption.json (最低限)
fs.writeFileSync(dir + '/instagram/caption.json', JSON.stringify({ hookText: '', displayTitle: item.title }));

console.log('Data files generated for:', rankingKey);
db.close();
"
```

6. Remotion で画像を生成:

```bash
cd apps/remotion

# Props JSON を生成（OS に応じた一時ディレクトリに保存）
node -e "
const fs = require('fs');
const os = require('os');
const path = require('path');
const data = JSON.parse(fs.readFileSync('../../.local/r2/sns/ranking/<RANKING_KEY>/data.json', 'utf8'));
let itemMeta = {};
try { itemMeta = JSON.parse(fs.readFileSync('../../.local/r2/sns/ranking/<RANKING_KEY>/ranking_items.json', 'utf8')); } catch(e) {}

const props = {
  theme: 'light',
  meta: {
    title: itemMeta.title || data.categoryName,
    unit: itemMeta.unit || data.unit,
    yearName: data.yearName,
    demographicAttr: itemMeta.demographicAttr || undefined,
    normalizationBasis: itemMeta.normalizationBasis || undefined,
  },
  allEntries: data.data.map(d => ({ rank: d.rank, areaCode: d.areaCode, areaName: d.areaName, value: d.value })),
};
const tmpPath = path.join(os.tmpdir(), 'sns-props-note.json');
fs.writeFileSync(tmpPath, JSON.stringify(props));
console.log('Props generated at:', tmpPath);
"

# Chrome パスを判定（プロキシ環境では Chrome Headless Shell のダウンロードが
# ブロックされるため、ローカルの Chrome を --browser-executable で指定する）
PROPS="$(node -e "const os=require('os'),path=require('path');console.log(path.join(os.tmpdir(),'sns-props-note.json'))")"
CHROME_OPT=""
if [ -f "/c/Program Files/Google/Chrome/Application/chrome.exe" ]; then
  CHROME_OPT='--browser-executable "C:/Program Files/Google/Chrome/Application/chrome.exe"'
elif [ -f "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ]; then
  CHROME_OPT=""  # macOS: Remotion が自動で Chrome Headless Shell をダウンロード
fi

# Git Bash (MSYS2) のパス変換を無効化（有効だと出力パスが
# C:/Program Files/Git/ に化ける）
export MSYS_NO_PATHCONV=1

# 画像レンダリング（4枚）
OUTDIR="../../.local/r2/sns/ranking/<RANKING_KEY>/note/images"
eval npx remotion still src/index.ts RankingNote-Cover "$OUTDIR/cover-1280x670.png" --props "$PROPS" $CHROME_OPT
eval npx remotion still src/index.ts RankingNote-ChoroplethMap "$OUTDIR/choropleth-map-1080x1080.png" --props "$PROPS" $CHROME_OPT
eval npx remotion still src/index.ts RankingNote-Chart "$OUTDIR/chart-x-1200x630.png" --props "$PROPS" $CHROME_OPT
eval npx remotion still src/index.ts RankingNote-Boxplot "$OUTDIR/boxplot-1200x630.png" --props "$PROPS" $CHROME_OPT
```

7. 画像を記事ディレクトリにコピー:

```bash
ARTICLE_DIR="docs/31_note記事原稿/a-<RANKING_KEY>/images"
mkdir -p "$ARTICLE_DIR"
cp .local/r2/sns/ranking/<RANKING_KEY>/note/images/*.png "$ARTICLE_DIR/"
```

### Phase 4: 確認

8. 生成物を確認:
- `note.md` の文字数（2500〜4000字が目安）
- stats47.jp リンクが合計5本以上あること
- 全リンクに UTM パラメータが付与されていないこと（素 URL）
- リンクパスが `/ranking/`（`/rankings/` ではない）であること
- 偏差値が正しく算出されていること（Phase 1 の統計量と一致）
- 画像が4枚生成されていること

## 品質チェックリスト

- [ ] タイトルに年版と意外性のあるポイント要約が含まれている
- [ ] 導入部がインパクトのある事実・問いかけから始まっている（定義から入っていない）
- [ ] 導入部に1位・最下位の値・偏差値が含まれている
- [ ] 指標の定義が導入部の最後に簡潔に補足されている
- [ ] データハイライトに全国平均・1位・最下位（偏差値付き）がある
- [ ] コロプレス地図の分析が2〜3段落ある
- [ ] 上位5の各県に偏差値・値と「なぜ？」の背景解説がある
- [ ] 上位5・下位5で書き出しの構文が5県とも同じになっていない
- [ ] 下位5の各県に偏差値・値と「なぜ？」の背景解説がある
- [ ] 地域別の傾向が箱ひげ図の読み取り1〜2文で簡潔にまとまっている
- [ ] まとめに3つの発見がボールドタイトル付きで記述されている
- [ ] 他ランキングとの相関・因果の主張が含まれていない（一般的な地理・気候知識に基づく説明は OK）
- [ ] 「もっと詳しく知りたい方へ」に素 URL（UTM なし）で関連リンクが5本程度ある
- [ ] リンクパスが `/ranking/`
- [ ] 画像が4枚生成されている
- [ ] 文体は「です・ます」調
- [ ] 見出しに絵文字なし
- [ ] Markdown テーブルなし
- [ ] `tags.txt` が生成されている（最大99個、1行1タグ）
- [ ] **数値情報に（）を使っていない — 文中に自然に組み込まれている**

## 量産のコツ

- ビューが見込めるカテゴリから優先: population > economy > health > education > landweather
- 同カテゴリのランキングをまとめて生成すると、関連リンクの相互設計がしやすい
- 生成後、反応が良いテーマは B シリーズ（考察記事）に展開する

## 注意

- **Chrome のインストールが必須**（Remotion のレンダリングに使用）
- **プロキシ環境**（会社 PC 等）では Chrome Headless Shell のダウンロードがブロックされる場合がある。その場合はローカルの Chrome を `--browser-executable` で指定すること（Phase 3 のスクリプトで自動判定済み）
- 画像生成をスキップしたい場合は Phase 3 を省略し、テキストのみ生成可能
- 一時ファイル（`os.tmpdir()/sns-props-note.json`）は自動で上書きされるため削除不要

## 参照

- note 戦略（SSOT）: `docs/30_note記事企画/note戦略.md`
- Remotion note コンポジション: `apps/remotion/src/features/ranking-note/`
- UTM ルール: `.claude/skills/sns/generate-utm-url/SKILL.md`
- SNS 静止画レンダリング: `.claude/skills/sns/render-sns-stills/SKILL.md`
