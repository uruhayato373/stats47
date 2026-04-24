---
name: publish-youtube-normal
description: YouTube 通常動画（ScrollGes）の制作からアップロード・DB 記録までを一貫実行する。Use when user says "YouTube動画投稿", "YouTube通常動画". レンダリング → アップロード → DB 記録.
disable-model-invocation: true
argument-hint: <rankingKey> [--schedule <ISO8601>]
---

YouTube 通常動画（16:9 ScrollGes テンプレート）の制作からアップロード・DB 記録・ローカル削除までを一貫実行する。

## 事前チェック（必須）

実行前に投稿ガードを通す。停止期間中 or 週 3 本上限到達時は exit 1 で即停止する:

```bash
node .claude/scripts/lib/check-youtube-post-budget.cjs || exit 1
```

ガードが失敗したら強行せず、`.claude/state/youtube-pause.json` の内容を確認する（シャドウバン対応中なら該当 Issue を参照）。

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **rankingKey** | ○ | — | ランキングキー |
| **--schedule** | — | なし | 予約公開日時（ISO 8601, UTC）。例: `2026-03-31T11:00:00Z`（= JST 20:00） |
| **--hookText** | — | 自動生成 | イントロ画面のフックテキスト（15文字以内） |
| **--displayTitle** | — | 自動生成 | 表示タイトル（20文字以内） |

## 通常動画の制作ルール

競合分析・離脱分析（2026-03 調査）に基づく実証済みルール。

### 尺・構成

- **動画尺は 4:50〜5:00 に統一**（競合上位チャンネルの平均 4:56。3分台は情報量不足、10分超は離脱増）
- **公開時間: JST 20:00 固定**（= UTC 11:00。競合「データ図鑑」は 43/44 本が 20 時公開）
- **投稿頻度: 週 2〜3 本**

### 5 セクション構成テンプレート

| セクション | 時間 | 内容 |
|---|---|---|
| フック | 0:00-0:15 | 衝撃的な事実を 1 つ提示（「○○県は全国平均の 2 倍」） |
| 導入 | 0:15-0:30 | テーマの背景を簡潔に |
| ランキング発表 | 0:30-3:00 | 47 位→1 位（または TOP10 / ワースト 10） |
| 深掘り解説 | 3:00-4:00 | 1 位の理由、地域パターン、意外な発見 |
| まとめ・CTA | 4:00-4:50 | 結論 + チャンネル登録・コメント誘導 |

### タイトル最適化

- **「都道府県別」をタイトル先頭に配置**（再生数 4 倍）
- **感情フック語を含める**（再生数 8 倍）
- フォーマット: 「都道府県別 ○○ランキング｜意外性のある副題」

## 前提

- ローカル D1 に `ranking_data`, `ranking_items` が存在すること
- OAuth 認証済み（`.env.local` に `GOOGLE_OAUTH_*` 3つ）
- `.claude/scripts/youtube/upload.js` が存在すること
- GES 背景動画が `apps/remotion/public/backgrounds/ges/landscape/` にあること

## 手順

### Phase 1: データ生成

DB から rankingKey の最新年データを取得し、`data.json` + `ranking_items.json` を生成する。

```bash
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const DB_PATH = '.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const KEY = '<rankingKey>';
const BASE = '.local/r2/sns/ranking/' + KEY;

fs.mkdirSync(BASE + '/youtube/stills', { recursive: true });

const db = new Database(DB_PATH, { readonly: true });
const item = db.prepare('SELECT * FROM ranking_items WHERE ranking_key = ?').get(KEY);
const years = db.prepare('SELECT DISTINCT year_code FROM ranking_data WHERE category_code = ? ORDER BY year_code DESC').all(KEY);
const latestYear = years[0].year_code;
const rows = db.prepare('SELECT area_code, area_name, CAST(value AS REAL) as value, year_name FROM ranking_data WHERE category_code = ? AND year_code = ? ORDER BY CAST(value AS REAL) DESC').all(KEY, latestYear);
const yearName = rows[0].year_name || latestYear + '年度';

const ranked = rows.map((r, i) => ({ rank: i + 1, areaCode: r.area_code, areaName: r.area_name, value: parseFloat(r.value.toFixed(2)) }));

fs.writeFileSync(BASE + '/data.json', JSON.stringify({ categoryCode: KEY, categoryName: item.title, yearCode: latestYear, yearName, unit: item.unit, data: ranked }, null, 2));
fs.writeFileSync(BASE + '/ranking_items.json', JSON.stringify({ title: item.title, subtitle: item.subtitle || undefined, unit: item.unit, normalizationBasis: item.normalization_basis || undefined }, null, 2));
console.log('Generated: ' + ranked.length + ' entries, year=' + latestYear);
db.close();
"
```

### Phase 2: Props 生成 + サムネイル レンダリング

