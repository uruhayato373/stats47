---
name: coconala-publish
description: >
  ココナラ出品サービスを Playwright で「新規出品」「内容修正」するスキル (stats47)。出品内容の
  真実源 .claude/config/coconala-listings.json (title/価格/カテゴリ/本文/ジャンル/納期) を product id で
  引き、ログイン済みプロファイルで出品フォームへ流し込む。安全弁 = account assert (coconala-account.json の
  sellerName・★dobokunote と取り違えない) / 既定は「下書きで保存」で実公開は --commit 必須 / 価格・カテゴリの
  充填 warning があれば公開せず下書き退避。公開成功時は listings JSON へ status:'listed'+serviceUrl+listedAt を
  書き戻す。商品設計 (name/価格帯) の上流 SSOT は packages/product-factory。
  Use when user asks to [ココナラに出品, ココナラ出品を修正, ココナラの価格を反映, サービスを公開, /coconala-publish].
user-invocable: true
primary_agent: coconala-operator
---

## 用途

ココナラの**出品・修正の実操作**を決定的スクリプトで行う (doboku-note からの移植)。永続プロファイル +
account assert + draft-first + `--commit` gate。文面・価格を SoT で直し、このスキルで反映する。

```
node .claude/scripts/coconala/login.mjs                                        # 初回のみ：headed Chrome で手動ログイン（プロファイル保存）
node .claude/scripts/coconala/capture-account.mjs --write                      # 初回のみ：userId/sellerName を coconala-account.json に記入
node .claude/scripts/coconala/discover-categories.mjs [--master N]             # カテゴリ確定：出品フォームの master/sub/type/facet/提供形式の実 value を取得
node .claude/scripts/coconala/coconala-publish.mjs --service D-01              # 新規：下書き作成のみ（既定・安全）
node .claude/scripts/coconala/coconala-publish.mjs --service D-01 --commit     # 新規：公開（★実公開・要オーナー承認）
node .claude/scripts/coconala/coconala-edit.mjs --service D-01 --commit        # 修正：現値をフル反映
node .claude/scripts/coconala/coconala-edit.mjs --service D-01 --fields price  # 修正：価格だけ（下書き保存）
node .claude/scripts/coconala/coconala-delete-draft.mjs --id <n>               # 空の下書き掃除（dry-run）
```

`--service` の id は **product-factory の商品 ID** (`A-01`〜`L-07`) と一致させる。

## 前提（最重要・★アカウント分離）

- **実行はローカルのみ**（ログイン済みプロファイル `.local/playwright-coconala-profile` があるマシン）。初回は headed で **stats47 のココナラアカウント**に手動ログイン（プロファイルに保持）。dobokunote ではない。
- **account assert**: 期待IDは`.claude/config/coconala-account.json`のみを参照し、`/mypage/user`の本人プロフィール「表示を確認する」リンクと照合する。ダッシュボード全体の最初の`/users/NNNN`はおすすめ出品者を拾うため禁止。ID未設定・取得不能・複数・不一致では停止し、表示名で代替しない。アカウント変更はオーナー承認後にconfigへ記録する。
- **規約リスク**: ココナラ利用規約に「出品者が自分の出品をブラウザ自動化することを禁じる明示条項」は doboku 側調査 (2026-07-18) では未確認だが、**bot 検知の運用リスクは残る**ため低頻度（出品時・価格改定時）に限る。
- **実公開 (`--commit`) はオーナー承認を要する** — outward-facing・不可逆寄り。既定の下書き検証まではエージェントが進めてよいが、`--commit` は明示承認後に実行する（`.claude/rules/coconala-product-standards.md §6`）。

## フロー

1. **SoT を確定**: `coconala-listings.json` に当該 product の出品内容 (title/priceYen/category/genreFacets/provisionFormat/body/purchaseNote/deliveryDays) を書き起こす。name/価格帯は `packages/product-factory` の該当商品を参照して転記する（product-factory が上流）。
2. **下書きで検証**: まず `--commit` なしで実行 → `.local/coconala-debug/publish-filled-*.png` と `ok:true`（下書き保存成功）を確認。
3. **公開**: オーナー承認後に `--commit` で公開。成功時は publish が listings JSON を `status:'listed'`+`serviceUrl`+`listedAt` に自動書き戻し。
4. **出品後の配線**: `coconala-account.json` の `profileUrl`（未設定なら）を埋める。

## コナラ2026-10/11フォーム刷新の既知の落とし穴（★展開時に踏む・対応は実装済）

実機で確定・`coconala-form.mjs`/publish ガードで対応済み。listings を書くときに守れば失敗ラウンド（約4分＋空の下書き）を避けられる。

