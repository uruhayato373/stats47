---
name: buzz-map
description: バズ地図カード（まちの計量舎系の日本地図×統計）の静止画PNG・動画MP4を「spec作成 → レンダ → 目視 → 改善」の反復で作る統合スキル。Use when user says "バズ地図", "buzz-map", "地図カード作成", "地図動画". 型・トークン・テーマカタログの正典は .claude/rules/buzz-map-standards.md。
disable-model-invocation: true
argument-hint: "<theme_id|specパス> [--type A|B] [--ratio 45|11|169|916] [--video] [--preview] [--year N --summary]"
primary_agent: sns-renderer
co_agents: [x-strategist, gis-curator]
---

# /buzz-map — バズ地図カードの生成→目視→改善ループ

日本地図×統計の SNS カード（型A=静止画二値 / 型B=時系列アニメ）を 1 本の線で作る。
**規約・レイアウト5要素・配色・テーマカタログはすべて [`buzz-map-standards.md`](../../../rules/buzz-map-standards.md) が正典**。本スキルは手順のみ。

## 前提

- `npm ci` 済み（モノレポルート）。レンダは Chrome 必須（Remotion/Puppeteer）
- spec は `apps/remotion/src/features/buzz-map/specs/<id>.json`（`{"spec": {...}}` 形式）
- フォント・ジオデータは同梱済み（`public/buzz-map/`）。追加セットアップ不要

## 工程

| step | 内容 | 出力 |
|---|---|---|
| 1. spec | **候補カタログ `build-buzz-map-catalog.ts --next N --lane muni\|pref\|ksj\|mlit-dpf`** から選ぶ（真実源 = `.claude/state/sns/buzz-map-catalog.json`・4 レーン）。型A(e-Stat)=`build-buzz-map-spec.ts`、型C 点プロット/点→自治体(KSJ・DPF)=`build-buzz-map-spec-ksj.ts` で自動生成、型B/新規はカタログ§4 を見て手作成 | `specs/<id>.json` |
| 2. still | 静止画レンダ（型Bも先に最終年静止画で構図確認） | `.local/r2/sns/buzz-map/<id>/x/stills/` |
| 3. 目視 | 生成 PNG を Read で開きチェックリスト判定（下記） | — |
| 4. 改善 | 崩れは spec 修正を優先して再レンダ。カードCSS/tokens の変更は standards §6 決定ログとセット | — |
| 5. video | 型B: `--preview`（先頭90フレーム・半解像度）で試写 → OK なら本尺 MP4 | `.local/r2/sns/buzz-map/<id>/x/` |
| 6. 台帳 | カタログ status を `build-buzz-map-catalog.ts --mark-spec\|--mark-generated\|--mark-posted <metricKey> --theme-id <id>` で更新 + standards §4 テーマ台帳に 1 行追加。投稿は既存フロー（posts.json draft、§2-9 登録は §2-10 ゲート）へ | — |

## 実行コマンド（apps/remotion で実行）

```bash
cd apps/remotion

# 型A 静止画（4:5 既定）。--props に spec ファイルをそのまま渡す
npx remotion still src/index.ts BuzzMap-Still-45 \
  ../../.local/r2/sns/buzz-map/<id>/x/stills/<id>-45.png \
  --props=src/features/buzz-map/specs/<id>.json

# 型B の最終年静止画（併投稿用・サマリー付き）: spec に year/showSummary を足した props を使う
node -e "const s=require('./src/features/buzz-map/specs/<id>.json');s.showSummary=true;console.log(JSON.stringify(s))" > /tmp/props.json
npx remotion still src/index.ts BuzzMap-Still-45 ../../.local/r2/sns/buzz-map/<id>/x/stills/<id>-final.png --props=/tmp/props.json

# 型B 試写（先頭3秒・半解像度で高速確認）
npx remotion render src/index.ts BuzzMap-Reel-11 /tmp/<id>-preview.mp4 \
  --props=src/features/buzz-map/specs/<id>.json --frames=0-89 --scale=0.5

# 型B 本尺（尺は spec の speed/holdSeconds から自動算出）
npx remotion render src/index.ts BuzzMap-Reel-11 \
  ../../.local/r2/sns/buzz-map/<id>/x/<id>-11.mp4 \
  --props=src/features/buzz-map/specs/<id>.json
```

