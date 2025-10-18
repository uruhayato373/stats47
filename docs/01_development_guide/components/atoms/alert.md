# Alert コンポーネント

## 概要

`Alert`は、成功・エラー・情報・警告などのメッセージを統一されたスタイルで表示するための共通コンポーネントです。アプリケーション全体で一貫したメッセージ表示を実現し、保守性と再利用性を向上させます。

## 基本情報

- **パス**: `src/components/atoms/Alert/Alert.tsx`
- **カテゴリ**: Atoms
- **依存関係**: `lucide-react` (アイコン)
- **アクセシビリティ**: ARIA 対応 (`role="alert"`, `aria-live="polite"`)

## Props

| プロパティ  | 型                                            | デフォルト | 必須 | 説明                                         |
| ----------- | --------------------------------------------- | ---------- | ---- | -------------------------------------------- |
| `type`      | `"success" \| "error" \| "info" \| "warning"` | -          | ✅   | アラートの種類                               |
| `message`   | `string`                                      | -          | ✅   | 表示するメッセージ                           |
| `className` | `string`                                      | `""`       | ❌   | 追加の CSS クラス                            |
| `showIcon`  | `boolean`                                     | `true`     | ❌   | アイコンを表示するかどうか                   |
| `icon`      | `React.ComponentType<{ className?: string }>` | -          | ❌   | カスタムアイコンコンポーネント               |
| `onDismiss` | `() => void`                                  | -          | ❌   | 閉じるボタンがクリックされた時のコールバック |

## 使用例

### 基本的な使用

```tsx
import { Alert } from "@/components/atoms/Alert";

// 成功メッセージ
<Alert type="success" message="保存が完了しました" />

// エラーメッセージ
<Alert type="error" message="エラーが発生しました" />

// 情報メッセージ
<Alert type="info" message="新しい機能が利用可能です" />

// 警告メッセージ
<Alert type="warning" message="この操作は取り消せません" />
```

### アイコンの制御

```tsx
// アイコンあり（デフォルト）
<Alert type="success" message="メッセージ" showIcon={true} />

// アイコンなし
<Alert type="success" message="メッセージ" showIcon={false} />
```

### カスタムアイコン

```tsx
import { Heart } from "lucide-react";

<Alert type="success" message="カスタムアイコン付きメッセージ" icon={Heart} />;
```

### 閉じるボタン付き

```tsx
const [showAlert, setShowAlert] = useState(true);

return showAlert ? (
  <Alert
    type="info"
    message="このメッセージは閉じることができます"
    onDismiss={() => setShowAlert(false)}
  />
) : null;
```

### カスタムスタイル

```tsx
<Alert
  type="error"
  message="カスタムスタイル付きメッセージ"
  className="border-2 border-dashed mb-4"
/>
```

## デザインガイドライン

### 色の使い分け

- **Success (成功)**: 緑色系 - 操作の成功、完了を表す
- **Error (エラー)**: 赤色系 - エラー、失敗を表す
- **Info (情報)**: 青色系 - 一般的な情報、通知を表す
- **Warning (警告)**: 黄色系 - 注意が必要な状況を表す

### アイコンの使い分け

- **Success**: Check (✓)
- **Error**: AlertCircle (⚠️)
- **Info**: Info (ℹ️)
- **Warning**: AlertTriangle (⚠️)

### レイアウト

- パディング: `p-4`
- ボーダー: `border rounded-lg`
- アイコンとメッセージの間隔: `gap-3`
- アイコンサイズ: `w-4 h-4`

## アクセシビリティ対応

### ARIA 属性

- `role="alert"`: スクリーンリーダーに重要なメッセージとして認識させる
- `aria-live="polite"`: メッセージの変更を控えめに通知
- `aria-label="アラートを閉じる"`: 閉じるボタンの説明

### キーボード操作

- 閉じるボタンは Tab キーでフォーカス可能
- Enter キーまたは Space キーでクリック可能

## ダークモード対応

すべてのアラートタイプでダークモードに対応しています：

```tsx
// ライトモード
<div className="bg-green-50 border-green-200 text-green-800">
  // ダークモード
  <div className="dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
```

## パフォーマンス考慮事項

### メモ化

Alert コンポーネント自体はメモ化されていませんが、必要に応じて親コンポーネントでメモ化を検討してください：

```tsx
const MemoizedAlert = memo(Alert);
```

### 大量表示時の注意

複数の Alert を同時に表示する場合は、適切な間隔を設けてください：

```tsx
<div className="space-y-2">
  {alerts.map((alert, index) => (
    <Alert key={index} {...alert} />
  ))}
</div>
```

## テスト

### 単体テスト

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Alert } from "@/components/atoms/Alert";

test("successタイプで正しく表示される", () => {
  render(<Alert type="success" message="成功メッセージ" />);

  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByText("成功メッセージ")).toBeInTheDocument();
});
```

### テストカバレッジ

- 各 type での表示確認
- アイコンの表示/非表示
- カスタムアイコンの使用
- onDismiss コールバック
- アクセシビリティ属性

## よくある質問

### Q: メッセージが長い場合はどうなりますか？

A: メッセージは自動的に折り返され、適切に表示されます。必要に応じて`className`でスタイルを調整してください。

### Q: 複数の Alert を表示する際の注意点は？

A: 適切な間隔（`space-y-2`など）を設けて、視認性を保ってください。また、同時に表示する Alert の数は制限することを推奨します。

### Q: カスタムアイコンを使用する際の注意点は？

A: アイコンコンポーネントは`className`プロパティを受け取る必要があります。また、適切なサイズ（`w-4 h-4`）で表示されるようにしてください。

## 関連コンポーネント

- [Message](./message.md) - シンプルなメッセージ表示
- [Toast](../molecules/toast.md) - 一時的な通知表示
- [Modal](../organisms/modal.md) - モーダル内でのメッセージ表示
