# スライドデータ

## 新規スライドセットの追加手順

1. このディレクトリに `.tsx` ファイルを作成（`fiscal-indicators.tsx` を参考）
2. `index.ts` の `SLIDE_REGISTRY` に登録
3. DB の `dashboard_components` に INSERT

```sql
INSERT INTO dashboard_components (
  id, dashboard_id, component_type, title,
  component_props, grid_column_span, grid_column_span_mobile,
  display_order, is_active
) VALUES (
  '{id}', '{dashboard_id}', 'slide-presentation', '{タイトル}',
  '{"slideSetKey":"{registryのキー}"}',
  6, 12, 0, 1
);
```

## アスペクト比

デフォルト: **16:9**（Remotion/YouTube 互換）

変更する場合は `componentProps` に `aspectRatio` を指定:

```json
{"slideSetKey": "xxx", "aspectRatio": "4/3"}
```
