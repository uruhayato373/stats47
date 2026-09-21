---
name: kdp-publish
description: stats47 の Kindle 電子書籍 (EPUB) を Amazon KDP へ Playwright で出品・修正する。出品内容 SoT = .claude/config/kdp-listings.json を書籍 id で引き、ログイン済みプロファイルで KDP の出品フォーム (Details/Content/Pricing) へ流し込む。Use when user says [KDPに出品, Kindle出版, 電子書籍を公開, /kdp-publish]. ログイン・税務/銀行情報は人間工程、実公開は --commit + オーナー承認。
disable-model-invocation: true
primary_agent: kdp-operator
co_agents: [kindle-publisher]
---

Amazon KDP の**出品・修正の実操作**を決定的スクリプトで行う (coconala-operator からの移植)。
永続プロファイル + account assert + draft-first + `--commit` gate。

```
node .claude/scripts/kdp/login.mjs                                  # 初回のみ: headed で手動ログイン (2FA 含む)
node .claude/scripts/kdp/capture-account.mjs --write                # 初回のみ: knownAsin を .local へ
npm run products:kindle:kdp-listings --workspace=@stats47/product-factory -- --version <VERSION> # 非公開の改訂書誌提案を生成

# ── バッチ (通常運用。1 つのブラウザで全冊・冪等) ──
node .claude/scripts/kdp/kdp-batch.mjs --phase draft                # 未完の下書きを完成させる (verify で欠けだけ埋める)
node .claude/scripts/kdp/kdp-batch.mjs --phase verify               # ★機械ゲート: read-back 全項目検証 (書き込みなし)
node .claude/scripts/kdp/kdp-batch.mjs --phase publish --commit     # ★公開 (verify PASS の本のみ・要オーナー承認)

# ── 単発 (1 冊だけ触る / 調査) ──
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --probe       # フォーム構造を dump (セレクタ調整)
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01               # 下書き作成のみ (既定・安全)
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --commit      # 公開 (★実公開・要オーナー承認)
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --update      # 既刊の修正下書き（R2 archive一致必須）
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --update --commit # 修正版を再申請（要オーナー承認）
node .claude/scripts/kdp/kdp-reports-probe.mjs                            # 売上ダッシュボードの読み取り専用 probe (アカウント合計。冊別は kdpreports.amazon.co.jp = 人間工程)

# ── 週次レビュー/計画からの新規パイロット（最大1冊/週） ──
npm run kdp:weekly -- --week 2026-W41 --write                    # listings + sales-ledger から公開ゲート生成（公開なし）
npm run kdp:weekly-publish -- --week 2026-W41 --id <ID> --owner-approved <ID> --commit # 対象IDの明示承認後だけ
```

`--id` は Kindle 書籍 ID (`K-S1-01` 等・KINDLE_BOOKS と一致)。`--ids A,B` でバッチの対象を絞れる。
**フローの実体は `lib/kdp-flow.mjs`** (verifyDraft / ensureDraft / publishDraft) で、単発とバッチが共有する。

## 前提 (最重要・★安全境界)

- **実行はローカルのみ** (ログイン済みプロファイル `.local/playwright-kdp-profile` があるマシン)。初回は headed で
  **stats47 の Amazon/KDP アカウント**に人間が手動ログイン (2FA 含む)。エージェントは認証を代行しない。
- **税務情報 (Tax interview)・銀行口座の入力は人間工程**。これらが未完了だと KDP は公開させない。
- **account assert**: 別アカウントでの誤操作を防ぐ。★**KDP はメールを本棚に出さず、アカウントページは 2FA を
  再要求する**ため (2026-08-12 実測)、`knownAsin` (この口座で公開済みの本の ASIN) で同一性を確認する。
  照合できなければ中断し、素通しにはしない。
- **個人情報は git 管理外**: このリポジトリは **public**。`accountEmail` / `knownAsin` は
  `.local/kdp-account.local.json` (gitignore 済) に置く。`readAccount()` が公開側の
  `.claude/config/kdp-account.json` に上書きとして重ねる。
- **ドメインは `kdp.amazon.co.jp`**: `.com` のサインインでは同じメールでも「アカウントが見つからない」になる
  (Amazon のアカウントは .com と .co.jp で別登録)。UI も `ja_JP` — フォームのセレクタが日本語ラベルのため。
- **実公開 (`--commit`) はオーナー承認を要する** — outward-facing・取り下げに時間がかかる。既定の下書き検証まではエージェントが進めてよい。
- **週次計画は承認ではない**。週次経路の新規パイロットは`kdp-weekly-publication.json`が
  `ready-for-owner-approval`かつ候補1冊のときだけ進め、対象IDと同じ`--owner-approved <ID>`を
  ユーザーがその場で明示した場合だけ`kdp-weekly-publish --commit`を使う。
- **KDP フォームは React SPA で DOM が変わりやすい**。日本語版の実仕様 (id 名指し / CKEditor /
  カテゴリの掲載場所チェック / AUI ボタンは実クリックのみ / 表紙は JPEG) は
  `.claude/rules/coconala-product-standards.md` §KDP 入稿フォームの実仕様 が正典。
  変わったら `--probe` で dump してからそこを直す。
- **判定は read-back で行う**。「押せた」を成功にすると、1 枠も入っていないのに ✓ が並ぶ
  (実際にカテゴリでそうなった)。件数・表示の変化を確かめる。

## フロー

