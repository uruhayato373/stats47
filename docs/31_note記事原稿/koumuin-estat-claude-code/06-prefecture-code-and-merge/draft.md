---
type: note-draft
vertical: koumuin-estat-claude-code
category: analysis
slug: prefecture-code-and-merge
title: 都道府県コードと地域階層を扱う — JIS X 0401・e-Stat 5 桁・市区町村コード変換
description: e-Stat の地域コードは 5 桁、JIS X 0401 は 2 桁、市区町村は 5 桁で上位 2 桁が都道府県です。コードを揃えて結合し「人口当たり指標」を出すまでを、合併でコードが変わった市町村の扱いも含めて解説します。
created: 2026-05-26
status: ready-to-publish
is_paid: true
price_jpy: 300
target_chars: 8500
mvp: false
related_idea_no: 06
quality_phase: rewrite-1
tags: [koumuin, claude-code, estat, analysis]
note_url: https://note.com/stats47/n/n7ba7ee560bbb
published: true
published_at: 2026-06-14

---

💡 **この記事を書いた私から、Claude Code 学習でひとつだけご紹介させてください（PR）**

この記事を読んでいる方は、Claude Code を業務に取り入れようとしているか、すでに使い始めているのだと思います。

独学でも十分に使えますが、「もっと体系的に学びたい」「詰まったときにすぐサポートを受けたい」という方には、Claude Code に特化した研修プログラムも選択肢のひとつです。

このリンクから申し込んでいただくと、私に紹介料が入ります。それでもお伝えするのは、Claude Code を業務で使いこなしたいすべての方に本当に役立つと思っているからです。

{{AFFILIATE_BANNER:ai_agent_camp}}

▶ Claude Code 特化研修「AI Agent Camp」の詳細はこちら（無料相談あり）

---

---

# 都道府県コードと地域階層を扱う — JIS X 0401・e-Stat 5 桁・市区町村コード変換

## はじめに

統計担当・企画課で日常的に発生する作業に「複数の統計を県別・市別に結合して人口当たり指標を出す」というものがあります。

たとえば e-Stat の医師数と総務省統計局の住民基本台帳人口を結合して「人口 10 万人あたり医師数」を計算する、農林水産省のデータと面積データを結合して「耕地面積あたり収穫量」を計算する、といった場面です。

ここで詰まるのは ETL のロジックではなく **コードの不一致** です。e-Stat は 5 桁 (01000〜47000)、JIS X 0401 は 2 桁 (01〜47)、市区町村コードは 5 桁 (上位 2 桁が都道府県)、財務省や厚生労働省の一部統計は独自の番号体系を使います。

値が同じ「北海道」でも、結合キーの型が違うと SQL は何も返しません。

**こんな方に向けた記事です**

- 複数の統計を県別・市別に結合して「人口当たり指標」を出す作業を任されている統計担当・企画課の職員
- コードの型がそろわず SQL や VLOOKUP が空振りし、原因を追えずにいる方
- e-Stat の 5 桁・JIS の 2 桁・市区町村コードの違いを一度整理しておきたい方

**この記事でわかること**

- e-Stat 5 桁・JIS X 0401 2 桁・市区町村コードを揃えて結合する具体的な手順
- 人口・面積マスタと結合して「人口当たり」「面積あたり」の派生指標を出す流れ
- 市町村合併で廃止された旧コードを変換テーブルで吸収する方法

執筆者は元自治体職員です。Claude Code で 47 都道府県の統計サイト stats47.jp（約 2,000 のランキングを毎日自動更新）を個人で開発・運用しています。

stats47 ではコードを **5 桁 (01000〜47000) に統一** する設計を採り、結合時の事故を構造的に潰しています。本記事はその実装規約をそのまま自治体実務に持ち込む手順です。

人口 30 万人規模の市役所では、企画課・統計担当が「県内市町村別の指標を 1 枚にまとめてほしい」という依頼を月 3-5 件抱える典型例があります。

1 件あたり Excel での VLOOKUP 整備に 2-3 時間を費やす職場は珍しくありません。Claude Code にコード変換を任せると、**初回構築 2 時間 → 月次運用は 5 分** に収まります。

