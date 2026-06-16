# /audit-chart-components

チャートコンポーネントの規約違反を検出し、是正優先リストを出力するスキル。
`.claude/rules/chart-component-standards.md` を基準とする。

## 実行

```
/audit-chart-components [--fix]
```

- 引数なし: 違反検出 + レポート出力のみ（read-only）
- `--fix`: 自動是正が可能な違反（ハードコード色 → CSS 変数への置換等）を実行

## 検出項目

### A. ハードコードカラー（重大度: high）

**対象**: `apps/web/src/` 配下の `.tsx` / `.ts` ファイル

```bash
# SVG fill / stroke / color にハードコード hex が使われている箇所
grep -rn \
  --include="*.tsx" --include="*.ts" \
  -E '(fill|stroke|color)\s*[:=]\s*["'"'"']#[0-9a-fA-F]{3,6}["'"'"']' \
  apps/web/src/
```

### B. feature スコープのチャートコンポーネント（重大度: high）

**対象**: `apps/web/src/features/` 配下

```bash
# feature 内に SVG / D3 を使った独自チャートが定義されている
grep -rn \
  --include="*.tsx" \
  -E '<svg|from "d3"|import.*d3' \
  apps/web/src/features/
```

### C. 独自カードラッパー（重大度: medium）

**対象**: `apps/web/src/features/` と `apps/web/src/app/` 配下

```bash
# Card コンポーネントを使わずカード形状を独自実装
grep -rn \
  --include="*.tsx" \
  -E 'function (Card|Frame|Tile|Panel|Widget)' \
  apps/web/src/features/ apps/web/src/app/
```

### D. useD3Tooltip 未使用のツールチップ（重大度: medium）

**対象**: D3 を使っているファイル

```bash
# D3 を使っているのに useD3Tooltip を使っていないファイル
files_with_d3=$(grep -rl 'from "d3"' apps/web/src/ packages/visualization/src/)
for f in $files_with_d3; do
  if ! grep -q "useD3Tooltip" "$f"; then
    echo "D3 without useD3Tooltip: $f"
  fi
done
```

### E. shadcn Card 未使用のカード形状（重大度: low）

```bash
# border + p-* の組み合わせでカード形状を作っているが Card コンポーネント未使用
grep -rn \
  --include="*.tsx" \
  -E 'className=.*border.*p-[0-9]' \
  apps/web/src/features/
```

## 出力フォーマット

```
## チャートコンポーネント監査レポート

### サマリ
- A. ハードコードカラー: N 件 (N ファイル)
- B. feature スコープチャート: N 件
- C. 独自カードラッパー: N 件
- D. useD3Tooltip 未使用: N 件
- E. shadcn Card 未使用: N 件

### 優先是正リスト（影響大順）

| 優先度 | ファイル | 違反種別 | 是正方法 |
|---|---|---|---|
| 1 | features/xxx/... | B: feature スコープチャート | @/components/charts/ に移動 |
| 2 | ... | ... | ... |

### 推奨アクション
1. ...
```

## --fix オプション（自動是正）

以下のみ自動是正する（その他は手動 or `chart-component-builder` に依頼）:

- ハードコード色 `#2563eb` → `hsl(var(--primary))`
- ハードコード色 `#94a3b8` → `hsl(var(--muted-foreground))`
- ハードコード色 `#64748b` → `hsl(var(--muted-foreground))`

```bash
# 自動置換（apps/web/src 配下）
sed -i 's/#2563eb/hsl(var(--primary))/g' <対象ファイル>
sed -i 's/#94a3b8/hsl(var(--muted-foreground))/g' <対象ファイル>
sed -i 's/#64748b/hsl(var(--muted-foreground))/g' <対象ファイル>
```

## 関連

- 基準: `.claude/rules/chart-component-standards.md`
- 実行エージェント: `chart-component-builder`
- 共通コンポーネント: `apps/web/src/components/charts/`
