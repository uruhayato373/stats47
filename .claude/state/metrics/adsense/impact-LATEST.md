# AdSense 施策 before/after（surface のみ・判定は improvement-triage）
# 最新スナップショット週: 2026-W27 / min-weeks=1

## ADSENSE-MOBILE-INCONTENT-01 — deployed 2026-06-14 (2026-W24)  [status: effect/pending]
  window: before=2026-W23 → after=2026-W27（3週経過）
  ⚠ after 窓を後発施策が汚染: ADSENSE-ANCHOR-01@2026-W27, ADSENSE-LAZYLOAD-01@2026-W27, ADSENSE-FOOTER-02@2026-W27, ADSENSE-SLOT-DEDUPE-01@2026-W27（この差分は本施策単独の効果ではない）
  account : RPM ¥50→¥45 (-10%) | viewability 61.2%→60.9% (-0.3pp) | earnings ¥119→¥128 (+8%) | imp/PV 0.88→0.93
  Desktop: RPM ¥56→¥50 (-11%) | viewability 62.9%→70.4% (+7.4pp) | CPC ¥12.86→¥15.83
  Mobile : RPM ¥37→¥33 (-11%) | viewability 53.4%→39.1% (-14.3pp) | CPC ¥1.08→¥1.38
  signal : 収益↑（POSITIVE 方向・要 triage 確認）  ※交絡/汚染ありのため単独判定不可（triage 参照）

## ADSENSE-ANCHOR-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  → まだ計測不能: post-deploy 週が不足（before=2026-W26 はあるが after が 0週 < min 1週）。 W28+ の snapshot 到着後に再実行。

## ADSENSE-LAZYLOAD-01 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-FOOTER-02, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  → まだ計測不能: post-deploy 週が不足（before=2026-W26 はあるが after が 0週 < min 1週）。 W28+ の snapshot 到着後に再実行。

## ADSENSE-FOOTER-02 — deployed 2026-07-03 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-SLOT-DEDUPE-01 と同時投入（単独帰属不可）
  → まだ計測不能: post-deploy 週が不足（before=2026-W26 はあるが after が 0週 < min 1週）。 W28+ の snapshot 到着後に再実行。

## ADSENSE-SLOT-DEDUPE-01 — deployed 2026-07-05 (2026-W27)  [status: effect/pending]  ⚠ 交絡: ADSENSE-ANCHOR-01, ADSENSE-LAZYLOAD-01, ADSENSE-FOOTER-02 と同時投入（単独帰属不可）
  → まだ計測不能: post-deploy 週が不足（before=2026-W26 はあるが after が 0週 < min 1週）。 W28+ の snapshot 到着後に再実行。

---
## 自動計測から除外（no silent drop）
- ADSENSE-LAZYLOAD-02 [pending]: 未稼働（人間タスク/未デプロイ）
- ADSENSE-HUB-INCONTENT-01 [pending]: 未稼働（人間タスク/未デプロイ）
