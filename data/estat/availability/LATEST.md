# e-Stat の実在年と metric config の years の差分 (LATEST)

- 生成: 2026-10-07T02:48:09.275Z
- 対象: 県の値を e-Stat (estat / kakei-chousa) から取り込む有効な metric 2221 件 (表 143・取り出し条件 2219)。市区町村の値は対象外
- 台帳: `data/estat/availability/tables/<statsDataId>.json`。取り込みと同じ取得と県の判定で、`years` で絞らずに年ごとの値のある県を数えたもの
- 全県: その条件で最も多く値が出た年の県の数 (港湾・漁業のように 47 県がそろわない統計があるため 47 に固定しない)。一部の県だけの年は分類に入れない (diff.json の `partial`)
- 作り直し: `npx tsx packages/data-configs/scripts/build-estat-availability.ts` (`--offline` で報告だけ)。差分は `npx tsx packages/data-configs/scripts/sync-estat-years.ts` が years に反映する
- `yearExclusions` に書いた年は判断済みとして差分に数えない

## 件数

| 分類 | 指標数 | 意味 |
|---|---|---|
| 取り込み忘れ | 0 | 設定の最初と最後の年のあいだに、全県の値があるのに設定にない年がある |
| 新しい年が出ている | 0 | 設定の最後の年より後に、全県の値がある年がある |
| e-Stat に無い年がある | 0 | 設定にあるのに e-Stat に 1 県も値が無い年がある (補完元の年は除く) |
| 範囲より前にも年がある | 0 | 設定の最初の年より前に、全県の値がある年がある (基準の切り替えで外した年もここに出る) |
| 差分なし | 2167 | 設定の年が全県の値のある年と一致する |
| years: "all" | 53 | 許可リストが無く、取り込みは e-Stat の全年を使う |
| 台帳なし・取得失敗・打ち切り・重複行 | 1 | 差分を比べていない (下の表。取得失敗は次の実行で取り直し、打ち切りと重複行は metric config の軸を直す) |
| 未判断の除外 | 422 | 移行時に当時の years から引き継いだ除外。根拠を書くか、外して年を戻す (下の表) |
| 理由付きの除外 | 0 | 判断して書いた除外 |

1 つの指標が複数の分類に入ることがある。

## 取り込み忘れ

なし

## 新しい年が出ている

なし

## e-Stat に無い年がある

なし

## 範囲より前にも年がある

なし

## 未判断の除外 (422 件)

全県の値があるのに、2026-10 の移行時の years に無かったので除外として残した年。基準の切り替え・5 年おきの揃えなどの根拠があれば `yearExclusions` の reason を具体的に書き換え、無ければ除外を消して `sync-estat-years.ts` で年を戻す。テーマで使う指標を先に、除外の年の多い順。上位 40 件 (全件は diff.json)。

