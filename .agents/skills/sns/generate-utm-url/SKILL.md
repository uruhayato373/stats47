---
name: generate-utm-url
description: SNS や note 記事の stats47.jp リンクに付与する UTM パラメータの生成ルールを提供する。Use when user says "UTM生成", "UTMパラメータ". 各 post-* スキルから参照される.
disable-model-invocation: true
primary_agent: sns-metrics-sync
---

UTM 生成ルールの正典は **`.Codex/rules/sns-content-standards.md` §4 (UTM 規則)** に移管した。
本スキルはそこを指す薄いエイリアス。各 `/post-*` スキルはこの名前で参照してよい。

## 要約 (詳細は rules §4)

- SNS リンクには UTM を付ける。**note は付けない** (素の URL)
- `utm_source` = `x` / `instagram` / `youtube`、`utm_medium` = `social`
- `utm_campaign` = ranking `<rankingKey>` / compare `compare-<A>-vs-<B>` / correlation `correlation-<X>--<Y>`
- `utm_content` = `<template>` (例 `shock` / `paradox`)。YouTube pinned_comment は `<template>-pinned`

例:
```
https://stats47.jp/ranking/taxable-income-per-capita?utm_source=x&utm_medium=social&utm_campaign=taxable-income-per-capita&utm_content=shock
```

正典 (ベース URL 表・全パラメータ・note の扱い): `.Codex/rules/sns-content-standards.md` §4。
