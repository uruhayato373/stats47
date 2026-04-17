---
name: knowledge
description: 過去の失敗と学びを参照・追記する。バグ解決時や設計判断の教訓記録に使用. DB・デプロイ・API連携の作業開始時に関連エントリを確認する背景知識.
user-invocable: false
---

過去の失敗と学びを参照・追記する。

## 使い方

- **参照**: 以下のナレッジから、現在の作業に関連するパターンがないか確認する
- **追記**: バグ解決や設計判断の教訓があれば、このファイル末尾に以下の形式で追記する

```markdown
---

## タイトル（簡潔に）

**問題**: 何が起きたか
**原因**: なぜ起きたか
**対策**: どうすれば防げるか
```

---

## tsconfig パスエイリアス

**問題**: `paths` を設定しても `@/*` が解決されない。

**原因**: `baseUrl` が未設定。`paths` は `baseUrl` からの相対パスで解決される。

**対策**: `baseUrl: "."` と `paths: {"@/*": ["./src/*"]}` をセットで設定する。`apps/web/tsconfig.json` のパターンを参照。

---

## drizzle-kit generate のスナップショット衝突

**問題**: `drizzle-kit generate` で `prevId collision` エラー。

**原因**: 手動作成したスナップショットの `prevId` が自分自身を指していた（`0005_snapshot.json` の `prevId` が `0005` の `id` と同一）。

**対策**: `drizzle/meta/*_snapshot.json` の `prevId` が前のスナップショットの `id` を正しく指しているか確認する。

---

## drizzle-kit push / generate の対話プロンプト

**問題**: `drizzle-kit push` や `drizzle-kit generate` がカラム削除・リネーム時に対話プロンプトを出し、非対話環境（CI、Claude Code）で止まる。

**対策**: 手動でマイグレーション SQL を作成し、`better-sqlite3` で直接適用する。`packages/database/drizzle/0007_articles_refactor.sql` が実例。

---

## seed のローカルディレクトリ統一（解決済み）

**経緯**: ローカル `.local/r2/seed/` と R2 の `seeds/` で名称が不一致だった。`npm run r2:upload` でアップロードすると R2 に `seed/` キーで保存されてしまい混在した。

**解決**: ローカルディレクトリを `.local/r2/seeds/` に統一。`sync-download.ts` の DEFAULT_PREFIXES も `"seeds"` に変更。現在は `r2:upload` でも `seed:push` でもどちらも R2 の `seeds/` に正しくアップロードされる。

---

## 企業プロキシと R2 S3 API

**問題**: `@aws-sdk/client-s3` 経由の R2 アクセスが HTTP 407/503 で失敗する。

**対策**: `npx wrangler r2 object put/get` で個別操作する。`/push-r2` スキルがフォールバック手順を提供。タイミングによって S3 API が通ることもある。

---

## MDX frontmatter の YAML クォート不正

**問題**: ブログ記事の frontmatter で `title: "...「鉤括弧」..."` のように YAML 二重引用符内に別の二重引用符を含めると、YAML パーサーが途中で文字列終端と解釈して `Unexpected scalar at node end` エラーになる。

**原因**: YAML の二重引用符文字列内では `"` をエスケープ (`\"`) しないと構文エラーになる。`compileMDX({ parseFrontmatter: true })` が記事コンテンツの frontmatter を再パースする際に発生。

**対策**: frontmatter の値に `"` を含める場合は `\"` にエスケープするか、シングルクォート `'...'` で囲む。または値にコロン・引用符を含まない場合はクォートなしで記述する。`/write-blog-article` の品質チェックリストに追加済み。

---

## Bash で cd するとローカルデータのパスが解決できなくなる

**問題**: `cd packages/svg-builder` 等でサブディレクトリに移動した後、`.local/r2/blog/<slug>/data/` や `.local/d1/` への相対パスが解決できず「No such file or directory」になる。

**原因**: `.local/` はプロジェクトルート直下にあるため、サブディレクトリから相対パスで参照できない。Bash の作業ディレクトリは `cd` 後も維持される。

**対策**: Bash コマンドで `cd` を使わない。型チェック等は `npx tsc --noEmit -p apps/web/tsconfig.json` のようにプロジェクトルートから実行する。やむを得ず `cd` する場合は同一コマンド内で `cd /c/Users/m004195/stats47 &&` で戻す。

---

## マイグレーションファイルのジャーナル外管理による不整合

