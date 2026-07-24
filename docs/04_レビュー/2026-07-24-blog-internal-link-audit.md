---
type: critical-review
date: 2026-07-24
status: completed
target_metric: blog-internal-linking
tags: [blog, internal-link, soft-404, quality-gate, isr]
---

# ブログ内部リンクのリンク切れ監査と機械検査の恒久化

## きっかけ

`/blog/black-tea-income-gap` のリンクカード是正 (`2026-07-24-blog-source-link-audit.md`) の直後、
オーナーから「リンク先に辿り着けない場合 (404) がある。機械的に一律でチェックできないか。
トークンは消費したくない」との指摘。

## 最大の発見: 壊れリンクの大半は HTTP 200 を返す

`/ranking/<存在しないkey>` は 404 ではなく **HTTP 200 + タイトルだけ「ランキングが見つかりません」**
を返す (soft 404)。実測で確認:

```
$ curl -o /dev/null -w '%{http_code}' https://stats47.jp/ranking/definitely-not-a-real-key-xyz
200
$ curl -s https://stats47.jp/ranking/definitely-not-a-real-key-xyz | grep -o '<title>[^<]*</title>'
<title>ランキングが見つかりません | 統計で見る都道府県</title>
```

したがって **HTTP ステータスを見る監視は無力**。判定は「実在集合との突合」か「タイトルの内容」で
行う必要がある。これは `nextjs-ssg-preservation.md` の prerender-notfound 検知と同じ性質で、
同じ流儀 (status ではなく `<title>`) を踏襲した。

ルート種別ごとの挙動も揃っていない:

| URL | 存在しないとき |
|---|---|
| `/ranking/<key>` | **200** + 「ランキングが見つかりません」 |
| `/blog/<slug>` | **200** + 「記事が見つかりません」 |
| `/tag/<key>` `/themes/<slug>` `/areas/<code>` | 410 (middleware) |
| `/survey/<key>` | 404 |

## 影響範囲 (公開 419 記事を live 実測)

内部リンク 延べ 2,573 本 / ユニーク 820 件のうち **49 件が到達不能**。

| 種別 | ユニーク | 壊れ | 内訳 |
|---|---:|---:|---|
| `/ranking/` | 561 | 36 | soft 404 29 + 410 Gone 7 |
| `/blog/` | 181 | 8 | published:false 5 / all.json 不在 2 / GONE 1 |
| `/category/` | 20 | 3 | 17 軸に無いキー (`transport` `living` `lifefoodclothing`) |
| `/themes/` | 11 | 2 | 実在しない slug (`landform-climate` `miningindustry`) |
| `/areas/` | 47 | 0 | — |

### 既存の検査がすり抜けた理由

1. **内部リンクの実在を見る検査が存在しなかった** (配置の検査しかなかった)。
2. 既存の抽出処理が **絶対 URL (`https://stats47.jp/ranking/...`) を内部リンクとして数えていなかった**。
   実測 135 本が不可視だった。`quality-gate.mjs` の `internalLinks` カウントも同じ取りこぼしをしていた。

## 対応

### 1. 二層の機械検査 (LLM 不使用・API 課金ゼロ)

| 層 | 実装 | 発火 | 判定できるもの |
|---|---|---|---|
| ① オフライン | `.claude/scripts/lib/internal-link-lint.mjs` | pre-commit / 公開 CI (`quality-gate.mjs`) / 日次是正キュー (`audit-published-blog.mjs`) / バッチ (`audit-article-structure.mjs`) | repo 内に集合がある型。ranking (GONE / KNOWN∪config 外) / category / areas / themes / blog (GONE・呼び元が公開 slug 集合を渡した場合) |
| ② live 実測 | `.claude/scripts/blog/audit-internal-links.mjs` (`internal-link-audit-weekly.yml`、日曜 04:00 JST) | 週次 cron。壊れがあれば `link-alert` Issue | 全種別。①が確定できない壊れ方 |

**①の精度**: live 実測 49 件に対し**誤検知 0・見逃し 0**。検査器自体の検証として、是正前の記事で
4 種の検査が実際に発火すること、正常リンクでは発火しないことを個別に確認した。

**②が要る理由**: `fiscal-strength-index` は metric config も KNOWN_RANKING_KEYS もあるのに
R2 データが無く soft 404 になる。集合判定では原理的に検出できない。

### 2. 記事の一括是正 (47 記事 65 箇所)

`fix-broken-internal-links.mjs` + 置換表 `broken-link-remap.json` で決定的に変換。散文は無変更。

- **remap 50 箇所** — アンカーテキストの指す指標が実在 metric の title と一致する場合のみ
  (例: `/ranking/health-life-expectancy-male` → `healthy-life-expectancy-male`「健康寿命（男性）」)
- **unlink 15 箇所** — 意味の合う実在ページが無い場合 (待機児童・アルコール総消費量・
  機械器具の業種別出荷額など)。アンカーテキストは残しリンクだけ外す。誤った行き先へ飛ばさない
- `あわせて見る:` 行のリンクが全て消えた場合は行ごと削除、一部だけ残る場合は生存分を繋ぎ直す

**`--apply` は置換先を live 実測し、1 つでも到達不能なら中断する。**この検証が当初案の
`fiscal-strength-index` を実際に弾いた (新たなリンク切れを作れない構造)。

### 3. 検証

- リンク切れ blocker 60 → 0 (47 記事)
- 非退行: H2 差 0 / callout 差 0 / 図差 0 / 3 連改行の増加 0 / source-link 配置 blocker 0 → 0
- 置換先 29 件すべて live 到達可能
- `quality-gate.mjs` を実記事で before/after 実行し、リンク blocker 5 → 0
- R2 push 47/47 (put 後に GET で内容一致を検証)

## 副次発見

### A. 3 連改行の扱いは「削除跡だけ局所的に詰める」

一括変換で `\n{3,}` を全体置換すると、**元から 3 連改行を持つ記事 9 件**の無関係な箇所を壊す。
削除跡に番兵を置き、その周囲だけを畳む方式に変更した。

### B. 301 リダイレクトを壊れと誤判定しかけた

`/blog/prefectural-income-ranking` は `blog-redirects.ts` により 301 → 200 に着地する正常なリンクだが、
公開 slug 集合に無いため offline lint が blocker にした。live 実測が正しく offline が誤っていたので
lint 側に `BLOG_REDIRECTS` を追加した。**live 実測を持っていなければ誤検知に気づけなかった**。

### C. published:false の記事へのリンクが 8 件

`2026-07-24-blog-source-link-audit.md` §副次発見 C で挙げた「非公開記事が all.json に混在」問題の
実害。公開記事から未公開記事へリンクが張られ、読者は「記事が見つかりません」に着地していた。
本監査では unlink で対処したが、all.json 側の整理は別途必要 (`docs/todo/02_機能バックログ.md`)。

## 関連

- 前段の監査: `docs/04_レビュー/2026-07-24-blog-source-link-audit.md`
- 規約: `.claude/rules/blog-quality-standards.md` §内部リンクの実在
- prerender の反映制約: `.claude/rules/nextjs-ssg-preservation.md`
- PR: [#622](https://github.com/uruhayato373/stats47/pull/622)
