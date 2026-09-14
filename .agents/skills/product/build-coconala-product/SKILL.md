---
name: build-coconala-product
description: ココナラで売る都道府県データ商品 (PowerPoint / Excel / CSV / SVG / PNG / PDF) を型付きカタログから生成・検証・出品準備する。Use when user says "ココナラ商品", "商品を生成", "商品ファクトリー", "product factory", "coconala 商品を作って". 生成先は .local (git 管理外)、出品は人間工程。
disable-model-invocation: true
primary_agent: coconala-product-manager
co_agents: [data-ingester, estat-researcher]
---

ココナラ商品ファクトリー (`packages/product-factory`) を操作して、型付き商品カタログ (P-01〜P-14・14パック) から
成果物一式を生成・検証し、**オーナーの実機検証・出品を待つ状態**まで仕上げる。

## 大原則

- **必ず `.claude/rules/coconala-product-standards.md` に従う**（SSOT 構造・生成フロー・出典/許諾/免責・禁止事項・出品規律）。
- 商品定義は git TS (`src/catalog/`) が SSOT。生成バイナリは `.local/coconala-products/`（**git 管理外・公開 R2 へ置かない**）。
- **Office 実機検証・ココナラ出品はしない**（人間工程）。「生成成功」を「互換性検証済み」と書かない。

## スコープ

含む: カタログ検証、単品/全商品の生成、リリース台帳の再生成、実データスナップショットの更新、出品前チェック (READINESS)。
含まない: ココナラへのログイン/出品/アップロード、本番 deploy、公開 R2 書込み、Office 実機での互換性判定。

## 手順

### A. カタログを検証する
```bash
npm run products:catalog --workspace=@stats47/product-factory -- --check   # ID一意・レビュー集合一致・価格整合・参照存在
```
error があれば `src/catalog/` の該当 family ファイルを修正して再検証。

### B. 商品を生成する
```bash
npm run products:generate --workspace=@stats47/product-factory -- --id <ID> --version <NEW_VERSION>
npm run products:generate --workspace=@stats47/product-factory -- --all --version <NEW_VERSION>
```
生成先 `.local/coconala-products/<id>/<version>/`。各商品に product.(pptx|xlsx) + preview + listing + SOURCES + LICENSE + manual.pdf + manifest + READINESS。

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
出力をスナップショット `src/data/datasets/<key>.ts` に貼り、SOURCES（調査名・statsDataId・URL・年・取得日・加工式）を手記。
商品→テーマの写像は `src/build/build-all.ts` の `resolveDataset` を拡張する。

### E. リリース台帳を再生成する
```bash
npm run products:report --workspace=@stats47/product-factory   # .claude/state/products/catalog-status.json
```

同コマンドは横断販売カタログ `.local/product-portfolio/catalog.{html,csv}` も生成する。
改訂Kindleは `-- --kindle-version <VERSION>`、noteは `--note-revision <REVISION>` で固定する。商品・公開記録・納品版・未完了工程を混同しない。
note販売準備は `npx tsx packages/product-factory/src/channels/note/cli.ts revision --revision <NEW_REVISION> --all`。
旧v1直参照のgenerate/promoteは使わず、既存の `_delivery` 固定SHAに接続する。

### F. オーナーへ渡す
各商品の `.local/coconala-products/<id>/<version>/READINESS.md`（機械充足項目 vs オーナー実施項目）を案内する。
**実機検証（Windows 推奨）と出品はオーナーが実施**する。commit/push/deploy は明示指示があるときだけ。

## 委譲

- 実データ (新 metric) の R2 投入 → `data-ingester`。e-Stat 実在検証 → `estat-researcher`。
- 実機検証・出品 → 人間（オーナー）。

## 関連
- 正典: `.claude/rules/coconala-product-standards.md`
- モジュール: `packages/product-factory/README.md`
- agent: `.claude/agents/coconala-product-manager.md`
- note・KDP・Brain・ココナラ横断の商品ポートフォリオ、需要ゲート、共通content bundleを扱う場合:
  `reference/multi-channel-content-product-factory.md`（進捗SSOTは`.claude/todo/backlog.md`）