**問題**: `drizzle/` に手動で SQL ファイルを追加し、`meta/_journal.json` に登録せずに運用した結果、ジャーナルは 7 件（0000〜0006）だが実ファイルは 20 本（0000〜0020）に乖離。削除済みテーブルの CREATE/DROP も混在し、新環境構築時に適用順序が不明になった。

**原因**: `drizzle-kit generate` の対話プロンプト回避のため、手書き SQL を `drizzle/` に直接配置した。ジャーナルはスナップショット 0006 で止まったまま、実際の DB スキーマだけが進んだ。

**対策**: (1) `drizzle/` には `drizzle-kit generate` の生成物のみ配置する（手動 SQL は `better-sqlite3` で直接適用）。(2) マイグレーションが 10 本を超えたら `/reset-migrations` でリセットする。(3) 詳細は `packages/database/README.md` の「マイグレーション運用ルール」を参照。

---

## 定数→DB 移行時のデータ消失

**問題**: アフィリエイトバナーを定数（`AFFILIATE_BANNERS`）から DB 管理に移行した際、定数を削除したが DB への INSERT を行わず、7件のバナーデータが消失した。

**原因**: 移行コミットでスキーマ変更とコード変更のみ実施し、既存データの移行（INSERT 文やシードデータ生成）を忘れた。

**対策**: 定数→DB 移行時は以下を必ず実施する: (1) 既存の定数データを INSERT 文に変換してローカル D1 に投入 (2) `--dry-run` 等で行数を確認 (3) 定数の削除は INSERT 確認後に行う。

---

## pull-remote-d1 はスキーマ差分で大量失敗する

**問題**: `/pull-remote-d1` で全テーブル pull したところ、3 テーブルがスキーマ差分でエラー、1 テーブルがネットワーク中断で部分 INSERT のまま停止した。修復に手作業が多く発生し、同期作業全体に数時間を要した。

- `articles`: リモートに `seo_title` カラムが追加されていた → `has no column named seo_title`
- `comparison_components`: リモートの CHECK 制約に `composition-chart` が追加されていた → `CHECK constraint failed`
- `ranking_tags`: リモートでカラム名が `tag` → `tag_key` に変更、`tags` テーブルへの FK 追加 → `has no column named tag_key`
- `tags`, `article_tags`: リモートにのみ存在する新テーブル → `[SKIP]` で無視されたが、pull 後に ranking_tags の FK 先がなく問題に
- `correlation_analysis`: 58,511 行中 33,500 行で企業ネットワークのタイムアウト → 手動 `--offset` で再開
- `ranking_data`: 3,084,967 行中 1,005,000 行で同上

**原因**: `/diff-d1` がデータ差分のみ比較しスキーマ差分を検知しなかった。別 PC でスキーマ変更（マイグレーション適用）されていたが、ローカルにはその変更が反映されていなかった。

**対策**: (1) **pull 前にスキーマ比較を行う**（`/pull-remote-d1` SKILL.md に手順を追加済み）。リモートとローカルの `CREATE TABLE` 文を比較し、差分があれば `ALTER TABLE` やテーブル再作成で先に解消する。(2) `/diff-d1` SKILL.md にスキーマ差分は検知できない旨を明記済み。(3) 大量テーブルの中断時は `--offset` で再開できる。

---

## ranking_items / ranking_data のフォーマット不一致で本番 404・地図グレー表示

**問題**: 職種別年収ランキング 40 件が本番で 404（`findRankingItem` の Zod パースエラー）。さらにコロプレス地図が全都道府県グレー表示（TopoJSON の `prefCode` とマッチしない）。過去にも家計調査系 675 件で同じ 404 が発生。

**原因（2パターン）**:
1. `latest_year` が `["2023"]`（配列）や `"2024000000"`（生コード）で保存。Zod は `{"yearCode":"...","yearName":"..."}` オブジェクトを期待。
2. `ranking_data.area_code` が `"01"`（2桁）で保存。TopoJSON は `"01000"`（5桁）でマッチング。

**根本原因**: `packages/database/scripts/populate-occupation-income.ts` が正規パイプライン（`packages/ranking/src/repositories/`）を経由せず独自に INSERT し、フォーマット規約を満たさなかった。

**対策**:
1. `latest_year` は `{"yearCode":"2023","yearName":"2023年度"}` 形式で保存（配列・文字列禁止）
2. `available_years` は `[{"yearCode":"2023","yearName":"2023年度"},...]` 形式で保存
3. `ranking_data.area_code` は都道府県なら `"01000"`〜`"47000"` の5桁で保存（2桁禁止）
4. 独自 populate スクリプト作成時は `populate-port-rankings.ts` をリファレンスとし、上記フォーマットに準拠する
5. 修正済み: `populate-occupation-income.ts`, `populate-port-rankings.ts`, `/register-ranking` SKILL.md

