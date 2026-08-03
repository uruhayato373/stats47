# AdSense 施策 before/after（surface のみ・判定は improvement-triage）
# 最新スナップショット週: 2026-W31 / min-weeks=1

## ADSENSE-MOBILE-INCONTENT-01 — deployed 2026-06-14 (2026-W24)  [status: effect/pending]
  window: before=2026-W23 → after=2026-W31（7週経過）
  ⚠ after 窓を後発施策が汚染: ADSENSE-ANCHOR-01@2026-W27, ADSENSE-LAZYLOAD-01@2026-W27, ADSENSE-FOOTER-02@2026-W27, ADSENSE-SLOT-DEDUPE-01@2026-W27（この差分は本施策単独の効果ではない）
  account : RPM ¥50→¥36 (-28%) | viewability 61.2%→54.3% (-7.0pp) | earnings ¥119→¥146 (+23%) | imp/PV 0.88→1.04
  Desktop: RPM ¥56→¥38 (-32%) | viewability 62.9%→56.6% (-6.3pp) | 収益/click(legacy) ¥12.86→¥11.78 | 公式CPC ¥12.00
  Mobile : RPM ¥37→¥30 (-19%) | viewability 53.4%→44.2% (-9.2pp) | 収益/click(legacy) ¥1.08→¥1.42 | 公式CPC ¥1.00
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-ANCHOR-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W31（4週経過）
  account : RPM ¥53→¥36 (-32%) | viewability 67.7%→54.3% (-13.5pp) | earnings ¥139→¥146 (+5%) | imp/PV 0.71→1.04
  Desktop: RPM ¥66→¥38 (-42%) | viewability 69.8%→56.6% (-13.2pp) | 収益/click(legacy) ¥22.00→¥11.78 | 公式CPC ¥12.00
  Mobile : RPM ¥30→¥30 (+0%) | viewability 57.3%→44.2% (-13.1pp) | 収益/click(legacy) ¥1.42→¥1.42 | 公式CPC ¥1.00
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-LAZYLOAD-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W31（4週経過）
  account : RPM ¥53→¥36 (-32%) | viewability 67.7%→54.3% (-13.5pp) | earnings ¥139→¥146 (+5%) | imp/PV 0.71→1.04
  Desktop: RPM ¥66→¥38 (-42%) | viewability 69.8%→56.6% (-13.2pp) | 収益/click(legacy) ¥22.00→¥11.78 | 公式CPC ¥12.00
  Mobile : RPM ¥30→¥30 (+0%) | viewability 57.3%→44.2% (-13.1pp) | 収益/click(legacy) ¥1.42→¥1.42 | 公式CPC ¥1.00
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-FOOTER-02 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W31（4週経過）
  account : RPM ¥53→¥36 (-32%) | viewability 67.7%→54.3% (-13.5pp) | earnings ¥139→¥146 (+5%) | imp/PV 0.71→1.04
  Desktop: RPM ¥66→¥38 (-42%) | viewability 69.8%→56.6% (-13.2pp) | 収益/click(legacy) ¥22.00→¥11.78 | 公式CPC ¥12.00
  Mobile : RPM ¥30→¥30 (+0%) | viewability 57.3%→44.2% (-13.1pp) | 収益/click(legacy) ¥1.42→¥1.42 | 公式CPC ¥1.00
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-SLOT-DEDUPE-01 — deployed 2026-07-05 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02 と同時投入（単独帰属不可）
  window: before=2026-W26 → after=2026-W31（4週経過）
  account : RPM ¥53→¥36 (-32%) | viewability 67.7%→54.3% (-13.5pp) | earnings ¥139→¥146 (+5%) | imp/PV 0.71→1.04
  Desktop: RPM ¥66→¥38 (-42%) | viewability 69.8%→56.6% (-13.2pp) | 収益/click(legacy) ¥22.00→¥11.78 | 公式CPC ¥12.00
  Mobile : RPM ¥30→¥30 (+0%) | viewability 57.3%→44.2% (-13.1pp) | 収益/click(legacy) ¥1.42→¥1.42 | 公式CPC ¥1.00
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

---
## 自動計測から除外（no silent drop）
- ADSENSE-CYCLE-02 [pending]: deploy 日を抽出できず
- ADSENSE-LAZYLOAD-02 [pending]: deploy 日を抽出できず
- ADSENSE-HUB-INCONTENT-01 [pending]: deploy 日を抽出できず
