# チャートタイプ決定木 + 色規約

## テーマページ対応タイプ（ThemeDbChartRenderer）

| タイプ | 用途 | componentProps の主要フィールド |
|---|---|---|
| `line-chart` | 時系列折れ線（1〜3 series） | `estatParams[]`, `labels[]`, `seriesColors[]` |
| `mixed-chart` | 棒+線の2軸（件数+率 等） | `columnParams[]`, `lineParams[]`, `columnLabels[]`, `lineLabels[]`, `columnColors[]`, `lineColors[]`, `leftUnit`, `rightUnit` |
| `donut-chart` | 構成比ドーナツ | `categories[]`, `statsDataId`, `topN?` |
| `cpi-profile` | 物価プロファイル（横棒） | `statsDataId`, `excludeCodes?`, `year?` |
| `cpi-heatmap` | 物価ヒートマップ | `statsDataId`, `excludeCodes?` |
| `pyramid-chart` | 人口ピラミッド | `maleParams[]`, `femaleParams[]`, `ageGroups?` |
| `composition-chart` | 構成比（年齢・産業等） | `statsDataId`, `segments[]`, `totalCode?`, `unit?` |

全データソースは e-Stat API。estatParams（statsDataId + cdCat01 等）を componentProps に指定する。

## チャートタイプ決定木

```
panelTab の指標を分析:
├─ 件数(実数) + 率(比率) が両方ある?
│  └─ YES → mixed-chart（棒=件数, 線=率, 2軸）
├─ 2〜3指標の時系列対比が有意義?
│  └─ YES → line-chart（複数 series）
├─ 単一指標の推移?
│  └─ YES → line-chart（単一 series）
├─ カテゴリ構成比?
│  └─ YES → composition-chart
└─ 物価テーマ?
   └─ cpi-profile or cpi-heatmap
```

## 1セクション 1〜2 チャート原則

各 panelTab に配置するチャートは最大2個。パネル右側が長くなりすぎるのを防ぐ。

## 色規約

### 予約カラー（変更禁止）

| 意味 | Hex |
|---|---|
| 男性 | `#3b82f6` |
| 女性 | `#ec4899` |

### 推奨カラーマッピング

| 意味 | Hex | 例 |
|---|---|---|
| 危険・死者数 | `#ef4444` | 交通事故死、火災死 |
| 件数・量 | `#f59e0b` | 認知件数、事故件数 |
| 改善・率 | `#22c55e` | 検挙率、納付率 |
| 中立・補助 | `#6b7280` | 参考指標 |
| 特殊 | `#8b5cf6` | 自殺率等 |
| 人口・出生 | `#3b82f6` | 男女比較でない文脈 |

### 拡張パレット（3 series 以上）

`#0ea5e9`, `#14b8a6`, `#a855f7`, `#f43f5e`, `#84cc16`, `#06b6d4`

## section ルール (2026-07-04 訂正: テーマでは未使用)

**⚠️ 旧「section = panelTabs[].label 完全一致必須」は誤り**。panelTabs は廃止済み、かつ現行の
`ThemeMetricsDashboard` は `section` を参照せず、チャートを **componentType でフィルタし flat grid に
`sortOrder` 順**で描画する。テーマページでの配置は「どのチャートを載せるか + `sortOrder` + `gridColumnSpan`」で決まる。
`section` は残置フィールドで theme では効かない (area ページの `AreaChartSection` のみグループ見出しに使用)。
正典: `.claude/rules/theme-catalog-standards.md`。

## estatParams の取得方法

R2 `app/ranking/<key>/item.json` の `.item.sourceConfig` に格納されている JSON から statsDataId / cdCat01 を取得する（完全DBレス。旧 D1 indicators は廃止）:

```bash
curl -s "https://storage.stats47.jp/app/ranking/nurse-annual-income/item.json" | jq '.item.sourceConfig'
# => {"statsDataId":"0003445758","cdCat01":"...","cdCat02":"..."}
```

**componentProps に転記する際は source_config の値をそのまま使う。手入力しない。**
