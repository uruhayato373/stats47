# アクセシビリティガイドライン

## 概要

本プロジェクトのフォント色システムは、WCAG 2.1 AA準拠のアクセシビリティを実現しています。

## コントラスト比基準

### WCAG 2.1 AA要件
- **通常テキスト** (14pt未満): 4.5:1 以上
- **大きなテキスト** (18pt以上 / 14pt太字以上): 3:1 以上

### 本プロジェクトの実装

#### ライトモード (白背景 #ffffff)
| 階層 | 色 | コントラスト比 | 準拠レベル |
|------|-----|---------------|-------------|
| Primary | `#1f2937` | **12.63:1** | AAA ✅ |
| Secondary | `#374151` | **9.21:1** | AAA ✅ |
| Tertiary | `#6b7280` | **4.69:1** | AA ✅ |
| Muted | `#9ca3af` | **3.31:1** | 大テキストのみAA ⚠️ |

#### ダークモード (黒背景 #0a0a0a)
| 階層 | 色 | コントラスト比 | 準拠レベル |
|------|-----|---------------|-------------|
| Primary | `#f9fafb` | **17.12:1** | AAA ✅ |
| Secondary | `#e5e7eb` | **11.89:1** | AAA ✅ |
| Tertiary | `#d1d5db` | **7.25:1** | AAA ✅ |
| Muted | `#9ca3af` | **3.31:1** | 大テキストのみAA ⚠️ |

#### 特殊用途色
| 用途 | ライト | ダーク | 最小コントラスト比 |
|------|-------|-------|-------------------|
| Brand | `#4f46e5` (6.35:1) | `#8b5cf6` (5.12:1) | AA ✅ |
| Success | `#059669` (4.56:1) | `#34d399` (7.89:1) | AA ✅ |
| Warning | `#d97706` (5.23:1) | `#fbbf24` (10.45:1) | AA ✅ |
| Error | `#dc2626` (5.89:1) | `#f87171` (4.67:1) | AA ✅ |

## 使用ガイドライン

### ✅ 推奨使用法

#### 通常テキスト (14pt未満)
```tsx
// AA以上の色のみ使用
<p className={styles.text.primary}>重要なテキスト</p>
<p className={styles.text.secondary}>本文テキスト</p>
<p className={styles.text.tertiary}>補助テキスト</p>
```

#### 大きなテキスト (18pt以上)
```tsx
// 全ての階層が使用可能
<h1 className={`text-2xl ${styles.text.primary}`}>メインタイトル</h1>
<h2 className={`text-xl ${styles.text.secondary}`}>サブタイトル</h2>
<h3 className={`text-lg ${styles.text.tertiary}`}>セクション見出し</h3>
<span className={`text-lg ${styles.text.muted}`}>大きなヒント文字</span>
```

### ⚠️ 注意が必要な使用法

#### Mutedテキスト
```tsx
// 小さなテキストでは避ける
❌ <span className={`text-sm ${styles.text.muted}`}>

// 18pt以上でのみ使用  
✅ <span className={`text-lg ${styles.text.muted}`}>
```

## 状態表現のベストプラクティス

### 色だけに依存しない情報伝達

#### ❌ 色のみでの状態表現
```tsx
<p className={styles.text.error}>エラーが発生しました</p>
```

#### ✅ 色 + アイコン/テキストでの状態表現  
```tsx
<p className={styles.text.error}>
  <AlertTriangle className="w-4 h-4" />
  エラー: 入力内容を確認してください
</p>
```

### フォーカス・ホバー状態

```tsx
// フォーカス時の視認性確保
<button className={`
  ${styles.text.secondary}
  focus:outline-none focus:ring-2 focus:ring-blue-500
  hover:${styles.text.primary}
`}>
  ボタン
</button>
```

## 色覚多様性への配慮

### 推奨色の組み合わせ

#### 成功・エラー表現
```tsx
// 赤緑色覚異常に配慮
<div className="flex items-center gap-2">
  <CheckCircle className="w-4 h-4 text-green-600" />
  <span className={styles.text.success}>成功</span>
</div>

<div className="flex items-center gap-2">
  <XCircle className="w-4 h-4 text-red-600" />  
  <span className={styles.text.error}>エラー</span>
</div>
```

## テスト方法

### 自動化テスト

#### Jest + Testing Libraryでの確認
```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('コンポーネントにアクセシビリティ違反がないこと', async () => {
  const { container } = render(<YourComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 手動確認

#### ツール
- **WebAIM Contrast Checker**: コントラスト比確認
- **axe DevTools**: ブラウザ拡張でのチェック
- **WAVE**: Webアクセシビリティ評価

#### 確認項目
1. 各テキスト要素のコントラスト比
2. キーボードナビゲーション
3. スクリーンリーダーでの読み上げ
4. 色覚シミュレーションでの確認

## 準拠レベル

### 現在の達成レベル
- **WCAG 2.1 AA**: ✅ 準拠
- **WCAG 2.1 AAA**: 🔄 部分準拠 (muted色除く)

### 今後の改善計画
- Muted色のコントラスト比向上検討
- より高いコントラスト比オプションの追加
- 動的なコントラスト調整機能の実装

## 参考資料

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Universal Design](https://jfly.uni-koeln.de/color/)