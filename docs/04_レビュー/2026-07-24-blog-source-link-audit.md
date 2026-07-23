---
type: critical-review
date: 2026-07-24
status: completed
target_metric: blog-internal-linking
tags: [blog, source-link, quality-gate, isr]
---

# ブログ source-link 配置の一括是正 (162 記事)

## きっかけ

`https://stats47.jp/blog/black-tea-income-gap` で「関係のないランキングへのリンク」がカード形式で
3 連続表示されている、というオーナー報告。

## 原因

ページ側の自動挿入ではなく、**記事 markdown 自体**にカードが 3 連続で書かれていた
(「## 地理でみる紅茶消費」節の末尾)。リンク先は 5 件とも実在し HTTP 200・ラベルとタイトルも一致
していたので、壊れたリンクではなく**配置の問題**だった。

1. 直上の図 (紅茶マップ) と 1 対 1 で対応していない。緑茶・コーヒーには対応する図が無い。
2. 紅茶消費支出額へのカードは記事内 2 回目 (前の節と重複)。
3. このページには `RelatedRankingsSection` (タグ駆動の関連ランキング) が描画されておらず、本文内
   カードが唯一のランキング導線になっていてクラスタが目立っていた (→ 別課題・後述)。

### なぜ機械チェックをすり抜けたか

`lintSourceLinkPlacement` は「**末尾ゾーン** (## まとめ以降 or 本文末尾 25%) に 2 個以上」しか見ておらず、
本文中盤のクラスタ・重複・図なし節への配置は検査範囲外だった (当該記事は warning 0 で通過)。しかも
warning 扱いで公開をブロックしない。ルール (`blog-quality-standards.md`) 側も「末尾集約」しか禁じて
おらず、記事を書いた agent はルールの字面には違反していない状態だった。

## 影響範囲 (公開 419 記事を R2 から実測)

| 指標 | 実測 |
|---|---|
| `/ranking/` カードを持つ記事 | 391 記事 / カード総数 926 本 |
| 同一ランキングへの重複カード | 88 記事 |
| 隣接クラスタ (カード連続 2 枚以上) | 31 記事 |
| 図の無い H2 節のカード | 100 記事 |
| 末尾集約 (既存 lint が捕まえていた分) | 15 記事 |
| **いずれか該当** | **162 記事 (39%)** |

既存 lint が検知できたのは 15 記事のみで、147 記事を取りこぼしていた。

## 対応

### 1. 決定的な一括変換 (散文は一切変更しない)

`.claude/scripts/blog/fix-source-link-placement.mjs` を新設し、以下を機械適用した。

- **R1 重複除去**: 同一 `/ranking/<key>` カードの 2 回目以降を削除 (102 本)
- **R2 図なし節**: 図が 0 枚の H2 節のカードをインラインテキストリンクへ格下げ (117 本)
- **R3 クラスタ解消**: 隣接カードが 2 枚以上残る場合、図の alt / 見出しの指標名と照合して 1 枚だけ
  カードで残し、残りを格下げ (50 本)

格下げは削除ではなく、節ごとに 1 行へ集約する
(`あわせて見る: [A ランキング](/ranking/a) / [B ランキング](/ranking/b)`)。markdown リンクは
`quality-gate.mjs` の internalLinks に数えられるため回遊導線は減らない (実測 +165 本)。

照合は英語 key のパス一致だけだと誤判定する (「black-tea」の図に green-tea が "tea" で一致して
しまう) ため、**指標名 (日本語 title) が図の alt / 見出しに出るか**を最強シグナルにし、パス一致は
「同じ節の他 key と共有しない識別語がすべて出る」場合のみ次点で採用した。

結果: **162 記事を変換**し、R2 `app/blog/<slug>/article.md` へ push (put 後に GET で内容一致を検証)。

### 2. lint 拡張 (再発防止)

`.claude/scripts/lib/article-structure-lint.mjs` に 4 検査を追加し、すべて **blocker** にした。

| 検査 | 内容 |
|---|---|
| `dup-ranking-link` | 同一ランキングのカードが 2 枚以上 |
| `adjacent-cluster` | カードが空白のみ挟んで 2 枚以上連続 |
| `no-figure-section` | 図が 0 枚の H2 節にカードがある |
| `tail-cluster` | 末尾集約 (旧 warning から昇格) |
| `offtopic-link` | 指標名が節の本文に出てこない (warning のみ・表記ゆれで誤検知しうる) |

配線先は既存の 3 消費者のみ (追加配線なし): `quality-gate.mjs` (pre-commit + `publish-blog.yml` で
公開前ブロック) / `audit-article-structure.mjs` / `audit-published-blog.mjs`。
`audit-published-blog.mjs` が持っていた末尾集約の独自コピーは共有 lib に寄せた (ドリフト防止)。

### 3. 検証

- 変換前後で lint: **source-link blocker 234 → 0** (162 記事)。offtopic warning 113 → 51。
- 全 419 記事を変換後の状態で走査して blocker 0 (残 5 件は `published:false` の非公開記事)。
- 非退行: callout 数・H2 数・図数の差分 0、3 連改行の増加 0、markdown 内部リンク +165、
  prose 字数 +34 字/記事程度 (「あわせて見る:」行のみ)。
- 目視 diff: `black-tea-income-gap` (報告例) / `livable-prefecture-composite-ranking` (最悪 16 本・
  重複 8) / `food-culture-prefecture-map` / `expenditure-structure-comparison` / `birth-death-gap-decline`。

## 副次発見

### A. prerender 済みページの更新には再デプロイが要る (★重要)

R2 の `article.md` を更新しても本番の記事ページは**変わらない**ことを実測した。

| 試したこと | 結果 |
|---|---|
| R2 の article.md を上書き (GET で内容一致まで確認) | live は旧内容 |
| `?cb=<random>` で CDN を迂回し Worker に直接 | 旧内容 (`x-nextjs-prerender: 1` / `x-nextjs-stale-time: 4294967294`) |
| OpenNext incremental cache エントリを削除 | 旧内容のまま。エントリの再生成すら起きない |

`blog/[slug]` は `generateStaticParams` を持つ `● SSG` で、ビルド時に焼かれた HTML が配信され続ける。
**反映手段は再デプロイのみ**。新規公開の記事はビルド時のパラメータに含まれないため on-demand で
描画され R2 push だけで出る (だから `blog-auto-publish.yml` は成立している) が、**既存記事の改稿は
デプロイしないと出ない**。この制約はブログ是正ループ全体に効くため
`.claude/rules/nextjs-ssg-preservation.md` に記録した。ISR エントリ削除の道具として
`packages/r2-storage/src/scripts/purge-isr-routes.ts` を新設した (`ƒ` ページには有効)。

### B. タグ駆動の「関連ランキング」が全記事で非表示

`RelatedRankingsSection` は記事の tag → `readRankingItemsByTagFromR2` で関連ランキングを出すが、
metric config 2,295 件のうち `tags` を持つものが **0 件**のため、`RankingItem.tags` が常に空配列で
セクションが `null` を返している。ブログ → ランキングの回遊導線が本文内リンクだけになっている。
→ `docs/todo/02_機能バックログ.md` に起票。

### C. 非公開記事が公開一覧に混在

`app/blog/all.json` に `published:false` のエントリが 11 件あり、うち 6 件は R2 に `article.md`
自体が無い (旧 mdx)。ページは HTTP 200 で「記事が見つかりません」を返す soft 404 状態。
本件では対象外としたが、GSC カバレッジ観点では別途整理が要る。

### D. incremental cache に旧ビルドの残骸が 59 世代分

`incremental-cache/<buildId>/` が 59 プレフィックス積み上がっている (デプロイのたびに増える)。
R2 課金 (現在 20GB 超で課金中) の観点で棚卸し候補。

## 残タスク

- 本番反映のための再デプロイ (オーナー判断)
- `offtopic-link` warning が残る **110 記事**: 指標名がその節の本文に出てこないカードで、本文で
  触れていないランキングへ誘導している疑い (是正前は 172 記事)。表記ゆれによる誤検知を含むため
  機械では確定できず、brushup サイクルで意味判断する。
