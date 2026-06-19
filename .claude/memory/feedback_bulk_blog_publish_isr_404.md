---
name: blog-isr-404
description: sync-snapshots --only blog で複数記事を同時 push すると、blog/all.json が article.md より先に R2 到達し ISR が 404 をキャッシュする
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4ac60d36-9984-4c4c-b98d-4a662dfb79d4
---

複数のブログ記事を一括 publish するときの再発リスク。

**現象**: D1 INSERT 完了後 `/sync-snapshots --only blog` を実行 → 5 件のうち 2-3 件は本番で「記事が見つかりません」(タイトル) が表示される。R2 にもファイルは存在し、blog/all.json にも含まれているのに 404 が返る。

**Why**:
- sync-snapshots は **blog/all.json を article.md より先に push** する順序になっている
- Next.js ISR は all.json を読んで article 一覧を取得 → 各 article.md を fetch
- もし fetch 時点で article.md がまだ R2 に到達していなければ 404 を返す
- ISR は **その 404 もキャッシュ** する (revalidate 期間 = 60s 〜 数分)
- 一度キャッシュされると次の revalidate トリガーまで「記事が見つかりません」が出続ける

**How to apply**:
- 連続 curl 3-5 回で revalidate がトリガーされて復活するケースが多い (1 回目で background revalidate 開始、2-3 回目で新版が返る)
- **復活しないケースは Cloudflare CDN edge cache レベルで stuck** している可能性高。Cloudflare ダッシュボード手動パージで解消 (token に Cache Purge 権限なし → `/purge-cdn` 自動実行不可、[[project_cloudflare_token_consolidated]] 参照)
- 量産フローの改善案: sync-snapshots の article.md → blog/all.json の push 順序を逆にする、もしくは article.md 完了を待ってから all.json を push する設計に変える
- 一括量産前に「公開直前は 1 記事ずつ確認」を挟む方が安全

**観測した実例 (2026-05-17)**: 5 本同時 publish で `prefectural-height-male-female-gap` `self-financing-ratio-prefecture-gap` の 2 件が 404 キャッシュ。連続 curl で前者は 3-5 回で復活、後者は手動 CDN パージが必要だった。