比率は composition id で選ぶ: `BuzzMap-Still-{45,11,169,916}` / `BuzzMap-Reel-{11,916}`。型C 点プロット・型D 線ネットワークは型A と同じ `BuzzMap-Still-*`（型D 時系列リールは `BuzzMap-Reel-*`）。

### spec 自動生成（step 1 のデータ接地）

```bash
# 型A（e-Stat 観測値 → 二値化）
npx tsx .claude/scripts/sns/build-buzz-map-spec.ts --metric <key> --id <id> \
  --level muni|pref --mode threshold --op gte --value N --title "..." --accent social|infra \
  --label-hit "..." --label-miss "..."

# 型C 点プロット（KSJ topojson → 属性フィルタ → 代表点）
npx tsx .claude/scripts/sns/build-buzz-map-spec-ksj.ts --data-id S12 --version 24 \
  --mode point-plot --filter "S12_057>=5000" --id <id> --title "..." --accent social \
  --label-hit "..." --data-year "令和4年度"

# 点→自治体二値（型A・◯◯がある/ない自治体。--invert で無い側）
npx tsx .claude/scripts/sns/build-buzz-map-spec-ksj.ts --data-id S12 --version 24 \
  --mode point-muni --invert --id <id> --title "..." --accent infra --label-hit "駅なし" --label-miss "駅あり"

# 型D 線ネットワーク＋時系列（供用開始年で伸びる網図）
npx tsx .claude/scripts/sns/build-buzz-map-spec-ksj.ts --mode line-network \
  --r2-key app/highway-history/highway-sections.topojson --id <id> --year-prop N06_002 \
  --title "..." --accent infra --label-hit "高速道路 総延長km" --data-year "1962-2020"
#   → 静止画 BuzzMap-Still-45（最新年全網図） / 時系列 BuzzMap-Reel-11（--frames=0-89 --scale=0.5 で試写）

# DPF（GraphQL 取得した GeoJSON を投入）
npx tsx .claude/scripts/sns/build-buzz-map-spec-ksj.ts --geojson /tmp/dpf.geojson --mode point-plot --id <id> ...
```

## 目視チェックリスト（step 3）

- [ ] タイトル 2 行以内・改行位置が助詞の前（ダメなら spec `titleLines` で手動改行）
- [ ] 凡例カードが地図と重なっていない・**件数ラベルが入っている**（型A）
- [ ] 年カウンターが右の海域に収まり地図と重ならない（型B）
- [ ] 沖縄インセットの枠とラベル（16:9 は無いのが正しい）
- [ ] 出典・ブランド行の欠落なし。ダミーデータなら【サンプル】明記
- [ ] muni レベル: 境界線が潰れていない・県境オーバーレイが見える

## トラブルシュート

| 症状 | 対処 |
|---|---|
| Chrome が見つからない/DLできない | リモート実行環境では `--browser-executable` で既存 Chromium（例: `/opt/pw-browsers/chromium-*/chrome-linux/chrome`）を指定。Mac はローカル Chrome を自動検出 |
| 日本語が豆腐・書体が違う | `public/buzz-map/fonts/` の woff2 がコミットされているか確認（フォントは同梱が正。OS フォント依存にしない） |
| 尺が想定と違う | spec の `speed`（年/秒）と `holdSeconds` を確認。尺 = Σ(区間年数/yearsPerSec) + hold |
| muni で外れ島が消えている | 仕様（standards §3: 小笠原等は v1 非描画）。必要になったら決定ログを起こして拡張 |
| プレビューを Studio で見たい | `/preview-remotion` ではなく `npm start --workspace stats47-remotion` → Folder「buzz-map」（プレビュー専用・レンダしない） |

## 参照

- 規約の正典: `.claude/rules/buzz-map-standards.md`（型仕様・トークン・テーマカタログ・決定ログ）
- 実装: `apps/remotion/src/features/buzz-map/`（tokens.ts=機械正本 / types.ts=spec 型）
- 投稿・頻度リミット・R2 保持: `.claude/rules/sns-content-standards.md`（§1, §2-9→§2-10, §5.5）
