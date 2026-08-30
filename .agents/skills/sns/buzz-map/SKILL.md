---
name: buzz-map
description: バズ地図カード（まちの計量舎系の日本地図×統計）の静止画PNG・動画MP4を「spec作成 → レンダ → 目視 → 改善」の反復で作る統合スキル。Use when user says "バズ地図", "buzz-map", "地図カード作成", "地図動画". 型・トークン・テーマカタログの正典は .Codex/rules/buzz-map-standards.md。
disable-model-invocation: true
argument-hint: "<theme_id|specパス> [--ratio 45|11|169|916] [--video] [--preview] [--year N --summary]"
primary_agent: sns-renderer
co_agents: [x-strategist, instagram-strategist, gis-curator]
---

# /buzz-map — バズ地図カードの生成→目視→改善ループ

日本地図×統計の SNS カード（型A〜E）を 1 本の線で作る。**型・レンダラーは spec の `type` で決まる**（描く型の一覧・仕様は再列挙せず [`buzz-map-standards.md`](../../../rules/buzz-map-standards.md) §1 が SSOT: 型A 二値 / 型B 時系列アニメ / 型C 点プロット / 型D 線ネットワーク・時系列リール / 型E レイヤー合成）。
**規約・レイアウト5要素・配色・テーマカタログ・カバレッジ表はすべて buzz-map-standards.md が正典**。本スキルは手順のみ。

## 前提

- `npm ci` 済み（モノレポルート）。レンダは Chrome 必須（Remotion/Puppeteer）
- spec は `apps/remotion/src/features/buzz-map/specs/<id>.json`（`{"spec": {...}}` 形式）
- フォント・ジオデータは同梱済み（`public/buzz-map/`）。追加セットアップ不要

## 工程

> **★バッチ量産の既定経路 (2026-07-17〜)**: 単発の下記工程に加え、**`npx tsx .Codex/scripts/sns/prepare-buzz-map-batch.ts`**
> (dry-run 既定・`--apply` で spec→render→R2→caption→**landing contract + isPostable ゲート通過分のみ** posts.json draft)
> が選定〜draft を一括処理する。管理画面は **read-only gallery `/buzz-map`**
> (`npm run admin` → 127.0.0.1:4747/buzz-map — catalog横断表示・素材previewのみ)。
> landing再判定/レンダ/R2 push/draft登録は本skillを実行するagentが担う。ゲート仕様の正典 = `buzz-map-standards.md` §5。

| step | 内容 | 出力 |
|---|---|---|
| 1. spec | **候補カタログ `build-buzz-map-catalog.ts --next N`**（既定 = **curated レーン** score 降順。素材レーンは `--lane muni\|pref\|ksj\|mlit-dpf\|gsi`・真実源 = `buzz-map-catalog.json`・6 レーン）または **`build-buzz-map-combo-catalog.ts --next N --feasible-only`**（掛け合わせ・型E）から選ぶ。型A(e-Stat)=`build-buzz-map-spec.ts`、型C/D(KSJ)=`build-buzz-map-spec-ksj.ts`、型C(GSI 地名)=`build-buzz-map-spec-gsi.ts`（**2 パターン比較は `--pattern-a/--pattern-b`** — 谷vs沢等。凡例が問いの 2 項になることを目視必須）、型E 合成=`merge-buzz-map-specs.ts` で生成 | `specs/<id>.json` |
| 2. still | 静止画レンダ（型Bも先に最終年静止画で構図確認） | `.local/r2/sns/buzz-map/<id>/x/stills/` |
| 3. 目視 | 生成 PNG を Read で開きチェックリスト判定（下記） | — |
| 4. 改善 | 崩れは spec 修正を優先して再レンダ。カードCSS/tokens の変更は standards §6 決定ログとセット | — |
| 5. video | 型B: `--preview`（先頭90フレーム・半解像度）で試写 → OK なら本尺 MP4 | `.local/r2/sns/buzz-map/<id>/x/` |
| 6. 台帳 | agentがカタログ status を `build-buzz-map-catalog.ts --mark-spec\|--mark-generated\|--mark-posted <metricKey> --theme-id <id>` で更新 + standards §4 テーマ台帳に1行追加。管理画面は更新しない | — |

