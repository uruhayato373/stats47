# 共有型と統計表示の計算

この package は他の workspace・React・D3・Node・R2 に依存しない。ドメイン共通の型と決定的な純粋関数を所有し、取得処理・描画処理を持たない。

## 設定とデータの置き場

- 指標の定義・表示方針: `data/metrics/<key>.ts`。既定値: `data/metrics/defaults/presentation.ts`。
- 観測値: R2 の `app/stats/<metric>/values.json`。RankingItem snapshot は指標の表示方針を保持する。
- 共通契約: `MetricPresentation`、`NumericDomainPolicy`、`YAxisConfig`、`StatsSchema`、`ChartSeriesData`、`TimeSeriesDataNode`、`ValueDisplayConfig`、`YoyTimeseries`。
- D3 の軸・余白・tooltip・アニメーション、SVG の組版、媒体サイズは各描画 package に残す。
- 私有の型見本 PNG/SVG・入力・生成ソースは R2。Admin の asset pointer は読戻し検証済みのハッシュを参照し、GET 時に再生成しない。

## 範囲の契約

1. 呼び出し側で指標・地域・期間・系列・単位を選ぶ。上位下位だけを描画しても、ランキングの範囲は全対象地域から決める。
2. チャートの明示 override → 指標の用途別 policy → authored 既定値の順。地図 domain、trendDomain、comparisonDomain、barDomain は用途が異なる。
3. `resolveChartDomain` / `resolveSeriesDomain` / `resolveObservationDomain` が数値範囲を解決する。描画側は解決結果を再 nice・再丸めしない。
4. fixed は最小・最大を両方保持し、競合指定・範囲外の観測値を拒否する。小数の加算誤差だけを許容する。色は凡例端への clamp、NumericTrendChart は範囲外の印を伴う clip を明示契約とする。
5. auto/sync は対象集合の指定であり、数値 policy ではない。sync でも fixed を解除しない。同軸の複数指標の policy が異なる場合は明示 override または別軸を使う。
6. null/undefined/非有限値をゼロ観測に変えない。空集合は null、一定値は有限幅を返す。積み上げは正負の合計を別々に取り、100% 構成比は固定0–100を使う。線の欠測は分断する。
7. 生値と境界は同じ単位で扱う。表示値そのものを換算する場合は `scaleNumericDomain` / `scaleMetricPresentation` で境界・中点・閾値も一度だけ換算する。ラベルだけの換算では生値の範囲を変えない。人口あたり等の正規化は `presentationForNormalizedValues` または基準別設定へ切り替える。単位の意味・換算表は data-configs/unit の所有。
8. `computeAxisDomain` は旧来の丸め軸を必要とする箱ひげ等の明示的互換入口。固定域には使用しない。目盛り計算は numeric-ticks に集約する。

## 配色の契約

`resolveColorEncoding` が範囲・発散中点・対称化・等間隔/分位/閾値・反転・欠測色を解決する。凡例と塗りは同じ解決結果を使う。RGB 補間器は描画層が渡し、D3 依存をここへ移さない。単色の棒・系列識別の色と、数値の大小を示す地図の色を混同しない。分位境界の重複は統合し、発散中点を跨ぐ階級は中立色にする。

## 型を統合する境界

同じ意味のデータ型は旧入口から re-export する。AuthoredNormalizationOption は保存前の必須項目、NormalizationDisplayOption は既存 payload 読取互換を表す。StatsSchema と SingleEntityRow は metric/unit をどの層が補うかの差を保つ。RadarAxis は識別子とラベルを共有し、raw 値/正規化済み値の描画契約は各 renderer に残す。

取得設定の SourceProvenance、ランキングの recipe 付き出典、API/DB schema、GIS geometry、地域ナビ型、商品・広告・管理 UI の型は責務が異なるため、名前だけで統合しない。

## 検証

共通計算は本 package の単体テスト、保存 schema は data-configs の生成・metrics:check、各描画 adapter は各 workspace のテストで検証する。Admin の presentation テストは地図の塗り・凡例を SVG と照合する。JSON Schema は型から生成し、手編集しない。
