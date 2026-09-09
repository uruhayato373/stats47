# リポジトリ走査が worktree の残骸まで拾う場合

**トリガー**: scripts 等の全件監査が `.claude/worktrees/<別checkout>/...` を現在のプロジェクトの検査漏れとして報告する。
**対処**: tracked paths とディレクトリ内容を照合し、別checkoutであることを確認する。走査は現在のcheckoutに限定し、管理用worktrees領域と入れ子のGit境界を除外する。通常の入れ子scriptsを拾い、`.git` の無いworktree残骸を拾わない両方のfixtureを追加する。ユーザーの残骸フォルダは削除しない。
**根拠**: 2026-09-08の型検査被覆テストで再現。`.git` の存在だけで判別する最初の対処では、既にGitメタデータが無い部分残存checkoutを除外できず、同じ誤検出が再発した。
**確信度**: 0.6
**発見日**: 2026-09-08
**関連**: `.claude/scripts/lib/__tests__/scripts-type-check-coverage.test.cjs`
