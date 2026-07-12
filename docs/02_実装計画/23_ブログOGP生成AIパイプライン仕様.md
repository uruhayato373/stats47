---
type: implementation-plan
date: 2026-07-12
status: ready-for-implementation
tags: [blog, ogp, gemini, image-generation, r2, claude-code]
---

# ブログOGP生成AIパイプライン仕様

## 1. 結論

ブログ記事のOGPは、**Geminiで記事別の「文字なし背景」を生成し、既存のSatori/Sharpでタイトル・説明・ブランド要素を重ねる**。
Geminiに完成OGPを一括生成させない。AI画像内の文字化け、レイアウト揺れ、統計値の捏造を避けながら、記事内容に応じた視覚的な変化を持たせるためである。

実装は既存の正典 `apps/web/scripts/generate-blog-thumbnails-cloud.ts` を拡張する。並行する別ジェネレーターは作らない。
最終成果物のR2キーも変更しない。

| 用途 | 既存の最終出力 |
| --- | --- |
| ライトカード | `app/blog/<slug>/thumbnail-light.webp` |
| ダークカード | `app/blog/<slug>/thumbnail-dark.webp` |
| OGP | `app/blog/<slug>/ogp/ogp.png` |
| メタデータ | `app/blog/<slug>/ogp/ogp.json` |

## 2. 成功条件

- 記事内容から6種類のビジュアル系統を決定できる。
- AIは背景だけを生成し、文字・数値・ロゴ・正確な地図を描かない。
- API障害、予算超過、不適切な生成結果があっても、現行の共通背景へ自動フォールバックする。
- 同一入力では再生成せず、プロンプトハッシュでキャッシュできる。
- dry-runが既定で、明示的な `--apply` なしにR2を変更しない。
- APIキーをログ、JSON、クライアントバンドル、Gitに残さない。
- 20記事のパイロットを人が確認してから全記事へ展開する。

## 3. ビジュアル系統

自由入力プロンプトを記事ごとに持たせず、Git管理のカタログから選ぶ。画風は全系統で「ライト、編集的、フラット、落ち着いた藍色、十分な余白」に統一する。

| `ogpVisualType` | 主な記事 | モチーフ例 |
| --- | --- | --- |
| `map` | 都道府県差、地域比較 | 抽象化した日本列島、47個の点、地域ブロック |
| `people` | 人口、結婚、世帯、教育、健康 | 人物シルエット、住宅、世代のまとまり |
| `economy` | 家計、物価、所得、消費 | コイン、家計簿、買い物かご、抽象チャート |
| `industry` | 職業、賃金、農林水産、製造 | オフィス、工場、農地、道具 |
| `timeline` | 推移、将来人口、長期変化 | 抽象的な時間軸、上昇・下降線、年輪 |
| `comparison` | ランキング、上位下位、二群比較 | 左右の抽象パネル、大小の棒、対比する形 |

禁止事項は全系統共通とする。

- 文字、文字らしい記号、数字、ロゴ、透かし
- 実在人物の顔、著名人、政党・企業の識別可能な意匠
- 正確性を装う統計値、都道府県名、順位
- 精密な行政境界を持つ地図（地理情報はSatori側の正規アセットを使う）
- 不安や差別を煽る人物表現

## 4. 記事側の指定と解決規則

記事のfrontmatterには必要な場合だけ次を追加する。記事本文 `article.md` がGit管理のAuthored SSOTであり、生成画像はR2上のDerived成果物である。

```yaml
ogpVisualType: people
ogpMotif: households
```

`ogpVisualType` は上記6値のみ。`ogpMotif` もカタログに登録した識別子のみ許可し、任意の生成プロンプトは許可しない。

解決優先順位:

1. frontmatterの有効な `ogpVisualType` / `ogpMotif`
2. `category`、`archetype`、`tags` の決定的な対応表
3. 既定値 `map` / `prefecture-comparison`

対応表で複数候補が一致した場合も順序を固定し、モデルに分類させない。分類と再試行状態は決定的なコードで処理する。

## 5. 生成アーキテクチャ

```text
R2 article.md
  -> frontmatter解析
  -> visualType / motifを決定
  -> 固定スタイル + カタログ + 記事タイトルからプロンプト生成
  -> promptHashを計算
  -> 同一hashの背景があれば再利用
  -> Geminiで文字なし背景を1枚生成
  -> Sharpで寸法・色・セーフゾーンを正規化
  -> Satoriでタイトル等を合成
  -> 既存4キーへ出力
```

AI背景のR2キーは `app/blog/<slug>/ogp/background.webp` とする。これはキャッシュ可能な派生成果物でありSSOTではない。
ダークカード用にAPIをもう1回呼ばず、同じ背景からSharpで彩度・明度・藍色オーバーレイを決定的に適用して生成する。
OGP本体とライトカードはライト版を使う。

メタデータ `ogp.json` には既存項目を壊さず、次の生成情報を追加する。

```json
{
  "background": {
    "provider": "google",
    "model": "gemini-2.5-flash-image",
    "visualType": "people",
    "motif": "households",
    "promptVersion": "blog-ogp-v1",
    "promptHash": "sha256-prefix",
    "generatedAt": "ISO-8601",
    "source": "ai"
  }
}
```

