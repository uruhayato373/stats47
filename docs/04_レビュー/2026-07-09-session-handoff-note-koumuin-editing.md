---
type: session-handoff
date: 2026-07-09
status: completed
vertical: koumuin-claude-code, koumuin-estat-claude-code
pr: 552
branch: claude/note-article-editing-6gvhyx
tags: [note, koumuin, editing, handoff]
---

# セッションハンドオフ: 公務員 note シリーズ（Claude Code / e-Stat）全記事の原稿修正

## 一言サマリ

公務員向け note 2 シリーズ（`koumuin-claude-code` 33 本 + `koumuin-estat-claude-code` 12 本 = 計 45 本）の原稿を、R2 から復元して 3 層で修正し、指定ブランチ `claude/note-article-editing-6gvhyx`（PR #552）に 4 コミットで反映した。**git 上の原稿はすべて修正済みだが、note.com の公開記事はまだ変わっていない**（反映は別途 `/publish-note --update` をローカルで実行する必要がある）。

## やったこと（3 層）

### 1. 外科的校正（6 記事）
R2 原本と機械突合して実変更を確定。記事は `rewrite-1` 済みで高品質だったため軽微。

- `00-claude-code-intro-for-public-servants`: 冒頭の著者プロフィール二重掲載を統合
- `02-internal-network-workarounds`: である調→ですます
- `06-ordinance-revision-review`: 重複語「slack」を削除
- `15-data-preprocessing-intro`: 箇条書きの太字開始 `**` 欠落を補完
- `23-mcp-internal-system`: 冗長な言い直しを dedup
- `32-claude-skills-getting-started`: 著者略歴の である調→ですます

### 2. 導入部に読者ガイドを追加・TL;DR 削除（44 記事）
各記事の `## はじめに` に、読者が自分ごと化しやすい 2 ブロックを追加した。手本は `04-meeting-minutes-30min-to-5min`（人手で編集）。

- **こんな方に向けた記事です**（想定読者 3 項目）
- **この記事でわかること**（得られる成果 3 項目）

あわせて、英語ジャーゴンで公務員読者に伝わりにくい **`## TL;DR` セクション（見出し＋要点箇条書き）を削除**した。**TL;DR 内のインフォグラフィック画像は保持**（機械検証で画像消失ゼロを確認）。

特殊処理:
- `00`: 既存で同型（本記事の想定読者 + わかること）を持つため追加なし
- `31-claude-code-how-to-ask` / `32-claude-skills-getting-started`: 「わかること」相当が既存のため **想定読者ブロックのみ**追加
- estat `06-prefecture-code-and-merge`: TL;DR なしのため 2 ブロック追加のみ

7 サブエージェントで並行編集し、機械検証で確認（導入ブロック 45/45・TL;DR 残 0・追加分に一人称混入なし・画像消失ゼロ・有料境界マーカー 32 保持）。

### 3. 方針§8 違反の是正（10 箇所 / 8 記事）
`docs/30_note記事企画/koumuin-claude-code/strategy.md` §8（第三者視点・煽り回避）の既存違反（Phase 4 の除去漏れ）を是正。

- 著者一人称 → 第三者視点（3 件）: `01` はじめの「私が同僚から受ける相談」→「現場でよく聞かれる相談」、`01`・`03` の有料 teaser
- 過剰な煽り表現の穏当化（7 件）: 「劇的に」→「大きく」（`07`/`08`/`25`）、「最強」→「最も効く／強力な」（`27`/`28`×2/`30`）

**意図的に残したもの（§8 対象外）**: 「自分の PC／自分の業務／自分の自治体」＝**読者自身**を指す用法、引用の NG 例（「私は〜と思います」は NG）、プロンプト例（「私が GO と言ってから」）、記入テンプレ（「私が明日試したい業務は」）、上席の心情の引用（「自分が処分される」）。§8 が禁じるのは*発信者*の一人称のみ。

## コミット（PR #552）