## 実行コマンド（apps/remotion で実行）

> リモート環境では `--browser-executable` が必須。新 chromium は旧 headless を廃止したため
> `export CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` を設定し
> 各 `remotion still|render` に `--browser-executable=$CHROME` を付ける（下の IG 節も同様）。

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

### Instagram 配信レイアウト（素材生成 → R2 → draft 登録）

IG Graph API は **R2 公開 URL** を要求するため、IG 配信は専用パスに出力して push する。静止画は `BuzzMap-Still-45`（1080×1350 4:5）、リールは `BuzzMap-Reel-916`（1080×1920 9:16）。

```bash
# 静止画 (型A/C/E)
npx remotion still src/index.ts BuzzMap-Still-45 \
  ../../.local/r2/sns/buzz-map/<id>/instagram/stills/slide-1-cover-1080x1350.png \
  --props=src/features/buzz-map/specs/<id>.json --browser-executable=$CHROME
# リール (型D・尺は spec 駆動)
npx remotion render src/index.ts BuzzMap-Reel-916 \
  ../../.local/r2/sns/buzz-map/<id>/instagram/reel.mp4 \
  --props=src/features/buzz-map/specs/<id>.json --browser-executable=$CHROME
# caption を同ディレクトリに (sns-content-standards §2-3 準拠。出典は metric config SSOT に合わせる)
#   → .local/r2/sns/buzz-map/<id>/instagram/caption.txt
```

```bash
# R2 push (公開 URL 200 を実測確認してから draft 登録)
ALLOW_LOCAL_R2_WRITE=1 npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix sns/buzz-map
curl -s -o /dev/null -w "%{http_code}\n" https://storage.stats47.jp/sns/buzz-map/<id>/instagram/stills/slide-1-cover-1080x1350.png
```

- draft 登録は `.Codex/scripts/lib/sns-posts-store.cjs` の `insert()`（platform=instagram / domain=buzz-map / content_key=<id> / media_path=R2キー / caption / `template=buzzmap-<型>` / status=draft）。**予約/投稿はせず draft 止まり**が既定（投稿タイミングは instagram-strategist / 人間が判断）。
- リールの content-type が `application/octet-stream` になる場合、IG Reels API が弾く可能性があるため投稿前に確認する。

### spec 自動生成（step 1 のデータ接地）

