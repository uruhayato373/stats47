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

データ層は「完全 DB レス」が正典 → [`docs/01_技術設計/02_データアーキテクチャ.md`](../../docs/01_技術設計/02_データアーキテクチャ.md)。
永続 DB は持たず、**git の `data/` (マスタと台帳) と R2 (観測値と配信 snapshot)** だけを正本にする。

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

アプリが読む配信データは、`data/` の DB と R2 の観測値から生成スクリプトで R2 の snapshot にする。生成物を手で編集しない。
観測値と派生値を git や永続 DB に置かない (分類は `02_データアーキテクチャ.md`「データ分類」)。
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
