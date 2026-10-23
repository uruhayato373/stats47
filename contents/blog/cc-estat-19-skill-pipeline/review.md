---
slug: cc-estat-19-skill-pipeline
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-10-23
---
## 評価サマリ
再審査 (delta。前回の BLOCK 1 件と MAJOR 4 件の解消確認と、変更箇所の回帰確認。変更前の版は git 管理外で差分が取れなかったため、本文を全読して照合) の結果、前回の BLOCK と MAJOR はすべて解消していました。前版の誤り (Pages 前提、D1 権限、`--remote` 欠落、存在しない claude オプション、cron 曜日 7) も再発していません。今回の修正で新たに入った事実誤りは見つかりませんでした。残るのは、修正の仕上げで生じた細かな不整合と未確認事項 (すべて MINOR) です。最終回 Part 20 (R2 の現行 article.md、updatedAt 2026-10-07) の `workflow_run` (`workflows: ["Weekly Refresh"]`、`weekly-refresh.yml`、成功時のみデプロイ、失敗時は Part 19 の Issue が知らせ) とも整合しています。

前回指摘の解消確認 (公式側の根拠付き):
- BLOCK (cron は必ず UTC): 解消。本文は「既定で UTC、`timezone` キーで IANA 名を指定でき、公式の例は America/New_York」に直っている。GitHub Docs「Events that trigger workflows」「Workflow syntax」(2026-10-23 取得) の「By default, scheduled workflows run in UTC」「optionally specify a timezone using an IANA timezone string」と一致する。`Asia/Tokyo` が使えるとは断定していない。
- MAJOR (`.claude/state` への書き込み): 解消。state は `state/weekly-refresh/`、設定は `config/` に移り、`Commit metrics` の `git add` にも `state/weekly-refresh/` が入った。`.claude` が保護ディレクトリで `claude -p` では書き込みが拒否されうるという注意書きも、公式 (permission-modes「Protected paths」) と合っている。
- MAJOR (部分再実行の入力): 解消。`workflow_dispatch.inputs.run_id`、`actions/download-artifact@v4` の step (`name` / `run-id` / `github-token` / `path: tmp`)、`permissions.actions: read` が揃った。actions/download-artifact の README は、別 run からの取得に `run-id` と `github-token` が必要で、トークンに `actions:read` が要ると書いており、`name` 指定時は `path` に直接展開されるので `tmp/raw/` 等に戻る。`GITHUB_TOKEN` に `actions: read` を与える書き方も整合する。
- MAJOR (失敗検知の連鎖): ほぼ解消。スキルが `tmp/result.json` に結果を書き、`Verify result` が検査して `exit 1` し、Issue 起票は workflow の `if: failure()` に一本化された (スキルの失敗時処理も「Issue は起票しない」に変更)。`result.json` が無い場合も `JSON.parse` の読み込みで落ちるので、fail-closed になっている。`gh` の認証 (`GH_TOKEN`) の問題も、gh を使わなくなったため消えた。
- MAJOR (ID 系 secrets): 解消。`CLOUDFLARE_ACCOUNT_ID` と `CLOUDFLARE_ZONE_ID` が、Secrets の説明 (5 系統)、`gh secret set` 7 行、`env`、スキルの前提に反映された。account ID を wrangler と S3 の endpoint に、zone ID をパージ API に使うという説明は、Cloudflare Docs と合っている。
- MINOR 群: `pull-requests: write` 削除、Node 22、e-Stat の接続数を「筆者の環境での観測 (記録は残していない)」に、API 課金への言及 (`--max-budget-usd` は `claude --help` 2.1.309 に存在)、次回予告への `workflow_run`、自動化の範囲を R2 までと明記、確認範囲の NOTE、`updatedAt` 更新は、いずれも反映を確認した。