1. **SoT を確定**: `products:kindle:kdp-listings --version <VERSION>` で非公開の改訂書誌提案を生成する。旧`--apply`一括上書きは禁止。改訂版の独立レビュー・Previewer・暗号化保全・オーナー承認後に、対象IDだけの出品台帳切替を別工程で行う。
   カテゴリ・DRM・AI 開示・フリガナはすべて git TS が SSOT なので手で書かない
   (`kdp-{category,publishing-policy,reading}.ts`)。`status` / `asin` / `draftId` は upsert 保持。
2. **構造確認**: DOM が変わった疑いがあるときだけ `--probe` で `.local/kdp-debug/probe-<id>.json` を確認。
3. **下書きを完成**: `kdp-batch.mjs --phase draft`。冪等 — 既存 draftId は verify して
   **欠けたステップだけ**埋める (details から全部やり直すと確定済みカテゴリが壊れる)。
4. **機械ゲート**: `kdp-batch.mjs --phase verify`。read-back で
   タイトル/カテゴリ保存/原稿処理完了/表紙/DRM/価格/ロイヤリティ を画面から確認。
   **1 冊でも不合格なら exit 1** (silent-green 防止)。
5. **不要な下書きを掃除**: `node .claude/scripts/kdp/kdp-drafts.mjs --prune`
   (`--apply` で削除)。SSOT の `draftId` と公開済みは対象外。
6. **作成数制限に注意**: KDP は未公開 (下書き+レビュー中) が約 10 冊で新規作成を拒む
   (「本の作成数制限を超えました」)。多冊数は「10 冊 draft→verify→publish → 審査完了を
   待つ → 次の 10 冊」で分割する。審査状態と ASIN 回収は `--phase status`。
   旧 launchd 再開ジョブ (`scripts/scheduled/kdp-resume-daily.sh`) は **2026-08-16 以降停止中**。
   repo 内の script/plist は復旧用に保持するだけで、自動再登録しない。再開にはオーナーの新しい明示承認が必要。
7. **公開**: オーナー承認後に `--phase publish --commit`。verify PASS の本だけ公開し、
   **本棚で status が「下書き」でなくなったこと**を read-back して初めて成功とする
   (文言 grep は「出版」がどのページにもあるので使わない)。成功時に `status:listed`+asin を書き戻し。
   ASIN 割当が遅れる本は `kdp-drafts.mjs` (一覧) で後追いする。
8. **状態同期**: `--phase status`はASINの有無に関係なく`draft|in_review|live|unknown`、生表示、確認日時、販売開始日をlistingsへ保存する。
8b. **止めている本・取り下げる本 (2026-09-19)**: `kdp-listings.json` の `status: "blocked-design"` (編集設計が無い 10 冊) は KDP に作らない。`withdrawal` を持つ販売中の本 (S2/S3/S4 の 10 冊) は `--update` も再申請もせず、オーナー指示のうえ
    `node .claude/scripts/kdp/kdp-unpublish.mjs --all-withdrawn --probe` (メニュー・確認ダイアログの採取だけ) →
    `--commit` で KDP 本棚の「電子書籍の出版停止」を実行する。対象は withdrawal かつ kdpStatus=live かつ ASIN あり
    に限り、行は ASIN + 題名で特定、成功判定は本棚 read-back が「下書き」になること (押せた = 成功にしない)。
    1 冊でも失敗したら残りを止める。実行後は listing に `status: "withdrawn"` と `withdrawal.unpublishedAt / readBack / evidence`
    を残す (2026-09-19 に 10 冊実施、証跡 `.local/kdp-debug/unpublish-<ts>/`)。ストアの商品ページが消えるまで数時間〜72 時間かかる。理由は各 listing の `blockReason` / `withdrawal.reason` にあり、消さない。`kdp-batch` はどちらも draft/verify/publish の対象から外す。
9. **既刊修正**: 原稿/表紙SSOTを修正・新versionへ生成し、`kindle:archive --push --id <ID> --version <VERSION>`で保全、同版を`--audit --deep --record`で検証してから`--update`。出品台帳のEPUB/表紙パス・保全版・ローカル全必須ファイルのSHAに加え、`kdp-release-gate.mjs`が現行原稿・本文品質・対象版の独立レビューを確認する。未達なら単発でもバッチでも送らない。本文検査だけでオーナー承認を代替しない。

## ガードレール

- **draft-first**: 既定は下書き保存。公開は `--commit` + オーナー承認時のみ。
- **偽成功を報告しない**: 未充填/公開未確定なら「公開した」と言わない。
- **公開は verify ゲートの後ろ**: read-back 全項目 PASS の本しか公開経路に乗らない。
- **計測はこの口座の stats47 ぶんだけ**: 同一口座に doboku-note が同居する。KDP レポートは
  `kdp-listings.json` の `asin` 集合でフィルタして読む (混ぜると他サイトの実績を誤認する)。
- **KU (KDP Select 独占) は既定 未登録**。判断はオーナー。

## スコープ外 (委譲)

- 書籍生成 (EPUB)・カタログ管理 = `kindle-publisher` (`/build-kindle-book`)
- 書き下ろし = `article-writer` → `blog-critic`
- ログイン・税務・銀行・Kindle Previewer 最終目視・公開承認 = 人間 (オーナー)

## 関連

- 規約: `.claude/rules/coconala-product-standards.md §8`
- スクリプト: `.claude/scripts/kdp/` / SoT: `.claude/config/kdp-listings.json` / アカウント: `.claude/config/kdp-account.json`
- agent: `.claude/agents/kdp-operator.md` / 認証プロファイル: `docs/01_技術設計/07_Playwright認証プロファイル.md`
