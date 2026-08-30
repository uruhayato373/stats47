---
title: よく使う県ほど、家計の負債も多いのか
seoTitle: "消費支出・負債現在高・平均消費性向の都道府県差を比較"
description: 消費支出、負債現在高、平均消費性向を都道府県別に比較し、支出の大きさと家計行動を分けて検証する企画です。
slug: household-spending-debt-propensity-gap
published: false
archetype: B
tags: []
referenceSourcePlan: true
planSummary: "消費支出・負債現在高・平均消費性向を分け、支出水準と家計余力を同一視できるか検証する"
---

## 企画仮説

消費支出が大きい県でも、所得に占める消費の割合や負債残高は異なる可能性があります。金額の大きさと家計の余力を分けて見ることで、「支出が多い県ほど豊か」という短絡を避けられます。

## 使用する一次データ

- [消費支出](/ranking/consumption-expenditure-multi-person-households-per-month)
- [負債現在高](/ranking/current-liabilities-balance-multi-person-households-per-household)
- [平均消費性向](/ranking/avg-propensity-to-consume-worker-households)

参考文献の値は使わず、家計調査の一次資料、世帯区分、月額・年額、名目値の定義を確認し、R2観測値へ接地します。

## 検証する論点

1. 二人以上の世帯と勤労者世帯など、3指標の母集団差を比較上どう扱うか。
2. 住宅ローンを含む負債残高と月間消費支出を同じ尺度と誤認させないか。
3. 所得・物価・世帯人数を考慮すると、見かけの関係がどう変わるか。

## 想定構成

消費支出と負債現在高のランキング、平均消費性向を加えた比較、母集団差と物価の影響、家計余力を読む際の限界の順に構成します。

## 公開前ゲート

> [!NOTE]
> 3指標は世帯区分、集計期間、単位が同一とは限りません。比較可能条件を一次資料で確定し、揃わない値は同じ散布図へ載せません。

> [!WARNING]
> 負債が多いことを家計困窮と同義にしません。住宅資産、所得、年齢構成を確認せずに因果や優劣を断定しません。

一次資料、母集団・単位、相関snapshot、R2接地、SVG、quality gate、独立critic PASSを満たすまで`published:false`を維持します。