## 指摘
- [MINOR][型:code] `Verify result` は `fetchFailed > 0` (1 件でも取得失敗) で `exit 1` するが、Step 1 の出力契約の文言は「全件失敗のままデプロイへ進まないように止める」と書いており、条件が食い違う。コードのままだと、15 件中 1 件の一時的な失敗でも週次の `Commit metrics` が飛び、Part 20 の `workflow_run` のデプロイも走らない。一方で同節には「全体停止より部分降格のほうが実用的」という説明が残っている。しきい値 (例: 取得失敗が全件、または 3 割以上) を決めて、コードと文言をそろえる。
- [MINOR][型:code] Step 2 の `weekly-refresh` の frontmatter `description` に「失敗時は Issue を起票する」が残っている。本文の失敗時処理は「Issue はここではせず、ワークフロー側で行う」に直ったので、description の方も「失敗時は結果を `tmp/result.json` に書く」などに直す。`description` は Claude が呼び出し判断に使う文面なので、起票を試みる動機を与えうる。
- [MINOR][型:code] `Upload intermediate artifacts` の `path` が `tmp/raw/`、`tmp/transformed/`、`tmp/rendered/` の 3 本だが、公式 (actions/upload-artifact README) は、複数 path のときは最小共通祖先をアーティファクトのルートにすると書いている。3 本ともあれば祖先は `tmp/` で、download の `path: tmp` と噛み合う。ただし fetch で失敗して `tmp/raw/` しか無い run では、ルートが変わって download 後の配置がずれるおそれがある (一部の path が無いときの扱いは公式に記載がなく、確かめられなかった)。`path: tmp/` の 1 本にして、必要なら `!tmp/result.json` で除外すると、配置が安定する。あわせて、`state/weekly-refresh/` が初回に存在しないと `git add` が pathspec エラーで落ちるので、スキルが空ファイルを作る旨を書くか、`mkdir -p` を入れる。
- [MINOR][型:source] CLOUDFLARE_API_TOKEN の節に、「Workers のデプロイまで行うなら Workers Scripts の編集権限を足す」の文が残っており、直後の「Part 20 ではデプロイ用に別のトークンを作るので用途ごとに分けます」と矛盾する。Part 20 は「Edit Cloudflare Workers」テンプレート (Account API tokens) を指示しているため、デプロイ権限の文は削除し、Part 20 に任せる。取得先の「My Profile → API Tokens」(ユーザートークン) と Part 20 の Account API tokens の食い違いも残る。
- [MINOR][型:structure] 確認範囲の NOTE の末尾に、ICT ランキング一覧への導線 (「本記事で扱った ICT 関連の指標も…」) が入っている。callout は読み違い防止の知識に絞るべきなので、導線は NOTE の外 (直前の段落か「データについて」) に出す。
- [MINOR][型:source] つまずき 2 は、「e-Stat 側で 429 を返してきます」と事実として書いた直後に、「記録は残していない」と断っている。順序を逆にして、「筆者の環境では 429 が出ることがありました (記録なし)」と書き、断定を弱める。
- [MINOR][型:structure] 図は 0 個 (アーキテクチャ図は ASCII のコードブロック) で、`data/` は空。gate は警告のみで blocker ではないが、4 段の流れとデータの保存先 (tmp / state / R2) を 1 枚の図にすると、部分再実行の入出力が一目で分かる。
- [MINOR][型:other] 確認範囲の NOTE にあるとおり、本文のワークフローとスキルは通し実行されていない。今回追加した `download-artifact` の cross-run 取得、`Verify result`、`timezone` キーは、いずれも公式文面との照合だけで、実行確認は無い。公開後に一度 `workflow_dispatch` で通した結果を、NOTE に追記できると、Part 20 と同水準の根拠になる。

## 判定理由
BLOCK は 0 件、前回の MAJOR 4 件はすべて公式と照合して解消を確認したため PASS。上記の MINOR は、記事の手順が動くかどうかを左右するものではなく (例外は、取得 1 件失敗で全体を止める条件が文言とずれている点と、部分 run でのアーティファクトの配置のずれ。どちらも読者が運用で気づいて調整できる範囲)、公開後の改稿で足りる。確かめられなかったのは、(1) 一部の path が無いときの upload-artifact のルート決定、(2) Workers Scripts のみでデプロイが通るかの最小権限、(3) ワークフローの実行結果、の 3 点。本セッションは review.md のみ書き込み可の指示だったため、`record-critic-findings.mjs` による台帳記録は実行していない。
