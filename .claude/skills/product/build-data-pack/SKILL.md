---
name: build-data-pack
domain: product
description: note で売る都道府県データパック (PowerPoint / Excel / CSV / SVG / PNG / PDF) を型付きカタログから生成・検証・note 販売準備する。Use when user says "データパック", "商品を生成", "商品ファクトリー", "product factory". 生成先は .local (git 管理外)、公開は人間の承認。
disable-model-invocation: true
primary_agent: data-pack-manager
co_agents: [data-ingester, estat-researcher]
---

商品ファクトリー (`packages/product-factory`) を操作して、型付き商品カタログ (P-01〜P-14・14パック) から
成果物一式を生成・検証し、**オーナーの実機検証と note 公開の承認を待つ状態**まで仕上げる。

## 大原則

- **必ず `.claude/rules/data-pack-standards.md` に従う**（SSOT 構造・生成フロー・出典/許諾/免責・禁止事項・note 販売準備）。
- 商品定義は `data/products/` の JSON 台帳が SSOT（`src/catalog/` は読み込み口）。生成バイナリは `.local/data-packs/`（**git 管理外・公開 R2 へ置かない**）。
- **Office 実機検証・note 公開はしない**（人間工程・`note-manager`）。「生成成功」を「互換性検証済み」と書かない。

## スコープ

含む: カタログ検証、単品/全商品の生成、リリース台帳の再生成、実データスナップショットの更新、note 販売準備 (READINESS・納品版台帳)。
含まない: note への公開、本番 deploy、公開 R2 書込み、Office 実機での互換性判定。

## 手順

### A. カタログを検証する
```bash
npm run products:catalog --workspace=@stats47/product-factory -- --check   # ID一意・レビュー集合一致・価格整合・参照存在
```
error があれば対応する `data/products/` の台帳を修正して再検証。分析と地域・年の参照は `npm run products:analysis:catalog` で全有料商品を検査する。

### B. 商品を生成する
```bash
npm run products:generate --workspace=@stats47/product-factory -- --id <ID> --version <NEW_VERSION>
npm run products:generate --workspace=@stats47/product-factory -- --all --version <NEW_VERSION>
```
生成先 `.local/data-packs/<id>/<version>/`。各商品に product.(pptx|xlsx) + preview + listing + SOURCES + LICENSE + manual.pdf + manifest + READINESS。

### C. 構造検証（Office 実機の代替・OOXML レベル）
- pptx: `unzip` して `ppt/slides/*.xml` のスライド数・`<a:custGeom>`（県別図形）・`ppt/embeddings/*.xlsx`（チャート）・
  ユーザー名/絶対パス漏れ 0 を確認。
- xlsx: `xl/worksheets/*.xml` のシート数・`<f>RANK(...)` 数式を確認。
- 実データ商品に「架空」表記が漏れていないか（`data.csv`/`listing`/`manifest`）。
- 型 / テスト: `npm run type-check` / `npm run test:run`（`--workspace=@stats47/product-factory`）。

### D. 実データを更新する（商品テーマの差し替え）
```bash
npx tsx packages/product-factory/src/data/load-ranking-values.ts <rankingKey>   # R2 から最新47県フルを取得
```
出力 (JSON の配列) を台帳 `products.pack-datasets` の `<key>.json` の `values` に貼り、出典の行 `source`（調査名・statsDataId・URL・年・取得日・加工式）を手記。
商品→テーマの写像は `src/build/build-all.ts` の `resolveDataset` を拡張する。

### D2. 時系列・市区町村の分析改訂
商品台帳 `products.landings.analysisPlan` に採用・調査中・除外の理由を記録し、`analysisRevision` の入力は指標キーで参照する。既存指標と精度・対象が違う原典だけ `metrics.analysis-source-variants` に別定義を登録する。表番号・単位を商品側に複製しない。

```bash
npm run products:analysis:catalog
npm run products:analysis:build -- --all
npm run products:analysis:check -- --all
```

計算・画像・CSV/Excel・LP・note初稿を共通生成する。図は原票の完全性・欠測・分母を検査した結果だけで描く。全件の候補を生成後、開発環境の `/products/preview/<slug>` で確認する。公開中の固定版を改訂候補で上書きしない。Windows PowerShellは `npm.cmd` を使い、引数欠落を避ける。

### E. リリース台帳を再生成する
```bash
npm run products:report --workspace=@stats47/product-factory   # data/products/catalog-status.json
```

同コマンドは横断販売カタログ `.local/product-portfolio/catalog.{html,csv}` も生成する。
改訂Kindleは `-- --kindle-version <VERSION>`、noteは `--note-revision <REVISION>` で固定する。商品・公開記録・納品版・未完了工程を混同しない。
note販売準備は `npx tsx packages/product-factory/src/channels/note/cli.ts revision --revision <NEW_REVISION> --all`。
旧v1直参照のgenerate/promoteは使わず、納品版台帳 `data/products/note-pack-deliveries.json` の `_delivery` 固定SHAに接続する。

### E2. note の見本画像を型で描く
note の販売記事の見本画像 (地図・棒・推移・内訳・ファイルの中身) は手で描かない。記事の作業コピーに
`figure-specs.json` (画像ごとに `file`・型の台帳の `template`・`input`) を置き、
`npx tsx .claude/scripts/note/render-product-figures.ts --spec <記事>/figure-specs.json` で描く。spec も記事と一緒に
`note:article save` で R2 へ保存する。型の無い画像を持つ記事は `build-note-figure-ledger.mjs --check` が縮小専用の上限で止める。

### F. オーナーへ渡す
各商品の `.local/data-packs/<id>/<version>/READINESS.md`（機械充足項目 vs オーナー実施項目）を案内する。
**実機検証（Windows 推奨）と公開の承認はオーナー**が行う。commit/push/deploy は明示指示があるときだけ。

## 委譲

- 実データ (新 metric) の R2 投入 → `data-ingester`。e-Stat 実在検証 → `estat-researcher`。
- note 公開 → `note-manager`。実機検証・公開の承認 → 人間（オーナー）。

## 関連
- 正典: `.claude/rules/data-pack-standards.md`
- モジュール: `packages/product-factory/README.md`
- agent: `.claude/agents/data-pack-manager.md`
- note・KDP 横断の商品ポートフォリオ、需要ゲート、共通content bundleを扱う場合:
  `reference/multi-channel-content-product-factory.md`（進捗SSOTは`.claude/todo/backlog.md`）