> **📌 この記事の読み方** — 本記事にはコマンド・設定例・プロンプト例など、やや専門的な記述も出てきます。ですが Claude Code の本質は「それらを自分で覚えること」ではなく、「**やってほしいことを言葉で頼めば、専門的な部分は AI が代わりに用意してくれる**」点にあります。掲載するコマンドや設定は丸暗記の対象ではなく「こう頼めば、こういうものが返ってくる」という地図として読んでください。

![都道府県コード体系の対応関係](./images/structure-1-code-systems.png)
<!-- SVG: structure | JIS X 0401・e-Stat 5 桁・市区町村コードの対応表 -->

## 背景: なぜ自治体職員にこの課題があるか

自治体の統計実務では、データ源ごとに地域コードの体系が異なるという構造的な問題があります。

- **e-Stat (政府統計の総合窓口)**: API レスポンスの `@code` は 5 桁文字列 (`"01000"` 〜 `"47000"`、市区町村は `"01100"` 等) です
- **JIS X 0401 (都道府県コード)**: 2 桁数値 (`1` 〜 `47`) です。古い Excel 帳票では「`1`」「`01`」が混在します
- **総務省「全国地方公共団体コード」**: 6 桁 (5 桁 + チェックデジット 1 桁) です。`01100-2` のような表記になります
- **国土交通省・農林水産省の一部統計**: 旧住所体系の独自コードを使います

これに加え、市町村合併でコードが廃止される事例が頻発します。**平成の大合併 (1999-2010)** だけで市町村数は 3,232 → 1,727 と約半減しました。

旧コードを保持したまま結合すると、新しいコード側にレコードがなく `NULL` が返ります。

