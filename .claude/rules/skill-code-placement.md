# スキル利用コードの配置原則

**スキル（SKILL.md）から呼ばれるユーティリティ・ヘルパースクリプトは `.claude/` 配下に置く**。`scripts/` 直下には置かない。

## 配置ルール

| 対象 | 置き場所 |
|---|---|
| 複数スキルから共有されるユーティリティ（SNS / GA4 / GSC 等ドメイン単位） | `.claude/scripts/<domain>/` 例: `.claude/scripts/sns/`, `.claude/scripts/lib/` |
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

## 拡張子: TypeScript は `.ts` にする (`.mts` にしない)

`.claude/scripts/` 配下で TypeScript を書くときは **`.ts`**。`.mts` にすると tsx が厳密な ESM として
扱い、**`@stats47/*` パッケージからの named import が実行時に落ちる**。

```
SyntaxError: The requested module '@stats47/data-configs/registry'
does not provide an export named 'METRICS_REGISTRY'
```

packages 側は `"type": "module"` を持たないため tsx からは CJS として解決され、
ESM の named import と噛み合わない。`.ts` なら同じ解決系に乗るので通る
(2026-08-21 に `build-wp0-inventory` で踏んだ)。既存の `.claude/scripts/**/*.ts` はすべてこの形。

## 新しいスクリプトは必ずどこかから参照させる

`node .claude/scripts/lib/check-agent-skill-consistency.cjs` の **W1 (orphan)** が、
どの SKILL / agent / workflow / script からも参照されていないスクリプトを警告する。
書きっぱなしは次の人に見つからないので、**SKILL.md か agent の手順に 1 行足す**。

- `.claude/todo/` からの参照は**数えない**。「消すか検討する」と TODO に書いた瞬間に
  警告が消えると、何もしていないのに解決に見えるため。
- 相対 import (`from "./data/thing"`) は参照として数える。data module を切り出しても警告されない。
