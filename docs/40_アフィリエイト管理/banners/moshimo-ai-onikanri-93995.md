---
id: moshimo-ai-onikanri-93995
asp: moshimo
title: "AI鬼管理｜Claude Code活用の業務自動化トレーニング"
imageUrl: "https://image.moshimo.com/af-img/7302/000000093995.png"
href: "https://af.moshimo.com/af/c/click?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995"
trackingPixelUrl: "https://i.moshimo.com/af/i/impression?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995"
width: 500
height: 500
reward: "¥15,000/件"
conversionCondition: "公式 LINE 登録または無料診断（オンライン面談）の予約完了"
placementMode: direct-attribute
placedIn:
  - blog: koumuin-claude-code-estat-automation
  - note: koumuin-shigoto-kouritsuka-ai
addedAt: 2026-05-16
---

## バナー概要

AI鬼管理が提供する「Claude Code 活用の業務自動化トレーニング」のアフィリエイトバナー。

## 商材の位置づけ

- **対象ターゲット**: Claude Code を業務に使いたいが独学に時間がかかると感じている個人事業主・公務員・自治体職員
- **CV ハードル**: 無料診断（オンライン面談 30 分）の予約 → 心理的障壁が低く CVR が期待できる
- **報酬**: 1 件 ¥15,000（無料 CV としては高単価）

## 配置戦略

タグベース自動配置はしない（`learning` カテゴリを既存に追加しない方針）。
代わりに「Claude Code を使ったサイト運営メイキング系記事」など、文脈が完全に一致する記事の末尾に手動で 1 個ずつ配置する。

### 想定配置記事（2026-05 時点）

1. blog `koumuin-claude-code-estat-automation` — 公務員 × e-Stat × Claude Code のロングテール SEO 記事
2. note `koumuin-shigoto-kouritsuka-ai` — 公務員向け業務効率化ストーリー記事

## 元のバナー HTML（ASP 管理画面取得時のオリジナル）

```html
<a href="//af.moshimo.com/af/c/click?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995" rel="nofollow" referrerpolicy="no-referrer-when-downgrade" attributionsrc>
  <img src="//image.moshimo.com/af-img/7302/000000093995.png" width="500" height="500" style="border:none;">
</a>
<img src="//i.moshimo.com/af/i/impression?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995" width="1" height="1" style="border:none;" loading="lazy">
```

**注意**: 元コードは `//` プロトコル相対 URL。記事中での使用時は `https://` を明示する（md-content.tsx の処理互換性確認のため）。

## ブログでの貼り付け形式

```html
<affiliate-banner
  src="https://image.moshimo.com/af-img/7302/000000093995.png"
  href="https://af.moshimo.com/af/c/click?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995"
  tracking="https://i.moshimo.com/af/i/impression?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995"
  width="500"
  height="500"
  label="業務効率化トレーニング（無料診断）"
></affiliate-banner>
```

## note での貼り付け形式

note はカスタム要素未対応のため、生 HTML（リンク + img）を貼る:

```html
<a href="https://af.moshimo.com/af/c/click?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995" rel="nofollow" referrerpolicy="no-referrer-when-downgrade">
  <img src="https://image.moshimo.com/af-img/7302/000000093995.png" width="500" height="500" style="border:none;">
</a>
<img src="https://i.moshimo.com/af/i/impression?a_id=5563655&p_id=7494&pc_id=21647&pl_id=93995" width="1" height="1" style="border:none;" loading="lazy">
```

note エディタが HTML を剥がす可能性あり。実投稿で再現確認するまで「画像 + 通常リンクテキスト」の代替フォーマットも用意しておく。

## 効果計測

- **moshimo 管理画面**: クリック数・成約数・否認率
- **GA4**: 外部リンククリックイベント（`/blog/koumuin-claude-code-estat-automation` から `af.moshimo.com` への遷移）
- **判定期日**: 2026-06-20（公開 1 ヶ月後）
- **撤退基準**: 1 ヶ月 CV 0 件 → 配置記事の差し替え検討
