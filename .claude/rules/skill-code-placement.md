---
paths:
  - ".claude/scripts/**"
  - ".claude/skills/**/scripts/**"
  - "scripts/**"
  - ".claude/skills/dev/create-skill/**"
  - "packages/ops/**"
---
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
| **アプリ (管理画面など) と packages も読む部品** | `packages/` (運用の部品は `packages/ops/src/<領域>/`、領域が合えば既存のパッケージ)。`.claude/scripts` には置かない |
| スクリプト用の鏡 (TS の正本の JS の写し) | 正本と同じパッケージの `mirror/` (`packages/r2-storage/mirror/r2-keys.mjs` など) |

### 依存の向き (2026-11-19 オーナー判断)

**apps と packages は、本番コードもテストも `.claude` を import せず、ファイルとしても読まない。** アプリと
エージェントの両方が使う部品は `packages/` に置き、`.claude/scripts` はそれを読む側にだけなる。例外は、
管理画面の本番コードが運用の状態 (todo・state・memory など) を表示のためにデータとして読むものと、品質のゲートの
基準 (`.claude/config`) を検査が読むものだけ。管理画面はパスを書かず、置き場の台帳 (`config/datasets.mjs`) の id で引く。

- 読み方: アプリと packages はパッケージ名 (`@stats47/ops/media/workspace.mjs`) で、`.claude/scripts` と依存を入れない
  CI の job (デプロイの範囲・PR の検査の振り分け・レビューの期限など) は相対パス (`../../../packages/ops/src/...`) で読む。
- `.claude/scripts` の部品をアプリが読みたくなったら、先に `packages/` へ移す。テストが `.claude/scripts` の道具を
  確かめたいときは、テストを `.claude/scripts/<領域>/__tests__/` に置く。
- 機械の止め: `node .claude/scripts/lib/check-claude-boundary.mjs` (PR の検査。縮小専用の基準
  `.claude/config/claude-boundary-baseline.json` と、行ごとの理由)。

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

素の node のスクリプトは、R2 のキー (`packages/r2-storage/mirror/r2-keys.mjs`)・都道府県の名前と地域コードの判定と変換 (`packages/area/mirror/prefectures.cjs`。2 桁⇄5 桁・全国コード・県の数・沖縄の判定も含む。正本は `packages/area/src/utils/area-code.ts`)・e-Stat の時間コードから年 (`packages/estat-api/mirror/year-code.mjs`) を共通の部品から読み、自前の表や判定を書かない (TS の正典から生成した鏡。`check-r2-entrypoint.mjs`・`check-area-year-entrypoint.mjs` が新しい写しを止める)。

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