| SHA | 内容 |
|---|---|
| `5469c717` | #00 著者プロフィール重複の統合 |
| `5283a602` | 校正 5 記事（である調→ですます・誤字・dedup） |
| `1961d82a` | 全記事の導入部に読者ガイド追加・TL;DR 削除 |
| `b6db1ae3` | §8 違反（著者一人称・煽り表現）の是正 |

## 次のアクション（人間 / 次エージェント）

### A. note.com への反映（最優先・人間のローカル作業）
git 上の原稿はすべて直っているが、**公開記事は未反映**。反映したい記事に対し、headed Chrome + note ログインのあるローカル環境で:

```
/publish-note --update <slug>
```

内容が変わったのは #00 以外のほぼ全 45 記事（導入ブロック 44 + 校正 6 + §8 是正 8、重複含む）。全反映なら 45 slug を順に流す。有料記事は有料エリア境界の再設定が絡むため、最終「更新する」確定は screenshot 確認後に人手で押す。

### B. 未着手（要判断）
1. **再投稿版 4 URL は復元不能**: `paid-n9f666946d105` / `recovered-nc18fa33ec65e` / `paid-n143a9f6a0050` / `recovered-n73a4d300e045`。R2 にその slug の manifest が無く復元できない（番号付き記事の再投稿版と推測、内容は番号付き記事の修正でカバー済み）。独立した別内容なら note URL を得て個別対応。
2. **価格の食い違い（未変更）**: `strategy.md` の価格（#01=¥1,500 等）と実際の公開価格（`note-published-urls.json` では ¥300）がズレている。販売価格の変更は収益に直結する業務判断のため未着手。方針 doc を実価格に合わせるか、価格を上げるか、オーナー判断が要る。

### C. マガジンへの記事追加（note.com 操作・未反映）★2026-07-09 追加

note にはシリーズごとに**マガジンが 2 つ**あり、記事フッターがそれぞれ正しく参照している（リポジトリ側は正しい）。問題は note.com 側の**マガジンメンバーシップ**（記事がマガジンに追加されていない）で、これは note.com のマガジン管理 UI での操作。

| マガジン | ID | 対象シリーズ | 現状 |
|---|---|---|---|
| 公務員のための e-Stat × Claude Code 実務ガイド | `m1b836e4c8dce`（https://note.com/stats47/m/m1b836e4c8dce ） | koumuin-estat-claude-code（全 12 本） | **1 本しか追加されていない → 残り 11 本を追加** |
| 公務員 × Claude Code 実務活用ガイド | `m512ad7023815` | koumuin-claude-code（全 33 本） | 同様に全数追加されているか要確認 |

**e-Stat マガジン（`m1b836e4c8dce`）に追加すべき 12 記事**（`.claude/state/note-published-urls.json` 由来。再投稿版 `paid-n143a9f6a0050` / `recovered-n73a4d300e045` は重複のため除外）:

| # | slug | 区分 | note URL |
|---|---|---|---|
| 00 | estat-claude-code-intro | 無料 | https://note.com/stats47/n/n258277f96f88 |
| 01 | estat-api-key-setup | 有料 | https://note.com/stats47/n/nc5a1358141a5 |
| 02 | search-estat-statsdataid | 有料 | https://note.com/stats47/n/n7e4572d23a1b |
| 03 | fetch-prefecture-ranking | 無料 | https://note.com/stats47/n/n914ee28ff773 |
| 04 | excel-download-and-parse | 有料 | https://note.com/stats47/n/n23262330a5e5 |
| 05 | pandas-duckdb-derived-metrics | 有料 | https://note.com/stats47/n/n0477d544669b |
| 06 | prefecture-code-and-merge | 有料 | https://note.com/stats47/n/n7ba7ee560bbb |
| 07 | year-on-year-diff | 有料 | https://note.com/stats47/n/n0bd95dda8588 |
| 08 | benchmark-table-5min | 無料 | https://note.com/stats47/n/nd4afc48385a3 |
| 09 | assembly-chart-generation | 有料 | https://note.com/stats47/n/nce1681932f40 |
| 10 | claude-skills-routinize | 有料 | https://note.com/stats47/n/n53c16adaf2c7 |
| 11 | mcp-sqlite-search | 有料 | https://note.com/stats47/n/n347f923606f1 |

