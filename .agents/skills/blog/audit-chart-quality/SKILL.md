---
name: audit-chart-quality
description: 全ブログ記事のチャート SVG 品質 (dark mode 対応・構造・パレット) を一括監査し、優先度付きレポート + state JSON を生成する。Use when user says "チャート監査", "SVG 品質チェック", "audit charts".
argument-hint: [--base <dir>]
disable-model-invocation: true
primary_agent: chart-author
---

全ブログ記事のチャート SVG 品質を決定的に一括監査するスキル。`/generate-article-charts --validate` を全記事スケールに拡張したもの。

## 役割と非役割

- **やること**: 検出 (lint) のみ。どの記事のチャートを直すべきかを優先度付きで定量化
- **やらないこと**: 再生成。既存公開記事の元データ (`data/*.json`) は publish 後に削除されるため、決定的な一括再生成は不可。再生成は **brushup サイクル** (`/brushup-blog --target batch`、data 再取得を伴う) に委ねる

設計根拠: AGENTS.md 原則 5「決定的な判定はコードで処理」。lint は `.Codex/scripts/lib/svg-lint.mjs` を `/generate-article-charts` と共有。

## 検査内容 (記事ごと)

`<base>/<slug>/data/*.svg` (生成物) と `article.md` のインライン `<svg>` (手書き) の両方:

| レベル | 項目 |
|---|---|
| ERROR | viewBox / width / height / 閉じタグ欠落 (描画が壊れる) |
| WARN | dark mode 非対応 (`@media (prefers-color-scheme:dark)` 欠落) |
| WARN | theme 依存色 (`#fff`/`#333`/`#6b7280`/`#e5e7eb` 等) の inline 直書き |

## 手順

### 1. R2 を pull (本番記事を監査する場合)

```bash
# ブログ記事を .local/r2/app/blog に取得 (R2 認証が必要なローカル環境のみ)
npx tsx packages/r2-storage/src/scripts/sync-download.ts --prefix blog
```

> ドラフトのみ監査する場合は pull 不要 (`--base docs/21_ブログ記事原稿`)。

### 2. 監査実行

```bash
# 本番記事 (R2 pull 済み)
node .Codex/scripts/blog/audit-chart-quality.mjs

# ドラフト
node .Codex/scripts/blog/audit-chart-quality.mjs --base docs/21_ブログ記事原稿
```

出力:
- 人間向け: 優先度順サマリ (errors → dark mode 非対応 → theme 色 inline)
- 機械向け: `.Codex/state/blog/chart-audit.json` (常に保存)

exit code: 構造 ERROR がある記事が 1 件でもあれば 3、なければ 0。

### 3. brushup への連携 (a+b の閉ループ)

`audit-chart-quality` が生成した `chart-audit.json` を `select-brushup-candidates.mjs` が
読み込み、各 candidate に `chartIssues` を付与する。GSC の改善余地スコア (expectedLift) を
主ソートに保ちつつ、**同点時はチャート問題が多い記事を優先**する。

→ `/brushup-blog --target batch` が該当記事を rewrite する際、data を再取得して svg-builder で
チャートを再生成することで dark mode 非対応・数値捏造を同時に解消する。

## 監査 → 修正 の流れ (全体像)

```
/audit-chart-quality        → chart-audit.json (検出・優先度付け)  [このスキル]
        ↓
select-brushup-candidates   → chartIssues を candidate に付与       [既存スクリプト拡張]
        ↓
/brushup-blog --target batch → data 再取得 + svg-builder で再生成    [既存スキル]
        ↓
/generate-article-charts --validate → 再生成後の品質を最終確認        [既存スキル]
```

## 関連

- lint 本体: `.Codex/scripts/lib/svg-lint.mjs`
- 監査スクリプト: `.Codex/scripts/blog/audit-chart-quality.mjs`
- 描画 (決定的): `packages/svg-builder/`
- 単一記事検証: `/generate-article-charts --validate`
- 再生成サイクル: `/brushup-blog --target batch`
- 候補選定: `.Codex/scripts/blog/select-brushup-candidates.mjs`
