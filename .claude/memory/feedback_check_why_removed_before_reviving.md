---
name: feedback_check_why_removed_before_reviving
description: 意図的に削除されたコードを復活させる前に「なぜ削除されたか」を git log/docs で確認する。確認せず ranking-download bake を復活させ、Phase6 が削除した理由(R2肥大化)で 45分 timeout・実機失敗した (2026-06-01)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 4d930b3a-9dfc-4616-8afd-8dd5bbb85bc1
---

意図的に削除された機能・exporter・テーブル等を「復活」させる前に、**まず削除理由を git log / docs / コメントで確認する**こと。

**Why:** 2026-06-01、code-review #1 (download API 404) を「CI 事前 bake」で直そうとし、Phase 6 で削除済みの `ranking-download-snapshots` exporter を復活させた。tsc も単一 key 実機テストも通ったが、**全 2,169 metric を CI で bake したら 23K+ ファイル / 1GB超 / 45分 timeout** で何も push されず失敗。これは **Phase 6 がまさにこの exporter を削除した理由 (R2 肥大化)** そのものだった。削除理由を先に確認していれば、最初から「オンザフライ生成」を選べた (やり直しで 1 デプロイ+検証サイクルを浪費)。

**How to apply:**
- 削除済みファイルを復活/再導入する前に `git log --all --oneline -- <path>` と削除コミットの本文、関連 docs (例: Phase log) を読む。
- スケール前提 (全 metric / 全県 / 全年) の処理は、単一サンプルの成功だけで OK としない。総量 (ファイル数・MB・所要時間) を見積もる。
- 関連: download は on-the-fly に確定 [[project_ranking_download_onthefly]]。

**付随知見 (sync-snapshots の設計脆弱性):** `.claude/skills/db/sync-snapshots/run.sh` は全 task を `.local/r2` に生成してから**最後に一括 diff-push** する。そのため重い/失敗する task が 1 個でも timeout すると **push 段に到達せず全 task の成果がロスト**する (今回 ranking-download で発生)。重い task を既定 TASKS に足さない / task 単位 push を検討する余地あり (automation-backlog 候補)。