プロンプト全文、APIキー、APIレスポンス本文は保存しない。失敗時は `source: "brand-fallback"` を記録する。

## 6. 実装ファイル

Claude Codeは最初に既存exportと呼び出し元を読み、命名を実コードへ合わせる。想定する最小構成は次の通り。

| ファイル | 変更内容 |
| --- | --- |
| `apps/web/scripts/generate-blog-thumbnails-cloud.ts` | 正典CLIへAI背景の取得、キャッシュ、フォールバックを統合 |
| `apps/web/scripts/data/blog-ogp-visual-catalog.ts` | 6系統、許可motif、タグ対応表、固定プロンプト断片 |
| `apps/web/scripts/lib/blog-ogp-visual.ts` | frontmatterからの決定的解決、promptHash生成 |
| `apps/web/scripts/lib/gemini-image-client.ts` | サーバー専用API呼び出し、タイムアウト、限定再試行、画像抽出 |
| `packages/types/src/article.ts` | 必要ならfrontmatterの2フィールドをoptionalで追加 |
| 対応テスト | resolver、hash、予算、fallback、メタデータ互換性を検証 |

既存 `generate-category-images.ts` のGemini REST呼び出しと `.env.local` 読込方法は参考にするが、エラー本文に機密や過大なレスポンスを出さないよう共通クライアント側で改善する。

## 7. CLI仕様

現行オプションとの互換性を維持し、次を追加する。名称が既存オプションと衝突する場合は既存を優先する。

```bash
# 監査と生成予定・推定費用のみ。R2には書かない
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --limit 20

# 1記事をローカル一時出力まで生成
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --slug <slug>

# 承認後にR2へ反映
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --slug <slug> --apply
```

追加オプション:

- `--ai-background`: AI背景を有効化。未指定時は現行挙動。
- `--limit <n>`: 対象記事数の上限。
- `--max-attempts <n>`: 1記事のAPI試行上限。既定2、最大3。
- `--budget-usd <n>`: 実行単位の上限。到達時は新規API呼び出しを止める。
- `--force-background`: hash一致のキャッシュを無視。通常運用では使わない。
- `--visual-type <type>`: 1記事の確認用上書き。frontmatterは変更しない。
- `--apply`: R2書込み。既定はdry-run。

dry-runでは対象数、キャッシュ命中数、新規生成上限、最大推定費用、出力先を表示する。API呼び出し自体も行わない純粋な監査モードを保持する。

## 8. APIキーとセキュリティ

- サーバー側スクリプトだけが `GEMINI_API_KEY` を読む。互換目的で既存の `GOOGLE_API_KEY` fallbackは維持してよい。
- `NEXT_PUBLIC_` 接頭辞を付けない。
- `.env.local` の値をconsole、例外、テストfixture、ドキュメントへ出さない。
- HTTPヘッダーは `x-goog-api-key` を使用し、URLクエリへキーを含めない。
- 30秒程度のタイムアウトを設ける。
- 429と5xxだけを指数バックオフ付きで再試行する。4xx入力エラーは再試行しない。
- ログはHTTP status、slug、attempt、短いエラー分類まで。レスポンス本文全文は出さない。

## 9. コスト制御

価格は実装時点でGoogle公式価格表を再確認する。2026-07-12時点の設計上の目安は Gemini 2.5 Flash Image が標準 `$0.039/画像`、Batch `$0.0195/画像`。公式: <https://ai.google.dev/gemini-api/docs/pricing>

例として20記事を各1枚なら標準で約 `$0.78`。1ドル150円と仮定すると約117円で、為替・税は別である。全記事数を先に数え、CLIのdry-runで必ず最大費用を出す。

コストガード:

1. 既存背景とpromptHash一致ならAPIを呼ばない。
2. 1記事1候補を基本にし、不合格時だけ最大1回再試行する。
3. 初回は20記事、実行上限 `$2`。
4. 全量実行にも明示的な `--budget-usd` を必須化する。
5. 大量再生成はBatch API対応を別フェーズで検討し、初期実装へ混ぜない。
6. モデル名と単価は定数化し、価格改定時にdry-run計算だけ差し替えられるようにする。

## 10. 品質ゲートとフォールバック

機械検査:

- APIレスポンスに画像が1枚存在する。
- Sharpでdecodeできる。
- 1200×630の合成用背景へcover変換できる。
- ファイルサイズが下限・上限内にある。
- 左側タイトルセーフゾーンに極端な高コントラストがない（必要なら半透明の白レイヤーを決定的に重ねる）。
- 出力OGP、light、darkの3画像が全て生成できる。

失敗時の順序:

1. 許可されたエラーだけ最大回数まで再試行。
2. 同記事の直前に成功したAI背景があれば使用。
3. 現行 `ogp-bg-brand-light/dark` を使用。
4. 最終成果物が作れない場合だけexit 1。

AI背景が失敗しても記事公開を止めない。完成OGPの欠落は既存の週次OGP監査・自己修復の対象に残す。

人によるパイロット確認:

