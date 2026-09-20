---
name: project_note_attachment_upload_limits
description: note.com の添付ファイルは 1 日 10 回までしかアップロードできない (画像は別枠)。有料記事の本文差し替えで添付を再アップロードする flow は dry run を繰り返せない。ins_file の anchor は UL 直後に置けない・file input は画像 input と区別する
metadata: 
  node_type: memory
  type: project
  originSessionId: 904a259f-b16f-4036-a557-45937f796fee
  modified: 2026-09-20T03:13:12.898Z
---

**問題** (2026-09-20): 有料データセット記事 `d-kakei-category-dataset` (na416c57e461c) の本文差し替え
(`publish-kakei-paid-update.sh`) を STOP_BEFORE_COMMIT で 6 回試したところ、6 回目で添付 CSV が一切
figure にならなかった。fetch/XHR を hook して実 API 応答を取ると
`POST https://note.com/api/v2/attachments/upload` → 500 `{"data":{"error":"1日にアップロードできるのは10回までです"}}`。

**原因**: note は添付ファイルの upload を **アカウント単位で 1 日 10 回**に制限している。画像 upload は別 endpoint で
同時刻でも通った (別枠)。1 回の実行で 3 ファイル分を消費するので、中断や dry run を繰り返すと当日枠が尽きる。
中断した run は **添付 0 件の下書き (has_draft=true)** を残し、`edit?draft_reedit=true` は次回その下書きを開く。

**How to apply**:
- 添付を再アップロードする flow は「更新する」まで **1 回で通す**。ゲートは全部スクリプト内 (構造ダンプ・順序・
  有料ライン・価格・API/非ログイン HTML) に置き、目視は screenshot 事後確認にする。
- 「アップロードできたか」は state の文字列一致で判定しない (本文にファイル名が書いてあると常に当たる)。
  `figure[embedded-service=attachment]` にファイル名 + 容量 (KB/MB) が出るまで待つ。
- `ins_file` の anchor は **UL の直前の段落に置かない**。note の `<li>` は内側に `<p id=>` を持つので awk の
  「次の `<p id=`」がリスト内を指し、UL が分割される。anchor → target の 2 段落を並べ、その間に挿す。
  2 件目以降は anchor 直後に入る (2026-09-20 の 3 回目 dry run で timeseries→json→csv の逆順を実測)。
  **[仮説]** リスト順に並べたいなら逆順で挿す — 枠切れで end-to-end 未確認。`publish-kakei-paid-update.sh` の
  順序ゲートが次回実行時に判定する (外れたら順序ゲートを直す)。
- `Home` キーは折り返し行頭へ飛び長い段落を割る。ins_img と同じ Range で段落先頭へ置く (2026-09-20 に ins_file を修正)。
- 同一セッションで画像を挿した後は `input type=file` が複数あり得る。画像 input (`note-editor-image-upload-input`) を除いて選ぶ。

**関連**: [[project_note_update_mode_learnings]] [[project_note_ins_img_heading_placement_bug]]
backlog `[NOTE-KAKEI-DATASET-PAID-UPDATE-01]` (枠明けに 1 回実行)。

**再発防止 (2026-09-20 同日)**: 有料記事の無料部分の着地検査 `paid_*` を `audit-note-circulation.mjs` に追加し、週次
`note-circulation-audit-weekly.yml` の gate に `paidLandingErrors` を足した。¥1,000 以上は error、それ未満は出典のみ error。
同じ監査で **a-kakei 47 本の catalog `stats47Targets` が 09-15 の本文テンプレ改訂から乖離**していた (47 error) のを見つけ、
draft の実リンクから同期した。footer は「もう一歩深掘りする」ラベルで冪等化 (views で次の 1 本が変わると 2 枚目を積んでいた)。
