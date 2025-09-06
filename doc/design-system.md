# デザインシステム仕様書

## フォント色システム

### カラーパレット

#### ライトモード
| 階層 | Tailwind Class | HEX | RGB | 用途 | コントラスト比 |
|------|----------------|-----|-----|------|----------------|
| Primary | `text-gray-900` | `#111827` | `17, 24, 39` | 見出し・最重要テキスト | 18.07:1 |
| Secondary | `text-gray-800` | `#1f2937` | `31, 41, 55` | 本文テキスト | 12.63:1 |
| Tertiary | `text-gray-700` | `#374151` | `55, 65, 81` | 補助テキスト | 9.21:1 |
| Muted | `text-gray-400` | `#9ca3af` | `156, 163, 175` | 非活性テキスト | 3.31:1 |

#### ダークモード
| 階層 | Tailwind Class | HEX | RGB | 用途 | コントラスト比 |
|------|----------------|-----|-----|------|----------------|
| Primary | `text-gray-50` | `#f9fafb` | `249, 250, 251` | 見出し・重要テキスト | 17.12:1 |
| Secondary | `text-gray-200` | `#e5e7eb` | `229, 231, 235` | 本文テキスト | 11.89:1 |
| Tertiary | `text-gray-300` | `#d1d5db` | `209, 213, 219` | 補助テキスト | 7.25:1 |
| Muted | `text-gray-400` | `#9ca3af` | `156, 163, 175` | 非活性テキスト | 3.31:1 |

#### 特殊用途色
| 用途 | ライトモード | ダークモード | 説明 |
|------|--------------|--------------|------|
| **Brand** | `text-indigo-600` (`#4f46e5`) | `text-indigo-400` (`#8b5cf6`) | ブランドカラー、CTA要素 |
| **Success** | `text-green-600` (`#059669`) | `text-green-400` (`#34d399`) | 成功状態、完了メッセージ |
| **Warning** | `text-amber-600` (`#d97706`) | `text-amber-400` (`#fbbf24`) | 注意喚起、警告メッセージ |
| **Error** | `text-red-600` (`#dc2626`) | `text-red-400` (`#f87171`) | エラー状態、バリデーション |

## 使用指針

### テキスト階層の選択基準

#### Primary (`styles.text.primary`)
- ページタイトル
- セクション見出し (h1, h2, h3)
- 重要な情報やCTA
- ナビゲーションの現在位置

#### Secondary (`styles.text.secondary`) 
- 本文テキスト
- 段落内容
- ボタンラベル
- フォームラベル

#### Tertiary (`styles.text.tertiary`)
- 補助説明文
- キャプション
- メタ情報 (日付、作成者など)
- プレースホルダーテキスト

#### Muted (`styles.text.muted`)
- 非活性状態のテキスト
- ヒント文字
- フッター情報
- 無効化された要素

### コンテキスト別ガイドライン

#### フォーム要素
```tsx
<label className={styles.text.secondary}>ラベル</label>
<input placeholder={styles.text.muted} />
<span className={styles.text.tertiary}>ヘルプテキスト</span>
<p className={styles.text.error}>エラーメッセージ</p>
```

#### カード・パネル
```tsx
<h3 className={styles.text.primary}>カードタイトル</h3>
<p className={styles.text.secondary}>メインコンテンツ</p>
<span className={styles.text.tertiary}>補助情報</span>
```

#### ナビゲーション
```tsx
<a className={styles.text.primary}>アクティブ項目</a>
<a className={styles.text.secondary}>通常項目</a>
<span className={styles.text.muted}>無効項目</span>
```

## アクセシビリティ要件

### WCAG 2.1 AA準拠

全ての色の組み合わせは以下の基準を満たしています：

- **通常テキスト**: 4.5:1以上のコントラスト比
- **大きなテキスト** (18pt+): 3:1以上のコントラスト比

### 色だけに依存しない情報伝達

状態や重要度の表現において、色に加えて以下の要素も併用：

- アイコン
- テキストラベル  
- 位置・配置
- フォントウェイト

## レスポンシブ対応

全ての色定義はブレークポイントに関係なく一貫して適用されます。

## 開発者向け実装ガイド

### TypeScript型定義

```typescript
interface TextStyles {
  primary: string;
  secondary: string;
  tertiary: string;
  muted: string;
  brand: string;
  success: string;
  warning: string;
  error: string;
}
```

### ESLintルール推奨設定

```json
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/text-(gray|neutral)-(400|500|600|700|800)/]",
        "message": "ハードコーディングされた色クラスは禁止です。styles.text.*を使用してください。"
      }
    ]
  }
}
```

## バージョン管理

**現在のバージョン**: v1.0.0  
**最終更新**: 2025年9月3日

### 変更履歴
- **v1.0.0** (2025-09-03): 初期リリース、統一フォント色システム構築