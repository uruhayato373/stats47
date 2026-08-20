# componentProps 実例集

safety テーマ（25件）から取得した実在の componentProps JSON。

## line-chart

### 2 series（事故件数 + 死者数）
```json
{
  "estatParams": [
    {"statsDataId": "0000010108", "cdCat01": "G210100"},
    {"statsDataId": "0000010108", "cdCat01": "G2201"}
  ],
  "labels": ["事故件数", "死者数(10万人当たり)"],
  "seriesColors": ["#f59e0b", "#ef4444"]
}
```

### 2 series（出火件数 + 救急出動）
```json
{
  "estatParams": [
    {"statsDataId": "0000010108", "cdCat01": "G310101"},
    {"statsDataId": "0000010108", "cdCat01": "G3401"}
  ],
  "labels": ["出火件数(10万人当たり)", "救急出動(千人当たり)"],
  "seriesColors": ["#f59e0b", "#22c55e"]
}
```

## mixed-chart

### 棒=認知件数、線=検挙率（2軸）
```json
{
  "columnParams": [
    {"statsDataId": "0000010211", "cdCat01": "#K06101"}
  ],
  "lineParams": [
    {"statsDataId": "0000010211", "cdCat01": "#K06201"}
  ],
  "columnLabels": ["認知件数"],
  "lineLabels": ["検挙率"],
  "leftUnit": "件/千人",
  "rightUnit": "%",
  "columnColors": ["#f59e0b"],
  "lineColors": ["#22c55e"]
}
```

## composition-chart

### 産業別就業者構成
```json
{
  "statsDataId": "0000010106",
  "segments": [
    {"code": "F2201", "label": "第1次産業", "color": "#10b981"},
    {"code": "F2211", "label": "第2次産業", "color": "#3b82f6"},
    {"code": "F2221", "label": "第3次産業", "color": "#f59e0b"}
  ],
  "totalCode": "F1102",
  "unit": "人"
}
```

### 犯罪種別構成
```json
{
  "statsDataId": "0000010211",
  "segments": [
    {"code": "#K06401", "label": "凶悪犯", "color": "#ef4444"},
    {"code": "#K06402", "label": "粗暴犯", "color": "#f97316"},
    {"code": "#K06403", "label": "窃盗犯", "color": "#3b82f6"},
    {"code": "#K06405", "label": "風俗犯", "color": "#8b5cf6"}
  ]
}
```

## DB カラム名

| Drizzle | SQLite |
|---|---|
| componentKey | chart_key |
| componentType | component_type |
| componentProps | component_props |
| sourceName | source_name |
| sourceLink | source_link |
| rankingLink | ranking_link |
| gridColumnSpan | grid_column_span |
| gridColumnSpanTablet | grid_column_span_tablet |
| gridColumnSpanSm | grid_column_span_sm |
| dataSource | data_source |
| isActive | is_active |

## chart_key 命名規約

- テーマチャート: `theme-{themeKey}-{section略}-{description}` 例: `theme-safety-crime-trend`
- 比較チャート: `cmp-{category}-{description}` 例: `cmp-labor-industry`
- kebab-case、全ページでユニーク
