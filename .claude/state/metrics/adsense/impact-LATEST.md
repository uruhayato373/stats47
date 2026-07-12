# AdSense 施策 before/after（surface のみ・判定は improvement-triage）
# 最新スナップショット週: 2026-W28 / min-weeks=1

## ADSENSE-MOBILE-INCONTENT-01 — deployed 2026-06-14 (2026-W24)  [status: effect/pending]
  window: before=2026-W23 → after=2026-W28（4週経過）
  ⚠ after 窓を後発施策が汚染: ADSENSE-ANCHOR-01@2026-W27, ADSENSE-LAZYLOAD-01@2026-W27, ADSENSE-FOOTER-02@2026-W27, ADSENSE-SLOT-DEDUPE-01@2026-W27（この差分は本施策単独の効果ではない）
  account : RPM ¥50→¥46 (-8%) | viewability 61.2%→52.7% (-8.5pp) | earnings ¥119→¥169 (+42%) | imp/PV 0.88→1.26
  Desktop: RPM ¥56→¥53 (-5%) | viewability 62.9%→56.0% (-7.0pp) | CPC ¥12.86→¥22.67
  Mobile : RPM ¥37→¥27 (-27%) | viewability 53.4%→37.0% (-16.4pp) | CPC ¥1.08→¥1.26
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-ANCHOR-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W28（1週経過）
  account : RPM ¥53→¥46 (-13%) | viewability 67.7%→52.7% (-15.0pp) | earnings ¥139→¥169 (+22%) | imp/PV 0.71→1.26
  Desktop: RPM ¥66→¥53 (-20%) | viewability 69.8%→56.0% (-13.8pp) | CPC ¥22.00→¥22.67
  Mobile : RPM ¥30→¥27 (-10%) | viewability 57.3%→37.0% (-20.3pp) | CPC ¥1.42→¥1.26
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-LAZYLOAD-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W28（1週経過）
  account : RPM ¥53→¥46 (-13%) | viewability 67.7%→52.7% (-15.0pp) | earnings ¥139→¥169 (+22%) | imp/PV 0.71→1.26
  Desktop: RPM ¥66→¥53 (-20%) | viewability 69.8%→56.0% (-13.8pp) | CPC ¥22.00→¥22.67
  Mobile : RPM ¥30→¥27 (-10%) | viewability 57.3%→37.0% (-20.3pp) | CPC ¥1.42→¥1.26
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-FOOTER-02 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W28（1週経過）
  account : RPM ¥53→¥46 (-13%) | viewability 67.7%→52.7% (-15.0pp) | earnings ¥139→¥169 (+22%) | imp/PV 0.71→1.26
  Desktop: RPM ¥66→¥53 (-20%) | viewability 69.8%→56.0% (-13.8pp) | CPC ¥22.00→¥22.67
  Mobile : RPM ¥30→¥27 (-10%) | viewability 57.3%→37.0% (-20.3pp) | CPC ¥1.42→¥1.26
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-SLOT-DEDUPE-01 — deployed 2026-07-05 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W28（1週経過）
  account : RPM ¥53→¥46 (-13%) | viewability 67.7%→52.7% (-15.0pp) | earnings ¥139→¥169 (+22%) | imp/PV 0.71→1.26
  Desktop: RPM ¥66→¥53 (-20%) | viewability 69.8%→56.0% (-13.8pp) | CPC ¥22.00→¥22.67
  Mobile : RPM ¥30→¥27 (-10%) | viewability 57.3%→37.0% (-20.3pp) | CPC ¥1.42→¥1.26
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

---
## 自動計測から除外（no silent drop）
- ADSENSE-LAZYLOAD-02 [pending]: 未稼働（人間タスク/未デプロイ）
- ADSENSE-HUB-INCONTENT-01 [pending]: 未稼働（人間タスク/未デプロイ）
