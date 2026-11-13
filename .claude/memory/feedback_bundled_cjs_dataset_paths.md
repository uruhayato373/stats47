---
name: feedback_bundled_cjs_dataset_paths
description: 管理画面のビルドで CJS の __dirname が /ROOT になり、台帳が ENOENT になる。CLI の直接実行だけでなく仮想パスとアプリ cwd の回帰テストで確認する
metadata:
  type: feedback
---

**問題**: 管理画面の本番ビルドが `/api/assets/summary` の page data 収集中に失敗した。CLI と型検査は通っていた。

**原因**: 共通の `prefectures.cjs` が `__dirname` から台帳の絶対パスを作っていた。Turbopack の出力では `/ROOT` という仮想パスになり、実ファイルの `fs.readFileSync` が ENOENT になった。組み立てたパスの `require` を `readFileSync` に変えるだけでは解決しない。

**対策**: 台帳の相対パスは `datasetPath("areas.prefectures")` で引く。CLI のモジュール位置に実体が無ければ、起動ディレクトリから親をたどって実体を解決する。見つからなければ停止し、空配列で正常扱いしない。`.claude/scripts/lib/__tests__/prefectures.test.cjs` が仮想 `__dirname`・root/apps/admin の cwd・リポジトリ外からの CLI・欠落時の停止を検証する。bundler 経由で使う共有スクリプトの修正時は対象アプリのビルドも確認する。

**証拠**: 2026-11-12、PR #1252 の Admin Build & E2E job 131170170663。`node --test .claude/scripts/lib/__tests__/prefectures.test.cjs`。
