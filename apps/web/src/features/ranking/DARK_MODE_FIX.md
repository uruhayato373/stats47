# ダークモードが反映されない問題

## 症状

dark モードに切り替えても画面の色が一切変わらない。

## 根本原因: PostCSS 8.5 と Tailwind CSS v3 の `@layer` 競合

**PostCSS 8.5** がネイティブ CSS `@layer` サポートを追加したことで、
Tailwind CSS v3 のカスタム `@layer` ディレクティブと競合が発生。

`globals.css` 内の `@layer base { .dark { ... } }` ブロックが
コンパイル後の CSS から**完全に消える**。

`:root` 変数（ライトモード）は残るが、`.dark` 変数（ダークモード）が消えるため、
テーマ切替しても CSS 変数が変わらず画面に変化が出ない。

### 確認方法

```bash
# コンパイル後の CSS で .dark ブロックの有無を確認
curl -s http://localhost:3000/_next/static/css/app/layout.css | grep '\.dark {'
```

## 修正

`globals.css` の `.dark { ... }` ブロックを `@layer base` の **外** に移動する。

```css
/* @layer base 内に :root のみ残す */
@layer base {
  :root {
    --background: 210 40% 98%;
    /* ... */
  }
}

/* .dark は @layer 外に配置（PostCSS 8.5 の @layer 処理を回避） */
.dark {
  --background: 222 47% 11%;
  /* ... */
}
```

`@layer` 外のルールは `@layer` 内より CSS 優先度が高いため、
dark 時に `:root` の変数を正しく上書きする。

## 副次的な修正（別途対応）

ランキングコンポーネントに残る `bg-slate-50`, `bg-amber-100` 等の
ハードコード色も `dark:` バリアント追加かセマンティック変数への置換が必要。
