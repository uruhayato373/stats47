---
slug: table-salt-consumption-quantity-prefecture-gap
reviewer: blog-critic
mode: delta
verdict: PASS
date: 2026-09-02
---

## 評価サマリ

前回レビューで指摘した blocker（家計調査の都道府県別値が「都道府県庁所在市・二人以上世帯」の平均であり県内全域の値ではないことが未記載）は、冒頭 NOTE callout への一文追記で解消を確認した。文言は「また、家計調査の都道府県別の値は都道府県庁所在市に住む二人以上の世帯の平均であり、県内全域の平均ではない点にも注意してください。」で、既存の食塩摂取量との違いの注記に自然に続いており、読み違い防止の知識として機能している。他の変更差分は無く、数値・地方区分・因果関係の断定回避（[仮説]タグ）も前回審査時のまま維持されている。

## 指摘

- [MAJOR] しょうゆ・みそのランキングへの直リンクが無く、「## 関連する調味料との関係を考える」節の誘導がテキストのみで終わっている（`/category/economy` への誘導はあるが個別ランキングへの source-link は無し）。ただし article.prompt.txt がリンク許可範囲を `/ranking/table-salt-consumption-quantity` と `/areas/*` 2件、`/category/economy` に限定しており、これは記事生成時点の制約であって今回の delta 修正対象外。将来 brushup 時にしょうゆ・みそのランキングキーが実在すれば source-link 追加を検討する。

## 判定理由

前回の唯一の BLOCK 指摘（家計調査の地理粒度に関する読み違い防止注記の欠落）が、指定どおり NOTE callout への一文追記で解消されたことを本文の該当箇所で直接確認した。変更 hunk（NOTE callout）以外の本文・数値・チャート参照・内部リンクは前回審査時から変更されておらず、再検査の必要はない。残る MAJOR 指摘は記事生成プロンプトの制約に起因するものであり、BLOCK 相当ではないため verdict は PASS とする。
