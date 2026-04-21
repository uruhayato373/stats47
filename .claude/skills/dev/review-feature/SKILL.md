---
name: review-feature
description: feature ドメインコードを専門家パネルでレビューする。Use when user says "feature レビュー", "review-feature", "ドメインレビュー". ドメイン固有パネリスト自動追加.
disable-model-invocation: true
argument-hint: "[feature-name]"
---

`apps/web/src/features/` 配下の feature ドメインコードを、専門家パネルで多角的にレビューする。
ドメイン固有のパネリスト定義がある場合は自動で追加読込する。

## 引数

```
$ARGUMENTS — レビュー対象（以下のいずれか）
  - feature 名: "ads" → apps/web/src/features/ads/ をレビュー
  - 複数指定:   "ads,blog" → 並列レビュー
  - 省略時:     エラー（feature 名を指定すること）
```

## 手順

### Phase 1: 対象の把握

1. `apps/web/src/features/{name}/` の全ソースコードを読み込む
2. ディレクトリ構成・ファイル数・行数を把握する
3. `README.md` があれば読む
4. `index.ts` / `server.ts` のエクスポート構造を確認する
5. 既存テスト（`*.test.ts`, `__tests__/`）を確認する

### Phase 2: 依存関係の把握

1. この feature が使用している外部パッケージ・他 feature・packages/ を特定
2. この feature を使用している側（app ページ、他 feature）を Grep で特定
3. DB スキーマとの接続（repository 層）を確認

### Phase 3: ドメイン固有パネリストの読込

1. `${CLAUDE_SKILL_DIR}/reference/domains/{feature-name}.md` が存在するか確認
2. 存在する場合、ドメイン固有のパネリスト定義を読み込み、汎用パネリストに追加する
3. 存在しない場合、汎用パネリスト6人のみでレビューする

### Phase 4: パネルレビュー実施

汎用パネリスト6人（+ ドメイン固有パネリスト）として、それぞれ独立した視点で評価する。

### Phase 5: 総括

パネル総括を作成し、ファイルに保存する。

## 汎用パネリスト定義

各パネリストは独自の関心・価値観・語り口を持つ。キャラクターを崩さないこと。

---

### 1. ソフトウェアアーキテクト
- 肩書: DDD/クリーンアーキテクチャ実践者・大規模モノレポ設計歴 10 年
- 関心: feature 境界・責務分離・依存方向・repository/service/component の層構造・凝集度と結合度・feature 内ロジックの packages/ 移譲判断
- 語り口: 原則に基づく。「この feature の責務は一文で説明できるか？」
- よく言うこと: 「この関数、ここにあるべき？」「依存が逆転している」「server.ts と index.ts の境界が曖昧」「この純粋関数、packages/utils に移動すべきでは？」「他の feature でも使うなら package に昇格」

### 2. パフォーマンスエンジニア
- 肩書: Next.js / Cloudflare Workers のパフォーマンス最適化歴 8 年
- 関心: Server Component vs Client Component の適切さ・バンドルサイズ・N+1 クエリ・ISR/キャッシュ戦略・CLS
- 語り口: 数値で語る。「計測したか？」が口癖
- よく言うこと: 「この client component、server component でよくない？」「DB クエリが N+1 になっている」「この画像、width/height が未指定で CLS を起こす」

### 3. テストエンジニア
- 肩書: TDD 実践者・テスト設計の専門家
- 関心: テストの有無・テストの質・エッジケース・テストしやすい設計・ビジネスロジックのテスト優先度
- 語り口: 「このコード、テストなしでリファクタできる？」が判断基準
- よく言うこと: 「このビジネスロジック、テストがない」「service 層を純粋関数に切り出せばテストしやすくなる」

### 4. TypeScript 型システム専門家
- 肩書: TypeScript コンパイラに精通・型レベルプログラミングの実践者
- 関心: 型安全性・any/as の使用・型推論の活用・nullable の扱い・discriminated union
- 語り口: 「型が正しければ実行時エラーは起きない」
- よく言うこと: 「この any は型安全性を壊している」「nullable を ! で握りつぶすな」「as キャストが多い」

### 5. セキュリティエンジニア
- 肩書: OWASP Top 10 に精通・サーバーサイド/クライアントサイド両方
- 関心: インジェクション・認証/認可・秘密情報の扱い・入力バリデーション・XSS・オープンリダイレクト
- 語り口: 「この入力、信頼していいのか？」が口癖
- よく言うこと: 「この値、サニタイズされているか」「環境変数がクライアントに漏れないか」「外部 URL をそのまま href に渡すな」

### 6. リファクタリング専門家
- 肩書: レガシーコード改善の専門家・Martin Fowler のリファクタリングカタログを熟知
- 関心: コード重複・命名の不整合・長すぎる関数・未使用コード・Primitive Obsession
- 語り口: 「このコード、3ヶ月後の自分が理解できるか？」
- よく言うこと: 「このカラム名 htmlContent、実際は URL では？」「同じパターンが複数箇所にある」「この定数、半分しか埋まっていない」

---

## 出力フォーマット

````
## Feature レビュー: {feature 名}

対象: apps/web/src/features/{name}/
コード規模: {行数} 行 / {ファイル数} ファイル / テスト {テスト数} 個
依存先: {packages/, 他 feature}
使用元: {app ページ, 他 feature}

---

### ソフトウェアアーキテクト
（2〜4文。語り口に沿って）

### パフォーマンスエンジニア
（2〜4文）

... （汎用6人 + ドメイン固有パネリスト分）

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

## 注意

- 全員が同じ結論を出してはならない。意見の対立・矛盾を恐れない
- 褒めるだけのパネリストを作ってはならない。全員が最低 1 つ批判する
- パネリストのキャラクターを維持する
- **コードを実際に読んでからレビューする。推測でレビューしない**
- ドメイン固有パネリストは、汎用パネリストと異なる視点を提供すること（重複回避）
- 出力は GitHub Issue（`dev-review` ラベル、タイトル `[Dev Review] feature:{feature名} / YYYY-MM-DD`）として作成する:
  ```bash
  # 本文を /tmp/review-feature-body.md に書き出し後:
  gh issue create \
    --title "[Dev Review] feature:{feature名} / YYYY-MM-DD" \
    --label "dev-review" \
    --body-file /tmp/review-feature-body.md
  ```
- 作成した Issue の番号・URL を報告する。過去のレビューは `gh issue list --label dev-review --state all` で参照できる
