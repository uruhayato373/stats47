# AdSense 施策 before/after（surface のみ・判定は improvement-triage）
# 最新スナップショット週: 2026-W29 / min-weeks=1

## ADSENSE-MOBILE-INCONTENT-01 — deployed 2026-06-14 (2026-W24)  [status: effect/pending]
  window: before=2026-W23 → after=2026-W29（5週経過）
  ⚠ after 窓を後発施策が汚染: ADSENSE-ANCHOR-01@2026-W27, ADSENSE-LAZYLOAD-01@2026-W27, ADSENSE-FOOTER-02@2026-W27, ADSENSE-SLOT-DEDUPE-01@2026-W27（この差分は本施策単独の効果ではない）
  account : RPM ¥50→¥42 (-16%) | viewability 61.2%→57.5% (-3.7pp) | earnings ¥119→¥162 (+36%) | imp/PV 0.88→1.23
  Desktop: RPM ¥56→¥48 (-14%) | viewability 62.9%→58.3% (-4.7pp) | CPC ¥12.86→¥25.60
  Mobile : RPM ¥37→¥28 (-24%) | viewability 53.4%→51.2% (-2.2pp) | CPC ¥1.08→¥1.18
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-ANCHOR-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W29（2週経過）
  account : RPM ¥53→¥42 (-21%) | viewability 67.7%→57.5% (-10.2pp) | earnings ¥139→¥162 (+17%) | imp/PV 0.71→1.23
  Desktop: RPM ¥66→¥48 (-27%) | viewability 69.8%→58.3% (-11.5pp) | CPC ¥22.00→¥25.60
  Mobile : RPM ¥30→¥28 (-7%) | viewability 57.3%→51.2% (-6.1pp) | CPC ¥1.42→¥1.18
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-LAZYLOAD-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W29（2週経過）
  account : RPM ¥53→¥42 (-21%) | viewability 67.7%→57.5% (-10.2pp) | earnings ¥139→¥162 (+17%) | imp/PV 0.71→1.23
  Desktop: RPM ¥66→¥48 (-27%) | viewability 69.8%→58.3% (-11.5pp) | CPC ¥22.00→¥25.60
  Mobile : RPM ¥30→¥28 (-7%) | viewability 57.3%→51.2% (-6.1pp) | CPC ¥1.42→¥1.18
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-FOOTER-02 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W29（2週経過）
  account : RPM ¥53→¥42 (-21%) | viewability 67.7%→57.5% (-10.2pp) | earnings ¥139→¥162 (+17%) | imp/PV 0.71→1.23
  Desktop: RPM ¥66→¥48 (-27%) | viewability 69.8%→58.3% (-11.5pp) | CPC ¥22.00→¥25.60
  Mobile : RPM ¥30→¥28 (-7%) | viewability 57.3%→51.2% (-6.1pp) | CPC ¥1.42→¥1.18
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-SLOT-DEDUPE-01 — deployed 2026-07-05 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W29（2週経過）
  account : RPM ¥53→¥42 (-21%) | viewability 67.7%→57.5% (-10.2pp) | earnings ¥139→¥162 (+17%) | imp/PV 0.71→1.23
  Desktop: RPM ¥66→¥48 (-27%) | viewability 69.8%→58.3% (-11.5pp) | CPC ¥22.00→¥25.60
  Mobile : RPM ¥30→¥28 (-7%) | viewability 57.3%→51.2% (-6.1pp) | CPC ¥1.42→¥1.18
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

---
## 自動計測から除外（no silent drop）
- ADSENSE-LAZYLOAD-02 [pending]: 未稼働（人間タスク/未デプロイ）
- ADSENSE-HUB-INCONTENT-01 [pending]: 未稼働（人間タスク/未デプロイ）
