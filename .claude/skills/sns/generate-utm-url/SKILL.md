---
name: generate-utm-url
description: SNS や note 記事の stats47.jp リンクに付与する UTM パラメータの生成ルールを提供する。Use when user says "UTM生成", "UTMパラメータ". 各 post-* スキルから参照される.
disable-model-invocation: true
---

SNS 投稿・note 記事で使用する stats47.jp リンクの UTM パラメータ生成ルール。
各 `/post-*` スキルから参照される。

## SNS（X / Instagram / YouTube / TikTok）

### ベース URL

| ドメイン | URL |
|---|---|
| ranking | `https://stats47.jp/ranking/<rankingKey>` |
| compare | `https://stats47.jp/compare?areas=<areaA>,<areaB>&cat=<categoryKey>` |
| correlation | `https://stats47.jp/correlation?x=<keyX>&y=<keyY>` |

### UTM パラメータ

| パラメータ | 値 |
|---|---|
| `utm_source` | `x` / `instagram` / `youtube` / `tiktok` |
| `utm_medium` | `social` |
| `utm_campaign` | ranking: `<rankingKey>` / compare: `compare-<areaA>-vs-<areaB>` / correlation: `correlation-<keyX>--<keyY>` |
| `utm_content` | `<template>`（例: `shock`, `paradox`）。YouTube pinned_comment では `<template>-pinned` |

### 例

```
https://stats47.jp/ranking/taxable-income-per-capita?utm_source=x&utm_medium=social&utm_campaign=taxable-income-per-capita&utm_content=shock
```

---

## note

note 記事の stats47.jp リンクには UTM パラメータを付けない。素の URL をそのまま記載する。

### 例

```
https://stats47.jp/ranking/taxable-income-per-capita
```
