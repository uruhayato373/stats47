---
name: fetch-note-metrics
description: note.com/dashboardから記事別インプレッション・PV・スキ・コメント・売上を期間指定で収集し、カバー監査と突合する。Use when user says "noteメトリクス", "note統計", "note ビュー数取得", "fetch-note-metrics". stats47専用Chrome Profile 5を使用する読み取り専用CLI。
disable-model-invocation: true
primary_agent: sns-metrics-sync
---

noteの現行ダッシュボードを読み、期間・記事数・合計・カバー状態の照合結果を保存する。
[2026-09-08の公式変更](https://note.com/info/n/n39880d8a9c57)で旧ビューがインプレッションとPVへ
分離されたため、新しい値はschemaVersion 2として旧`views`と分ける。旧形式へ別名で保存しない。

## 前提

- Chrome **Profile 5**にstats47のログインがあること。未ログインならユーザーのログインが必要。
- `~/.browser-use-env/bin/browser-use`を使用する。別の場所なら`BROWSER_USE_BIN`で指定する。
- アカウント設定画面の`note ID === stats47`と全記事URLの帰属を照合する。不一致なら取得を止める。
- カバー突合には24時間以内の全量監査結果が必要。未設定があっても監査の取得範囲が完全なら利用できる。

## 実行

```bash
# 最初にカバー状態を更新（exit 1=未設定/集合差分、2=取得不完全）
npm run note:covers:audit
# JSTの昨日までの28日間。上の未設定exit 1でこの計測を止めない。
npm run note:metrics:fetch
# 同じ日付の再取得、実験の変更前後14日など
npm run note:metrics:fetch -- --start 2026-08-15 --end 2026-09-11
# 取得・突合ロジックのテスト
npm run note:metrics:test
```

旧入口`bash .claude/scripts/note/fetch-note-metrics.sh`も新CLIへ委譲する。
`--output-dir PATH`と`--cover-audit PATH`で保存先・監査入力を指定できる。
デフォルトProfile以外を使う必要がある場合のみ`--profile NAME`を指定する。帰属チェックは省略できない。

## 収集と検証

1. stats47を確認して`https://note.com/dashboard`のカスタム期間を開く。
2. URLと可視の選択期間、JST、記事/サマリー集計時刻を照合する。当日・未来日・2021-05-01より前を拒否する。
3. `記事一覧`テーブルだけを読み、ヘッダー名で5指標を対応付ける。列変更・空欄・未知表記は失敗にする。
   桁区切りを除いて数値化する。現行UIの`-`は実測0、存在しない行は欠測として分離する。
4. 「もっとみる」を終端まで開く。読み込み中の一時消失後は再表示を確認して継続する。
   取得の重複・停止・上限到達を成功扱いしない。
5. 公開記事カタログと突合し、未登録・欠落・公開状態の差分を残す。
   行合計は画面のインプレッション/PV/スキ/コメントと一致させる。
   全体売上には記事以外も含むため、`totals.salesJpy`は記事行合計、`dashboardTotals.salesJpy`は別保存する。
6. 最新カバー監査と記事IDで結合し、表示量順の棚卸し一覧を生成する。
   比較に必要な値や画像が未取得なら候補にしない。`baselineEligible`は全期間公開・表示ありの粗い条件であり、
   実験への割当・母数充足・他施策の除外を済ませた意味ではない。

集計定義・確定時刻は[公式ヘルプ](https://www.help-note.com/hc/ja/articles/360010324194)、
記事一覧は[公式ヘルプ](https://www.help-note.com/hc/ja/articles/61982766676121)を参照する。
カバーの指標・比較契約は[`note戦略.md`](../../../../../docs/30_note記事企画/note戦略.md#カバー改善のkpiと比較方法)が正典。
PV/インプレッションをカバーCTRにしない。流入元別PV・記事内クリック・読了はこのCLIでは未取得。

## 出力

`.claude/state/metrics/note/dashboard/`へatomic保存する。

| ファイル | 内容 |
|---|---|
| `<開始日>_<終了日>_<取得時刻>.json` | 取得ごとのschemaVersion 2履歴。期間、集計時刻、articles、totals、coverage、issues、raw DOM値 |
| `latest.json` | 最新の取得試行。失敗でも更新して古い成功を最新に見せない |
| `cover-metrics-latest.json` | カバー×新指標の棚卸し。未設定/既存見直し/要調査、記事別欠測を明示 |
| `cover-metrics-latest.csv` | 全公開記事の確認用一覧。実測0は0、欠測は空欄。計測状態列で区別 |

**終了コード**: `0`=計測とカバー突合が完全、`2`=不完全またはエラー。exit 2だけでログイン切れと決めず、`issues`を見る。

一覧の欠落だけが残り、全ページ終端と合計一致を確認できた場合、取得済みの記事は棚卸しに利用する。
ただし全体は`incomplete`のまま、欠落記事は`metricsAvailability: missing_period_row`、指標`null`、
`baselineEligible: false`にする。期間を広げて表示されても元の期間を0埋めしない。
列・帰属・合計・鮮度に異常がある場合は、突合一覧を比較に利用しない。

## 終了時クリーンアップ

CLIは実行ごとのnamed sessionを使い、正常・異常終了とも自分のsessionを`close`する。
2026-09-12のインストール済みbrowser-useでは`close`がdaemon停止を要求する実装だが、
session一覧が0でもOSプロセスが残る事例を確認した。OSのPIDも確認し、残存時は自分のdaemonと
子プロセスだけを停止し、自分が複製したprofileだけを削除する。
他のtaskのdaemonやユーザーのChromeタブをglobalな`pkill`やAppleScriptで閉じない。

## ログイン切れ

`collection_failed`の理由が`login_required`またはアカウント確認タイムアウトなら、Profile 5で
[アカウント設定](https://note.com/settings/account)を開き、note IDを確認する。再認証はユーザー工程。
他アカウントにログインしたまま再実行しない。

本CLIはローカルの読み取り専用収集。週次実行や実験の開始は自動登録しない。
