# Atoms（原子）

アトミックデザインの最小単位となるコンポーネントです。

## 概要

Atomsは、プロジェクト全体で再利用可能な最小のUIコンポーネントです。これらは単一の責任を持ち、他のコンポーネントに依存しません。

## 含まれるべきコンポーネント

- **ボタン** (`Button.tsx`)
- **入力フィールド** (`Input.tsx`)
- **ラベル** (`Label.tsx`)
- **アイコン** (`Icon.tsx`)
- **アバター** (`Avatar.tsx`)
- **バッジ** (`Badge.tsx`)
- **スピナー** (`Spinner.tsx`)

## 命名規則

- ファイル名: `PascalCase.tsx` (例: `Button.tsx`)
- コンポーネント名: `PascalCase` (例: `Button`)
- フォルダ名: `kebab-case` (例: `button/`)

## 実装例

```typescript
// Button.tsx
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onClick 
}: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

## 原則

1. **単一責任**: 1つのコンポーネントに1つの責任
2. **再利用性**: 複数の場所で使用可能
3. **独立性**: 他のコンポーネントに依存しない
4. **一貫性**: デザインシステムに従ったスタイリング
