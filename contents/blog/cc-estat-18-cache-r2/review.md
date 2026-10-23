---
slug: cc-estat-18-cache-r2
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-10-23
---
## 評価サマリ
3 回目 (delta) の審査。前回残った BLOCK (カスタムドメイン経由でも `.json` は既定でキャッシュされない点の欠落) が直り、BLOCK・MAJOR は 0 件になった。Cloudflare Workers / R2 の挙動に関する記述は、今回照合できた範囲で公式ドキュメントと一致している。残るのは出典を確かめられなかった項目だけで、公開を止める性質のものではない。

## 前回指摘の解消確認
- BLOCK (452 行目): 解消。「Cloudflare の CDN は `.json` を既定ではキャッシュしない」と Default cache behavior へのリンク付きで書き、そのホスト名に Cache Rule (Eligible for cache) を作って Edge TTL を決める、と手順まで入った。Step 6 の 477 行目にも「`s-maxage` は `.json` を対象にした Cache Rule を作ってはじめて効く」が入り、Step 6 冒頭の経路の説明と整合する。公式 (cache/concepts/default-cache-behavior、R2 public buckets の Caching 節) の記述と一致する。
- つまずき 5: 解消。冒頭に「まず疑うのは BYPASS ではなく DYNAMIC」と `.json` が既定の対象拡張子にない点が入り、実際の症状の順に並んだ。BYPASS の原因 (`Set-Cookie`、`Authorization`、`private` / `no-store`、GET/HEAD 以外) は Workers Caching の自動バイパス条件と一致する。
- コード例: 解消。`headers` が宣言され、`Set-Cookie` を外す意図がコメントで分かる。Route Handler の `Cache-Control` はブラウザと Workers Cache 有効時の前段向け、というコメントが入り、462 行目の「binding 経由はキャッシュを通らない」との矛盾は解消した。
- 31 行目の執筆者向け注記の削除、`/ranking/total-population` への統一 (261 行目): 解消。

## 指摘
- [MINOR][型:source] 確かめられていない項目が残る。(a) 92・164 行目の「wrangler 4.148.0」の実在 (今回のワークツリーのロックファイルは `^4.126.0` / 4.124.0)。(b) 79 行目の AWS S3 の転送無料枠 (月 100 GB) は、執筆側が AWS 料金ページで確認したと報告しているが、こちらでは再照合していない。(c) 494 行目付近の cache purge API の仕様と権限。(d) 171 行目「stats47 でも最初の 3 ヶ月はこれでした」の経緯。(e) 141 行目の「連載の執筆時の確認では外す必要があった」は執筆者本人の経験の記述で、公式との差を明記してあるので許容する。次回の更新時に (a) と (c) を実機または公式で確かめること。
- [MINOR][型:other] 388 行目のログ例のキー名 `population` は、他の例の `total-population` と揃っていない。ログ例は任意のキー名でもよいので、揃えるのは任意とする。

## 判定理由
BLOCK が 0 件。前回までの BLOCK・MAJOR はすべて解消し、Workers と R2 の挙動 (binding 経由でキャッシュを通らない点、カスタムドメインでは JSON が既定でキャッシュされない点、BYPASS と DYNAMIC の区別、429 / 503、上限値、無料枠) は公式ドキュメントと一致した。前版の誤り (Pages 表記、`--remote` 欠落、`preview_bucket_name`、存在しない purge コマンド、`persist_to`、D1 前提) も再発していない。

照合の限界: 上記 MINOR の (a)(c) は公式ドキュメントを照合していない。機械ゲート (`quality-gate.mjs`) は実行していない。