| 指標 | 表 | 設定の年 | 除外している年 | テーマ |
|---|---|---|---|---|
| `elementary-school-count` | 0000010105 | 2023–2024 | 1975–2022 | education-culture |
| `high-school-count` | 0000010105 | 2023–2024 | 1975–2022 | education-culture |
| `junior-high-school-count` | 0000010105 | 2023–2024 | 1975–2022 | education-culture |
| `new-condo-starts` | 0000010108 | 2023–2024 | 1975–2022 | living-housing |
| `new-housing-starts` | 0000010108 | 2023–2024 | 1975–2022 | living-housing |
| `new-owner-occupied-starts` | 0000010108 | 2023–2024 | 1975–2022 | living-housing |
| `new-rental-starts` | 0000010108 | 2023–2024 | 1975–2022 | living-housing |
| `population-density-per-km2-inhabitable-area` | 0000010201 | 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2023–2024 | 1975–1984, 1986–1989, 1991–1994, 1996–1999, 2001–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2022 | living-housing, population-dynamics |
| `police-officer-count-per-population` | 0000010211 | 2005–2024 | 1975–2004 | safety |
| `infant-mortality-rate-per-1000-births` | 0000010209 | 2008–2023 | 1980–2007 | healthcare |
| `university-count-per-100k` | 0000010205 | 2002–2024 | 1975–2001 | education-culture |
| `garbage-final-disposal` | 0000010108 | 2022–2023 | 1999–2021 | waste-recycling |
| `garbage-total-output` | 0000010108 | 2022–2023 | 1999–2021 | waste-recycling |
| `general-hospital-avg-length-of-stay` | 0000010209 | 1995–2023 | 1975–1994 | healthcare |
| `disaster-recovery-expenses-prefecture` | 0000010104 | 1994–2022 | 1975–1993 | safety |
| `per-capita-total-expenditure-pref-municipal` | 0000010204 | 1994–2022 | 1975–1993 | local-finance |
| `manufacturing-shipment-amount-per-employee` | 0000010203 | 1992–2023 | 1975–1991 | manufacturing |
| `nurses-in-medical-facilities-per-100k` | 0000010209 | 2002, 2004, 2006, 2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022 | 1975–1982, 1984, 1986, 1988, 1990, 1992, 1994, 1996, 1998, 2000 | healthcare |
| `urban-planning-area` | 0000010108 | 2022–2023 | 2005–2021 | living-housing |
| `births` | 0000010101 | 1995–2023 | 1980–1994 | aging-society, population-dynamics |
| `employment-rate` | 0000010206 | 1986–2021 | 1975–1985 | labor-mobility, labor-wages |
| `in-pref-university-entrance-ratio-by-highschool-origin` | 0000010205 | 1994–2024 | 1980, 1984–1993 | education-culture |
| `manufacturing-shipment-amount-per-establishment` | 0000010203 | 1986–2023 | 1975–1985 | manufacturing |
| `psychiatric-hospital-count-per-100k` | 0000010209 | 1986–2023 | 1975–1985 | healthcare |
| `deaths-diabetes-per-100k` | 0000010209 | 1985–2023 | 1975–1984 | healthcare |
| `deaths-hypertensive-diseases-per-100k` | 0000010209 | 1985–2023 | 1975–1984 | healthcare |
| `general-hospital-bed-occupancy-rate` | 0000010209 | 1985–2023 | 1975–1984 | healthcare |
| `road-length-per-km2` | 0000010208 | 1985–2023 | 1975–1984 | roads |
| `traffic-accident-injuries-per-100k` | 0000010211 | 1985–2024 | 1975–1984 | safety |
| `forest-road-length` | 0000010103 | 1989–2022 | 1980–1988 | forestry-timber |
| `intellectual-disability-support-facility-count-per-1m` | 0000010210 | 1984–2011 | 1975–1983 | disability-support |
| `investment-expenditure-ratio-pref-finance` | 0000010204 | 1984–2022 | 1975–1983 | local-finance |
| `lowest-temperature` | 0000010102 | 1984–2024 | 1975–1983 | climate |
| `main-road-paving-rate` | 0000010208 | 1984–2023 | 1975–1983 | roads |
| `nursery-utilization-rate` | 0000010205 | 1984–2020 | 1975–1983 | childcare-services |
| `truck-operators` | 0000010103 | 1984–2023 | 1975–1983 | freight-logistics |
| `fire-department-emergency-car-count-per-100k` | 0000010209 | 1983–2024 | 1975–1982 | safety |
| `nursing-home-capacity-per-1000-65plus` | 0000010210 | 2008–2023 | 2000–2007 | aging-society, long-term-care |
| `passenger-ship-transport` | 0000010103 | 1983–2023 | 1975–1982 | ports |
| `per-capita-prefectural-income-h27` | 0000010203 | 2020–2021 | 2012–2019 | local-economy, real-income |

## 市区町村 (cities.json)

- 対象: 市区町村の値を e-Stat から取り込む有効な metric 171 件 (市区町村の表 21)。数えるのは取り込みと同じく現行の市区町村マスタにあるコードだけ
- **報告だけで years は変えない** (years は県の値で決める。市区町村は合併でコードが変わり、古い年ほど数が減るため「全市区町村の年」が定まらない)
- 設定の年に市区町村の値が無い: 68 件 / 設定に無い年に市区町村の 90% 以上の値がある: 34 件 / 差分なし: 53 件 / years: "all": 21 件 / 台帳なし・失敗等: 0 件

該当する年の多い順。上位 40 件 (全件は diff.json の cities)。