**note.com での追加手順**（ローカル・Profile 5 = note.com/stats47）:
1. マガジン https://note.com/stats47/m/m1b836e4c8dce を開き「マガジンを管理」→「記事を追加」、または各記事の「…」メニュー →「マガジンに追加」から選ぶ
2. 上表の 12 記事のうち未追加分を追加する（#00 → #11 の順が読者導線に沿う）
3. 追加後、姉妹マガジン `m512ad7023815`（koumuin-claude-code 33 本）も同様に全数入っているか確認する

> リポジトリ側の修正は不要（フッターの参照 URL は全記事で正しい）。マガジン ID の設定コピー・説明文は `.claude/skills/note/koumuin-estat-claude-code/MAGAZINE.md`（買い切り ¥1,480・全 12 本）を参照。**現状「マガジンに何本入っているか」を追跡する repo 側データは無い**（note.com 状態）。

## 次エージェント向けの前提知識（重要）

- **記事の SSOT は R2 `note/<vertical>/<slug>/`**。`docs/31_note記事原稿/` は ephemeral outbox（公開後に自動削除）。作業は `bash .claude/scripts/note/restore-from-r2.sh <slug>` で R2 → docs/31 に復元してから行う。
- **R2 SSOT は自動更新されない**: `sync-note-r2.mjs` は `r2_path` 記録済み（＝既公開）記事をスキップするため、既存記事の R2 内容は develop push では更新されない。R2 を更新したい場合は別途 push が要る（今回は git ブランチに原稿を載せ、note.com 反映は `/publish-note --update` が docs/31 の draft.md を直接読む経路を使う設計）。
- **導入ブロックの型（本セッションで確立）**: `**こんな方に向けた記事です**`（3 項目）+ `**この記事でわかること**`（3 項目）を `## はじめに` のフック直後・著者略歴の前に置く。太字ラベル＋箇条書き。手本 = `04-meeting-minutes-30min-to-5min`。
- **koumuin シリーズの方針は stats47 ランキング系（A/B/C/D）とは別**。正典は `docs/30_note記事企画/koumuin-claude-code/strategy.md`（収益化バーティカル・無料 7/有料 23・マガジン ¥980・M6 で月 20 万円目標）。§8 守秘・倫理ガード（第三者視点・煽り回避・自治体名を出さない・AI 補助の明示推奨）を厳守。**stats47.jp への送客は原則しない**（データ系 #14/#15/#17 のみ 1 行）。
- 検証コマンド例:
  - 導入型: `grep -rlE "こんな方に向けた記事です|本記事の想定読者" docs/31_note記事原稿/koumuin-*/*/draft.md | wc -l`
  - TL;DR 残: `grep -rl "^## TL;DR" docs/31_note記事原稿/koumuin-*/*/draft.md | wc -l`
  - 煽り/一人称: `grep -rnE "劇的|最強|神ツール|爆速" docs/31_note記事原稿/koumuin-*/*/draft.md | grep -v images`

## 関連ファイル

- ブランチ: `claude/note-article-editing-6gvhyx` / PR: #552
- 原稿: `docs/31_note記事原稿/{koumuin-claude-code,koumuin-estat-claude-code}/<slug>/draft.md`
- 方針: `docs/30_note記事企画/koumuin-claude-code/strategy.md`（§8 が本セッションの基準）
- 公開 URL 台帳: `.claude/state/note-published-urls.json`
- 復元スクリプト: `.claude/scripts/note/restore-from-r2.sh`
- 反映スキル: `.claude/skills/note/publish-note/`（`--update` モード = `references/update-mode.md`）