```bash
# 型A（e-Stat 観測値 → 二値化）。--theme blue|dark|paper で配色テーマ選択（省略=blue。§1 配色規則）
npx tsx .Codex/scripts/sns/build-buzz-map-spec.ts --metric <key> --id <id> \
  --level muni|pref --mode threshold --op gte --value N --title "..." --accent social|infra \
  [--theme dark] --label-hit "..." --label-miss "..."

# 型C 点プロット（KSJ topojson → 属性フィルタ → 代表点）
npx tsx .Codex/scripts/sns/build-buzz-map-spec-ksj.ts --data-id S12 --version 24 \
  --mode point-plot --filter "S12_057>=5000" --id <id> --title "..." --accent social \
  --label-hit "..." --data-year "令和4年度"

# 点→自治体二値（型A・◯◯がある/ない自治体。--invert で無い側）
npx tsx .Codex/scripts/sns/build-buzz-map-spec-ksj.ts --data-id S12 --version 24 \
  --mode point-muni --invert --id <id> --title "..." --accent infra --label-hit "駅なし" --label-miss "駅あり"

# 型D 線ネットワーク＋時系列（供用開始年で伸びる網図）
npx tsx .Codex/scripts/sns/build-buzz-map-spec-ksj.ts --mode line-network \
  --r2-key app/highway-history/highway-sections.topojson --id <id> --year-prop N06_002 \
  --title "..." --accent infra --label-hit "高速道路 総延長km" --data-year "1962-2020"
#   → 静止画 BuzzMap-Still-45（最新年全網図） / 時系列 BuzzMap-Reel-11（--frames=0-89 --scale=0.5 で試写）

# DPF（GraphQL 取得した GeoJSON を投入）
npx tsx .Codex/scripts/sns/build-buzz-map-spec-ksj.ts --geojson /tmp/dpf.geojson --mode point-plot --id <id> ...

# 型C 地名系（国土地理院 地名情報）。全国点データは一度だけ取得して R2 に永続化 → 以後は再取得不要
npx tsx .Codex/scripts/sns/fetch-gsi-place-names.ts --all               # 初回のみ (居住地名+自然地名 z15・約42万タイル)
#   → .local/gsi-pni/points.json を R2 へ: diff-push-r2.ts --prefix gis/gsi-pni
npx tsx .Codex/scripts/sns/build-buzz-map-spec-gsi.ts --pattern "宿" --id shuku-place-names \
  --title "「宿」のつく地名はどこか" --accent social \
  --label-admin "字・町名（行政地名）" --label-nature "自然地名" [--theme dark]
#   → 居住地名=accent・自然地名=accent2 の 2 色型C。候補は catalog --lane gsi で払い出す

# 型E 掛け合わせ（既存 spec 2 つをマージ: 塗り × 点/線）
npx tsx .Codex/scripts/sns/merge-buzz-map-specs.ts \
  --base <塗りspec> --overlay <点or線spec> --id <id> --title "..." --subtitle "..."
#   → 塗り=accent・overlay=accent2 で色分離。組み合わせネタは combo カタログの候補から選ぶ
#   ※ --theme は 3 ヘルパー共通（merge は --theme > base > overlay の順で継承）
```

## 目視チェックリスト（step 3）

- [ ] タイトル 2 行以内・改行位置が助詞の前（ダメなら spec `titleLines` で手動改行）
- [ ] 配色テーマ（`spec.theme`: blue/dark/paper）が意図どおり・強調色が判読できる
- [ ] 凡例カードが地図と重なっていない・**件数ラベルが入っている**（型A）
- [ ] 年カウンターが右の海域に収まり地図と重ならない（型B）
- [ ] 沖縄インセットの枠とラベル（16:9 は無いのが正しい）
- [ ] 出典・ブランド行の欠落なし。ダミーデータなら【サンプル】明記
- [ ] muni レベル: 境界線が潰れていない・県境オーバーレイが見える

## トラブルシュート

| 症状 | 対処 |
|---|---|
| Chrome が見つからない/DLできない | リモート実行環境では `--browser-executable` で既存バイナリを指定。**新 chromium (`chromium-1194/chrome-linux/chrome`) は旧 headless モードを廃止し起動失敗する → `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell` を使う**（"Old Headless mode has been removed" が出たらこれ）。Mac はローカル Chrome を自動検出 |
| 日本語が豆腐・書体が違う | `public/buzz-map/fonts/` の woff2 がコミットされているか確認（フォントは同梱が正。OS フォント依存にしない） |
| 尺が想定と違う | spec の `speed`（年/秒）と `holdSeconds` を確認。尺 = Σ(区間年数/yearsPerSec) + hold |
| muni で外れ島が消えている | 仕様（standards §3: 小笠原等は v1 非描画）。必要になったら決定ログを起こして拡張 |
| プレビューを Studio で見たい | `/preview-remotion` ではなく `npm start --workspace stats47-remotion` → Folder「buzz-map」（プレビュー専用・レンダしない） |

## 参照

- 規約の正典: `.Codex/rules/buzz-map-standards.md`（型仕様・トークン・テーマカタログ・決定ログ）
- 実装: `apps/remotion/src/features/buzz-map/`（tokens.ts=機械正本 / types.ts=spec 型）
- 投稿・頻度リミット・R2 保持: `.Codex/rules/sns-content-standards.md`（§1, §2-9→§2-10, §5.5）
