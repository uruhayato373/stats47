---
name: find-quote-rt
description: X の直近3日以内のバズツイートを全テーマ並列検索し、鮮度×エンゲージメントで最上位候補を提示する。Use when user says "引用RT", "バズツイート検索", "quote RT". 元スレッドが活発なうちに引用RTで到達を最大化.
disable-model-invocation: true
argument-hint: "[テーマ] [--post]"
primary_agent: x-strategist
---

X の**直近3日以内**のバズツイートを全テーマ並列検索し、stats47 データとマッチングしてスコア上位の引用RT候補を提示する。投稿は手動確認後のセミオート運用。

## 用途

- stats47 に関連する**ホットな**バズツイートを見つけて引用RTしたいとき
- 元ツイートがまだ活発なうちに乗って、引用RT経由の到達を最大化したいとき

## 戦略: 鮮度ファースト

テーマローテーションは**採用しない**。理由:
- ローテで先にテーマを固定すると、その日の最強ツイートを逃すリスクが大きい
- X のエンゲージは投稿後24〜48時間に9割発生するため、鮮度が最重要
- テーマ別の反応分析は投稿台帳 `posts.json` の `content_key → ランキングの category_key` の事後集計で十分取れる（観察データ）
- ただし毎回同じテーマに偏らないよう、**直近2件の category_key は避ける**という軽い多様性制約だけ残す

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **テーマ** | - | 全テーマ並列検索 | 明示的にテーマを絞りたい時のみ指定（通常は省略） |
| **--post** | - | false | 指定すると候補選択後に `publish-x --quote-url` で引用RT投稿まで実行 |
| **--with-media** | - | false | 指定時のみ、マッチした県の動画 (station-passengers / migration-flow) を引用RTに添付。デフォルトはテキストのみ |

## テーマカタログ

全テーマのキーワード定義・multi-theme 並列検索用のキーワード集合・多様性制約は `reference/rotation-schedule.md` を参照（ファイル名は歴史的経緯で rotation- のまま）。

## 前提条件

1. browser-use CLI がインストール済み:
   ```bash
   export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
   browser-use doctor
   ```
2. Chrome に X ログイン済みセッション（Profile 5）
3. ローカル D1 に ranking_items データあり

## 手順

### Phase 0: 環境準備

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile 'Profile 5'"
```

### Phase 1: 検索戦略

**X 検索クエリの構成（鮮度ファースト）:**
```
<キーワード> min_faves:300 lang:ja -filter:replies since:<3日前の日付>
```

- `min_faves:300` — 300いいね以上。直近3日は累積時間が短いので閾値を低めに
- `lang:ja` — 日本語のみ
- `-filter:replies` — リプライを除外
- `since:YYYY-MM-DD` — **必須**。直近3日以内に制限（鮮度ファースト）

**なぜ3日か:**
- X のツイートはエンゲージの約9割を投稿後24〜48時間に獲得する
- 3日を超えると元スレッドの会話はほぼ沈静化し、引用RTしても到達が伸びない
- 3日以内なら元ツイート作者や既存リプライ参加者にも通知が届きやすい

### Phase 2: 全テーマ並列検索

テーマが引数で指定されていない場合は、`reference/rotation-schedule.md` のテーマカタログから**全テーマのキーワードで並列に検索**する。

```bash
# since は動的に「3日前」を計算（macOS/Linux 両対応）
SINCE=$(date -v-3d +%Y-%m-%d 2>/dev/null || date -d '3 days ago' +%Y-%m-%d)

# テーマごとに検索→スクレイプを順次実行し、結果を統合する
# （browser-use は1プロファイルで直列実行のため並列化は不可、順次ループする）
for THEME_KEYWORDS in "少子化 OR 出生率 OR 人口減少" "年収 OR 給料 OR 賃金 OR 最低賃金" "物価 OR 家賃 OR 地価" "治安 OR 犯罪 OR 交通事故" "医療 OR 医師不足 OR 看護師" "教育 OR 大学 OR 学歴" "観光 OR インバウンド" "農業 OR 米 OR 農家"; do
  QUERY="$THEME_KEYWORDS min_faves:300 lang:ja -filter:replies since:$SINCE"
  ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$QUERY'))")
  $BU open "https://x.com/search?q=$ENCODED&src=typed_query&f=top"
  sleep 4
  # Phase 3 のスクレイプを実行して結果を変数に蓄積
