# Next ESLintのフォルダー検索

root package.jsonの限定overrideが `@next/eslint-plugin-next` のfast-glob依存だけをこのpackageへ接続する。未修正bracesを含む経路を除去するため、tinyglobbyを使う。

rootの開発依存にfile参照を置き、overrideは `$fast-glob` でそれを参照する。依存側のディレクトリを基準にfile参照が解決されるのを避けるためで、fast-glob全APIの代替として使わない。

Next ESLint 16.3.3が呼ぶ `globSync(pattern, { onlyDirectories: true })` だけを支援する。絶対パスを維持し、指定ディレクトリを再帰展開せず、末尾のスラッシュを付けない。tinyglobbyの既定値をそのまま使うとNextのページ検出が壊れる。未対応の呼び方は例外にし、上流更新で黙って検索を変えない。

検証は `apps/web/src/__tests__/eslint-dependency-compatibility.test.ts`、Web/adminのlint、`npm audit`。公式側でbraces依存が解消されたらoverrideとこのpackageの必要性を再評価する。
