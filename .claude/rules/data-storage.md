---
paths:
  - "data/**"
  - "assets/**"
  - "config/**"
  - ".claude/{skills,state,todo,config}/**"
  - "docs/**"
  - "apps/web/scripts/export-*.ts"
  - ".claude/agents/**"
---
# データの置き場 (DB は `data/`、設定は `config/`)

## 置き場の正本は機械の台帳 2 つ (2026-11-14 オーナー決定)

「何のデータをどこに持つか」の正本は、検査が実物と照合する 2 つの台帳だけである。文章の正典は持たない
(手で書く一覧は実物とずれ、R2 の区分表に行があるのに文章に無いため「無い」と思い込んだ事故が起きた)。
新しい置き場・層は文章に足さず、台帳の行で表す。

| 見たいもの | 台帳 | 一覧を出すコマンド |
|---|---|---|
| git のマスタと台帳 (置き場・Schema・`refs`) | `config/datasets.mjs` | `npm run check-datasets -- --er` |
| R2 の prefix ごとの区分・書き手・何のデータか | `packages/r2-storage/src/scripts/r2-key-classes.ts` | `npm run r2:classes` |

取り込む前に、まず上の 2 つで既存の置き場を引く (e-Stat は R2 `estat-catalog/` と、非公開 R2 `estat-tables/` の表の写し)。

### 原則 (完全 DB レス)

永続 DB を真実源にも本番ランタイムの依存先にもしない。正本は **git の `data/` (人が定義するマスタと台帳)** と
**Cloudflare R2 (観測値と、公開アプリが読む配信 snapshot)** の二つだけである。

- 本番アプリは R2 snapshot を読み、DB query を実行しない。リモート D1・常駐 SQLite を SSOT として再導入しない
- 観測値と派生値を永続 DB・git に置かない (DB の肥大で解約に至った経緯がある)。R2 に置く
- 人が定義する低 volume の設定は git で review できるようにする。派生値は入力とロジックから再生成できるようにする
- 集計に SQLite / DuckDB を使うのは、プロセス終了で破棄できる一時領域 (`:memory:`) に限る。一時 DB は cache か計算手段で、
  復元できない唯一のデータを持たない
- schema 定義 (`packages/database/src/schema/*.ts`) と integration テスト基盤は型ソース・テスト用として残してよいが、
  存在することを永続 DB 利用の根拠にしない

| 許容 | 禁止 |
|---|---|
| integration test の一時 DB・build 中だけの cache・`:memory:` 集計 | リモート D1 を運用 SSOT にする・ローカル SQLite だけに authored data を置く |
| schema を型・テストに再利用 | 観測値・派生値を DB へ恒久保存する・本番アプリから DB query する |

#### データ分類

| 分類 | 真実源 | 配信先 |
|---|---|---|
| Authored / config | `data/` のマスタと台帳 (JSON + Schema) | 必要に応じて R2 snapshot |
| Authored / content | git 上の原稿・frontmatter (公開後の正本は R2) | R2 snapshot |
| Operational state | domain が定める git 管理 state | 原則 agent / automation 内だけ (公開アプリの runtime SSOT に転用しない) |
| Observation | R2 | R2 |
| Reference | 外部 API または再生成できる git source | git または R2 |
| Derived | 入力データ + 計算コード | R2 snapshot (入力から再生成する) |

どの prefix がどの区分かは R2 の区分表 (`npm run r2:classes`) が持つ。新しい prefix は reader・writer・検証・保持期間・所有 domain を
同時に定め、区分表に「何のデータか」を書いて足す。

#### 流れ