done
```

**結果が不足の場合のフォールバック:**
1. `min_faves` を 200 まで下げる
2. `since` を 5日前まで拡大（3日 → 5日）
3. それでも不足なら `f=live`（最新順）に切り替えて直近高エンゲージを拾う

**明示的にテーマを引数で指定された場合**は、そのテーマのキーワードだけで検索（並列ループ不要）。

### Phase 3: 検索結果のスクレイプ

各テーマの検索ページで、JavaScript eval でツイート情報を一括抽出する。`ageHours` を算出して**72時間(3日)超のツイートは除外**する。

```bash
$BU eval "(() => {
  const articles = document.querySelectorAll('article[role=article]');
  const results = [];
  const now = Date.now();
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const textEl = a.querySelector('[data-testid=tweetText]');
    const text = textEl ? textEl.textContent.trim() : '';
    const engEl = a.querySelector('[role=group]');
    const engLabel = engEl ? engEl.getAttribute('aria-label') : '';
    // aria-label から いいね数・リポスト数・表示数を数値抽出
    const parseNum = (label, keyword) => {
      const m = label.match(new RegExp('(\\\\d[\\\\d,]*) 件の' + keyword));
      return m ? parseInt(m[1].replace(/,/g,''), 10) : 0;
    };
    const likes = parseNum(engLabel, 'いいね');
    const reposts = parseNum(engLabel, 'リポスト');
    const views = parseNum(engLabel, '表示');
    const links = a.querySelectorAll('a[href*=\"/status/\"]');
    let url = '';
    for (const l of links) { if (l.href.indexOf('/status/') >= 0) { url = l.href; break; } }
    const userEl = a.querySelector('[data-testid=User-Name]');
    const user = userEl ? userEl.textContent : '';
    const timeEl = a.querySelector('time');
    const postedAt = timeEl ? timeEl.getAttribute('datetime') : '';
    const ageHours = postedAt ? Math.floor((now - new Date(postedAt).getTime()) / (60*60*1000)) : 99999;
    // 72時間(3日)超のツイートは除外（鮮度ルール）
    if (ageHours > 72) continue;
    results.push({i, user: user.substring(0,30), text: text.substring(0,220), likes, reposts, views, url, postedAt, ageHours});
  }
  return JSON.stringify(results);
})()"
```

**取得される数値フィールド**: `likes`, `reposts`, `views`, `ageHours`。これらは Phase 4 のスコアリングで使う。

### Phase 4: スコアリング + 多様性チェック

全テーマの検索結果を統合し、各候補に**鮮度×エンゲージメント**スコアを付ける。

#### 4a. スコア計算

```
freshness = max(0, (72 - ageHours) / 72)      # 0〜1、投稿直後1.0、72h で0.0
engagement = log10(likes + 1) + log10(views + 1) * 0.3
score = engagement * (0.4 + 0.6 * freshness)  # 鮮度ボーナス 60%
```

- `log10` を使う理由: バズ規模の差をなだらかにし、中堅ツイートも拾えるようにする
- 鮮度重み60%: 同等エンゲージなら新しい方を強く優遇

#### 4b. 多様性制約（直近2件の category_key を避ける）

スコア順に候補を並べた後、投稿台帳 `posts.json` から直近2件の quote_rt の `content_key` を取得し（完全DBレス。旧 D1 sns_posts は廃止）、その category を解決する:

```bash
# 直近2件の quote_rt content_key（category は metric config の category から解決）
node -e 'const s=require("./.Codex/scripts/lib/sns-posts-store.cjs");
  const recent=s.query(p=>p.post_type==="quote_rt"&&p.platform==="x")
    .sort((a,b)=>(b.posted_at||"").localeCompare(a.posted_at||"")).slice(0,2)
    .map(p=>p.content_key);
  console.log(JSON.stringify(recent))'
