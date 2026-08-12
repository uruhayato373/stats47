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
node .claude/scripts/kdp/capture-account.mjs --write                # 初回のみ: accountEmail を kdp-account.json へ
npm run products:kindle:kdp-listings --workspace=@stats47/product-factory -- --apply   # 出品内容 SoT を KINDLE_BOOKS から生成
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --probe       # ★初回: フォーム構造を dump (セレクタ調整)
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01               # 下書き作成のみ (既定・安全)
node .claude/scripts/kdp/kdp-publish.mjs --id K-S1-01 --commit      # 公開 (★実公開・要オーナー承認)
```

`--id` は Kindle 書籍 ID (`K-S1-01` 等・KINDLE_BOOKS と一致)。

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
- **KDP フォームは React SPA で DOM が変わりやすい**。初回は必ず `--probe` で構造を dump し、`kdp-form.mjs` の
  label セレクタが合うか確認する (coconala の `discover-categories` 相当)。

## フロー

1. **SoT を確定**: `products:kindle:kdp-listings --apply` で `kdp-listings.json` を最新化。カテゴリは人手で `categories` に記入 (upsert 保持)。
2. **構造確認**: `--probe` で `.local/kdp-debug/probe-<id>.json` を確認。
3. **下書きで検証**: `--commit` なしで実行 → `.local/kdp-debug/details-<id>.png` と未充填 warnings を確認。warnings が残る間は公開しない。
4. **公開**: オーナー承認後に `--commit`。成功時に `kdp-listings.json` を `status:listed`+asin へ書き戻し。KDP 審査後に販売開始。

## ガードレール

- **draft-first**: 既定は下書き保存。公開は `--commit` + オーナー承認時のみ。
- **偽成功を報告しない**: 未充填/公開未確定なら「公開した」と言わない。
- **1 冊ずつ**: 一括出品しない。売上・KENP を実測して伸びる系統だけ横展開。
- **KU (KDP Select 独占) は既定 未登録**。判断はオーナー。

## スコープ外 (委譲)

- 書籍生成 (EPUB)・カタログ管理 = `kindle-publisher` (`/build-kindle-book`)
- 書き下ろし = `article-writer` → `blog-critic`
- ログイン・税務・銀行・Kindle Previewer 最終目視・公開承認 = 人間 (オーナー)

## 関連

- 規約: `.claude/rules/coconala-product-standards.md §8`
- スクリプト: `.claude/scripts/kdp/` / SoT: `.claude/config/kdp-listings.json` / アカウント: `.claude/config/kdp-account.json`
- agent: `.claude/agents/kdp-operator.md` / 認証プロファイル: `docs/01_技術設計/07_Playwright認証プロファイル.md`