| 指標 | 市区町村の表 | 設定の年 | 値が無い年 | 設定に無いが値がある年 | 値がある年 (最多の数) |
|---|---|---|---|---|---|
| `moving-in-excess-rate-japanese` | 0000020301 | 1976–2024 | 1976–1999, 2001–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2024 |  | 2000, 2005, 2010, 2015, 2020 (1910) |
| `elementary-school-children-count` | 0000020205 | 2023–2024 |  | 1980–2022 | 1980–2024 (1913) |
| `elementary-school-count` | 0000020205 | 2023–2024 |  | 1980–2022 | 1980–2024 (1913) |
| `junior-high-school-count` | 0000020205 | 2023–2024 |  | 1980–2022 | 1980–2024 (1913) |
| `junior-high-school-students-count` | 0000020205 | 2023–2024 |  | 1980–2022 | 1980–2024 (1913) |
| `penal-code-offenses-recognized-per-1000` | 0000020311 | 1975–2023 | 1975–1979, 1981–1984, 1986–1989, 1991–1994, 1996–1999, 2001–2004, 2006–2023 |  | 1980, 1985, 1990, 1995, 2000, 2005 (1853) |
| `traffic-accident-count-per-population` | 0000020311 | 1976–2024 | 1976–1979, 1981–1984, 1986–1989, 1991–1994, 1996–1999, 2001–2004, 2006–2024 |  | 1980, 1985, 1990, 1995, 2000, 2005 (1874) |
| `total-population` | 0000020201 | 1975–2025 | 1975–1979, 1981–1984, 1986–1989, 1991–1994, 1996–1999, 2001–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2024 |  | 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020 (1911) |
| `high-school-count` | 0000020205 | 2023–2024 |  | 1980, 1983–2007, 2009–2022 | 1980–2024 (1913) |
| `japanese-population` | 0000020201 | 1980–2024 | 1980–1999, 2001–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2024 |  | 2000, 2005, 2010, 2015, 2020 (1911) |
| `general-clinic-count-per-100k` | 0000020309 | 1980–2023 | 1981–1984, 1986–1989, 1991–1994, 1996–1999, 2001–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2023 |  | 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020 (1910) |
| `general-hospital-count-per-100k` | 0000020309 | 1980–2023 | 1981–1984, 1986–1989, 1991–1994, 1996–1999, 2001–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2023 |  | 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020 (1910) |
| `general-clinic-count` | 0000020209 | 2022–2023 |  | 1982, 1985–1989, 1994, 1996–2021 | 1980–2023 (1911) |
| `general-hospital-count` | 0000020209 | 2022–2023 |  | 1985–1986, 1996–2021 | 1980–2023 (1911) |
| `dental-clinic-count` | 0000020209 | 2022–2023 |  | 1996–2021 | 1996–2023 (1911) |
| `intellectual-disability-support-facility-capacity` | 0000020210 | 1975–2011 | 1975–1999 |  | 2000–2011 (1906) |
| `intellectual-disability-support-facility-residents` | 0000020210 | 1975–2011 | 1975–1999 |  | 2000–2011 (1906) |
| `manufacturing-establishments` | 0000020203 | 1975–2014, 2016–2024 | 1975–1999 |  | 2000–2014, 2016–2024 (1913) |
| `physical-disability-rehabilitation-facility-capacity` | 0000020210 | 1975–2011 | 1975–1999 |  | 2000–2011 (1906) |
| `physical-disability-rehabilitation-facility-residents` | 0000020210 | 1975–2011 | 1975–1999 |  | 2000–2011 (1906) |
| `agricultural-output` | 0000020203 | 1975–2024 | 1975–1979, 2007–2024 |  | 1980–2006 (1718) |
| `garbage-collection-population` | 0000020208 | 2022–2023 |  | 1999–2021 | 1999–2023 (1742) |
| `garbage-total-output` | 0000020208 | 2022–2023 |  | 1999–2021 | 1999–2023 (1719) |
| `garbage-final-disposal` | 0000020208 | 2022–2023 |  | 2000–2021 | 2000–2023 (1719) |
| `japanese-movers-out` | 0000020201 | 1975–2025 | 1975–1995, 2025 |  | 1996–2024 (1913) |
| `psychiatric-hospital-count` | 0000020209 | 1975–2023 | 1975–1996 |  | 1997–2023 (1911) |
| `criminal-recognition-count` | 0000020211 | 1975–2023 | 1975–1979, 1983, 2009–2023 |  | 1980–1982, 1984–2008 (1899) |
| `ratio-65-plus` | 0000020301 | 2005–2025 | 2006–2009, 2011–2014, 2016–2019, 2021–2024 | 1980, 1985, 1990, 1995, 2000 | 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020 (1910) |
| `standard-fiscal-revenue-municipality` | 0000020204 | 1979–2022 | 1979–1999 |  | 2000–2022 (1718) |
| `young-population-ratio` | 0000020301 | 2005–2025 | 2006–2009, 2011–2014, 2016–2019, 2021–2024 | 1980, 1985, 1990, 1995, 2000 | 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020 (1910) |
| `japanese-movers-in` | 0000020201 | 1977–2025 | 1977–1995, 2025 |  | 1996–2024 (1913) |
| `library-count-per-million` | 0000020307 | 1975–1997, 1999, 2002, 2005, 2008, 2011, 2015, 2018, 2021 | 1975–1994 |  | 1995–1997, 1999, 2002, 2005, 2008, 2011, 2015, 2018, 2021 (1910) |
| `traffic-accident-count` | 0000020211 | 1975–2024 | 1975–1979, 2010–2024 |  | 1980–2009 (1899) |
| `new-condo-starts` | 0000020208 | 2023–2024 |  | 2005–2022 | 2000–2024 (987) |
| `new-housing-floor-area` | 0000020208 | 2023–2024 |  | 2005–2022 | 2000–2024 (987) |
| `new-housing-starts` | 0000020208 | 2023–2024 |  | 2005–2022 | 2000–2024 (987) |
| `new-owner-occupied-starts` | 0000020208 | 2023–2024 |  | 2005–2022 | 2000–2024 (987) |
| `new-rental-starts` | 0000020208 | 2023–2024 |  | 2005–2022 | 2000–2024 (987) |
| `nursing-welfare-facility-count-per-100k-65plus` | 0000020310 | 2005–2023 | 2006–2009, 2011–2014, 2016–2023 | 2000 | 2000, 2005, 2010, 2015 (1907) |
| `urban-planning-area` | 0000020208 | 2022–2023 |  | 2005–2021 | 2005–2023 (1747) |

## 台帳なし・取得失敗・打ち切り・重複行

| 指標 | 表 | 状態 | 理由 |
|---|---|---|---|
| `convenience-store-sales` | 0004032502 | duplicate-rows |  |
