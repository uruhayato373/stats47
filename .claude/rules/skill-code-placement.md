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
**ただし、テストが要るほどのロジック (判定・変換・集計・台帳の読み書き) は誰が呼ぶかに関係なく `packages/` に置き、
テストもそこに置く。`.claude/scripts` はそれを呼ぶ薄い入口になる** (2026-11-19 オーナー判断)。

## 配置ルール

| 対象 | 置き場所 |
|---|---|
| 複数スキルから共有されるユーティリティ（SNS / GA4 / GSC 等ドメイン単位） | `.claude/scripts/<domain>/` 例: `.claude/scripts/sns/`, `.claude/scripts/lib/` |
| 特定スキル専用の長大スクリプト | `.claude/skills/<skill>/scripts/` |
| スキルが参照するデータ・テンプレ（非実行） | `.claude/skills/<skill>/reference/` |
| launchd 等の OS 統合用シェルラッパー | `scripts/scheduled/`（唯一の例外、`.claude/` 外でよい） |
| アプリのビルド・デプロイ用スクリプト | `packages/*/scripts/` or `apps/*/scripts/` |
| **テストが要るロジック** (判定・変換・集計・台帳の読み書き) とそのテスト | `packages/` (領域が合う既存のパッケージ、運用の部品は `packages/ops/src/<領域>/`)。`.claude/scripts` には呼ぶ入口だけを置く |
| **アプリ (管理画面など) と packages も読む部品** | `packages/` (運用の部品は `packages/ops/src/<領域>/`、領域が合えば既存のパッケージ)。`.claude/scripts` には置かない |
| スクリプト用の鏡 (TS の正本の JS の写し) | 正本と同じパッケージの `mirror/` (`packages/r2-storage/mirror/r2-keys.mjs` など) |

### 依存の向き (2026-11-19 オーナー判断)

**apps と packages は、本番コードもテストも `.claude` を import せず、ファイルとしても読まない。** アプリと
エージェントの両方が使う部品は `packages/` に置き、`.claude/scripts` はそれを読む側にだけなる。例外は、
管理画面の本番コードが運用の状態 (todo・state・memory など) を表示のためにデータとして読むものと、品質のゲートの
基準 (`.claude/config`) を検査が読むものだけ。管理画面はパスを書かず、置き場の台帳 (`config/datasets.mjs`) の id で引く。

- 読み方: アプリと packages はパッケージ名 (`@stats47/ops/media/workspace.mjs`) で、`.claude/scripts` と依存を入れない
  CI の job (デプロイの範囲・PR の検査の振り分け・レビューの期限など) は相対パス (`../../../packages/ops/src/...`) で読む。
- `.claude/scripts` の部品をアプリが読みたくなったら、先に `packages/` へ移す。
- 機械の止め: `node .claude/scripts/lib/check-claude-boundary.mjs` (PR の検査。縮小専用の基準
  `.claude/config/claude-boundary-baseline.json` と、行ごとの理由)。

### テストは `.claude` に置かない (2026-11-19 オーナー判断)

テストを書きたくなったら、先に対象のロジックを `packages/` へ移し、テストもそこに置く。テストだけを packages へ
移さない (packages が `.claude` を読むことになり、上の依存の向きに反する)。

- `.claude/scripts` に新しいテストを置けるのは、エージェントが居るから存在する基盤 (hook・セッションの検知・
  agent/skill の整合検査・backlog-loop・モデル利用量・CI の契約の検査) だけ。基準の `harness` に理由付きで 1 行足す。
  置ける領域は基準の `harnessDomains` に限る。
- 既存のテストは、その領域を触るときに対象のロジックごと packages へ移し、基準を縮める (SCRIPTS-TO-PACKAGES-02)。
  移すときは下の「拡張子」の注意 (packages は `"type": "module"` を持たない) と、依存を入れない CI の job は
  相対パスで読む決まりに従う。
- 機械の止め: `node .claude/scripts/lib/check-claude-scripts-tests.mjs` (PR の検査。領域ごとのテスト数の縮小専用の基準
  `.claude/config/claude-scripts-test-baseline.json`)。
- 移すときは道具を使う: `npm run claude:scripts:move -- <表.json> [--apply]` (`.claude/scripts/lib/move-script.mjs`)。`git mv`・
  相対パスの読みの付け替え・`package.json` と workflow と基準のキーと文書の旧パスの置き換えを機械的に行い、判断が要る行
  (ROOT を求める式・`.claude` の文字列・残った言及) を一覧に出す。CLI は元のパスに本体の `main` を呼ぶ薄い入口を置き直し
  (表で `keepEntry: true`)、名指しされているパスを変えない。移したあと `node .claude/scripts/lib/check-claude-scripts-tests.mjs --shrink`
  で基準を縮める。
- 移す先に vitest の project があるときは、`node:test` のテストをその vitest が拾わないことを確かめる (`packages/ops` には無い)。
  `.claude` のパスを文字列で持つ本体は、基準や予算の場所を入口から渡すか、置き場の台帳の id で引く形に直してから移す。

## 判断フロー

```
スクリプトを新規作成する
  ↓
テストが要るロジック (判定・変換・集計・台帳の読み書き) か？
  ├─ YES → packages/ (テストもそこ)。.claude/scripts には呼ぶ入口だけ
  └─ NO
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
