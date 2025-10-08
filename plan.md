## 作業計画: `mapping.csv`からの統計値抽出と`combined_population_stats.md`への整理

### 目的

`src/data/mapping.csv`に格納されている統計データの中から、`src/config/categories.json`で定義されている各サブカテゴリに対応する統計値を抽出し、ランキング表示に適した形式で`combined_population_stats.md`に整理して出力する。

### 前提

- `src/data/mapping.csv`には、5,050 行の統計データが含まれている（`stats_data_id`, `cat01`, `item_name`, `item_code`, `unit`など）
- `src/config/categories.json`には、8 つの主要カテゴリとその下に複数のサブカテゴリが定義されている
- `combined_population_stats.md`は、既存の人口関連統計データまとめに加えて、新たに抽出した統計データを追記する

### データ分析結果

#### mapping.csv の構造

- **総行数**: 5,050 行（ヘッダー含む）
- **主要カラム**: `stats_data_id`, `cat01`, `item_name`, `item_code`, `unit`, `dividing_value`, `new_unit`, `ascending`
- **cat01 プレフィックス**: `#`で始まるもの（例: `#A011000`）と、英数字のみ（例: `A1101`）の 2 パターン
- **統計表 ID**: 複数の異なる統計表からデータが集約されている

#### categories.json の構造

- **主要カテゴリ数**: 15 個
  - `landweather` (国土・気象) - 4 サブカテゴリ
  - `population` (人口・世帯) - 6 サブカテゴリ
  - `laborwage` (労働・賃金) - 6 サブカテゴリ
  - `agriculture` (農林水産業) - 1 サブカテゴリ
  - `miningindustry` (鉱工業) - 1 サブカテゴリ
  - `commercial` (商業・サービス業) - 2 サブカテゴリ
  - `economy` (企業・家計・経済) - 3 サブカテゴリ
  - `construction` (住宅・土地・建設) - 5 サブカテゴリ
  - `energy` (エネルギー・水) - 4 サブカテゴリ
  - `tourism` (運輸・観光) - 1 サブカテゴリ
  - `educationsports` (教育・文化・スポーツ) - 1 サブカテゴリ
  - `administrativefinancial` (行財政) - 6 サブカテゴリ
  - `safetyenvironment` (司法・安全・環境) - 4 サブカテゴリ
  - `socialsecurity` (社会保障・衛生) - 2 サブカテゴリ
  - `international` (国際) - 1 サブカテゴリ
  - `infrastructure` (社会基盤施設) - サブカテゴリなし

**総サブカテゴリ数**: 47 個

### 作業手順

#### Phase 1: 基盤データの分析と準備

1. **mapping.csv の全体分析**

   - 全 5,050 行のデータを読み込み、cat01 プレフィックスの分布を分析
   - 統計表 ID ごとのデータ分布を確認
   - ランキング表示に適した統計値の特徴を特定
   - データ品質基準の設定（ランキング表示に適した統計値の選別基準）

2. **共通処理テンプレートの作成**

   - カテゴリごとの処理に使用する共通ロジックの実装
   - キーワードマッチングアルゴリズムのテンプレート化
   - Markdown テーブル生成の共通関数作成

#### Phase 2: カテゴリ別データ抽出（15 カテゴリを順次処理）

3. **人口・世帯関連カテゴリ** (優先度: 高)

   - `population` (人口・世帯) - 6 サブカテゴリ
   - 既存の知識を活用して高品質な抽出を実現

4. **経済・労働関連カテゴリ** (優先度: 高)

   - `economy` (企業・家計・経済) - 3 サブカテゴリ
   - `laborwage` (労働・賃金) - 6 サブカテゴリ
   - 関連性の高いカテゴリをグループで処理

5. **社会基盤関連カテゴリ** (優先度: 中)

   - `construction` (住宅・土地・建設) - 5 サブカテゴリ
   - `energy` (エネルギー・水) - 4 サブカテゴリ
   - `infrastructure` (社会基盤施設) - サブカテゴリなし

