---
title: shadcn/ui 採用理由
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - UIコンポーネント
  - shadcn/ui
---

# shadcn/ui 採用理由

## ステータス
accepted

## 背景

stats47 プロジェクトでは、以下の要件を満たすUIコンポーネントライブラリが必要でした：

1. **Tailwind CSS統合**: 既存のTailwind CSS 4との完全な統合
2. **Atomic Design対応**: 既存のAtomic Design階層構造への組み込み
3. **バンドルサイズ最小化**: 使用する部分のみをバンドルに含める
4. **カスタマイズ性**: 完全なコードコントロール
5. **開発効率**: UI開発の効率化

## 決定

**shadcn/ui** を採用

## 理由

### 1. Tailwind CSS完全統合
- 既存のTailwind CSS 4との完全な統合
- カスタムクラスとの自然な組み合わせ
- 一貫したデザインシステム

### 2. バンドルサイズの最適化
- **コピー&ペースト方式**: 使用する部分のみをバンドルに含める
- **Tree-shaking**: 不要なコードの自動除去
- **軽量**: ライブラリ全体ではなく、必要なコンポーネントのみ

### 3. 完全なコードコントロール
- コンポーネントのソースコードを所有
- 自由なカスタマイズが可能
- デバッグとメンテナンスが容易

### 4. Atomic Designとの親和性
- 既存のAtomic Design階層構造に自然に組み込める
- コンポーネントの分類と整理が容易
- 再利用性の向上

### 5. 学習コストの低さ
- Tailwind CSSベースで学習コストが低い
- 既存の開発フローとの統合が容易
- ドキュメントが充実

## NextUIとの比較

| 項目 | shadcn/ui | NextUI (HeroUI) | 優位性 |
|------|-----------|-----------------|--------|
| **統合性** | Tailwind CSS完全統合 | React Aria + Tailwind | shadcn/ui |
| **バンドルサイズ** | 使用分のみ（コピー&ペースト） | ライブラリ全体 | shadcn/ui |
| **カスタマイズ** | 完全制御（コード所有） | テーマシステム | shadcn/ui |
| **Atomic Design** | 自然な階層構造 | コンポーネント分類 | shadcn/ui |
| **学習コスト** | 低（Tailwindベース） | 中（React Aria学習） | shadcn/ui |

## 使用箇所

### 1. 対話的コンポーネント
```typescript
// モーダル、ドロップダウン、ツールチップ等
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";
```

### 2. フォームコンポーネント
```typescript
// 入力フィールド、ボタン、チェックボックス等
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
```

### 3. レイアウトコンポーネント
```typescript
// カード、セパレーター、アコーディオン等
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
```

## 代替案の検討

### NextUI (HeroUI)
**メリット:**
- 豊富なコンポーネント
- アニメーション機能
- アクセシビリティ対応

**デメリット:**
- バンドルサイズが大きい
- React Ariaの学習が必要
- カスタマイズ性が限定的

**結論:** バンドルサイズとカスタマイズ性を考慮し不採用

### Material-UI (MUI)
**メリット:**
- 成熟したライブラリ
- 豊富なコンポーネント

**デメリット:**
- Tailwind CSSとの統合が困難
- バンドルサイズが大きい
- デザインの一貫性に課題

**結論:** Tailwind CSS統合の観点から不採用

### カスタムコンポーネント
**メリット:**
- 完全な制御
- 軽量

**デメリット:**
- 開発工数が大きい
- アクセシビリティ対応が困難
- メンテナンスコストが高い

**結論:** 開発効率を考慮し不採用

## 結果

この決定により以下の効果が期待されます：

### 1. 開発効率の向上
- プリビルドコンポーネントの活用
- 一貫したデザインシステム
- 迅速なプロトタイピング

### 2. バンドルサイズの最適化
- 使用する部分のみをバンドルに含める
- パフォーマンスの向上
- ロード時間の短縮

### 3. メンテナンス性の向上
- コンポーネントの一元管理
- カスタマイズの容易さ
- デバッグの簡素化

### 4. デザインシステムの統一
- 一貫したUI/UX
- ブランドアイデンティティの維持
- ユーザー体験の向上

## 実装方針

### Phase 1: 基盤コンポーネント（1-2週間）
- Button, Input, Card等の基本コンポーネント導入
- 既存のカスタムコンポーネントとの統合

### Phase 2: 対話的コンポーネント（2-3週間）
- Dialog, DropdownMenu, Tooltip等の導入
- 既存のAtomic Design階層への組み込み

### Phase 3: 高度なコンポーネント（3-4週間）
- DataTable, Calendar, Select等の導入
- カスタマイズとテーマの調整

## 参考資料

- [shadcn/ui公式ドキュメント](https://ui.shadcn.com/)
- [shadcn/ui GitHub](https://github.com/shadcn-ui/ui)
- [Tailwind CSS統合ガイド](https://ui.shadcn.com/docs/installation)