| 項目 | 制約 | 対応 |
|---|---|---|
| **タイトル** | 表示25字以内（末尾自動付与「ます」2字を含む） | publish がブラウザ起動前に ABORT。listings の title を25字以内（末尾「ます」込）に |
| **キャッチコピー** | 15〜30字 | publish が事前 ABORT / fill が warn |
| **価格プルダウン** | option の value=表示×1.1（表示"4,000円"⇔value"4400"）。**カテゴリごとに最低額あり**（例 資料作成=最低4,000円） | fill が表示テキスト一致で選択。低すぎると警告→listings の priceYen を上げる |
| **提供形式** | カテゴリによりsection全体が非表示。非表示radioの書換えは保存されない | visibleな場合だけ実クリックし保存後read-back。非表示はcategory-inactiveとして保持し、本文の納品内容・納期・修正回数を照合する |
| **無料修正回数(fixLimit)** | 公開時のみ必須（下書き保存では任意） | listings に `fixLimit`（省略時 publish/edit が既定 -1=無料修正なし） |
| **カテゴリ** | master/sub/type/facet の value は実機依存 | `discover-categories.mjs --master N` で取得して確定 |
| **公開済みの画像差し替え** | 公開中listingを `--image` で更新すると提供形式が既定へ戻り更新失敗しうる | `coconala-edit --service <id> --service-id <n> --image <path> --replace-image --commit`（★既定の `--image` は全フィールド再適用+画像差し替え。旧画像を消してメイン化）。`--image-only` 明示時のみ画像だけ触る |

## ガードレール

- **納品物照合**: P-*パックの公開修正前に `node .claude/scripts/coconala/render-pack-previews.mjs` を通す。
  `_delivery` のartifactDirectory/manifestSha256/indicatorCount/hasXlsx/pptxIndicatorCountが実物と一致すること。
  画像作成は同コマンドに `--render`。既存画像はテーマイメージ、追加画像は納品CSVの表示例と明記する。
  `coconala-edit --commit`は未検証の旧版・ハッシュ不一致を拒否する。Office実機未確認を検証済みと書かない。

- **draft-first**: 既定は「下書きで保存」。公開は `--commit` を明示 + オーナー承認時だけ。
- **偽成功を報告しない**: 送信後にバリデーションエラー（記入エラー）が出たら「公開した」と言わない（publish/edit は `ok:false` を返し下書きに退避）。
- **1商品ずつ**: `.claude/rules/coconala-product-standards.md` の戦略どおり、一括出品せず 1 商品ずつ需要を実測する。
- **orphan draft（出品失敗の残骸）が出たら**: `coconala-delete-draft.mjs --id <n>`（dry-run）→ `--commit`。listings 在籍 id はガードで拒否＝出品済み商品は誤爆しない。
- **フォーム仕様がドリフトしたら**: `discover-categories.mjs --master N` でカテゴリ option を取り直し、listings の category/genreFacets を是正。価格/フィールド未確定は `/mypage/services/{id}` を実機で確認。

## 未移植（doboku にあるが stats47 には無い）

- `coconala-order` / `coconala-status`（受注 E2E・KPI 記録）: stats47 側に受注/KPI の state 基盤が無いため未移植。
- 商品画像生成（thumb/cover 専用ジェネレータ）・PDF 納品ビルド: 現状は product-factory の生成物（`preview/thumbnail-*.png`）を `--image` で流用。専用化は必要になってから。
- `check-coconala-wiring`（配線 lint）: listings が育ったら移植を検討。
- （移植済み: `discover-categories.mjs`＝カテゴリ option 取得 / `capture-account.mjs`＝userId 取得 / `login.mjs`＝初回ログイン）

## 関連

### プロフィール整備

- 公開文面は `.claude/config/coconala-profile.ts`、ブランド素材は同configの参照先、実測は `.claude/state/products/coconala-profile-2026-09-06.json` を参照する。
- プロフィールの各「保存する」は保存後に消え、残りのボタンのindexが変わる。セクションを限定して保存し、再読込で内容一致を確認する。アイコンの更新直後に別ページへ移動すると送信を中断しうるため、公開プロフィールへの遷移完了を待つ。
- カバーはアップロード後のトリミング画面で「決定」が必要。商品画像は案内イメージと実データの見本を区別し、見本を受注実績と表示しない。
- 本人確認・NDA・規約同意・税務情報は人間工程。技術欄の経験年数・資格・稼働時間を推測して埋めない。
- 文面ゲート: `node --import tsx --test .claude/scripts/coconala/__tests__/profile.test.ts`。

- スクリプト: `.claude/scripts/coconala/{coconala-publish,coconala-edit,coconala-delete-draft}.mjs` + `lib/coconala-{session,form}.mjs`
- SoT: `.claude/config/coconala-listings.json`（出品内容・公開状態）/ `coconala-account.json`（アカウント）/ `packages/product-factory`（商品設計）
- 規約: `.claude/rules/coconala-product-standards.md`（§6 出品規律）
- agent: `.claude/agents/coconala-operator.md`（出品オーケストレーター）/ `coconala-product-manager.md`（商品生成・カタログ）
- 認証プロファイル: `docs/01_技術設計/07_Playwright認証プロファイル.md`