---

## OpenNext R2 ISR キャッシュの正しいキー構造

**[廃止] ISR は 2026-03 に廃止済み（全ページ SSR 化）。このナレッジは歴史的記録として残す。**

**問題**: R2 の ISR キャッシュを手動パージする際、キー構造が不明だった。

**原因**: OpenNext の R2 キャッシュキーは `{prefix}/{buildId}/{sha256(pageKey)}.{cacheType}` 形式。

**対策**: ISR 廃止により不要。D1 は 0.1ms で応答するため SSR で十分な性能。ISR を使うとビルド時に D1 が利用できない CI 環境でエラー状態がキャッシュされる問題があった。

---

## 国土数値情報 C02 港湾座標の重複

**問題**: 国土数値情報 C02（港湾データ）由来の座標に6組12港の重複があり、地図上で異なる港が同じ位置に表示された。重複ペア: 宮古/大船渡、福井/敦賀、神戸/姫路、三隅/西郷、長浜/新居浜、中城湾/運天。

**原因**: 元データの品質問題。同一都道府県内の複数港に同じ座標が割り当てられていた。

**対策**: (1) MLIT サイバーポート（cyport）API のバース施設座標の平均値で修正。cyport に無い港は Web 調査で補完。修正スクリプト: `packages/database/scripts/import-cyport-ports.ts`。(2) 港湾データ投入・更新時は `SELECT ... FROM ports a JOIN ports b ON a.latitude = b.latitude AND a.longitude = b.longitude AND a.port_code < b.port_code` で重複座標チェックを行う。

---

## X 予約投稿の正しいフロー（browser-use 自動化）

**問題**: browser-use で X の予約投稿ダイアログの「予約投稿ポスト」ボタンをクリックしても予約が登録されない。ダイアログは閉じるが「予約済み」タブは空のまま。

**原因**: 「予約投稿ポスト」ボタンはダイアログ内で直接予約を完了するボタンではない。正しいフローは「確認する」→ コンポーザに戻る（予約日時がセットされた状態）→「予約設定」ボタンをクリック。

**対策**: X 予約投稿の正しい手順:
1. コンポーザでテキスト入力 + 画像アップロード
2. 「ポストを予約」（カレンダーアイコン）をクリック → ダイアログ表示
3. select 要素で日時を設定
4. **「確認する」をクリック** → ダイアログが閉じ、コンポーザに「YYYY年M月D日(曜)の午前/午後H:MMに送信されます」が表示される
5. **「予約設定」ボタンをクリック** → 予約完了（「予約済み」タブに表示される）

**注意**: `/publish-x` SKILL.md の記述は不正確（「確認する」はクリック不要と書いてあるが、実際はクリック必須）。SKILL.md の更新が必要。

---

## YouTube OAuth トークンは定期的に失効する

**問題**: `.claude/scripts/youtube/upload.js` で `invalid_grant: Token has been expired or revoked` エラー。

**原因**: Google OAuth の refresh token が失効（長期間未使用、パスワード変更、手動取り消し等）。

**対策**: `node .claude/scripts/youtube/oauth-setup.js` を実行し、ブラウザで Google 認証を通す。新しい refresh token が `.env.local` に自動保存される。browser-use の Profile 5 で自動化可能。

---

## OGP 画像 URL と noindex 漏れによる「クロール済み - インデックス未登録」1,453 件

**問題**: GSC で「クロール済み - インデックス未登録」が 1,453 ページ繰り返し発生。主原因は (1) Next.js の opengraph-image.tsx が自動生成する `/areas/*/opengraph-image` URL が robots.txt で Disallow されておらず Google が全てクロール、(2) 市区町村ページ `cities/[cityCode]/page.tsx` に `robots: "noindex, follow"` が未設定（子ページには設定済み）。

**原因**: (1) robots.ts 作成時に Next.js File Convention の自動生成ルート（opengraph-image 等）を考慮しなかった。(2) 子ページの noindex を親ページに適用する確認を怠った。

**対策**: (1) robots.ts に `"/*/opengraph-image"` を全 userAgent の Disallow に追加。(2) 市区町村ページに `robots: "noindex, follow"` を追加。(3) 新規ページ作成時は `coding-standards.md` のインデックス制御チェックリストを実行。(4) `/seo-audit` に「2-7. インデックス制御チェック」を追加。

---

