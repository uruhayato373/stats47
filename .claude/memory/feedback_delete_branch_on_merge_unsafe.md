---
name: feedback_delete_branch_on_merge_unsafe
description: develop は保護なし (2026-11-04 実測)。GitHub のマージ後の自動削除をオンにすると develop→main のマージで develop が消える
metadata:
  type: feedback
---

リポジトリ設定 `delete_branch_on_merge` をオンにしない。

**Why:** `gh api repos/.../branches/develop` は protected=false で、head ブランチの develop が削除対象になる。

**How to apply:** 余分なブランチは自動処理の側を減らして防ぐ (2026-11-04 にキー同期と SEO 提案を develop への直接記録にした)。
