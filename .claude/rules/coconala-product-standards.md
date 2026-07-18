# ココナラ商品ファクトリー標準 (product-factory SSOT)

ココナラで販売する stats47 の都道府県データ商品（PowerPoint / Excel / CSV / SVG / PNG / PDF）を、
共通部品から段階的に生成する **実行規約の単一ソース (SSOT)**。商品カタログ・生成・検証・出品準備に
関わる agent (`coconala-product-manager`) / skill (`/build-coconala-product`) / 人間はこれに従う。

> **方式**: `buzz-map-standards.md` / `affiliate-ads-standards.md` と同じ「rules に規約 1 ファイル、
> skill/agent は参照のみ」。実装の恒久スペック（Phase 記録・技術判定の根拠）は
> `docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md`、商品案の出所は
> `docs/04_レビュー/2026-07-18-coconala-content-monetization.md`（A-01〜L-07）。値やコードは本ファイルに転記しない。

---

## 1. SSOT 構造（どのデータがどこにあるか）

完全DBレス準拠（`docs/01_技術設計/12_完全DBレス設計.md`）。永続/公開 DB を持たない。

| データ | SSOT | 形 | 備考 |
|---|---|---|---|
| 商品定義（A-01〜L-07・174 件） | `packages/product-factory/src/catalog/` | git TS | family 別 12 ファイル。`ProductDefinition` 型。**ここだけ編集** |
| ライセンス / テンプレ / family メタ | `src/catalog/{licenses,templates,families}.ts` | git TS | 再販売禁止は `resale: false` で型固定 |
| 実データ（観測値） | R2 `app/ranking/<key>/values.json` | 既存 R2 | 取得は `src/data/load-ranking-values.ts` |
| 商品に焼く実データ | `src/data/datasets/<key>.ts` | git TS スナップショット | **基準年固定**。R2 から取得して手記の SOURCES を添える |
| 生成バイナリ（pptx/xlsx/pdf/png…） | `.local/coconala-products/<id>/<version>/` | 派生物・**git 管理外** | 手編集を正典にしない・公開 R2 へ置かない |
| リリース台帳（生成状況） | `.claude/state/products/catalog-status.json` | 機械状態 | `products:report` で再生成 |

- **商品定義=git TS が SSOT**。生成物は再生成可能な派生物（`.local/` は `.gitignore` 済）。
- **実データは R2 → git TS スナップショット（基準年固定）**。架空サンプルは `Dataset.isSample: true` で明示分離する。

---

## 2. 生成・検証フロー

```bash
# カタログ検証（ID 一意・レビュー集合一致・価格整合・参照存在）
npm run products:catalog  --workspace=@stats47/product-factory -- --check
# 生成（単品 / 全商品）— 生成先は .local/coconala-products/<id>/<version>/
npm run products:generate --workspace=@stats47/product-factory -- --id <ID>
npm run products:generate --workspace=@stats47/product-factory -- --all
# リリース台帳を再生成
npm run products:report   --workspace=@stats47/product-factory
# 型 / テスト
npm run type-check --workspace=@stats47/product-factory
npm run test:run   --workspace=@stats47/product-factory
```

- ジェネレータ: pptx（**pptxgenjs custGeom で県別に再着色できる地図** + ネイティブチャート）/ xlsx（**exceljs・
  値編集で再計算する RANK 数式**。ネイティブチャート/塗り分け地図は不可 → Excel 側の挿入手順を案内）/ csv(BOM) /
  svg+png / manual.pdf（pdf-lib + NotoSansJP subset）/ listing / manifest / readiness。
- 地図結合は**都道府県コード**（名称文字列をキーにしない）。全図表にタイトル・単位・基準年・出典を持たせる。

---

## 3. 出典・利用許諾・免責（全成果物に必須）

- `SOURCES.csv`（調査名・表名・statsDataId・URL・年・取得日・単位・加工式・注意事項）を同梱する。
- `LICENSE-ja.txt`（利用範囲・クライアントワーク可否・**再販売/再配布禁止**・出典表示義務・免責）を同梱する。
- e-Stat の**公認・推奨と誤認させない**。国・府省・自治体作成物と誤認させない（`evidence-based-judgment.md` 準拠）。
- 欠損・秘匿・非該当を 0 にしない（`Dataset` は null + 理由で保持）。異年次結合は避ける。
- 架空サンプルは商品内・販売文で明示（`isSample`）。実データ商品は基準年固定・買い切りを明示。

---

## 4. 禁止事項

| NG | OK |
|---|---|
| 生成バイナリを git / 公開 R2 に置く | `.local/`（git 管理外）に生成し、配信しない |
| 生成物 (pptx/xlsx/json) を手編集して真実源化 | git TS を編集 → `generate` で再生成 |
| 実在しない商品 ID / licenseId / metric を書く | validator（`catalog --check`）が弾く |
| 架空データを実データと偽る | `Dataset.isSample` で分離・販売文に明記 |
| **オーナー承認なしにココナラへ出品/アップロード** | 出品は人間工程（下記 §6） |
| 全商品を一括出品して WIP を増やす | 戦略（`docs/02_実装計画/01`）どおり 1 商品ずつ需要実測 |
| Office 実機未確認で「互換性検証済み」と書く | 構造(OOXML)検証と実機検証を区別して報告 |

---

## 5. Office 実機検証（Phase 4・人間工程）

生成は OOXML 構造レベルでのみ検証できる。**PowerPoint / Excel 実機（Windows/Mac 365）での県別再着色・
チャート編集追従・表示崩れは、オーナーが各商品の `READINESS.md` に沿って目視する**。Office の無い環境では
「生成成功」を「互換性検証済み」と報告しない。

---

## 6. 出品規律（人間工程・自動化しない）

- ココナラへのログイン・出品・アップロードは**自動化しない**（禁止事項・アカウント操作）。
- **1 商品ずつ検証**。閲覧・お気に入り・問い合わせ・購入・サポート工数・手取りを記録する。
- 反応が無ければ同系統を増やさず、対象・用途・価格・サンプルを見直す（レビュー §実行規律）。

---

## 7. 役割分担

| 工程 | 担当 |
|---|---|
| カタログ / ジェネレータ / SSOT の管理・生成・検証・出品準備 | `coconala-product-manager`（skill `/build-coconala-product`） |
| 実データ（新 metric）の R2 投入 | `data-ingester` |
| e-Stat 実在検証 | `estat-researcher` |
| 実機検証・出品 | 人間（オーナー・Windows 実機） |

## 関連

- 恒久スペック: `docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md`
- 商品案の出所: `docs/04_レビュー/2026-07-18-coconala-content-monetization.md`
- モジュール: `packages/product-factory/`（README + `src/`）
- 完全DBレス: `docs/01_技術設計/12_完全DBレス設計.md` / データ保存先: `.claude/rules/data-storage.md`
- 実証判定: `.claude/rules/evidence-based-judgment.md` / 収益化戦略: `docs/02_実装計画/01_収益化マスタープラン.md`
- agent: `.claude/agents/coconala-product-manager.md` / skill: `.claude/skills/product/build-coconala-product/SKILL.md`
