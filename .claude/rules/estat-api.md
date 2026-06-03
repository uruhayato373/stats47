# e-Stat API データ取得規約

## 規約

- **`cdTimeFrom`/`cdTimeTo`（年度範囲指定）を使わない。** 全年度を一括取得し、必要な年度はメモリ上で `yearCode` フィルタする。理由:
  - R2 キャッシュキーが `statsDataId` + `cdCat01` 等で決まるため、年度範囲パラメータの違いでキャッシュが分断され、同じデータが複数キャッシュされる
  - 全年度取得→メモリフィルタの方がキャッシュヒット率が高く、API 呼び出し回数を最小化できる
- **`cdArea`（地域コード指定）を使わない。** 全都道府県を一括取得し、`areaCode` でフィルタする。理由は同上（47都道府県でキャッシュを共有）
- **地域コードは5桁（`01000`〜`47000`）に統一。** 2桁→5桁の正規化は不要な設計とする

## e-Stat に「無い」データ（再調査防止・2026-06 確認）

estat-researcher で再調査する前に、以下は **e-Stat API に存在しない / 取得不可**と確定済み。総務省の公開 Excel を別経路で取り込むこと（手本: `apps/web/scripts/generate-finance-cards*.py`、出典 `https://www.soumu.go.jp/iken/zaisei/card.html`）。

- **地方財政状況調査「決算カード」本体（団体別の絶対額・基金内訳・実質収支額・標準財政規模）**: 政府統計コード `00200251` 配下の団体別表は **FY2017-2018 で凍結**（多くは FY2009 止）。市区町村団体別 × 2020-2024 連続は **構造的に取得不可**。
- **類似団体区分・類似団体平均**: e-Stat に統計表として **存在しない**（決算カード/財政状況資料集/健全化判断比率/類似団体いずれも 0 件）。`市町村類型` は総務省決算カード Excel から抽出する。
- 2020-2022 の連続が取れるのは `0000010104`（社会・人口統計体系 D 行政基盤）のみで、**都道府県粒度・積立金は合算（内訳なし）・標準財政規模/実質収支額のコードなし**。

## 年（time コード）の正規化 ★再発防止

e-Stat の `@time` は **10 桁のフルタイムコード**（例 `"2009100000"` = 2009年度、先頭4桁が年）。
これを **4 桁年に正規化せずに保存すると不具合が再発する**（年フィルタが 0 件・年セレクタにフルコード表示・
ランキング年次の不整合など）。過去に複数回発生（page-data-batch の 0 行バグ、config の 60 件混入等）。

**規約:**

1. **`year` は常に 4 桁文字列/数値**（`"2009"` / `2009`）。フルコード（`2009100000`）を SSOT に持たない。
2. **`metrics/*.ts` の `years`（`{from,to}` / `{years:[…]}`）は 4 桁年のみ**。フルコード禁止。
3. **R2 の `yearCode` も 4 桁**（`values.json` / `cities.json`）。
4. **time コード → 年の変換は必ず正準ユーティリティ `extractYearCode` を使う**
   （`packages/estat-api/src/stats-data/utils/extract-year-code.ts`）。
   各所で ad-hoc な `code.slice(0,4)` を新規に書かない（既存は許容、新規は util へ）。
5. **新規 metric 量産・編集後は lint を実行**:
   ```bash
   npm run validate:years --workspace=@stats47/data-configs
   ```
   フルコード/不正年（1900–2100 外）が config に混入していれば fail する。CI / pre-commit / data-ingester
   agent の量産フローに組み込むこと。

**page-data-batch の扱い:** `inYearRange` はフルコードが来ても 4 桁に正規化して比較する防御を持つが、
**SSOT（config）側を 4 桁に保つのが正**。lint で担保する。

## 関連

- e-Stat API クライアント: `packages/estat-api/`
- 正準ユーティリティ: `packages/estat-api/src/stats-data/utils/extract-year-code.ts`（`extractYearCode`）
- year lint: `packages/data-configs/scripts/validate-metric-years.ts`（`npm run validate:years`）
- **metric config 構造規約 (category 17 軸 / title・subtitle・note・description の役割)**: `.claude/rules/metric-config-standards.md`（lint: `npm run validate:config`）
- 関連スキル: `/fetch-estat-data`, `/inspect-estat-meta`, `/search-estat`, `/page-data-batch`
- 関連エージェント: `data-ingester`（量産後に validate:years と validate:config を実行する）