公的データを商用利用する場合の出典表記も実務上の論点になります。e-Stat のデータは **「政府統計の総合窓口 (e-Stat)」と出典明記すれば商用利用可** です (e-Stat 利用規約 https://www.e-stat.go.jp/api/ アクセス日 2026-05-26)。

総務省「全国地方公共団体コード」も同様にオープンデータとして公開されています。

## 手順 / 解説

### Step 1: 都道府県コードを 5 桁に正規化する

e-Stat の地域コードは 5 桁文字列が正規です。CSV や Excel で `1, 2, 3, ...` の数値で持っているデータは、結合前に必ず 5 桁に揃えます。

```python
import pandas as pd

# JIS X 0401 (2 桁数値) → e-Stat 5 桁文字列
def normalize_pref_code(code) -> str:
    """1 or "1" or "01" or "01000" → "01000" """
    s = str(code).strip()
    # 既に 5 桁
    if len(s) == 5 and s.isdigit():
        return s
    # 1-2 桁数値 → 0 埋め 2 桁 → 末尾 "000" 付与
    return f"{int(s):02d}000"

df = pd.read_csv("input.csv", dtype={"pref_code": str})
df["pref_code"] = df["pref_code"].apply(normalize_pref_code)
```

逆方向 (5 桁 → JIS X 0401 2 桁) は単純に `code[:2]` で取り出せます。

```python
# e-Stat 5 桁 → JIS X 0401 2 桁
df["jis_code"] = df["pref_code"].str[:2]
```

### Step 2: 市区町村コードから都道府県コードを取り出す

市区町村コードは 5 桁で、上位 2 桁が都道府県コードです。

コードと意味の対応は次の通りです。

- `01000`: 北海道 (県)
- `01100`: 北海道 札幌市
- `01101`: 北海道 札幌市 中央区
- `13000`: 東京都 (都)
- `13101`: 東京都 千代田区

```python
# 市区町村コードから都道府県コードを抽出
df["pref_code"] = df["city_code"].str[:2] + "000"

# 政令市の区まで含むデータの市レベル抽出 (区を捨てる)
def to_city_level(code: str) -> str:
    # 札幌市中央区 01101 → 札幌市 01100
    if code.endswith("1") or code.endswith("2"):
        # 政令市区の最後 1 桁は区番号
        return code[:4] + "0"
    return code
```

実際の政令市の区コード体系はやや複雑なので、Claude Code に「総務省全国地方公共団体コードの政令市区コード一覧を整理して」と頼むのが速いです。

### Step 3: 人口マスタと結合して人口当たり指標を出す

e-Stat から取得した医師数データに住民基本台帳人口を結合する例です。両方とも事前に `pref_code` を 5 桁化しておきます。

```python
import pandas as pd

# 医師数 (e-Stat 取得済み、整形済み CSV)
df_doctor = pd.read_csv("doctors_2024.csv")  # pref_code, doctor_count

# 住民基本台帳人口 (e-Stat 取得済み、整形済み CSV)
df_pop = pd.read_csv("population_2024.csv")  # pref_code, population

# 結合
df = df_doctor.merge(df_pop, on="pref_code", how="inner", validate="1:1")

# 人口 10 万人あたり医師数
df["doctors_per_100k"] = df["doctor_count"] / df["population"] * 100_000
df = df.sort_values("doctors_per_100k", ascending=False)

print(df[["pref_code", "doctors_per_100k"]].head(10))
```

`validate="1:1"` をつけると、結合キーがどちらかで重複していたときに例外を投げます。コード正規化の失敗を早期に発見できます。

stats47 では「人口当たり医師数」「世帯当たり年収」「面積あたり耕地」「昼夜間人口比率」「入港船舶トン数」など、約 2,000 のランキングを同様の結合パターンで生成しています。

具体例は https://stats47.jp/ranking/doctors-per-100k や https://stats47.jp/ranking/household-income で公開しています。

![データ結合パイプライン](./images/flow-1-merge-pipeline.png)
<!-- SVG: flow | 統計データ + マスタ → 結合 → 派生指標 -->

### Step 4: 都道府県マスタを作る

47 都道府県の名称・コードは固定なので、CSV または JSON 形式で 1 つマスタを作って使い回します。

```csv
pref_code,jis_code,pref_name,pref_kana,region
01000,01,北海道,ホッカイドウ,北海道
02000,02,青森県,アオモリケン,東北
03000,03,岩手県,イワテケン,東北
13000,13,東京都,トウキョウト,関東
27000,27,大阪府,オオサカフ,近畿
47000,47,沖縄県,オキナワケン,沖縄
```

Claude Code に「47 都道府県の `pref_code`, `jis_code`, `pref_name`, `pref_kana`, `region` を CSV で作って」と頼めば 1 発で出ます。

ここから先は有料部分です:

### Step 5: 市町村合併で廃止されたコードを吸収する

平成の大合併で廃止された市町村コードを新コードに変換する処理は、過去データを使う限り避けて通れません。

```python
# 廃止コード → 後継コード の変換テーブル (一部抜粋)
MERGE_MAP = {
    # 旧コード: (新コード, 合併年月)
    "20208": ("20210", "2005-10"),  # 中野市 (長野県) は旧コード 20208 → 20210
    "08221": ("08220", "2006-03"),  # 旧 茨城県岩井市 → 坂東市
    "40610": ("40229", "2005-10"),  # 旧 福岡県前原町 → 糸島市
    # 全件は総務省「市町村合併資料集」参照
}

def resolve_city_code(old_code: str) -> str:
    if old_code in MERGE_MAP:
        return MERGE_MAP[old_code][0]
    return old_code

df["city_code_current"] = df["city_code"].apply(resolve_city_code)
```

変換テーブルは総務省「市町村合併資料集」(https://www.soumu.go.jp/gapei/) を出典として年度別に管理します。Claude Code には「総務省の市町村合併データから変換テーブルの JSON を作って」と頼めば下書きが出ます。

**最終的なコード対応の正誤確認は総務省一次資料に当たってください** (合併は本来 1:1 ではなく N:1 や境界変更を伴うため、機械生成のテーブルは要人手レビューが必要です)。

### Step 6: 地域区分 (8 地方区分) で集約する

47 都道府県を 8 地方 (北海道・東北・関東・中部・近畿・中国・四国・九州・沖縄) で集約するケースも頻出します。前項のマスタに `region` 列を含めておけば、結合 1 回で集約できます。

```python
df_merged = df.merge(df_pref_master[["pref_code", "region"]], on="pref_code")
df_by_region = df_merged.groupby("region")["doctor_count"].sum().reset_index()
```

地方区分の定義は組織によって揺れます (沖縄を九州に含めるか別建てか、新潟を関東・中部・北陸のどこに置くか)。**マスタ側で 1 つに決めて統一する** のが事故を防ぐ最良の手段です。

![市区町村階層構造](./images/infographic-1-municipalities-hierarchy.png)
<!-- SVG: infographic | 都道府県 → 市区町村 → 大字 の階層図 -->

### Step 7: 結合エラーを早期検出するチェックリスト

結合処理を運用化する前に、以下のチェックを `.claude/skills/<skill>/run.sh` に組み込みます。

```python
def validate_merge(df_left, df_right, on: str) -> None:
    """結合キーの整合性をチェック"""
    left_keys = set(df_left[on])
    right_keys = set(df_right[on])

    only_left = left_keys - right_keys
    only_right = right_keys - left_keys

    if only_left:
        print(f"⚠️ 左テーブルのみに存在するキー ({len(only_left)} 件): "
              f"{sorted(only_left)[:5]}...")
    if only_right:
        print(f"⚠️ 右テーブルのみに存在するキー ({len(only_right)} 件): "
              f"{sorted(only_right)[:5]}...")

    # 47 都道府県データなら 47 件揃っているはず
    if len(left_keys) != 47 or len(right_keys) != 47:
        print(f"⚠️ 47 県揃っていない: 左 {len(left_keys)}, 右 {len(right_keys)}")
```

実務では「東京都 (13000) が片方のテーブルでは `'13'` で持たれていた」「岐阜県 (21000) が誤って `21001` で記録されていた」といったケースが頻発します。

**結合前にキーの集合差を出力する** だけで、原因不明の `NULL` を 9 割減らせます。

## よくあるつまずきと回避策

- ⚠️ JIS X 0401 の数値型 (1, 2, 3, ...) を文字列化せずに e-Stat の `'01000'` と結合してしまいます → 必ず文字列で正規化します
- ⚠️ Excel が `01` を `1` に自動変換してしまいます → CSV 読み込み時 `dtype={"pref_code": str}` を必ず指定します
- ⚠️ 政令市区コードと市コードが混在してしまいます → どのレベルで集計するか先に決め、変換関数で揃えます
- ⚠️ 合併で廃止された旧コードが新しいマスタにありません → 変換テーブルで吸収するか、旧コードのレコードを除外します
- ⚠️ 地方区分が組織で違います → マスタの `region` 列で 1 つに決め打ちします
- ⚠️ `.diff()` や `.merge()` で行数が想定外に増減してしまいます → `validate="1:1"` で早期検出します

## 応用 / 次に読むべき記事

- [#05 pandas / DuckDB で派生指標を作る](../05-pandas-duckdb-derived-metrics/draft.md) — 結合した後の派生指標計算の本格パターン
- [#07 e-Stat 統計の前年比較・5 年トレンド](../07-year-on-year-diff/draft.md) — コード正規化済みデータで時系列処理
- [#08 他自治体ベンチマーク表を 5 分で作る](../08-benchmark-table-5min/draft.md) — コード変換を前提とした実務出力例

stats47.jp の実例:

- https://stats47.jp/ranking/doctors-per-100k — 人口 10 万人あたり医師数 (結合パターンの典型)
- https://stats47.jp/ranking/household-income — 世帯当たり年収 (結合 + 派生指標)
- https://stats47.jp/areas/13000 — 東京都プロフィール (各種指標の県別ダッシュボード)

<!-- circulation-footer:v2 -->

## このシリーズについて

「公務員のための e-Stat × Claude Code 実務ガイド」全 12 本のシリーズ第 06 回。e-Stat 業務の効率化に関心がある方は、マガジン購読がお得です。

▶️ マガジン: 公務員のための e-Stat × Claude Code 実務ガイド
🔗 https://note.com/stats47/m/m1b836e4c8dce

姉妹マガジン「公務員 × Claude Code 実務活用ガイド (全 33 本)」では議事録・議会答弁・条例レビューなど統計以外の業務効率化を扱っています。

▶️ stats47.jp: 本記事で紹介した手順で運用している 47 都道府県統計サイト (約 2,000 のランキングを毎日自動更新)。動いている実例として参考にどうぞ。
🔗 https://stats47.jp