- 設定・コンテンツ: git の定義 → 型・Schema・相互参照の検査 → 決定的な exporter → R2 snapshot → runtime reader。生成物は手編集せず、入力側を直して同じコマンドで再現する
- 観測値: 外部 API → 取得 → 出典と形の検証 → R2。取得元・期間・単位・地域粒度を失わず、欠損と 0 を区別する (`data-provenance-standards.md`)
- 派生値: R2 の観測値 + git の定義 → 一時計算 (`:memory:` SQLite / DuckDB / 純コード) → 検証 → R2 の派生 snapshot
- 利用者が条件を持ち込むツールは、利用者ごとの状態を持たない限り DB が要らない (条件は URL query、値は R2 を読む)。ログイン・端末をまたぐ保存・更新通知の登録は
  利用者データの永続保存で、上の分類に該当がない。入れるなら先にこの分類へ「利用者データ」(真実源・保持期間・削除手順・個人情報の範囲) を足す改訂をし、
  収益化戦略 §5 のゲートを通った機能に限る

#### 保存先の判断

```text
外部に真実源があるか
  ├─ yes → Reference / Observation として取得・再生成
  └─ no
      ├─ 入力から決定的に計算できるか
      │   ├─ yes → Derived。計算後 R2 へ出力
      │   └─ no  → Authored。git の型付き定義へ
      └─ agent の進捗・台帳か → .claude/state または .claude/todo
```

新しい永続層を足して解決しない。変更時は、真実源・生成物・cache を分けたか、writer と reader が同じ schema と key を使うか、欠損・空・0・not-found・upstream failure を
区別するか、生成が決定的か、remote write を dry-run と差分確認なしで実行しないか、巨大な registry や全量 R2 read を runtime bundle に引き込まないかを確かめる。

R2 に置けるのは、配信の権利条件まで確認済みの観測値・原典・派生 snapshot だけである。GIS の元データ公開可否と商用成果物の利用可否は別に判定する
(`gis-data.md`・`license-policy.ts`)。非商用原典はローカル作業キャッシュに限り、公開 JSON/CSV も書面確認なしで生成しない。
R2 の key・Content-Type・cache・差分 upload・削除は `r2-storage-design.md`。

## 規則 (2026-11-10 オーナー決定)

RDB の考え方で読む。

| RDB | このリポジトリ |
|---|---|
| テーブル | マスタ (ほかから ID で指される ID の集合) と台帳 (判断して増える記録・ID に付く本文) |
| 主キー・外部キー | ID と、カタログ `config/datasets.mjs` の `refs` |
| ビュー | 生成物。手で編集しない |
| システムカタログ | `config/datasets.mjs` (どのファイルが何のデータで、どこに置くかの唯一の正本) |
| アプリ | コンポーネント・ページの部品・表示の設定。DB ではない |

1. マスタと台帳は `data/<領域>/` の JSON + Schema に置き、カタログに登録する
2. 関係は ID で結び、`refs` に宣言する (ID を文章に書かない)
3. `config/` はシステムの設定だけ。`packages/` と `apps/` は型・読み込み・検査の関数とアプリだけ

規則はこの 3 行だけで、守らせるのは `npm run check-datasets` (pre-commit・PR CI) である。何を止めるかは
`.claude/scripts/lib/check-datasets.mjs` の冒頭、置き場ごとの中身は `config/datasets.mjs` の行が正本で、この文書には写さない。
テーブルと外部キーの一覧は `npm run check-datasets -- --er` が出す。

`packages/`・`apps/`・`config/` にまだ残っているマスタと台帳は、カタログの `OUTSIDE_DATA`・`CONFIG_MOVE_PENDING` に
移す段付きで載っている (縮小専用)。新しいマスタ・台帳をそこへ足さない。

## git で管理するファイルの置き場

| 置き場 | 置くもの |
|---|---|
| `data/<領域>/` | DB (マスタ・台帳) と事業の記録 (計測・改善ログ・レビュー・監査と是正のキュー・生成物)。CI が書き戻すのもここ |
| `config/` | システムの設定 (アカウント・接続先・パスの定数・端末の予算・カタログ自身)。許可リストは `SYSTEM_CONFIG` |
| `assets/<用途>/` | 画像などの素材の原本と、その生成の説明・マニフェスト |
| `contents/<媒体>/` | 公開待ちの原稿 (outbox)。公開すると CI が消し、公開した記事の正本は R2 |
| `.claude/state/` | エージェント運用の状態だけ (下の許可リスト) |
| `.claude/config/` | 品質ゲートの基準・閾値。無人 run の Claude は `.claude/` に書けないので、エージェントが自分の品質ゲートを緩められない |

