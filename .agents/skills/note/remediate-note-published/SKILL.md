---
name: remediate-note-published
domain: product
description: 公開中の note 記事を採点結果の並びから少量ずつ直す。旧文言のカード・型でない本文画像を、dry-run → 反映 → 採点し直しの繰り返しで是正する。Use when user says "note記事の是正", "note公開記事を直す", "採点の続き", "note監査の修正".
disable-model-invocation: true
argument-hint: "[dataset-card-wording | ranking-image-type] [本数 (既定 10)]"
primary_agent: note-manager
---

公開中の note 記事を、採点 (`npm run note:published:audit`) が出す並びの上から少量ずつ直す。新しい記事は作らないので 4 型の宣言は要らない (既存記事の型は変えない)。

判定と並びはスクリプトが決める。この手順はコマンドを流して結果を読むだけなので、**小さいモデル・低い effort で回す**。安全装置で止まった原因を調べるときだけ中位のモデルへ切り替える。配分の正典は `.claude/rules/model-prompting.md`。

## 入力

- 採点結果: `data/note/published-audit-latest.json` (土曜の `npm run weekly:audits` が測り直す)
- `queue` が直し方ごとの記事の並び (閲覧の多い順)。`tool` の `<key>` を記事キーに置き換えて使う

| `queue[].kind` | 直す道具 | 変わるもの |
|---|---|---|
| `dataset-card-wording` | `update-published-navigation.mjs --slug <key>` | カードの文言 1 段落と、本文のテキストリンクの UTM |
| `ranking-image-type` | `update-note-body-figures.mjs --key <key>` | 本文画像 3 枚 (文章・カード・タグ・カバーは変えない) |
| `ranking-image-type-no-chart-data` | 無い (`blocked`) | 固定コピーを作る手順ができるまで触らない |
| `semantic-review` | 無い (`blocked`) | `note-critic` に該当の段落と 47 県の値だけを渡す。この手順では直さない |

## 手順

1. `npm run note:session:check` で口座が `stats47` と確かめる。違えば止める。
2. 採点結果の `measuredAt` が 8 日より古ければ、先に `npm run note:published:audit` で測り直す (約 8 分・note へは書かない)。
3. 引数の種類 (既定 `dataset-card-wording`) の `queue[].keys` の上から本数分を取る。**1 回の実行は 10 本まで。**
4. 1 本ずつ次を行う。
   1. 道具を `--commit` なしで流し (dry-run)、対象が 1 本で、変わる項目が上の表のとおりか確かめる。
   2. `--commit` を付けて反映する。
   3. `node .claude/scripts/note/audit-note-published.mjs --key <key>` で、その違反コードが消えたことを確かめる。
5. 終わったら `npm run note:published:audit -- --check` で全件を測り直す。「上限を下げられる」と出たコードは `.claude/config/note-published-baseline.json` を実測値まで下げる (縮小専用。上げない)。
6. `.claude/todo/backlog.md` の `NOTE-PUBLISHED-AUDIT-01` に、直した本数と残りの本数を 1 行で追記する。

## 止める条件

- 道具が安全装置で止まったら (`FAIL`)、**同じ記事を再実行で押し通さない**。その記事を飛ばし、止まった文言を記録して次へ進む。
- 続けて 2 本止まったら全体を止めて報告する。原因は公開本文と編集画面の本文の差にあることが多い (2026-11-11: 空のカード要素の空白 1 文字。`canonicalizeNoteEditorBody` で吸収済み)。
- 止まった記事は編集画面を開いた影響で未公開の下書きが残ることがある。公開版は変わらないが、次の更新を止めるので報告に含める。
- 公開 API が 403 を返したら、その日は止める (大量操作で 403 になった実例がある)。
- 有料記事は `update-note-body-figures.mjs` が自分で止める。止まるのが正しい。

## 報告

反映した記事の数・飛ばした記事と理由・測り直した後の違反コードごとの本数を、完全な文で報告する。反映していないものを反映済みと書かない。

## 関連

- 採点の判定と減点: `.claude/scripts/note/lib/published-audit.mjs`
- 本文画像の型と差し替えの契約: `.claude/rules/note-image-assets.md`「ランキング記事の本文画像 3 枚」
- 進捗のカード: `NOTE-PUBLISHED-AUDIT-01`・`NOTE-FIGURE-ROLLOUT-01`