- 6系統が最低2件ずつ含まれる20記事を選ぶ。
- `npm run gallery` の `/assets` で一覧確認する。
- 文字の可読性、人物表現、記事との関連、ブランド統一、不自然な文字らしき形を確認する。
- 不合格は自由プロンプトで個別修正せず、カタログまたは共通スタイルを直す。

## 11. 実装フェーズ

### Phase 0: 現状固定

- 正典スクリプト、R2キー、`ogp.json` 現行schema、週次監査を確認する。
- 現在の代表OGPを6〜10枚保存せずにギャラリーで確認し、比較基準を記録する。
- 対象記事数と最大費用を算出する。

### Phase 1: 決定的な分類

- 型、6系統カタログ、解決関数、hash関数を実装する。
- APIを呼ばず、全記事が必ず有効な系統へ解決されることをテストする。

### Phase 2: Geminiクライアント

- 既存カテゴリ画像生成の呼び出し作法を共通化または安全に再利用する。
- タイムアウト、限定再試行、予算、画像抽出、機密を含まないエラーを実装する。
- Geminiが使えないテスト環境ではfetchをmockする。

### Phase 3: 正典パイプライン統合

- AI背景をSatori/Sharpの既存合成へ注入する。
- final keyは変えず、背景とメタデータだけ追加する。
- `--ai-background` 未指定時の出力が変わらない回帰テストを行う。

### Phase 4: 20記事パイロット

- dry-run結果と費用を確認する。
- `/tmp` 出力またはローカルギャラリーで人が確認する。
- ユーザー承認後だけ `--apply` でR2へ反映する。本番デプロイは別途明示承認がある場合だけ行う。

### Phase 5: 段階展開

- まず流入上位・SNS再利用予定の記事へ適用する。
- 残りは20〜50記事単位。失敗率、fallback率、費用を各バッチで記録する。
- 4週間後にSNSリンクCTR、noteからの遷移、対象記事の流入変化を確認する。OGPだけの因果と断定しない。

## 12. テストと受入条件

最低限の自動テスト:

- explicit指定がタグ推論より優先される。
- 不正なtype/motifが既定値へ安全に落ちる、またはbuild時検証で検出される。
- 同一入力は同一promptHashになる。
- title、model、promptVersion、motifの変更でhashが変わる。
- hash一致時にfetchが呼ばれない。
- 予算到達後にfetchが呼ばれない。
- 429/5xxは再試行、400/401は再試行しない。
- API失敗で共通背景へfallbackし、完成OGPは生成される。
- APIキーとプロンプト全文がログ・メタデータに含まれない。
- `--apply` なしでR2 writerが呼ばれない。
- 既存 `ogp.json` readerとの互換性がある。

検証コマンドは実装時に実ファイルへ合わせるが、最低でも対象テストと次を行う。

```bash
npm run type-check --workspace apps/web
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --ai-background --limit 20
```

SSGやmetadata readerを変更した場合だけ、対象ページ検証または節目のfull buildを追加する。未実行の検証は完了報告に明記する。

## 13. Claude Codeへの実装指示

次をClaude Codeへそのまま渡せる。

```text
docs/02_実装計画/23_ブログOGP生成AIパイプライン仕様.md を正典として実装してください。

最初に CLAUDE.md、.claude/rules/ogp-image-standards.md、
.claude/rules/data-storage.md、.claude/rules/skill-code-placement.md を読み、
generate-blog-thumbnails-cloud.ts、generate-category-images.ts、既存OGP renderer、
ogp.json readerとテストを監査してください。

既存の generate-blog-thumbnails-cloud.ts を正典のまま拡張し、別の並行
ジェネレーターは作らないでください。AIは文字なし背景だけを生成し、文字・数値・
ブランド要素は既存Satori/Sharpで合成します。最終R2キーは変更しません。

Phase 1〜3を実装し、対象テストとapps/web type-checkを実行してください。
APIキーを出力しないでください。R2書込み、外部公開、本番デプロイは実行せず、
dry-runとローカル一時出力までで止めてください。20記事パイロットの対象、最大推定費用、
検証済み項目、未検証項目、変更ファイルを最後に報告してください。
```

## 14. 非スコープ

- Geminiによる記事本文生成
- 実行時のNext.js `ImageResponse` OGP生成
- OGPへの正確な統計チャート・順位・都道府県境界のAI描画
- 記事公開時の無制限な自動生成
- 初期フェーズでのBatch API、複数プロバイダー抽象化、管理画面からの自由プロンプト入力
- ランキングOGPのA/B仕様（別タスク `RANKING-THUMBNAIL-AB-01` Phase 4）

## 15. 関連正典

- `.claude/rules/ogp-image-standards.md`
- `.claude/rules/sns-content-standards.md`
- `.claude/rules/data-storage.md`
- `apps/web/scripts/generate-blog-thumbnails-cloud.ts`
- `apps/web/scripts/generate-category-images.ts`
- `docs/02_実装計画/01_収益化マスタープラン.md`
- Google Gemini画像生成: <https://ai.google.dev/gemini-api/docs/image-generation/>
- Google Gemini API料金: <https://ai.google.dev/gemini-api/docs/pricing>
