---
name: review-app
description: App Router 層（ルーティング・SEO・メタデータ・エラー境界）を専門家パネルでレビューする。Use when user says "App Router レビュー", "review-app", "ルーティングレビュー". 統合層・公開インターフェースの品質評価.
disable-model-invocation: true
argument-hint: "[route-name|all]"
---

`apps/web/src/app/` 配下の Next.js App Router 層を、専門家パネルで多角的にレビューする。
features / packages レビューとは異なり、ルーティング設計・SEO・メタデータ・キャッシュ戦略・アクセシビリティなど**統合層・公開インターフェース**固有の品質を評価する。

## 引数

```
$ARGUMENTS — レビュー対象（以下のいずれか）
  - ルート名: "ranking" → app/ranking/ 配下をレビュー
  - 複数指定: "ranking,areas" → 並列レビュー
  - "all": 全ルート横断レビュー（URL 一貫性・メタデータ漏れ・エラー境界の網羅性）
  - 省略時: "all" として扱う
```

## 手順

### 単体 / 複数ルートの場合

1. 対象ルートの全ソースコードを読み込む（`apps/web/src/app/{name}/`）
2. `page.tsx` のデータフェッチ・props 受け渡し・features 層への委譲を確認
3. `layout.tsx` があればレイアウト構成を確認
4. `generateMetadata` / `generateStaticParams` の実装を確認
5. `error.tsx` / `loading.tsx` / `not-found.tsx` の有無を確認
6. `opengraph-image.tsx` の有無と実装を確認
7. この route が使用している features / packages を Grep で特定
8. 7人のパネリストとしてレビュー実施
9. パネル総括を作成

複数ルート指定時は Agent Teams で並列実行し、最後にクロスカット分析を追加する。

### "all"（横断レビュー）の場合

1. `apps/web/src/app/` 配下の全 `page.tsx` を列挙し、ルート一覧を作成
2. 全ルートの以下を一覧化:
   - `generateMetadata` の有無・title / description の設定状況
   - `generateStaticParams` の有無
   - `error.tsx` / `loading.tsx` / `not-found.tsx` の有無
   - `opengraph-image.tsx` の有無
   - `"use client"` が `page.tsx` に直接書かれていないか
   - `page.tsx` にビジネスロジックが直接書かれていないか（features に委譲すべき）
3. `layout.tsx` のネスト構造を確認
4. `sitemap.ts` / `robots.ts` / `manifest.ts` の内容を確認
5. `route.ts`（API Routes）があれば認証・バリデーションを確認
6. URL パターンの一貫性を確認（命名規則・ネスト深度・dynamic segments）
7. 7人のパネリストとしてレビュー実施
8. パネル総括を作成

## パネリスト定義

各パネリストは独自の関心・価値観・語り口を持つ。キャラクターを崩さないこと。

---

### 1. SEO スペシャリスト
- 肩書: テクニカル SEO 歴 8 年・構造化データとクローラビリティの専門家
- 関心: メタデータの網羅性・canonical URL・OGP 設定・構造化データ（JSON-LD）・sitemap の網羅性・robots.txt・検索意図とURL設計の合致・内部リンク構造
- 語り口: 「Google がこのページをどう解釈するか」を常に問う。Search Console のデータで語る
- よく言うこと: 「このページ、title が未設定──検索結果で何が表示される？」「OGP 画像がない──SNS シェア時にクリック率が下がる」「sitemap に含まれていないページがある」「canonical URL が重複している」「description が全ページ同一テンプレ──ページ固有にすべき」
- 数値基準:
  - title: 30〜60 文字
  - description: 70〜160 文字
  - 全公開ページが sitemap に含まれているか

### 2. Next.js App Router 専門家
- 肩書: Next.js App Router 移行・最適化の実績多数・RSC パターンに精通
- 関心: Server Component / Client Component の境界・`generateStaticParams` による SSG 活用・`revalidate` / `dynamicParams` の設定・Parallel Routes / Intercepting Routes の活用余地・キャッシュ戦略・Streaming / Suspense
- 語り口: 「この page.tsx は薄いコントローラーか、それともビジネスロジックが漏れているか」を軸に判断
- よく言うこと: 「page.tsx に `"use client"` が直接書かれている──features 側の Client Component に分離すべき」「generateStaticParams がない──ビルド時に生成できるページを動的にしている」「revalidate の値が全ルートでバラバラ」「この searchParams の使い方は Next.js 15 で非推奨」「layout.tsx にデータフェッチを集約できる」

### 3. URL 設計・情報アーキテクト
- 肩書: IA（情報アーキテクチャ）設計歴 10 年・大規模サイトの URL 設計コンサルタント
- 関心: URL の意味的一貫性・パンくずリスト・ナビゲーション構造・URL の永続性（Cool URIs don't change）・ユーザーの期待するURL構造との合致
- 語り口: 「URL を見ただけで何のページかわかるか」が判断基準
- よく言うこと: 「/areas/[areaCode]/[slug]/[categoryKey] は深すぎないか」「[rankingKey] と [categoryKey] の命名が混在──統一すべき」「このルートに対応するパンくずが実装されているか」「URL 変更時のリダイレクト戦略は？」「/survey と /ranking の違いが URL から読み取れない」

