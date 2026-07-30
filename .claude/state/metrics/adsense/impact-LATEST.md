# AdSense 施策 before/after（surface のみ・判定は improvement-triage）
# 最新スナップショット週: 2026-W30 / min-weeks=1

## ADSENSE-MOBILE-INCONTENT-01 — deployed 2026-06-14 (2026-W24)  [status: effect/pending]
  window: before=2026-W23 → after=2026-W30（6週経過）
  ⚠ after 窓を後発施策が汚染: ADSENSE-ANCHOR-01@2026-W27, ADSENSE-LAZYLOAD-01@2026-W27, ADSENSE-FOOTER-02@2026-W27, ADSENSE-SLOT-DEDUPE-01@2026-W27（この差分は本施策単独の効果ではない）
  account : RPM ¥50→¥34 (-32%) | viewability 61.2%→56.9% (-4.4pp) | earnings ¥119→¥129 (+8%) | imp/PV 0.88→1.07
  Desktop: RPM ¥56→¥35 (-38%) | viewability 62.9%→57.8% (-5.1pp) | 収益/click(legacy) ¥12.86→¥22.00
  Mobile : RPM ¥37→¥29 (-22%) | viewability 53.4%→51.2% (-2.2pp) | 収益/click(legacy) ¥1.08→¥1.52
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-ANCHOR-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W30（3週経過）
  account : RPM ¥53→¥34 (-36%) | viewability 67.7%→56.9% (-10.9pp) | earnings ¥139→¥129 (-7%) | imp/PV 0.71→1.07
  Desktop: RPM ¥66→¥35 (-47%) | viewability 69.8%→57.8% (-11.9pp) | 収益/click(legacy) ¥22.00→¥22.00
  Mobile : RPM ¥30→¥29 (-3%) | viewability 57.3%→51.2% (-6.1pp) | 収益/click(legacy) ¥1.42→¥1.52
  signal : 収益↓ なのに imp↑ = dilution の兆候（NEGATIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-LAZYLOAD-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W30（3週経過）
  account : RPM ¥53→¥34 (-36%) | viewability 67.7%→56.9% (-10.9pp) | earnings ¥139→¥129 (-7%) | imp/PV 0.71→1.07
  Desktop: RPM ¥66→¥35 (-47%) | viewability 69.8%→57.8% (-11.9pp) | 収益/click(legacy) ¥22.00→¥22.00
  Mobile : RPM ¥30→¥29 (-3%) | viewability 57.3%→51.2% (-6.1pp) | 収益/click(legacy) ¥1.42→¥1.52
  signal : 収益↓ なのに imp↑ = dilution の兆候（NEGATIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-FOOTER-02 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W30（3週経過）
  account : RPM ¥53→¥34 (-36%) | viewability 67.7%→56.9% (-10.9pp) | earnings ¥139→¥129 (-7%) | imp/PV 0.71→1.07
  Desktop: RPM ¥66→¥35 (-47%) | viewability 69.8%→57.8% (-11.9pp) | 収益/click(legacy) ¥22.00→¥22.00
  Mobile : RPM ¥30→¥29 (-3%) | viewability 57.3%→51.2% (-6.1pp) | 収益/click(legacy) ¥1.42→¥1.52
  signal : 収益↓ なのに imp↑ = dilution の兆候（NEGATIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-SLOT-DEDUPE-01 — deployed 2026-07-05 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W30（3週経過）
  account : RPM ¥53→¥34 (-36%) | viewability 67.7%→56.9% (-10.9pp) | earnings ¥139→¥129 (-7%) | imp/PV 0.71→1.07
  Desktop: RPM ¥66→¥35 (-47%) | viewability 69.8%→57.8% (-11.9pp) | 収益/click(legacy) ¥22.00→¥22.00
  Mobile : RPM ¥30→¥29 (-3%) | viewability 57.3%→51.2% (-6.1pp) | 収益/click(legacy) ¥1.42→¥1.52
  signal : 収益↓ なのに imp↑ = dilution の兆候（NEGATIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

---
## 自動計測から除外（no silent drop）
- ADSENSE-CYCLE-02 [pending]: deploy 日を抽出できず
- ADSENSE-LAZYLOAD-02 [pending]: deploy 日を抽出できず
- ADSENSE-HUB-INCONTENT-01 [pending]: deploy 日を抽出できず
