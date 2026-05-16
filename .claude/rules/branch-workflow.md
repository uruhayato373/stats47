# ブランチ運用ルール

## フロー

```
feature/* ──(PR 必須)──▶ develop ──(直接 merge)──▶ main（デプロイ）
```

## ルール

- **feature/***: 機能ブランチ。develop から分岐し、**PR 経由でのみ develop にマージ**する。マージ後は削除
- **develop**: 統合ブランチ。feature/* からの PR を受け入れる。**develop 直接 push は禁止**。`gh pr create --base develop` で PR を出し、`.github/workflows/pr-quality-check.yml` の CI が pass してからマージ
- **main**: 本番デプロイブランチ。develop からの直接 merge のみ（Cloudflare Pages トリガー）。直接コミット・push しない

## デプロイ

- `/deploy` スキルで実行
- フロー: feature push → PR → develop → main マージ + push → 必要なら `/purge-cdn`

## DB データ反映フロー

**リモート D1 は 2026-04-29 に解約済み（D1 残数 = 0）。** 本番は R2 スナップショット配信のみ。

```
ローカル D1（source of truth）──/sync-snapshots──▶ R2 snapshot──▶ 本番配信
```

- データ変更後は `/sync-snapshots` で R2 スナップショットを再生成・push する
- ranking-values（~30K files）の更新は時間がかかるため `SKIP_VALUES=1` で他のみ更新し、必要な場合のみフル実行
- ロールバックは R2 の旧 snapshot ファイルへの上書き push で対応
