# ブランチ運用ルール

## フロー

```
feature/* ──(直 merge)──▶ develop ──(PR + CI)──▶ main（デプロイ）
```

PR は **develop → main の 1 段階のみ**。feature/* → develop は直 merge で可 (個人開発、self-review 前提)。

## 実行環境による差分 (web / クラウド) ★

`gh` CLI と GitHub Actions の起動可否が環境で異なる。混同すると「dispatch できるはず」と誤認する (2026-06-02 発生)。

- **ローカル**: `gh` あり・任意ブランチ push 可・`gh workflow run` で dispatch 可。
- **Claude Code on the web / クラウド**: `gh` 無し・push 先制限あり・**連携トークンに `actions:write` が無く workflow dispatch 不可 (403)**。PR 操作は GitHub MCP ツールで行う。**R2 公開 (記事・広告) は workflow_dispatch ではなく push トリガーに委ねる** (`blog-auto-publish.yml` / `publish-affiliate-ads.yml` は develop への該当ファイル push で自動発火)。
  **dispatch でしか起動できない workflow は `workflow-dispatch-proxy.yml` で代理実行する** — `data/workflow-dispatch-requests.json` を develop に push すると CI が `gh workflow run` する (CI 内の `GITHUB_TOKEN` は `actions:write` を持てる)。allowlist 制で、request は成否によらず自動消費される。★`requestedAt` を毎回更新すること (paths フィルタは diff で判定するので同内容の再 push は発火しない)。
- 詳細・判定表・データ公開経路は `.claude/skills/dev/deploy/SKILL.md` の「実行環境の判定」「データ公開」を参照。

> **データ公開は develop 経由**: `blog-auto-publish.yml` / `publish-affiliate-ads.yml` / `publish-blog.yml` は **develop を checkout** する。feature を main へ直接 squash しただけだと記事/広告が develop に乗らず公開されない。記事を含むデプロイは必ず develop を経由させる (feature → develop で公開発火 → develop → main の PR でコードデプロイ)。

### ★`[skip ci]` の commit-back がヘッドになると PR に check が 1 つも付かない

CI が develop へ書き戻す commit は `[skip ci]` を持つ。**それが develop の HEAD になった状態で
develop→main の PR を開く / 既に開いていると、その commit を head に持つ PR に check が
1 つも付かず、status は pending のまま永久に止まる** (workflow が走らないので「まだ実行中」と
区別が付かない)。

実際に踏んだ経路は 2 つあり、どちらも「data 系の作業をしてから PR を出す」流れで起きる:

| commit-back の出所 | いつ HEAD になるか |
|---|---|
| `workflow-dispatch-proxy.yml` の request 消費 | proxy で sync-snapshots 等を代理起動した直後 (PR #733) |
| `blog-auto-publish.yml` の docs/21 outbox 掃除 | 記事を公開した直後 (PR #734) |

**対処**: PR 作成後に `get_check_runs` が 0 件なら、まず develop の HEAD が `[skip ci]` かを疑う
(`git log --oneline -1 origin/develop`)。**後続の実コミットを push すれば CI が発火する**。
空コミットで済ませず、その時点で残っている本来の作業 (規約の追記・是正など) を載せるとよい。

#### ★commit 件名にトークンを書かない (2026-08-05 に実際に踏んだ)

GitHub は **commit メッセージ内のどこにあっても** skip トークン (`[skip ci]` / `[ci skip]` /
`[no ci]` / `***NO_CI***`) を拾う。件名の一部として引用したつもりでも run は作られない。

上の罠を文書化する commit の件名にトークンを引用した結果、**その commit 自身が CI を止め**、
PR の check が 0 件のままになった。**判定は ref の HEAD commit に対して行われるので、
PR を close→reopen しても同じ HEAD が読まれて発火しない** — 「reopen すれば直る」は効かない。

トークンに言及するときは件名を避け、本文でもバッククォートではなく `skip-ci` のような
別表記にする (バッククォートは GitHub のスキャナに対して無力)。

**★2026-08-20 に同じ事故が 2 回目。機械で止めるようにした。**
この節を**読んだ直後の** commit で件名にトークンを引用し、push した 6 commit に対して
run が 0 件になった。2 回とも「トークンを話題にする commit」で起きており、
**文章で注意を促すだけでは防げない**ことが実測で分かった。

`.husky/commit-msg` → `.claude/scripts/lib/check-commit-message.cjs` が
`[skip ci]` / `[ci skip]` / `[no ci]` / `[skip actions]` / `***NO_CI***` と
その表記ゆれ (アンダースコア・ハイフン・大小文字) を拒否する。

意図的に skip したいときは `--no-verify` ではなく本文に理由を宣言する:

```
ALLOW-SKIP-CI: 生成物のみで検査対象の変更が無いため
```

grep で追える監査可能な逃げ道で、うっかりでは書けない (理由が空だと通らない)。

**cron の commit-back は壊れない。** フックは `$CI` が立っていれば素通りする。
2026-08-20 時点では husky が依存に無く CI で `core.hooksPath` も設定されないため
そもそも発火しないが (実測)、将来 husky を導入したときに
`[skip ci]` を**正当に**使う cron を壊さないよう明示的に抜けている。

## ルール

- **feature/***: 機能ブランチ。develop から分岐し、ローカルで `git merge --no-ff feature/<name>` で develop に取り込む。マージ後は削除。PR は不要 (作っても良いが、feature ブランチへの push では CI は走らない)。**develop に push した時点で `develop-quality-gate.yml` の高速 3 ゲートが走る** (下記)
- **develop**: 統合ブランチ。feature/* からの直 merge を受ける。`git push origin develop` で remote に反映。**develop 直接 commit は推奨されないが禁止ではない** (短い chore は許容)
- **main**: 本番デプロイブランチ。**develop → main の PR 経由でのみ更新**。`gh pr create --base main --head develop` で CI (`.github/workflows/pr-quality-check.yml`) を発火 → green を確認してマージ → Cloudflare Pages 自動デプロイ
- main への直接コミット / push / force push は禁止

## hotfix / main 直行を入れたら main → develop を即同期する（★分岐再発防止・2026-06-08）

緊急 hotfix を `hotfix/* → main` の PR で入れる等、**develop を経由せず main に commit が乗った場合**、main が develop より先行して **main/develop が分岐**する。同じ内容を develop でも別 SHA で持っていると、次の `develop → main` PR が **重複コミット込みで巨大化・コンフリクト化**する（2026-06-08 実際に発生: PR が 2955 ファイル diff になり手作業 reconcile が必要だった）。

**規約**: main に develop 非経由の commit が入ったら、**その場で `origin/main` を develop に取り込んで同期する**。

```bash
git fetch origin main develop
git rev-list --count origin/develop..origin/main   # >0 なら main が先行＝要同期
git switch develop && git pull origin develop
git merge origin/main --no-edit                    # コンフリクトは内容同一なら ours/theirs で解決
git push origin develop
```

原則は「main に入るものは必ず develop を先に通す」。hotfix もできる限り `feature → develop → PR develop→main` に乗せ、緊急で main 直行した場合のみ上記で即同期する。`/deploy` は Step 1 で `origin/develop..origin/main` を必ずチェックする。

## ★scheduled workflow は default branch (main) の定義で発火する (2026-08-21 実測)

**cron を止めたいのに develop から workflow を消しても止まらない。** GitHub Actions は
schedule を **default branch のファイルから読む**ので、main に残っている限り発火し続ける。
しかも中身が `ref: develop` を checkout する作りだと、develop 側で prompt やスクリプトを
消した分だけ**毎晩失敗する run** が積み上がる (失敗 Issue を起票する workflow なら通知も出る)。

2026-08-21 に ai-content / blog の日次生成ループを削除したとき、develop から消えた時点で
「cron は止まった」と判断しかけた。実際は main に 2 ファイルが残っており
(`git ls-tree origin/main -- '.github/workflows/'` が 64 対 62)、同日中に発火する状態だった。

- **確認は `git ls-tree origin/main` で行う。** `git cat-file -e origin/main:<path>` は
  Git Bash (MSYS) がパスを変換して**偽の「無い」を返す**。実際にこれで誤判定しかけた。
  `MSYS_NO_PATHCONV=1` を付けるか `ls-tree` を使う。
- **デプロイせずに即止めるなら `gh workflow disable <file>`。** main を触らず、可逆で、
  次のデプロイでファイルごと消えたあとは disable 状態も不要になる。
- 逆に **新しい cron は main へマージされるまで一度も発火しない**。develop で試したいなら
  `workflow_dispatch` か request push トリガーを併記する。

## なぜ PR を develop → main にだけ置くか

- `pr-quality-check.yml` (フル suite) の trigger は `pull_request: branches: [main]` のため、**フル CI は main PR でしか発火しない**
- feature/* → develop の PR は self-merge → PR 自体を作る価値がない (オーバーヘッドだけ)
- develop → main の PR を「本番デプロイの最終ゲート」に集約することで、CI green + 履歴境界 + ロールバック単位の 3 つを 1 箇所で確保

## develop への push も高速ゲートを通る (★2026-08-20 新設)

**「develop は完全に無検査」ではなくなった。** `develop-quality-gate.yml` が push ごとに
ESLint / env registry / maintenance debt の 3 つだけを走らせる。
**job 全体は実測 104 秒** (2026-08-20 の初回成功 run 32361789100)。
大半は `npm ci` で、3 ゲート本体は数秒に収まる。

なぜ足したか (実測): それ以前の develop は無検査だったため、pre-commit を通っていない変更が
そのまま着地し、**壊れは「次に develop をマージする人」が払う**構造になっていた。
2026-08-20 のマージでは `MetricFocusCharts.tsx:63` の ESLint 違反・未登録 env 4 件・
maintenance debt 1 件が origin/develop に入ったまま残っており (commit `621131d6c`)、
マージ担当が 3 サイクル・十数分を検査待ちに費やした。しかもマージ中は
「自分が壊したのか継承したのか」の切り分けが毎回必要になる。

- **ここに重い検査を足さない。** 「決定的か」「1 分以内か」を満たさないものは
  `pr-quality-check.yml` 側に置く。develop への push が詰まると `--no-verify` を誘発し、
  ゲートを足した意味が消える。
- cron の commit-back はほぼすべて `[skip ci]` を持つので発火しない (実測: 23 本中 22 本)。
  例外は `gsc-url-inspection-daily.yml` の 1 本だけで、state の CSV/MD しか触らないため緑で通る。
- **`paths-ignore` で state を除外しない。** 実測すると 3 ゲートはいずれも
  `.claude/state` を読まない (maintenance-debt は `state` を EXCLUDED に持ち、env-registry の
  roots にも無く、eslint は `apps/web/src` のみ) ので、**除外しても今は安全**。
  それでも足さないのは、将来 state を読むゲートを足したときに**除外が黙って穴になる**から。
  1 日 1 回の余分な run のほうが安い。

### commit 前に blocker を一度に洗い出す

pre-commit は直列 all-or-nothing で 2 分超かかるため、blocker を 1 つずつ潰すと
1 個につき 1 サイクル待つことになる。同じ 3 ゲートを**並列**で先に回す:

```bash
npm run preflight
```

pre-commit の代替ではない (型・docs・画像 pipeline の深い検査は含まない)。
**通っても commit が通る保証はしないが、ここで落ちれば確実に落ちる。**

### マージ中にゲートが落ちたら「継承か自作か」を先に切り分ける

develop をマージした直後の失敗は、自分の変更ではなく**取り込んだ側に元からあった**ことが多い。
切り分けないと、他人のコードを自分のバグとして調べ続けることになる。

```bash
git show origin/develop:<落ちたファイル> | grep -n '<該当パターン>'
```

origin 側に既に違反があれば継承 (直して commit に含めてよい。ゲートは着地点で捕まえる設計)。
無ければ自分のマージ解決かローカル変更が原因。

## デプロイ

- `/deploy` スキルで実行
- フロー: feature/* で作業 → ローカルで develop に merge → `git push origin develop` → `gh pr create --base main --head develop` → CI green → マージ → main 自動デプロイ → 必要なら `/purge-cdn`

### デプロイ頻度の規律 ★毎回デプロイしない（2026-06-20 追加）

**変更のたびに本番デプロイ（develop→main PR → CI → merge → Cloudflare deploy）を回さない。** CI（6-8分）+ Cloudflare ビルド/デプロイ（6-8分）が毎回走り、時間もコストも無駄になる。

- **UI/見た目/ロジックの反復は localhost (`npm run dev:web`) で確認**して完結させる。デプロイしない。
- 複数の変更を**まとまりに溜めて、完成時に 1 回だけ**デプロイ（コミットも micro-commit ごとの PR を避ける）。
- デプロイするのは次のときだけ:
  1. **ユーザーが明示的にデプロイを求めたとき**
  2. **本番でしか再現しない問題の検証時**（例: Cloudflare Workers ランタイム固有の R2 / env 問題。dev では再現しないため本番で観測するしかない）
- 本番反映は outward-facing。明示指示が無ければ、デプロイ前に**「デプロイしてよいか」を確認する**。
- 背景: 2026-06-20 のテーマ UI 改修で 7 回連続デプロイ（#486/490/491/492/493/494/495）してしまい指摘された。本番固有のデータ障害切り分け（#491-493）以外は localhost で十分だった。

## データ反映フロー（完全DBレスが正典 → `docs/01_技術設計/02_データアーキテクチャ.md`）

**本番は R2 スナップショット配信のみ。** SSOT は git TS と R2 の二つだけ。永続/リモート D1 は廃止。
オーサリング SSOT を生成スクリプトで R2 に直接反映する（D1 を経由しない）:

```
Authored/設定 (チャート定義等)        : git TS 定義 ──生成スクリプト──▶ R2 ──▶ 本番配信
Authored/関係・運用 (page_components 等) : git TS 定義 ──生成スクリプト──▶ R2 ──▶ 本番配信 (横断整合はビルド時に検証)
Reference (metrics/articles)          : git TS / article.md ──再生成──▶ R2 snapshot
Derived (area_profiles/相関)          : R2 観測値をエフェメラル計算 (:memory:/DuckDB) ──▶ R2 snapshot
```

- **クラウド/ローカルとも git TS 編集 + R2 直接反映で作業**（永続 D1 認証は不要 = クラウド完結）
- 設定の R2 反映の実装例: `apps/web/scripts/export-page-components-snapshot.ts`（git TS `data/page-components/` → R2、Phase E 実装済）
- R2 読みは公開 URL 経由で可能: `R2_PUBLIC_FETCH_URL=https://storage.stats47.jp`
- ranking-values（~30K files）の更新は `SKIP_VALUES=1` で他のみ更新し、必要な場合のみフル実行
- ロールバックは R2 の旧 snapshot ファイルへの上書き push で対応
- 旧 `db:pull`/`db:push` / リモート D1 seed/export は廃止 (legacy)。手編集 JSON を SSOT にしない（git TS → 生成）