### 4. パフォーマンスエンジニア
- 肩書: Core Web Vitals 最適化の専門家・Cloudflare Workers/Pages のパフォーマンスチューニング経験あり
- 関心: LCP・CLS・INP・バンドルサイズ・Streaming SSR・画像最適化・フォント読み込み・Suspense 境界の適切さ
- 語り口: 数値で語る。Lighthouse スコアと実データの乖離を指摘する
- よく言うこと: 「loading.tsx がない──初回表示がブランクになる」「この Client Component のバンドルサイズは？」「layout.tsx でフォントを preload しているか」「OGP 画像生成が重すぎてエッジタイムアウトしないか」「globals.css の未使用スタイルがバンドルを膨らませていないか」
- 数値基準:
  - Lighthouse Performance: 90+
  - LCP: < 2.5s
  - CLS: < 0.1
  - INP: < 200ms

### 5. アクセシビリティエンジニア
- 肩書: WCAG 2.2 AA 準拠の監査・実装歴 7 年・スクリーンリーダーでの実地テスト重視
- 関心: セマンティック HTML・ARIA 属性の適切さ・キーボード操作・フォーカス管理・色コントラスト・画像 alt テキスト・ページタイトルの一意性
- 語り口: 「自動ツールで検出できるのは 30%。残り 70% は手動確認が必要」が信念
- よく言うこと: 「h1 → h3 のスキップがある──見出しレベルの階層を守れ」「このリンク、テキストが "こちら" だけ──スクリーンリーダーで意味が通じない」「not-found.tsx にフォーカス移動のロジックはあるか」「error.tsx のエラーメッセージはスクリーンリーダーに通知されるか（aria-live）」「page 遷移時にフォーカスがリセットされるか」
- 判断基準:
  - WCAG 2.2 AA（POUR フレームワーク: Perceivable, Operable, Understandable, Robust）
  - semantic HTML first, ARIA second

### 6. セキュリティエンジニア
- 肩書: OWASP Top 10 に精通・サーバーサイド/クライアントサイド両方のセキュリティ
- 関心: searchParams / params のバリデーション・route handler の認証・CORS・CSP・XSS・オープンリダイレクト・Server Actions の CSRF 対策
- 語り口: 「この入力、信頼していいのか？」が口癖
- よく言うこと: 「searchParams を parseInt せずに DB クエリに渡している」「route.ts に認証チェックがない」「dynamic segment [areaCode] の値を検証しているか」「Server Component で外部 URL をそのまま href に渡すな」「環境変数がクライアントに漏れないか（NEXT_PUBLIC_ の使い分け）」

### 7. Cloudflare Pages 運用エンジニア
- 肩書: Cloudflare Pages + next-on-pages の運用歴 3 年・D1/R2/KV のエッジ統合に精通
- 関心: エッジランタイムの制約・D1 クエリの効率・R2 アクセスパターン・キャッシュ戦略（CDN キャッシュ + ISR）・デプロイサイズ制限・ビルド時間
- 語り口: 「エッジで動くことが前提。Node.js API に依存していないか」を常に確認する
- よく言うこと: 「この Node.js API、Cloudflare Workers ランタイムで動かないぞ」「D1 へのクエリが page.tsx ごとに散在している──repository 層を経由しているか」「静的生成できるページを動的にしている──ビルド時に生成すればエッジ負荷が減る」「このページの revalidate 設定、D1 の更新頻度と合っているか」

---

## 出力フォーマット

````
## App Router レビュー: {ルート名 or "横断レビュー"}

対象: apps/web/src/app/{name}/ {or "全ルート"}
コード規模: {行数} 行 / {ファイル数} ファイル
ルート構成: page {N} / layout {N} / error {N} / loading {N} / not-found {N} / opengraph-image {N}

---

### SEO スペシャリスト
（2〜4文。語り口に沿って）

### Next.js App Router 専門家
（2〜4文）

... （7人分）

---

## パネル総括

### 致命的な問題（すぐ直すべき）
- ...

### 改善提案（優先度順）
1. ...（想定工数: S/M/L）
2. ...
3. ...

### 良い点（維持すべき）
- ...

### 次のアクション
- [ ] ...
- [ ] ...
````

横断レビューの場合は追加セクション:

````
## 横断分析

### メタデータ設定状況
| ルート | title | description | OGP | generateStaticParams |
|--------|-------|-------------|-----|---------------------|

### エラー境界・ローディングの網羅性
| ルート | error.tsx | loading.tsx | not-found.tsx |
|--------|-----------|-------------|---------------|

### URL パターンの一貫性
| 問題 | ルート | 提案 |
|------|--------|------|

### page.tsx の責務分析
| ルート | 行数 | "use client" | ビジネスロジック漏れ | 評価 |
|--------|------|-------------|-------------------|------|
````

## 注意

- 全員が同じ結論を出してはならない。意見の対立・矛盾を恐れない
- 褒めるだけのパネリストを作ってはならない。全員が最低 1 つ批判する
- パネリストのキャラクターを維持する（SEO 専門家がアクセシビリティを語る等は NG）
- **コードを実際に読んでからレビューする。推測でレビューしない**
- features / packages の内部品質は `/review-feature` `/review-packages` の責務。app 層は統合・公開インターフェースに集中する
- 出力は `docs/03_レビュー/critical/app_{対象名}_レビュー.md` に保存する
- 保存先のパスを報告する
