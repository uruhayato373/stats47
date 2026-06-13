---
slug: cc-estat-05-medical-cost-choropleth
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-13
---
## 評価サマリ
Claude Code 実例集 Part 5 として「医療費コロプレス地図を D3-geo + TopoJSON で描く」ハンズオン記事です。地理データ初心者が必ず詰まる結合キー(JIS コード 1-47 vs e-Stat 5桁 areaCode)・投影法選択(Conic vs Mercator)・simplify アルゴリズム(Visvalingam vs Douglas-Peucker)・カラースケール設計・凡例/ツールチップを、実用的な判断材料込みで押さえており、チュートリアルとしての読者価値は床を十分に超えています。前版の致命的欠陥(である調・markdown 表 5 件・chart-placeholder 未描画・記事内関連セクション・callout 0)はすべて是正済みで、文体は冒頭から末尾まで ですます調 に一貫し常体混在は皆無、表は箇条書き/SVG に置換され、callout 3 個(NOTE/WARNING/TIP)はいずれも記事固有の読み違い防止知識(架空 statsDataId の警告・id 結合失敗で地図が真っ白になる罠・例示値が仮数値である注記)として機能しています。冒頭 SVG の 2022年度実データ(高知479〜埼玉332)は data JSON と完全一致し、1.44倍・西高東低・上位四国九州/下位関東の集計主張も矛盾しません。

## 指摘
- [minor] archetype D の「生活含意」要素は L75/L422 に軽く触れる程度で、記事の主軸はあくまで Claude Code ハンズオンです。型としては「なぜ上位/下位か」を高齢化率で分解する分析視点が満たされているため許容範囲ですが、自分の県の濃さを起点にした読者ベネフィットをもう一段書くと D 型としての厚みが増します。
- [minor] コード例は架空 statsDataId(0003411111)+仮値(2023年度)、冒頭 SVG は実データ(2022年度)という二系統が併存します。L72 NOTE・L194 注記・L216 TIP で透明に整理されており矛盾ではありませんが、年度表記が NOTE/コードで混在する点は読者の軽い混乱要因になりうるため、いずれ年度を片寄せできると親切です。

## 判定理由
title/seoTitle に NG_PATTERN(bare rank・X倍格差連結)は無く curiosity gap「なぜ西高東低になる？」は本文で高齢化率/若年層比率により回収済み、本文は ですます調 に統一され常体混在ゼロ、数値・順位・倍率・集計主張は data JSON と相互整合、markdown 表・chart-placeholder・記事内関連セクションは全廃、SVG×1 に対し prose ~8,400字で図あたり字数フロアを大幅超過、callout は記事固有知識、source-link は図直下にインライン配置。決定的 blocker(文体崩壊・数値矛盾・title NG・図表重複水増し)はいずれも存在せず、読者価値が床を超え重大欠陥が無いため verdict: PASS。
