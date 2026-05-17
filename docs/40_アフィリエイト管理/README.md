---
type: affiliate
status: active
tags: [banner, ssot]
---

# アフィリエイトバナー管理

stats47 が掲載しているアフィリエイトバナーの単一情報源（SSOT）。

## 配置方式の使い分け

| 方式 | 概要 | 用途 | 管理場所 |
|---|---|---|---|
| **タグベース自動配置** | 記事の tags → `TAG_AFFILIATE_MAP` → `AffiliateCategory` で自動マッチ | カテゴリ全体に薄く広く配置（労働 / 住宅 / 経済 等） | `apps/web/src/features/ads/constants/affiliate-category.ts` + D1 `affiliate_ads` |
| **直接属性方式** | 記事中に `<affiliate-banner src=... href=... tracking=...>` を直書き | 特定記事の文脈にピンポイント配置（メイキング系等） | 本ディレクトリ + 各記事 `article.md` |

本ディレクトリで管理するのは **直接属性方式** のバナーのみ。タグベース自動配置のバナーは D1 / TS 定数で管理する。

## ディレクトリ構造

```
docs/40_アフィリエイト管理/
├── README.md                              # 本ファイル
└── banners/
    └── <asp>-<slug>-<id>.md               # バナー1個 = 1md ファイル
```

## 新規バナー登録手順

1. **バナー HTML を ASP 管理画面から取得**（a_id, p_id, pl_id 等のパラメータ確認）
2. `banners/<asp>-<slug>-<id>.md` を作成（YAML frontmatter テンプレ参照）
3. 配置先の記事 `article.md` / `note.md` に `<affiliate-banner src=... href=...>` を貼り付け
4. 本 README の「現在のバナー一覧」表に追記

## YAML frontmatter テンプレ

```yaml
---
id: <asp>-<slug>-<id>           # ユニーク識別子
asp: <a8 | moshimo | rakuten>    # ASP 種別
title: "<バナータイトル>"
imageUrl: "https://..."
href: "https://..."
trackingPixelUrl: "https://..."
width: 500
height: 500
reward: "¥X,XXX/件"
conversionCondition: "<CV 条件>"
placementMode: direct-attribute  # 自動配置 (category) と区別
placedIn:
  - blog: <slug1>
  - note: <slug2>
addedAt: YYYY-MM-DD
---
```

## 現在のバナー一覧（直接属性方式のみ）

| ID | ASP | 商材 | 報酬 | CV 条件 | 配置記事 |
|---|---|---|---|---|---|
| `moshimo-ai-onikanri-93995` | moshimo | AI鬼管理｜Claude Code 業務自動化トレーニング | ¥15,000/件 | LINE 登録 or 無料診断予約完了 | blog: `koumuin-claude-code-estat-automation`, note: `koumuin-shigoto-kouritsuka-ai` |

## PR / 景表法対応ルール

景表法（2023-10 施行）に基づき、アフィリエイトリンクを含む記事は以下を明示する:

- **記事冒頭**: 「⚠ この記事には PR（アフィリエイトリンク）を含みます。」
- **リンク直前**: 「※PR：」のプレフィックス
- **note のハッシュタグ**: `#PR` または `#広告` を含める

## 関連

- `apps/web/src/features/ads/` — アプリ側のバナー表示実装
- `apps/web/src/features/blog/components/article-affiliate-banner.tsx` — 自動配置コンポーネント
- `apps/web/src/features/blog/components/md-content.tsx` — `<affiliate-banner>` カスタム要素の処理
- `.claude/skills/ads/register-affiliate-banner/SKILL.md` — A8 用既存スキル（タグベース）
