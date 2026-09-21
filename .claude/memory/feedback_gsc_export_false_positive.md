---
name: GSC exportはファイル数でなく内容を照合する
description: 非表示理由行のクリック失敗で概要ZIPが詳細として保存され、CIが偽成功した事故と再発防止
type: feedback
---

## 問題

2026-09-21、GSCの5分類exportが成功表示でも「検出 - インデックス未登録」は概要ZIPだった。CI run 35554816770の旧`coverage-export`成功も完全取得の証拠に使えない。

## 原因

理由一覧は12行だが初期表示10行。非表示行のクリック失敗を握りつぶし、概要画面のexportへ進んだ。SPAの見出しとexportボタンの描画にも時間差がある。

## 対策

`export-coverage-playwright.mjs`は表示25行へ変更し、詳細URL・property・見出し一致を必須化する。ボタンは自動待機付きlocatorで操作する。概要1個+詳細5個を別々に取得し、`ingest-gsc-export.py --require-actionable`が今回のZIPだけから分類・概要件数（UI上限1000）・重複・stats47.jpドメイン帰属を照合する。`sc-domain`なのでwww/storage等のサブドメインも含むが、類似ドメインは拒否する。欠測を古い出力で補完しない。capabilityを`verified-coverage-export`へ改め、health・restoreとも旧方式の成功を拒否する。

回帰テスト: `npm run measurement:test`（Python内容検査とUI遷移失敗を含む）。取得成功はサンプルURLの完全性までで、GSC上限を超える全URL取得やインデックス改善を意味しない。