## GA4 の「既知の bot 除外」は常時オンで UI トグル無し

**問題**: `/themes/population-dynamics` で PV/user = 70.5（他 /themes/* は 25 以下）、avg session 4,169 秒（≈69 分）という異常値を検知。「GA4 管理画面で『既知の bot トラフィックを除外』を有効化」と案内しようとしたが、実際には UI にそのようなトグルは存在しない。UA（旧 Google アナリティクス）の「ボットとスパイダーをすべて除外」チェックボックスは GA4 では撤廃された。

**原因**: GA4 の既知 bot フィルタは IAB/ABC International Spiders and Bots List を常時参照して **自動除外する仕様**。ユーザーが手動でオン/オフを切り替える設計ではない。したがって「GA4 で bot フィルタを有効化してもらう」提案は無効。IAB リスト未登録のクローラー（独自 scraper / headless Chrome / Playwright 等）は GA4 既定では検知されない。

**対策**: bot 疑いの異常値を GA4 側で除外したい場合、以下を検討する:
1. **内部トラフィック除外フィルタ**（管理 → データストリーム → タグ設定 → 内部トラフィックを定義 → データフィルタで有効化）: 自オフィス IP を除外
2. **Cloudflare Bot Analytics**: Cloudflare ダッシュボード → Security → Bots で該当ページの bot スコア / UA を確認。GA4 より粒度が細かい
3. **middleware レベルでの 410**: Cloudflare `cf.botManagement.score`（enterprise）or User-Agent 文字列判定（無料）で不要 bot を弾く
4. ユーザーに案内する際は「GA4 UI の bot フィルタ有効化」ではなく上記を提示する

---

## note 記事 cover SVG で大きな数字テキストがリード文と重なる

**問題**: B/C/D シリーズ note 記事の cover SVG (1280×670) で `font-size="180"` の big number を `y="250"` 前後に置くと、上の `y="110"` リード文と完全に重なる。8 ファイル一斉に同じレイアウト崩れを起こした。

**原因**: SVG の `<text y="...">` は baseline 位置。CJK グリフは em-box ほぼ全体（baseline から上に `font-size × 0.88` まで）を埋める。font-size 180 のテキストは baseline が y=250 なら top が y=110 となり、同じ y=110 のリード文 (font 32) のベースラインに完全にかぶる。Latin 用の 70% cap-height 感覚で見積もると間違える。

**対策**:
1. **検証スクリプトを必ず通す**: cover SVG 生成・修正後は `node .claude/scripts/note/check-cover-overlap.cjs <svg>` で全 `<text>` 要素の bbox 重なりを自動検出する（`<g transform="translate()">` 追跡対応、4px 以下の接触は許容）。失敗時は exit 1。
2. **geometry 規則**: CJK の `<text y=Y font-size=F>` は y 範囲 `[Y - 0.88F, Y + 0.12F]` を占有する。font 180 を中央に置く場合は上の要素との間に最低 30px の余白を確保し、下の要素は `y >= Y + 0.12F + 6` に置く。
3. **font-size 180 は避ける**: cover で大きな数字を強調したい場合 font-size 130 までが安全（y=250 baseline で top y=136、上に y=110 リード文 font 32 があれば 22px gap）。
4. SKILL.md の cover SVG テンプレ記述には font 180 の例を載せない（誤コピー防止）。

---

## GSC 「クロール済み - インデックス未登録」は sitemap から除外しただけでは減らない

**問題**: 2026-04 に `INDEXABLE_AREA_CATEGORIES` を 13 → 2 に削減して sitemap から 517 URL（47 × 11）を除外したが、GSC の「クロール済み - インデックス未登録」は期待ほど減らなかった（W15 2,339 → W16 2,415、+76）。

**原因**: Google のインデックスは **sitemap から消したというシグナルだけでは除去トリガーにならない**。既にインデックスに入っている URL は、Googlebot が該当 URL を再クロールして 404 / 410 / noindex を受領することで初めて除去候補になる。sitemap は「新規 URL の発見」の案内であり、既存 URL の削除指示ではない。

**対策**: インデックス残骸の systematically な除去には **middleware で明示的に 410 Gone を返す**のが最も強いシグナル。404 でも除去されるが 410 の方が早い。2026-04-18 の Fix 7（`/themes/<unknown>` 410）/ Fix 8（`/areas/{pref}/<non-indexable-sub>` 410）がこの対応例。観測は `.claude/skills/analytics/gsc-improvement/reference/improvement-log.md` の T0-THEME-01 / T0-AREA-SUB-01 を参照。