```

各 `content_key`（= ranking_key）の `category_key` は metric config（`packages/data-configs/src/metrics/<key>.ts` の `category`）または R2 `app/ranking/<key>/item.json` から解決する。

候補マッチング(4c)で決まった `ranking_key` の `category_key` がこの直近2件に**含まれる場合は除外**する。ただしスコア上位が全て該当する場合は、多様性制約を緩めて最上位を採用する（鮮度優先）。

#### 4c. R2 ranking-items でデータ検索

各候補のツイート内容からキーワードを抽出し、関連するランキングを R2 ranking-items snapshot（旧 D1 indicators の DBレス版）で検索:

```bash
# キーワードで ranking を絞り込む（KW を書き換えて使う）
KW="出生|少子|人口" node -e '
const R2=process.env.R2_PUBLIC_FETCH_URL||"https://storage.stats47.jp";
const re=new RegExp(process.env.KW);
fetch(R2+"/app/ranking-items/all.json").then(r=>r.json()).then(s=>{
  const hits=(s.items||[]).filter(i=>i.areaType==="prefecture"&&re.test(i.rankingName||i.title||""))
    .slice(0,20).map(i=>({rankingKey:i.rankingKey,rankingName:i.rankingName||i.title,categoryKey:i.categoryKey}));
  console.log(JSON.stringify(hits,null,2));
})'
```

キーワードはツイート内容に応じて動的に変更する。同一 `content_key` は過去7日以内に使用していれば除外（投稿台帳 `posts.json` から。完全DBレス。旧 D1 sns_posts は廃止）:

```bash
node -e 'const s=require("./.Codex/scripts/lib/sns-posts-store.cjs");
  const cut=new Date(Date.now()-7*864e5).toISOString();
  const used=s.query(p=>p.post_type==="quote_rt"&&(p.posted_at||"")>cut).map(p=>p.content_key);
  console.log(JSON.stringify([...new Set(used)]))'
```

#### 4d. 動画アセット照合（`--with-media` 指定時のみ）

`--with-media` が指定された場合、ツイートの話題が **station-passengers（駅乗降客数）** または **migration-flow（人口移動）** に合致するか判定し、合致した県の **既存レンダ済み動画** を引用RTに添付する。レンダリングは不要（ストック消化）。

| 話題キーワード | アセット種別 | 動画パス (X / landscape) | 遷移先 URL |
|---|---|---|---|
| 駅, 鉄道, 通勤, 満員電車, 乗降, 路線 | station-passengers | `.local/r2/sns/station-passengers/landscape/<NN>.mp4` | `https://stats47.jp/ranking/<station-passengers の ranking_key>` |
| 引っ越し, 転入, 転出, 転出超過, 移住, 上京, 人口流出 | migration-flow | `.local/r2/sns/migration-flow/<romaji>/x/stills/reel.mp4`（無ければ `migration-flow/landscape/<NN>.mp4`） | `https://stats47.jp/gis-cross/migration-flow?pref=<NN>` |

- `<NN>` = 県コード（01=北海道 … 13=東京 … 23=愛知 … 47=沖縄）、`<romaji>` = 県ローマ字（`tokyo`, `aichi` 等）。対応表は `reference/keyword-mapping.md` の「動画アセット対応」を参照
- **県の選び方**: ツイートが特定県に言及していればその県。汎用的（県名なし）なら話題インパクトの大きい県（駅→東京13、移動→転出超過の話題県）を選ぶ
- 上記いずれにも合致しない場合は `--with-media` でも添付せず **テキストのみ** にフォールバック（無理に添付しない）
- migration-flow の遷移先 URL は `/ranking/` ではなく **`/gis-cross/migration-flow?pref=<NN>`** である点に注意

### Phase 4 補足: e-Stat フォールバック（DB に指標が無い場合）

DB にピッタリの ranking_items が無いときのみ実行。e-Stat API で直接データを探す。特に以下の統計は都道府県別×詳細分類のデータが豊富:

| 統計 | statsDataId 例 | 内容 |
|---|---|---|
| 賃金構造基本統計調査（職種別） | `0003445758` | 130超の職種別賃金（都道府県別） |
| 社会・人口統計体系 | `0000010101`〜`0000010111` | 人口・経済・治安・教育 etc. |

```bash
# e-Stat 検索例
curl -s "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsList?appId=$ESTAT_KEY&searchWord=職種+賃金&limit=5"
```

e-Stat で良いデータが見つかった場合は TS-config (`packages/data-configs/src/metrics/<key>.ts`) を追加 + `/sync-metrics-cache --apply` + `/page-data-batch --metric <key>` で登録することを提案する。

### Phase 5: 候補リスト提示

以下の形式でユーザーに候補を提示する:

```
## 引用RT候補

### 候補 1
- 元ツイート: @xxx「ツイート本文...」(♥ 5,200)
- URL: https://x.com/xxx/status/123456
- マッチデータ: 合計特殊出生率 (total-fertility-rate)
- 引用RTテキスト案:
  「ちなみに都道府県別の合計特殊出生率で見ると、1位は沖縄県(1.70)、47位は東京都(1.04)。
   地域差はかなり大きいです。
   https://stats47.jp/ranking/total-fertility-rate」

### 候補 2
...
```

