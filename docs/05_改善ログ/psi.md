---
type: improvement-log
metric: psi
created: 2026-05-16
updated: 2026-05-16
---

# PSI 改善ログ

施策ベースで append-only。新しい施策は最新を上に追加。判定が変わったら section 末尾に追記。

## [CWV-RANKING-LCP-01] ranking mobile LCP — map tile preload を lg 以上に限定

- **status**: pending
- **tier**: 1
- **target_metric**: psi-lcp
- **owner**: claude
- **deployed_at**: 2026-06-02 (PR #400)
- **due**: 2026-07-01 (4週後 PSI 検証)

### 施策

`/ranking/[rankingKey]` モバイル LCP 9,079ms の主因 = EXP-003 で追加した map tile preload が mobile でも実行されていた（モバイルは table がデフォルト表示で地図非表示なのに `fetchPriority="high"` の tile 4枚が帯域を専有）。preload link に `media="(min-width: 1024px)"` を追加し desktop 限定化。

### 想定効果 [根拠: tile 競合の排除]

- Mobile LCP: 9,079ms → ~4,000ms（tile fetch を可視コンテンツから分離）
- Desktop: 変化なし（media query 対象外）
- 対象: ranking 1,992 ページ

### 検証コマンド (PSI quota リセット後)

```bash
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/ranking/total-population&strategy=mobile&category=performance" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['lighthouseResult']['audits']['largest-contentful-paint']['displayValue'])"
```

期日 (2026-07-01) に LCP < 5,000ms なら effect/partial、< 3,500ms なら effect/full。

## [CWV-THEMES-CLS-01] themes Sankey placeholder の高さ予約を実SVG比率に修正

- **status**: pending
- **tier**: 1
- **target_metric**: psi-cls
- **owner**: claude
- **deployed_at**: 2026-06-02 (PR #407)
- **due**: 2026-07-01 (4週後 PSI 検証)

### 施策

`/themes/population-dynamics` CLS 0.514 / `/themes/local-economy` 0.530 の主因 = Migration/Commute/Finance Sankey のローディング placeholder が `aspect-[3/2]`(1.5) だが、HubSankey 実描画は `viewBox 1000×730`(≈1.37)。データ fetch 完了で SVG が placeholder より高くなり下方シフト。3つの placeholder を `aspect-[100/73]`（実SVG比率）に統一。

### 想定効果 [根拠: placeholder/描画の高さ一致]

- /themes/* の Sankey 由来 CLS を排除（population-dynamics は migration+commute の2図でシフト倍加していた）
- 2026-06-01 PSI batch 実測では既に 0.514 → 0.236 に低下、本修正で更に < 0.1 を狙う

### 検証コマンド

```bash
# 日次 PSI batch JSON から CLS を確認
python3 -c "import json,glob,os; f=sorted(glob.glob('.claude/state/metrics/psi/psi-batch-*.json'),key=os.path.getmtime)[-1]; d=json.load(open(f)); print([r['lab_data']['CLS'] for r in d['results'] if 'population-dynamics' in r['url'] and r['strategy']=='mobile'])"
```

