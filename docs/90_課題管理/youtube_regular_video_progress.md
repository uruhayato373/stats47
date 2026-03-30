# YouTube 通常動画 制作進捗

最終更新: 2026-03-25

## 完了した作業

### 1. 競合分析・戦略レポート
- 5チャンネル（データは語る / 数字で巡る世界 / 世界ランキング図鑑 / そういうデータあるんすか / データ図鑑）を分析
- 成功パターン7つを抽出 → `.claude/agents/sns-producer.md` に統合済み
- 制作ルール（尺・構成・タイトル）→ `/post-youtube`, `/publish-youtube-normal` スキルに統合済み

### 2. 6テーマの動画企画書
- `docs/90_課題管理/youtube_regular_video_plans.md` に記録
- 犯罪・治安 / 外国人人口 / 県民所得 / 生活保護 / 離婚率 / 自殺率
- 各テーマの具体的データポイント、タイトル候補3案、5分構成タイムラインを作成

### 3. 犯罪テーマのデータ準備
- `.local/r2/sns/ranking/theft-offenses-recognized-per-1000/data.json` — 窃盗犯認知件数2023年 全47都道府県
- `.local/r2/sns/ranking/theft-offenses-recognized-per-1000/ranking_items.json` — メタデータ
- プレビューデータ（`apps/remotion/src/utils/preview-data.ts`）を窃盗犯データに上書き済み

### 4. Remotion レンダリング（部分完了）
- サムネイル: `.local/r2/sns/ranking/theft-offenses-recognized-per-1000/youtube/stills/thumbnail-1280x720.png` — 完了（201KB）
- Normal動画: ディスク容量不足（1264/5880フレームで失敗）

### 5. 横棒グラフ新テンプレート作成
- `apps/remotion/src/features/ranking-youtube/RankingHorizontalBar.tsx` — 新規作成
- `apps/remotion/src/features/ranking-youtube/previews/RankingHorizontalBarPreview.tsx` — プレビューラッパー
- `apps/remotion/src/Root.tsx` に `RankingYouTube-HorizontalBar` Composition を登録済み
- 型チェック通過済み
- **Studioでのプレビュー未実施**

### 6. ディスク容量確保
- 投稿済み16ランキングのSNS動画ファイル（318ファイル / 7.4GB）を削除
- data.json は保持済み（再レンダリング可能）
- 現在の空き容量: 約6.8GB（OS遅延反映の可能性あり）

### 7. X（Twitter）引用RT戦略
- `docs/90_課題管理/x_quote_rt_strategy.md` に企画段階の運用ルールを記録

### 8. ScrollGes テンプレート作成・犯罪テーマ動画投稿（2026-03-28）
- `RankingScrollGes` テンプレート新規作成（GES背景 + 右からスライドインするカード）
- NormalIntro を画面中央・大フォントに改修
- YouTube Data API アップロードスクリプト作成（`scripts/youtube-upload.js`）
- OAuth スコープに `youtube.upload` 追加・再認証完了
- 犯罪テーマ（`theft-offenses-recognized-per-1000`）を ScrollGes でレンダリング → YouTube に限定公開で投稿完了
  - Video ID: `gzdSq-COcHM`
  - URL: https://www.youtube.com/watch?v=gzdSq-COcHM
- `/render-sns-stills` スキルの YouTube Normal テンプレートを `RankingYouTube-ScrollGes` に変更

## 次に行うこと

### 優先度: 高
1. **犯罪テーマ動画の確認・公開設定** — YouTube Studio で限定公開→公開に変更、公開時間 JST 20:00 に予約
2. **残り5テーマのdata.json生成・レンダリング・投稿** — 外国人人口 / 県民所得 / 生活保護 / 離婚率 / 自殺率

### 優先度: 中
3. **ScrollGes テンプレートの改善** — 都道府県コメント追加、TOP3 の演出強化
4. **YouTube 自動投稿スキル作成** — `scripts/youtube-upload.js` をスキル化

### 優先度: 低
5. **X引用RT用の検索パターン整理** — `x_quote_rt_strategy.md` のTODO
6. **投稿済み動画の `/mark-sns-posted` 実行** — R2リモートからも削除

## レンダリングコマンド（再実行用）

```bash
# Normal版
cd apps/remotion && npx remotion render src/index.ts RankingYouTube-Normal \
  "../../.local/r2/sns/ranking/theft-offenses-recognized-per-1000/youtube/normal.mp4" \
  --props /tmp/sns-props-yt.json

# 横棒グラフ版
cd apps/remotion && npx remotion render src/index.ts RankingYouTube-HorizontalBar \
  "../../.local/r2/sns/ranking/theft-offenses-recognized-per-1000/youtube/horizontal-bar.mp4" \
  --props /tmp/sns-props-yt.json

# サムネイル（完了済み）
cd apps/remotion && npx remotion still src/index.ts RankingYouTube-Thumb-Hero \
  "../../.local/r2/sns/ranking/theft-offenses-recognized-per-1000/youtube/stills/thumbnail-1280x720.png" \
  --props /tmp/sns-props-thumb.json
```

## props再生成コマンド（/tmp が消えた場合）

```bash
cd /Users/minamidaisuke/stats47 && node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.local/r2/sns/ranking/theft-offenses-recognized-per-1000/data.json','utf8'));
const itemMeta = JSON.parse(fs.readFileSync('.local/r2/sns/ranking/theft-offenses-recognized-per-1000/ranking_items.json','utf8'));
const hookText = '2位は大阪じゃない。意外すぎる県';
const displayTitle = '泥棒が多い県ランキング';
const meta = { title: itemMeta.title, subtitle: itemMeta.subtitle, unit: itemMeta.unit, yearName: data.yearName, normalizationBasis: '人口1,000人あたり' };
const allEntries = data.data.map(d => ({ rank: d.rank, areaCode: d.areaCode, areaName: d.areaName, value: d.value }));
fs.writeFileSync('/tmp/sns-props-yt.json', JSON.stringify({ theme:'dark', hookText, displayTitle, meta, allEntries, variant:'youtube', precision:2, colorScheme:'interpolateBlues' }));
fs.writeFileSync('/tmp/sns-props-thumb.json', JSON.stringify({ theme:'dark', variant:'hero', hookText, displayTitle, meta, allEntries, precision:2 }));
console.log('Props regenerated');
"
```
