---
name: optimize-themes
description: テーマダッシュボードを継続最適化する（GSC/GA4 + 競合調査 + ギャップ分析 → 優先度付きアクション）。Use when user says "テーマ最適化", "ダッシュボード改善". 4軸分析で改善アクション出力.
disable-model-invocation: true
argument-hint: "[theme-key] | --all"
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch
primary_agent: theme-component-builder
---

# テーマの継続改善

`manage-theme-portfolio/reference/テーマポートフォリオ運用.md` と
`.claude/state/themes/README.md` を正典とする。

1. `npm run theme:portfolio:audit` を実行し、全現行テーマの構成、公開値、前回退行、
   GSCとJapan-only GA4、期日を確認する。変化のない警告を毎回新規課題にしない。
2. 新規の取得失敗・単位/期間誤表示・履歴消失を最優先にする。公式資料で定義を確認し、
   対応ownerの最小修正→生成→対象テスト→型検査→localhost表示で閉じる。
3. 月次は一次資料の更新を全テーマで確認し、主指標に未取得の新年がないか調べる。
   追加は既存指標との重複、47県適合、分母、対象年、取得再現性、問いへの寄与で採否を決める。
4. 構成は「概況→問いごとの章（数値・図・短い注意・地図等）→詳細指標→関連/出典」。
   全テーマに同じ指標数・図数を強制しない。単年は同時点比較にし、異なる期間や母集団を同一尺度に混ぜない。
5. 効果判定は重複しない28日窓2本。GA4は `pages-clean.csv` と成功/期間/国条件メタが揃ったもののみ。
   行欠落は未測定、低標本はカウントだけで、滞在30秒等の単独閾値から原因を断定しない。
6. 公開後d7は品質、d28は暫定、d56で効果を判定する。公開日は実際の反映後に実験へ記録する。
   変更のない週は通知せず、異常・修正・復旧・判断が必要な時だけ報告する。

指標/章は theme-designer、図は theme-component-builder、UIは theme-ui-manager、
観測は data-ingester、施策台帳は improvement-triage、公開は既存公開ownerへ渡す。
R2 push・本番デプロイの実行はセッションの承認範囲とbranch-workflowに従う。