6. **行政・安全関連カテゴリ** (優先度: 中)

   - `administrativefinancial` (行財政) - 6 サブカテゴリ
   - `safetyenvironment` (司法・安全・環境) - 4 サブカテゴリ

7. **その他カテゴリ** (優先度: 低)

   - `landweather` (国土・気象) - 4 サブカテゴリ
   - `agriculture` (農林水産業) - 1 サブカテゴリ
   - `miningindustry` (鉱工業) - 1 サブカテゴリ
   - `commercial` (商業・サービス業) - 2 サブカテゴリ
   - `tourism` (運輸・観光) - 1 サブカテゴリ
   - `educationsports` (教育・文化・スポーツ) - 1 サブカテゴリ
   - `socialsecurity` (社会保障・衛生) - 2 サブカテゴリ
   - `international` (国際) - 1 サブカテゴリ

#### Phase 3: ドキュメント統合と最終確認

8. **カテゴリ別結果の統合**

   - 各カテゴリで抽出した統計値を `combined_population_stats.md` に統合
   - カテゴリ別セクションの作成とインデックス化
   - データの重複チェックと品質確認

9. **最終ドキュメントの完成**

   - 全体の整合性チェック
   - 統計値の説明と注釈の追加
   - ドキュメントの構造化と読みやすさの向上

### 進捗管理（TODO リスト）

#### Phase 1: 基盤データの分析と準備

- [x] mapping.csv の構造とデータ量を分析し、カテゴリマッピングの戦略を決定する
- [x] categories.json の全カテゴリとサブカテゴリを分析し、mapping.csv の cat01 プレフィックスとの対応関係を定義する
- [ ] mapping.csv の全体分析を完了し、ランキング表示に適した統計値の特徴を特定する
- [ ] 共通処理テンプレートを作成し、カテゴリごとの処理に使用する共通ロジックを実装する

#### Phase 2: カテゴリ別データ抽出（15 カテゴリを順次処理）

- [ ] 人口・世帯関連カテゴリ (population) の統計値抽出
- [ ] 経済・労働関連カテゴリ (economy, laborwage) の統計値抽出
- [ ] 社会基盤関連カテゴリ (construction, energy, infrastructure) の統計値抽出
- [ ] 行政・安全関連カテゴリ (administrativefinancial, safetyenvironment) の統計値抽出
- [ ] その他カテゴリ (landweather, agriculture, miningindustry, commercial, tourism, educationsports, socialsecurity, international) の統計値抽出

#### Phase 3: ドキュメント統合と最終確認

- [ ] 各カテゴリで抽出した統計値を combined_population_stats.md に統合する
- [ ] カテゴリ別セクションの作成とインデックス化を完了する
- [ ] データの重複チェックと品質確認を実施する
- [ ] 最終ドキュメントの完成と全体の整合性チェックを実施する

### 期待される成果物

1. **カテゴリ別統計指標一覧**

   - 15 の主要カテゴリ、47 のサブカテゴリごとに整理された統計指標
   - 各指標の詳細情報（stats_data_id, cat01, item_name, unit 等）
   - ランキング表示の適性評価

2. **更新された combined_population_stats.md**

   - 既存の人口関連データを保持
   - 新たに抽出した全カテゴリの統計指標を追加
   - カテゴリ別の見出しとインデックス

3. **データ品質レポート**
   - 抽出された統計値の品質評価
   - ランキング表示に適した統計値の選別結果
   - 今後の拡張可能性の評価

### 注意事項

- **データ量**: 5,050 行のデータを効率的に処理するため、バッチ処理を検討
- **品質管理**: ランキング表示に適さない統計値（比率のみ、絶対値なし等）の除外
- **拡張性**: 将来的な新しいカテゴリやサブカテゴリの追加に対応できる柔軟な設計
- **パフォーマンス**: 大量データの処理時間を考慮した最適化