監査・レビューの記録は `data/<領域>/{reviews,audits}/` に置き、カタログに行を足す (テーマ・調査・SEO)。定期レポートは
`data/<取得元>/<レポートの名前>/` に置く (SNS の週次・競合の定点観測・X とブログの勝ち要因)。skill の `reference/` は手順・契約・
テンプレの置き場で、`reference/{reviews,audits,reports}/` に置いた追跡ファイルは `GOVERNED` に当たって未宣言で落ちる (2026-11-14)。
未完了の対策は記録に溜めず、バックログのカードにする ([`docs-vs-issues.md`](./docs-vs-issues.md))。

アプリが読む配信データは、`data/` の DB と R2 の観測値から生成スクリプトで R2 の snapshot にする。生成物を手で編集しない。
観測値と派生値を git や永続 DB に置かない (上の「データ分類」)。
文書・TODO・Issue の使い分けは [`docs-vs-issues.md`](./docs-vs-issues.md)。

### `.claude/state/` に置いてよいもの (許可リスト)

判断の基準は「**エージェントの運用をやめたら不要になるか**」。是正キューや監査の結果は、エージェントが作って読むものでも、
エージェントをやめたあとも事業として見返すので `data/` に置く (2026-10-06 オーナー決定)。

| データ | 置き場 | 台帳 id |
|---|---|---|
| バックログ自動処理の実行台帳 (completion gate の証拠) | `.claude/state/backlog-loop/ledger.json` | `agent.backlog-loop` |
| 整合性監査の印 (Stop hook が読む) | `.claude/state/consistency/audited.json` | `agent.consistency` |
| RemoteTrigger の記録 | `.claude/state/triggers.json` | `agent.triggers` |
| obsidian の mail-triage がメールから拾ったイベントの受信箱 (書き手と置き場はリポ外の cron が決める) | `.claude/state/inbox/mail-events.json` | `agent.mail-inbox` |
| Claude routine のトークン実績・モデル使用量と canary・プロンプト評価 | `.claude/state/metrics/{claude-usage,model-usage,prompt-evals}/` | `claude.*` |
| (git 管理外) セッションロック・実行間隔の記録 | `.claude/state/{session-locks,cadence}/` | — |

許可リストの正本は台帳 `config/datasets.mjs` の `AGENT_STATE` (id → 置く理由)。`.claude/state/` を指す台帳の行が
`AGENT_STATE` に無いと `npm run check-datasets` が止める。足すときは上の基準を満たす理由を書く。

### 画像の置き場

画像は `config/datasets.mjs` の `IMAGE_ROOTS` の中にだけ置く。外にある追跡画像は `npm run check-datasets` が止める。

| 置き場 | 置くもの |
|---|---|
| `assets/<用途>/` | 素材の原本。配信用に変換したもの (webp・リサイズ) は下の配信先か R2 に置き、原本はここに残す |
| `apps/*/public/` | アプリがそのまま配信する画像 (コードと一緒にデプロイされる) |
| `packages/*/src/`・`packages/*/data/` | パッケージに同梱する画像・図形 (コードが import する) |
| `.claude/skills/**/examples/` | スキルの説明に使う作例 (Codex 用ミラー `.agents/` を含む) |
| `contents/blog/` | ブログの公開待ちの原稿 outbox (公開後に CI が消す)。note の記事の画像は R2 だけに置く |

公開する画像の正本は R2 (ブログの図・OGP・特産品イラスト)。生成した派生 PNG を git に足さない
(`note-image-assets.md`・`ogp-image-standards.md`)。

### カタログと検査

- 新しい記録・素材は、先にカタログへ 1 行足してから書く。JSON のマスタ・台帳・設定は `schema` (JSON Schema) を宣言する。
  共通の型は `config/schema/common.schema.json` を `$ref` で使う
