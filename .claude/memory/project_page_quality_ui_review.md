---
name: project-page-quality-ui-review
description: 週次ページ品質監査は全URL静的+代表URL7幅スクショ+Claude確認。生データはR2 state/page-quality/ (git禁止)。SNS予約画像はMac launchdで週次確認
metadata:
  node_type: memory
  type: project
  originSessionId: b0488360-947c-4d7f-8e04-76eb2f53fa97
  modified: 2026-09-23T13:49:21.060Z
---

週次ページ品質監査 (`page-quality-audit-weekly.yml`、土 18:00 UTC) は 2026-09-23 に初めて最後まで完了した。
それ以前は RSC 込み並列 4 で 45 分制限に毎回打ち切られていた (1,200/6,237 URL で止まる)。

- 全 URL: 静的解析 (`--skip-rsc`・並列 12) + 画像切れ + 空見出し。代表 URL 11 件だけブラウザで 7 幅
  (390/640/768/992/1024/1440/1920) を撮影し、幅ごとの崩れ・先週比の変化を測る。Claude は 3 幅だけ確認。
- **生データは R2 `state/page-quality/` に置き git に入れない。** 初回完了時に 10MB の latest.json と同内容の
  snapshot が git に書き戻され、リポジトリ衛生の 1MB 上限を超えた。ローカルは `npm run state:pull -- page-quality`。
- 通知: 新しい UI 違反と agent 指摘 → `ui-review-alert` Issue、肥大化/重複 error → `page-quality-alert` Issue。
- SNS 予約画像の週次確認は **CI ではなく Mac の launchd** (`com.stats47.sns-image-review`、日曜 07:30)。
  X/Threads の画像は `.local/r2/sns/` にしか無い (R2 に上がっているのは Instagram だけ) ため。

**Why:** agent の確認は機械検査で拾えない実害を初回から見つけた (CARTO 地図タイルの「API KEY REQUIRED」透かし、
/geo の地図プレビュー全欠落、見出しの漢字が潰れた予約中 IG カルーセル)。一方で指摘には外れもあり得るので、
Issue は人が判断してバックログへ落とす運用。IG の件は原因を二度取り違えた: 「疑似太字の修正前に上げた古い画像」と判断したが、修正後のコードで再レンダーすると
R2 とバイト一致し、Google Fonts 単体の描画とも同じ形だった (書体 Dela Gothic One の字形そのもの)。
2026-09-24 に見出しを M PLUS 1p 900 へ替えて全予約カルーセルを差し替えた。コミット時刻は rebase で書き換わるので
「修正より前に上げた」を commit date で判断しない (author date と、現行コードでの再レンダー結果を比べる)。

**How to apply:** テンプレートや共通レイアウトを直したら、予約中の SNS 素材の再レンダーも同時に考える
(共通の見出し書体を替えたら、予約済みの全カルーセルを再レンダーして R2 を差し替える)。page-quality の結果を git に書く経路を増やさない。
関連: [[feedback-mutation-test-passes-wrongly]]
