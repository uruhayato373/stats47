---
name: e-Stat 賃金構造基本統計調査
description: 賃金構造基本統計調査(statsDataId:0003445758)の使い方 — 130超の職種別・都道府県別年収データ
type: reference
---

賃金構造基本統計調査（statsDataId: `0003445758`）は130超の職種を都道府県別に持つ貴重なデータソース。

**データ構造:**
- cat01: 性別（01=男女計, 02=男, 03=女）
- cat02: 職種コード（例: 1163=保育士, 1133=看護師, 1361=介護職員, 1121=医師, 1104=SE）
- tab: 40=きまって支給する現金給与額(千円), 44=年間賞与(千円)
- area: 都道府県（00000=全国, 01000〜47000）
- time: 年度（2020〜2023）

**年収計算:** `tab:40 × 12 + tab:44`（千円→万円は÷10）

**登録済みランキングキー:**
- nursery-teacher-annual-income, nurse-annual-income, care-worker-annual-income
- cleaning-worker-annual-income, software-engineer-annual-income, doctor-annual-income

**How to apply:** 引用RT・ブログ記事で職業別賃金データが必要な時に参照。e-Stat API でcdCat02に職種コードを指定して取得。
