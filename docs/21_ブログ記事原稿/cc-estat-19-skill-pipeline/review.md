---
slug: cc-estat-19-skill-pipeline
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-21
---

## 評価サマリ

Claude Code シリーズ Part 19 の開発 how-to 記事です。「15本の図を毎週ほったらかしで最新化」という課題提示から、4段パイプライン (fetch→transform→render→push) を独立 Skill 化し、GitHub Actions cron・Secrets 管理・失敗時 Issue 起票・段単位の部分再実行へと一貫した筋で展開しており、読者が実際に再現できる完結したチュートリアルになっています。アーキテクチャ図・YAML・TypeScript・Skill 定義が具体的で、「なぜモノリシック shell を避けるか」「なぜ並列度3か」「Secret マスクを base64 がすり抜ける」など非自明な設計理由と落とし穴が随所にあり、水増しや図表重複はありません。本記事はデータランキング記事 (アーキタイプ A-E) ではなくインフラ/自動化チュートリアルのサブ型で、姉妹記事 `cc-estat-18-cache-r2` 同様 SVG 0 が妥当 (記事価値はコード・構成にある)。callout 4 個は各々独立した読み違い防止知識を持ち定型反復ではありません。

## 指摘

- [MINOR] state/config パスの自己矛盾。Skill 仕様 (本文の `weekly-refresh` 手順) では対象 statsDataId リストを `.claude/state/weekly-refresh-targets.json` に置くと2箇所で明記する一方、「つまずきポイント 3」の規約では「設定 (statsDataId リスト、閾値) は `.claude/config/` に置く」と述べており、同じ targets ファイルの置き場所が config か state かで食い違います。修正案: 手順側のパスを `.claude/config/weekly-refresh-targets.json` に統一する (記事が後段で打ち出す config/state 分類規約に合わせる) か、つまずきポイント側の「設定」例から statsDataId リストを外す。
- [MINOR] e-Stat レート制限の表現。「公式に明示されたレート制限は緩いのですが、実測では同時5接続を超えると不安定」は経験則ベースで妥当だが、`evidence-based-judgment` 観点では「実測 (取得日)」を一言添えると主張が強くなる。チュートリアルの体験談として許容範囲のため修正必須ではない。

## 判定理由

curiosity gap タイトルは本文の自動化ペイロードと一致し釣りではない。cron のタイムゾーン換算 (UTC 11:00 = JST 日曜 20:00、UTC 21:00 = JST 月曜 06:00、誤記例の UTC 20:00 = JST 翌日05時) はすべて算術的に正しい。内部リンク4本 (Part 2/Part 3/Part 20/category/ict) はいずれも実在し Part 3 は R2 で 200 を返す。ですます調は地の文で一貫 (である調検出 0、常体ヒットは code fence 内のみ)、markdown 表・インライン SVG・chart-placeholder・記事内「関連」見出しはなく、prose 8,097字で水増しなし。残る指摘はいずれも MINOR (内部整合の1行修正) で、読者の再現性・読者価値を損なう BLOCK 級の問題はないため PASS とする。
