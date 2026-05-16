# スキル利用コードの配置原則

**スキル（SKILL.md）から呼ばれるユーティリティ・ヘルパースクリプトは `.claude/` 配下に置く**。`scripts/` 直下には置かない。

## 配置ルール

| 対象 | 置き場所 |
|---|---|
| 複数スキルから共有されるユーティリティ（YouTube / GA4 / GSC 等ドメイン単位） | `.claude/scripts/<domain>/` 例: `.claude/scripts/youtube/`, `.claude/scripts/lib/` |
| 特定スキル専用の長大スクリプト | `.claude/skills/<skill>/scripts/` |
| スキルが参照するデータ・テンプレ（非実行） | `.claude/skills/<skill>/reference/` |
| launchd 等の OS 統合用シェルラッパー | `scripts/scheduled/`（唯一の例外、`.claude/` 外でよい） |
| アプリのビルド・デプロイ用スクリプト | `packages/*/scripts/` or `apps/*/scripts/` |

## 判断フロー

```
スクリプトを新規作成する
  ↓
SKILL.md から `node <path>` で呼ばれる？
  ├─ YES → .claude/scripts/<domain>/ または .claude/skills/<skill>/scripts/
  └─ NO → OS から直接起動される？
          ├─ YES → scripts/scheduled/
          └─ NO → packages/*/scripts/ or /tmp/（使い捨て）
```

`.claude/scripts/<domain>/` に置くスクリプトから project root を参照するときは `require("path").resolve(__dirname, "../../..")` を `PROJECT_ROOT` として冒頭で宣言する。