- コードは置き場を直書きせず、カタログの id で引く (`datasetPath(id)` / `datasetDir(id)`)。`config/` の設定は `config/paths.mjs` の定数を import する
- 判断に使う記録の書き手は、`.claude/scripts/lib/dataset-shape.mjs` の `assertDatasetShape(id, doc)` で書く前に形を確かめる
- 日付付きファイルの寿命は `prune-state-snapshots.mjs` の `RETENTION_POLICIES` だけが数値を持ち、カタログは名前で参照する
- テストの fixture が実物のスクリプトを一時ディレクトリへコピーして動かすときは、`config/datasets.mjs` と `config/paths.mjs` もコピーする
  (`apps/admin/tests/helpers/fixture-root.ts`)

### 置き場を移す手順

1. 台帳の行の `path` を新しい置き場に書き換え、`git mv` で移す (中身は変えない)。
2. 旧置き場を `RETIRED` に `{ from, to, since }` で宣言する。コードと文書 (作業カード・memory を含む) の直書きは検査が拾う。
   部品に分けた形 (`path.join(ROOT, "state", "ads", ...)`・`resolve(STATE_DIR, "x.json")`) と、スキルの場所を基準にした
   相対パス (`reference/improvement-log.md`) は検査に掛からないので、別に探して直す。
3. workflow の書き戻し (`git add`)・`RETENTION_POLICIES` の `directory`・品質検査の baseline のパスを同じ差分で変える。
4. **develop への push から main のマージまでを数十分に収める。** 定期実行は main の workflow 定義で動き、中で develop を
   checkout して develop のスクリプトを使う。develop だけ先に変わると、新しい置き場に書いた記録を main の定義が
   `git add` せず (旧パスが無ければ `fatal: pathspec` で step ごと落ち、差分で判定する workflow は「変更なし」と黙って抜ける)、
   その run の記録が失われる。GitHub の cron は数時間遅れて発火するので「定期実行が無い時間帯」は当てにできない。
   - push の前に `npm run preflight:pr` とローカルの検査を通し、push したら PR の CI が通り次第すぐマージする。
   - マージ後、push からマージまでの間に動いた run を一覧し (`/actions/runs?created=>=<push 時刻>`)、記録の欠落を
     run のログから補う。最後に workflow を手動起動して新しい置き場へ書くことを確かめる。
   - 実例 (2026-10-06): develop に入れてから main のマージまで約 12 時間空き、Instagram の投稿記録 (投稿は出たが
     投稿台帳と二重投稿防止ログが残らず、次の run が同じ投稿を繰り返す状態になった)・Threads の投稿確認・
     認証付き計測の 3 run が記録を落とした。
5. 改善ログ・レビュー・state の json など、当時のパスを記録した履歴は書き換えない。

## 作業の途中で作るもの

- 作業の途中だけ要るものは OS の一時領域 (`os.tmpdir()`) に置き、終わったら消す
- 人が見返す作業記録・候補画像・納品物の控えは Google Drive `stats47/` へ移す (`drive-archive.mjs` で照合して移す)

**作ったら消す (2026-11-08 オーナー指示)**: スキルとエージェントは、作業の途中で作ったファイルを、作業の最後に消す。
残す価値があるものは、上の分類どおり git・R2・Drive のどれかへ移してから消す。ローカルは正本にしない。
`.local/` に新しい置き場を作るときは、`config/local-resources.json` に登録する。登録先は 2 つある。
- **期限で消す作業領域**: `cachePaths` に `ageDays` 付きで登録する。
- **年齢では消さないもの**: `localRegistry` に、種類（auth / state / product）と理由付きで登録する。

登録の無い置き場は、次の 2 か所で検出される。
- **書く前**: コード・SKILL.md・agent 定義を対象に、PR CI の `check-local-registry.mjs` が止める。
- **書いた後**: 日次の `local:cleanup` が、`.local` 直下の名前を台帳と照合して警告する。

詳細は `local-environment.md`「ローカルに残さない」。
