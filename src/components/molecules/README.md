# Molecules（分子）

Atomsを組み合わせて作成される、より複雑なUIコンポーネントです。

## 概要

Moleculesは、複数のAtomsを組み合わせて作成されるコンポーネントです。これらは特定の機能や目的を持ち、複数の場所で再利用できます。

## 含まれるべきコンポーネント

- **検索バー** (`SearchBar.tsx`) - Input + Button + Icon
- **カード** (`Card.tsx`) - Image + Title + Description + Button
- **フォームフィールド** (`FormField.tsx`) - Label + Input + Error
- **ナビゲーションアイテム** (`NavItem.tsx`) - Icon + Text + Link
- **ステータス表示** (`StatusDisplay.tsx`) - Badge + Text + Icon
- **データ行** (`DataRow.tsx`) - Label + Value + Action

## 命名規則

- ファイル名: `PascalCase.tsx` (例: `SearchBar.tsx`)
- コンポーネント名: `PascalCase` (例: `SearchBar`)
- フォルダ名: `kebab-case` (例: `search-bar/`)

## 実装例

```typescript
// SearchBar.tsx
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';

export interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

export function SearchBar({ placeholder, onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
      <Button type="submit" variant="primary">
        <Icon name="search" />
        検索
      </Button>
    </form>
  );
}
```

## 原則

1. **組み合わせ**: Atomsを適切に組み合わせる
2. **機能性**: 特定の機能や目的を持つ
3. **再利用性**: 複数の場所で使用可能
4. **一貫性**: デザインシステムに従ったスタイリング