hookText と displayTitle はユーザー指定または企画書から取得する。

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('<BASE>/data.json','utf8'));
const itemMeta = JSON.parse(fs.readFileSync('<BASE>/ranking_items.json','utf8'));
const hookText = '<hookText>';
const displayTitle = '<displayTitle>';
const meta = { title: itemMeta.title, subtitle: itemMeta.subtitle, unit: itemMeta.unit, yearName: data.yearName, normalizationBasis: itemMeta.normalizationBasis };
const allEntries = data.data.map(d => ({ rank: d.rank, areaCode: d.areaCode, areaName: d.areaName, value: d.value }));
fs.writeFileSync('/tmp/sns-props-yt.json', JSON.stringify({ theme:'dark', hookText, displayTitle, meta, allEntries, variant:'youtube', precision:2, colorScheme:'interpolateBlues' }));
fs.writeFileSync('/tmp/sns-props-thumb.json', JSON.stringify({ theme:'dark', variant:'hero', hookText, displayTitle, meta, allEntries, precision:2 }));
console.log('Props generated');
"
```

サムネイル:
```bash
cd apps/remotion && npx remotion still src/index.ts RankingYouTube-Thumb-Hero \
  "../../<BASE>/youtube/stills/thumbnail-1280x720.png" \
  --props /tmp/sns-props-thumb.json
```

### Phase 3: ScrollGes レンダリング

**約30分かかる。バックグラウンドで実行する。**

```bash
cd apps/remotion && npx remotion render src/index.ts RankingYouTube-ScrollGes \
  "../../<BASE>/youtube/scroll-ges.mp4" \
  --props /tmp/sns-props-yt.json
```

### Phase 4: YouTube メタデータ生成 + アップロード

レンダリング完了後、以下のテンプレートに沿ってメタデータを生成し、`.claude/scripts/youtube/upload.js` でアップロードする。

#### タイトル（50文字以内）

SEO キーワードを先頭に配置。「都道府県別」＋指標名＋意外性のあるフック。

#### 説明欄テンプレート（250文字以上）

```
#ハッシュタグ1 #ハッシュタグ2 #ハッシュタグ3 #stats47

{動画の説明文 2〜3行。冒頭125文字にキーワード集中}

■ ランキング TOP5
1位 ○○県 ○○
...

■ ランキング WORST5
43位 ○○県 ○○
...

データ出典: e-Stat 政府統計の総合窓口（{年度}）

📊 全47都道府県ランキングはこちら
https://stats47.jp/ranking/{rankingKey}?utm_source=youtube&utm_medium=social&utm_campaign=ranking&utm_content={rankingKey}

あなたの県は何位だった？コメントで感想教えてください！

━━━━━━━━━━━━━━━
📊 統計で見る都道府県 | stats47
🌐 https://stats47.jp?utm_source=youtube&utm_medium=social&utm_campaign=channel
━━━━━━━━━━━━━━━

📢 チャンネル登録で最新の都道府県ランキングを見逃さない！
```

**必須ルール**:
- 個別ランキング URL を折りたたみ前（先頭3行以内）に近い位置に配置
- UTM パラメータ必須（`utm_content={rankingKey}` でテーマ別計測）
- チャンネル共通リンク（`stats47.jp?utm_campaign=channel`）は末尾に固定
- 自殺率テーマは説明欄末尾に相談窓口（いのちの電話・よりそいホットライン等）を必ず記載

#### アップロード

```bash
node .claude/scripts/youtube/upload.js \
  <BASE>/youtube/scroll-ges.mp4 \
  --title '<title>' \
  --description '<description>' \
  --tags '<tags>' \
  --thumbnail <BASE>/youtube/stills/thumbnail-1280x720.png \
  --schedule <ISO8601>
```

### Phase 5: DB 記録 + ローカル削除

アップロード成功後、`sns_posts` に INSERT する。

```bash
node -e "
const Database = require('better-sqlite3');
const DB_PATH = '.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite';
const db = new Database(DB_PATH);
db.prepare(\`INSERT INTO sns_posts (platform, post_type, domain, content_key, caption, post_url, status, scheduled_at, created_at, updated_at)
VALUES ('youtube', 'normal', 'ranking', ?, ?, ?, 'scheduled', ?, datetime('now'), datetime('now'))\`).run(
  '<rankingKey>', '<title>', 'https://www.youtube.com/watch?v=<videoId>', '<scheduledAt>'
);
console.log('sns_posts に記録しました');
db.close();
"
```

mp4 削除（~700MB 回収）:
```bash
rm -f <BASE>/youtube/scroll-ges.mp4
```

## 注意

- レンダリングは1本ずつ順次実行（ディスクと CPU の制約）
- 自殺率テーマは説明欄末尾に相談窓口（いのちの電話等）を必ず記載
- `--schedule` の日時は UTC で指定（JST 20:00 = UTC 11:00）
