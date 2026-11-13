---
name: release-squash-skip-token
description: develop→main を squash でマージすると、取り込んだ CI 記録コミットの skip-ci 印が本文に入り、本番デプロイが起動しない
metadata:
  type: feedback
---

develop→main の PR を squash (auto-merge の既定) でマージすると、GitHub が作るコミット本文に取り込んだコミットの件名が並ぶ。
CI の書き戻しコミット (キーワード観測の記録など) の skip-ci 印がそこに入ると、main への push の workflow が 1 本も作られず、`deploy-workers.yml` も動かない。

**Why:** 2026-11-13 の PR #1257 で起きた。マージは成功表示なので気づきにくい。`.husky/commit-msg` の検査はローカルのコミットしか見ない。

**How to apply:** release のマージ後は `gh run list --workflow deploy-workers.yml --branch main --limit 1` で run ができたかを必ず確かめる。無ければ `OWNER_APPROVED_RELEASE=1 gh workflow run deploy-workers.yml --ref main` で手動起動する (手動は常にデプロイする)。恒久対策はカード RELEASE-SQUASH-SKIP-TOKEN-01。関連: [[no-deploy-per-iteration]]
