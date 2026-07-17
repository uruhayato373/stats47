---
type: session-handoff
date: 2026-07-16
status: completed
tags: [buzz-map, blog, p1, batch-progress]
---

# buzz-map P1 記事バッチ 進捗ハンドオフ

`docs/02_実装計画/27_buzz-map集客ゲート統合仕様.md` §10.6 の P1-01〜P1-30 を 1 記事ずつ処理した。
**2026-07-17 完了**: 残 4 件 (P1-20/22/23/25) を後続セッションが処理し、30 件全件が終端状態になった。
最終集計: **drafted-pass 16** (12+4) / **blocked-data 14**。追加 4 件 = yato-yatsu-place-name-boundary /
hama-ura-tsu-coastal-place-names / kawa-gawa-river-place-name-map / distinctive-place-name-kanji-by-prefecture
(各 critic REVISE→修正→PASS、16/16 で factual/quality/review PASS/published:false を一括再検証済み)。

## 終端状態サマリ

- **drafted-pass 12件**: P1-01, P1-02, P1-03, P1-05, P1-06, P1-09, P1-11, P1-12, P1-24, P1-26, P1-27, P1-28
  - すべて `docs/21_ブログ記事原稿/<slug>/` に `published: false` で article.md + data/*.json + data/*.svg + review.md (verdict: PASS) が実在。factual-check / quality-gate ともに exit 0。
- **blocked-data 14件**: P1-04, P1-07, P1-08, P1-10, P1-13, P1-14, P1-15, P1-16, P1-17, P1-18, P1-19, P1-21, P1-29, P1-30
  - 理由は本セッションの最終報告および下表参照。市区町村別データの不在・GIS 空間結合/到達圏レンダラー依存・時系列不足など。
- **feasible・未着手 4件 (本ハンドオフで継続)**: P1-20, P1-22, P1-23, P1-25 (すべて GSI 地名パターン系)

## 未着手 4 件の継続方法 (データ算出済み)

データ源は R2 `gis/gsi-pni/points.json` (国土地理院 電子国土基本図・地名情報、PDL1.0・出典明示で商用可、61MB)。
`kind:"admin"` の居住地名 344,910 件が `pref` (県コード) を持つ (自然地名 69,867 件は pref なし=県別集計不可)。
**正規化は「県内の居住地名1000件あたりのパターン一致数」** (県の大小の影響を除去)。P1-24 (development-history-place-name-map) が
この方式で drafted-pass 済み = テンプレとして流用可能。

集計スニペット (実行済み・再現可能):
```js
const arr = JSON.parse(fs.readFileSync("/tmp/gsi.json")).points.filter(p=>p.kind==="admin"&&p.pref);
const total={}; arr.forEach(p=>total[p.pref]=(total[p.pref]||0)+1);
const shareByPref = re => Object.keys(total).map(pc=>({pc, cnt: arr.filter(p=>p.pref===pc&&re.test(p.name)).length, share:/*cnt/total[pc]*1000*/}));
```

| P1 | slug 候補 | パターン | 実測 (居住地名1000件あたり share・県略称) | 記事の骨子 |
|---|---|---|---|---|
| P1-20 | `yato-yatsu-place-name-boundary` | 谷戸 / 谷津 | 谷戸: 群馬8.0・神奈川4.1・埼玉2.6・東京2.0 / 谷津: 千葉5.0・神奈川3.4・茨城1.8 | 南関東で谷戸(西)↔谷津(千葉)が入れ替わる境界。tile-grid は南関東中心=地域フォーカス記事。「読み・表記から語源を断定しない」注記必須 |
| P1-22 | `hama-ura-tsu-coastal-place-names` | 浜 / 浦 / 津 | 浦: 長崎67.6・愛媛26.6・徳島25.3・佐賀23.1 / 浜: 長崎23.3・香川22.4・沖縄21.8 / 津: 滋賀37.0・長崎32.1・佐賀28.6 | 海岸地名の漢字が地域で使い分け。浦=リアス海岸(長崎)に突出。3語の dominant を県別に。津は内陸(滋賀=琵琶湖の湊)にも注意 |
| P1-23 | `kawa-gawa-river-place-name-map` | 川 / 河 | 川: 全国34,150件 / 河: 全国2,766件 (河は稀・河内=大阪等に偏在) | 河/(川+河) の比を県別に。河は歴史的地名(河内・河北)に残る。表記から読みを推定しない注記 |
| P1-25 | `distinctive-place-name-kanji-by-prefecture` | 地名漢字の特徴度 | 未算出 (要 TF-IDF 実装) | 各県で全国平均より高頻度の漢字 (「多い」でなく「特徴的」)。居住地名を1文字ずつ集計し県別頻度÷全国頻度。異体字・文字分割の注意 |

継続手順 (1 記事ずつ):
1. `/tmp/gsi.json` が無ければ `curl -s https://storage.stats47.jp/gis/gsi-pni/points.json -o /tmp/gsi.json`
2. 上記スニペットで per-pref share を算出 → `docs/21_ブログ記事原稿/<slug>/data/<slug>-tile-grid.json` + `-ranking.json` + `-summary-findings.json` + 各 `.source.json` (kind:derived, source: r2:gis/gsi-pni/points.json, license PDL1.0)
3. article.md 執筆 (ですます調・archetype A・内部リンク3本以上を markdown 形式で・GSI 記事は /ranking source-link 不要)
4. `npx tsx .claude/scripts/blog/generate-article-charts.ts --slug <slug>` → `--validate` errors=0
5. factual-check → quality-gate 両方 exit 0
6. blog-critic (別 context・bypassPermissions) で review.md verdict: PASS
7. **published: false 維持**。commit/push/R2/SNS 一切なし

## 重要な教訓 (P1-01 データ整合性)

`population-growth-rate` の cities.json は**増加中の主要市 (奈良市・生駒市等) を欠落**しており (1339件、完全版は1738件)、
割合(分母)が偏る。市区町村の増減率・割合を出すときは **`total-population` cities.json (2015・2020) から自前計算**すること。
P1-01 は当初この欠落で「奈良が割合トップ43.3%」という誤った hook を作り、critic BLOCK → 完全データ再計算で「北海道が数・割合とも首位、奈良33.3%」に是正済み。

## 触っていないもの (次セッションも尊重)

開始前 dirty files (note catalog / ai-content state / consistency / docs INDEX / 設計書27 / handoff prompt) には一切触れていない。
P1 記事以外の既存 draft (library-museum-cultural-capital / overseas-travel-gap) も未変更。
