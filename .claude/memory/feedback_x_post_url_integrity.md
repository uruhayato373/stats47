---
name: feedback_x_post_url_integrity
description: Xのposted判定は予約時刻や旧台帳日付で推定せず、自アカウントのstatus URLと本文一致を証拠にする
type: feedback
---

**問題**: 2026-09-04 の全件監査で、X の active な `status=posted` 163件中43件に `post_url` が無かった。台帳日付で検索すると実投稿を見落とし、存在しない投稿を posted と扱う状態が混在していた。

**原因**: 旧 D1 から `posts.json` への移行データに、媒体横断の完了フラグだけで `posted` になった空レコードが含まれていた。また予約時刻経過だけの昇格と、即時投稿後に実URLを回収しない更新経路があった。旧 `posted_at` は実投稿日時と一致しないため照合キーに使えない。

**対策**: `.claude/scripts/lib/sns-posts-store.cjs` で active な X `posted` に `https://x.com/<handle>/status/<digits>` 形式を必須化する。`.claude/skills/sns/publish-x/publish-x.ts` は即時投稿後に自プロフィールの直近投稿を本文+時刻で照合して実URLを取得できた場合だけ `posted` を保存し、予約は常に `scheduled` のまま保持する。履歴補正では認証済み自プロフィール全履歴と直接URLを確認し、tweet ID の snowflake 時刻を正とする。

**証拠**: 2026-09-04 に `@stats47jp373` の409件をPlaywrightで取得し、10件を実URLへ補完、実体なし・別レコード重複の33件を無効化した。補正後は active X `posted` 130/130件が有効なstatus URLを持ち、129件は取得履歴、履歴範囲外1件は直接URLで公開中を確認した。回帰テストは `.claude/scripts/lib/__tests__/sns-posts-store.test.cjs` と `.claude/scripts/sns/__tests__/promote-scheduled-x.test.cjs`。
