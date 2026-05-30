# データ管理アーキテクチャ (完全DBレス)

> **⚠️ 2026-05-29 更新: 正典は [`docs/01_技術設計/19_完全DBレス設計.md`](../../docs/01_技術設計/19_完全DBレス設計.md)。**
> stats47 は **完全DBレス**に決定 (doc 18 ハイブリッド / doc 17 リモートD1 は同日 superseded)。
> **永続/リモート D1 を SSOT に持たない。** SSOT は **git TS (コード)** と **R2 (観測値・配信)** の二つだけ。
> 本番アプリは R2 snapshot のみ読む。Derived (area_profiles / correlations) は
> **エフェメラル計算** (使い捨て `:memory:` SQLite / DuckDB が R2 を読む) → R2 へ書き出す。
> 本ファイルと食い違う場合は **doc 19 が優先**。

stats47 の data layer は **2 層モデル** で構成される。永続 DB は登場しない。

```
オーサリング層(SSOT)  : git TS(設定・定義・運用エンティティ)  +  R2(観測値)
配信層(app が読む)    : 常に R2 JSON snapshot                      ← 不変
集計(Derived)        : エフェメラル計算(:memory: SQLite / DuckDB が R2 を読む使い捨て)→ R2
```

> ## 用語: 「ローカルビルド DB (SQLite)」≠ Cloudflare D1 / SSOT ではない
>
> 各 skill / agent / 旧 docs で歴史的に **「D1」** と呼んでいたものは Cloudflare D1 サービスではない:
> - 本番 D1 binding は Phase 8 で削除済み。リモート D1 は 2026-04-29 に解約済み (残数 0)。Phase F (2026-05-30) で
>   アプリ実行時の `getDrizzle()` query は **0** になり本番デプロイ済。本番 Web app は **R2 snapshot のみ**読む。
> - 残置しているローカル SQLite ファイルは **「再生成可能な使い捨てビルドキャッシュ」**であり、**SSOT ではない**。
>   schema 定義 (`packages/database/src/schema/*.ts`) は **型ソース / テスト基盤 / エフェメラル計算の temp table 型**
>   として残す (配信 R2 に影響しない)。プロセス終了で消える前提のものだけ建ててよい。

## データ分類と置き場 (決定表 — doc 19 §3 準拠)

| 種別 | サブ判定 | SSOT 置き場 | 該当 |
|---|---|---|---|
| **Authored / 設定** | 低volume・人手・型/review が効く | **git TS** → R2 へ反映 | テーマのチャート定義、各種カタログ定義 |
| **Authored / 運用** | 関係・横断参照を持つ運用エンティティ | **git TS(定義が SSOT)** → 生成スクリプトで R2 JSON | page_components・theme_metrics・sns_posts・affiliate_ads・categories/themes |
| **Reference** | 外部に真実源あり | **再生成** | metrics(TS registry)・articles(article.md)・estat_catalog(e-Stat API)・prefectures/cities(JSON) |
| **Derived** | 計算で作れる | **エフェメラル計算 → R2**(永続しない) | area_profiles・correlations |

> 横断クエリ・参照整合性は **実行時の動的 JOIN ではなくビルド時**に git TS (+必要なら R2 観測値) を入力に
> 検証・生成して担保する。手編集 JSON を SSOT にしない (必ず git TS 定義 → 生成スクリプトで R2)。

## R2 に置くもの (観測値 + 配信 snapshot)

| R2 key | 内容 |
|---|---|
| `app/stats/<metric>/values.json` | 都道府県観測値 (全年) |
| `app/stats/<metric>/cities.json` | 市区町村観測値 (全年) |
| `app/stats/<metric>/ports.json` | 港湾観測値 |
| `app/stats/<metric>/migration-flow-<year>.json` | ペア観測 (pref ↔ pref) |
| `app/ranking/<key>/values.json` 等 | Web page 別 snapshot |
| `app/areas/<code>/profile.json` | area profile snapshot (エフェメラル計算で生成) |
| `app/correlation/top-pairs.json` | 計算済相関 top (エフェメラル計算で生成) |

## なぜ完全DBレスか (経緯)

Phase 1-4 で「D1 を SSOT として全データを集約」したが、5.5M 行の観測値で D1 が 15GB に肥大化 (上限 10GB 超)。
観測値 query は実質すべて `WHERE metric=? AND area=? AND year=?` の key-value lookup で JOIN の利益ゼロ。
Phase 6 (2026-05-27) で観測値を R2 JSON に全面移行。2026-05-29 にオーナー判断で **運用エンティティの SSOT も
リモート D1 → git TS に移し、永続 D1 を全廃**(完全DBレス)。横断クエリ・参照整合性はビルド時に解決する。

## 禁止事項 (doc 19 §8)

| NG | OK |
|---|---|
| 観測値・派生を永続 DB に入れる | R2(観測値)/ エフェメラル計算(派生)→ R2 |
| 設定・運用エンティティを手編集 JSON で散逸させる | git TS を単一ソースにし生成スクリプトで R2 反映 |
| リモート/常駐 D1 を SSOT として再導入する | git TS + R2 + 使い捨て計算 |
| 本番アプリから DB を query する | R2 snapshot 経由 (`fetchFromR2AsJson`) |
| `app/stats/<metric>/*.json` を手で編集 | `/page-data-batch --metric <key>` で再生成 |

## データ取り込みフロー (新規 metric 追加)

```
1. packages/data-configs/src/metrics/<new-key>.ts 新規作成   # git TS が SSOT
2. /page-data-batch --metric <new-key>                       # e-Stat → R2 直行
3. /push-r2 --prefix app/stats                               # 本番 R2 反映
4. /sync-snapshots                                           # 派生 snapshot 更新 (エフェメラル計算 → R2)
```

## 集計 (Derived) のエフェメラル計算

correlations / area_profiles は **R2 観測値を入力に使い捨て計算 → R2 出力**:
1. R2 から観測値を読み込み → `:memory:` SQLite / DuckDB に temp テーブル化 (schema 型を再利用)
2. JOIN / 集計 (Pearson r 等) → R2 snapshot 書き出し
3. プロセス終了で計算 DB は消える (永続しない)

普段 area_profiles / correlation 値を永続 DB に持たない。毎回 R2 観測値から再計算可能。

## R2 読み取り (SSD/認証なし)

ビルド/集計スクリプトが R2 を読むとき:
- **公開 URL 経由 (推奨・SSD/認証不要)**: `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp` を設定
  (list は不可、GET のみ)。`NODE_OPTIONS='--conditions react-server'`。
- SSD が物理接続されている場合はローカル FS (`.local/r2`) tier も使える (任意)。
- 旧 `db:pull` / リモート D1 / SSD dual-mode の前提は使わない。

## 関連

- **正典**: `docs/01_技術設計/19_完全DBレス設計.md`
- 却下した代替案: `docs/01_技術設計/18_データ層ハイブリッド設計.md` / `17_リモートD1ハイブリッド設計.md`
- 実行計画: `docs/02_実装計画/dbless-migration.md`
- Phase 6 観測値 R2 移行: `docs/01_技術設計/14_Phase6_deprecation_log.md`
- 記録先分類: `.claude/rules/data-storage.md`
- R2 キー設計: `.claude/rules/r2-storage-design.md`
- TS-config 詳細: `packages/data-configs/src/types.ts` / R2 stats 型: `packages/stats-r2/src/types.ts`