**引用RTテキストの原則:**
- 1〜2行で簡潔に（200文字以内）
- 「ちなみに」「データで見ると」等の補足スタンス
- 具体的な数値（1位/47位）を含める
- **stats47 URL を毎回含める**（`https://stats47.jp/ranking/<ranking_key>`、migration-flow は `https://stats47.jp/gis-cross/migration-flow?pref=<NN>`）。UTM パラメータは不要
- ハッシュタグは不要
- **添付は opt-in**: デフォルトはテキストのみ（宣伝臭を避け元ツイの文脈に自然に乗る）。`--with-media` 指定かつ station-passengers / migration-flow に合致した時のみ、Phase 4d で選んだ県の動画を 1 本添付する

### Phase 6: 投稿（--post 指定時のみ）

ユーザーが候補を選択し `--post` が指定されている場合のみ実行。
**投稿は `/publish-x` に委譲する**（このスキルは投稿コードを持たない＝投稿機構の単一ソースは publish-x）。引用RTテキストは引用元 URL を含めず caption ファイルに書く。URL の末尾付与・引用カード生成・動画エンコード待ち・fail-safe・DB INSERT (`post_type='quote_rt'`) はすべて publish-x 側が行う。

#### 6a. caption ファイルを書き出す

引用RTテキスト（200文字以内、stats47 URL を含む）を `/tmp/` に書き出す。**引用元ツイート URL は含めない**（publish-x が `--quote-url` で末尾付与する）。

```bash
cat > /tmp/quote-rt-caption.txt <<'EOF'
ちなみに都道府県別の合計特殊出生率で見ると、1位は沖縄県(1.70)、47位は東京都(1.04)。地域差はかなり大きいです。
https://stats47.jp/ranking/total-fertility-rate
EOF
```

#### 6b. publish-x に委譲して投稿

```bash
# テキストのみ（デフォルト） — 即時投稿
npx tsx .Codex/skills/sns/publish-x/publish-x.ts <content_key> \
  --quote-url "https://x.com/xxx/status/123456" \
  --caption /tmp/quote-rt-caption.txt \
  --domain ranking

# --with-media 指定かつ Phase 4d で県動画が選ばれた場合は --media を追加
npx tsx .Codex/skills/sns/publish-x/publish-x.ts <content_key> \
  --quote-url "https://x.com/xxx/status/123456" \
  --caption /tmp/quote-rt-caption.txt \
  --media .local/r2/sns/migration-flow/aichi/x/stills/reel.mp4 \
  --domain gis-cross
```

- `<content_key>` はマッチした ranking_key（または migration-flow の場合は県スラッグ等の識別子）。`--domain` は遷移先に合わせる（ranking / gis-cross）
- 日時を渡さなければ即時投稿（引用RT は鮮度ファースト）。予約したい場合は `<content_key>` の直後に `YYYY-MM-DDTHH:MM` を渡す
- **初回 / セレクタ更新後は `--dry-run` を先に通すこと**（publish-x の fail-safe 規約。誤即時投稿事故の再発防止）
- DB への `post_type='quote_rt'` INSERT は publish-x が成功時に自動実行する（このスキルでは SQL を書かない）

## 運用ルール

| 項目 | ルール |
|---|---|
| 頻度 | 1日2〜3件まで（スパム判定回避） |
| 鮮度 | **投稿から72時間(3日)以内のツイートのみ対象** |
| 対象 | 300いいね以上（3日制約下での現実的な閾値） |
| 選定 | 全テーマ並列検索→スコア(鮮度×エンゲージ)上位から提示 |
| 多様性 | 直近2件の category_key は避ける（ソフト制約） |
| 比率 | 引用RT 3 : オリジナル投稿 7 |
| URL | 3回に1回程度 stats47.jp リンクを含める |
| 添付 | デフォルトはテキストのみ。`--with-media` かつ station-passengers / migration-flow 合致時のみ県動画を 1 本添付（opt-in） |
| スタンス | データで補足・検証する立場。議論に加担しない |

## 避けるべきパターン

- 機械的に大量引用 → アカウント凍結リスク
- 毎回 URL 付き → 宣伝臭でミュートされる
- 元ツイートと無関係なデータ → 逆効果
- 政治的に偏った立場を取る → 炎上リスク
- センシティブなトピック（自殺、差別等）への引用 → ブランド毀損
- **古いツイート(72時間超)への引用RT** → 元スレが沈静化しており到達が伸びない
- **テーマ固定ローテ** → その日の最強ツイートを逃す。鮮度ファースト戦略を優先すること

## 関連スキル

- `/render-sns-stills` — ランキング画像の生成
- `/publish-x` — X への予約投稿
- `/post-x` — X 投稿キャプション生成
- `/generate-utm-url` — UTM パラメータ付き URL 生成
