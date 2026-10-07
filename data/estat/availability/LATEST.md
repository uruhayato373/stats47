# e-Stat の実在年と metric config の years の差分 (LATEST)

- 生成: 2026-10-07T01:58:16.454Z
- 対象: 県の値を e-Stat (estat / kakei-chousa) から取り込む有効な metric 2221 件 (表 143・取り出し条件 2219)。市区町村の値は対象外
- 台帳: `data/estat/availability/tables/<statsDataId>.json`。取り込みと同じ取得と県の判定で、`years` で絞らずに年ごとの値のある県を数えたもの
- 全県: その条件で最も多く値が出た年の県の数 (港湾・漁業のように 47 県がそろわない統計があるため 47 に固定しない)。一部の県だけの年は分類に入れない (diff.json の `partial`)
- 作り直し: `npx tsx packages/data-configs/scripts/build-estat-availability.ts` (`--offline` で報告だけ)

## 件数

| 分類 | 指標数 | 意味 |
|---|---|---|
| 取り込み忘れ | 438 | 設定の最初と最後の年のあいだに、全県の値があるのに設定にない年がある |
| 新しい年が出ている | 26 | 設定の最後の年より後に、全県の値がある年がある |
| e-Stat に無い年がある | 40 | 設定にあるのに e-Stat に 1 県も値が無い年がある (補完元の年は除く) |
| 範囲より前にも年がある | 739 | 設定の最初の年より前に、全県の値がある年がある (基準の切り替えで外した年もここに出る) |
| 差分なし | 1273 | 設定の年が全県の値のある年と一致する |
| years: "all" | 53 | 許可リストが無く、取り込みは e-Stat の全年を使う |
| 台帳なし・取得失敗・打ち切り・重複行 | 1 | 差分を比べていない (下の表。取得失敗は次の実行で取り直し、打ち切りと重複行は metric config の軸を直す) |

1 つの指標が複数の分類に入ることがある。

## 取り込み忘れ (438 件)

設定の最初と最後の年のあいだに、全県の値があるのに設定にない年がある。テーマで使う指標を先に、該当する年の多い順。上位 40 件 (全件は diff.json)。

| 指標 | 表 | 設定の年 | 該当する年 | 全県の値がある年 (県の数) | テーマ |
|---|---|---|---|---|---|
| `education-expenditure-ratio-pref-finance` | 0000010204 | 1978–1988, 2022 | 1989–2021 | 1975–2022 (47) | local-finance |
| `population-density-per-km2-inhabitable-area` | 0000010201 | 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2023 | 1986–1989, 1991–1994, 1996–1999, 2001–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2022 | 1975–2024 (47) | living-housing, population-dynamics |
| `welfare-expenditure-ratio-pref-finance` | 0000010204 | 1981–1992, 2022 | 1993–2021 | 1975–2022 (47) | local-finance |
| `deaths-hypertensive-diseases-per-100k` | 0000010209 | 1985–1996, 2023 | 1997–2022 | 1975–2023 (47) | healthcare |
| `deaths-lifestyle-diseases-per-100k` | 0000010209 | 1980–2001, 2023 | 2002–2022 | 1975–2023 (47) | healthcare |
| `national-treasury-disbursement-ratio-pref-finance` | 0000010204 | 1980–2001, 2022 | 2002–2021 | 1975–2022 (47) | local-finance |
| `public-assistance-facility-capacity-per-1000` | 0000010210 | 1981–2002, 2023 | 2003–2022 | 1975–2023 (47) | public-assistance |
| `late-elderly-medical-expense-per-insured` | 0000010210 | 1996–2003, 2023 | 2004–2022 | 1996–2023 (47) | aging-society |
| `manufacturing-establishments` | 0000010103 | 1975–1990, 2000–2011, 2023–2024 | 1991–1999, 2012–2014, 2016–2022 | 1975–2014, 2016–2024 (47) | manufacturing |
| `real-balance-ratio` | 0000010104 | 1981–2002, 2022 | 2003–2021 | 1975–1984, 1986–2022 (47) | local-finance |
| `fire-department-emergency-car-count-per-100k` | 0000010209 | 1983–2005, 2024 | 2006–2023 | 1975–2024 (47) | safety |
| `theft-criminal-arrest-rate` | 0000010211 | 1983–2004, 2023 | 2005–2022 | 1975–2023 (47) | safety |
| `disaster-recovery-expenses-prefecture` | 0000010104 | 1994–2004, 2022 | 2005–2021 | 1975–2022 (47) | safety |
| `fiscal-strength-index-prefecture` | 0000010104 | 1981–1992, 2002–2013, 2022 | 1993–2001, 2014–2021 | 1975–2022 (47) | local-economy, local-finance |
| `general-hospital-count-per-100k` | 0000010209 | 1980–2001, 2005, 2010, 2015, 2020, 2023 | 2002–2004, 2006–2009, 2011–2014, 2016–2019, 2021–2022 | 1975–2023 (47) | healthcare |
| `deaths-diabetes-per-100k` | 0000010209 | 1985–2006, 2023 | 2007–2022 | 1975–2023 (47) | healthcare |
| `general-hospital-bed-occupancy-rate` | 0000010209 | 1985–2006, 2023 | 2007–2022 | 1975–2023 (47) | healthcare |
| `investment-expenditure-ratio-pref-finance` | 0000010204 | 1984–2005, 2022 | 2006–2021 | 1975–2022 (47) | local-finance |
| `persons-on-public-assistance-per-1000` | 0000010210 | 1975–1985, 1996–2017, 2023 | 1986–1995, 2018–2022 | 1975–2023 (47) | public-assistance |
| `deaths-malignant-neoplasms-per-100k` | 0000010209 | 1975–1996, 2006–2017, 2023 | 1997–2005, 2018–2022 | 1975–2023 (47) | healthcare |
| `fire-damage-casualties-per-population` | 0000010211 | 1976–2008, 2023 | 2009–2022 | 1975–2023 (47) | safety |
| `self-financing-ratio` | 0000010204 | 1975–1985, 1996–2017, 2022 | 1986–1995, 2018–2021 | 1975–2022 (47) | local-finance |
| `traffic-accident-count-per-population` | 0000010211 | 1976–1987, 1998–2019, 2024 | 1988–1997, 2020–2023 | 1975–2024 (47) | safety |
| `urban-parks` | 0000010108 | 1976–2008, 2023 | 2009–2022 | 1975, 1978–2023 (47) | living-housing |
| `current-balance-ratio` | 0000010104 | 1975–1986, 1997–2018, 2022 | 1987–1996, 2019–2021 | 1975–2022 (47) | local-finance |
| `local-tax-ratio-pref-finance` | 0000010204 | 1975–1986, 1997–2018, 2022 | 1987–1996, 2019–2021 | 1975–2022 (47) | local-finance |
| `per-capita-inhabitant-tax-pref-municipal` | 0000010204 | 1975, 1985–2017, 2022 | 1976–1984, 2018–2021 | 1975–2022 (47) | local-finance |
| `personnel-expenditure-ratio-pref-finance` | 0000010204 | 1976–1986, 1997–2018, 2022 | 1987–1996, 2019–2021 | 1975–2022 (47) | local-finance |
| `public-assistance-expenses-prefecture` | 0000010104 | 1976–2008, 2022 | 2009–2021 | 1975–2022 (47) | public-assistance |
| `cultivated-area` | 0000010103 | 1978–2010, 2023–2024 | 2011–2022 | 1975–2024 (47) | agriculture-production |
| `ordinary-construction-expenses-prefecture` | 0000010104 | 1975–1986, 1996–2018, 2022 | 1987–1995, 2019–2021 | 1975–2022 (47) | local-finance |
| `prime-contractor-completed-construction` | 0000010103 | 1975–1977, 1988–2020, 2023 | 1978–1987, 2021–2022 | 1975–2023 (47) | construction-industry |
| `public-works-expenditure-ratio-pref-finance` | 0000010204 | 1977–2009, 2022 | 2010–2021 | 1975–2022 (47) | local-finance |
| `theft-offenses-recognized-per-1000` | 0000010211 | 1978–2010, 2023 | 2011–2022 | 1975–2023 (47) | safety |
| `deaths-cerebrovascular-disease-per-100k` | 0000010209 | 1979–2011, 2023 | 2012–2022 | 1975–2023 (47) | healthcare |
| `deaths-heart-disease-excl-hypertensive-per-100k` | 0000010209 | 1979–2011, 2023 | 2012–2022 | 1975–2023 (47) | healthcare |
| `general-hospital-bed-count-per-100k` | 0000010209 | 1980–2011, 2023 | 2012–2022 | 1975–2023 (47) | healthcare |
| `high-school-advancement-rate` | 0000010205 | 2001–2011, 2023 | 2012–2022 | 2000–2023 (47) | education-culture, population-dynamics |
| `intellectual-disability-support-facility-residents-per-100k` | 0000010210 | 1978–1999, 2011 | 2000–2010 | 1975–2011 (47) | disability-support |
| `police-department-staff` | 0000010104 | 2002–2012, 2024 | 2013–2023 | 1998–2024 (47) | local-finance |

## 新しい年が出ている (26 件)

設定の最後の年より後に、全県の値がある年がある。テーマで使う指標を先に、該当する年の多い順。

| 指標 | 表 | 設定の年 | 該当する年 | 全県の値がある年 (県の数) | テーマ |
|---|---|---|---|---|---|
| `disposable-income-worker-households` | 0000010112 | 1975–2024 | 2025 | 1975–2025 (47) | local-economy, real-income |
| `female-part-time-hourly-wage` | 0000010206 | 2023 | 2024 | 2020–2024 (47) | labor-wages, gender-participation |
| `movers-in` | 0000010101 | 2014–2024 | 2025 | 2014–2025 (47) | population-dynamics |
| `movers-out` | 0000010101 | 2018–2024 | 2025 | 2014–2025 (47) | population-dynamics |
| `population-density-per-km2-inhabitable-area` | 0000010201 | 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2023 | 2024 | 1975–2024 (47) | living-housing, population-dynamics |
| `regular-cash-salary-female` | 0000010206 | 2023 | 2024 | 2020–2024 (47) | labor-wages |
| `regular-cash-salary-male` | 0000010206 | 2023 | 2024 | 2020–2024 (47) | labor-wages |
| `water-supply-population-ratio-2012on` | 0000010208 | 2022 | 2023 | 2012–2023 (47) | water-services |
| `annual-sales-amount` | 0000010103 | 2020, 2022 | 2023 | 1975, 1978, 1981, 1984, 1987, 1990, 1993, 1996, 1998, 2001, 2003, 2006, 2011, 2013, 2015, 2018–2023 (47) |  |
| `cpi-change-rate-excl-food-energy` | 0000010212 | 2023 | 2024 | 2015–2024 (47) |  |
| `cpi-change-rate-excl-fresh-food` | 0000010212 | 2023 | 2024 | 2005–2024 (47) |  |
| `cpi-change-rate-excl-fresh-food-energy` | 0000010212 | 2023 | 2024 | 2016–2024 (47) |  |
| `cpi-change-rate-excl-owner-rent` | 0000010212 | 2023 | 2024 | 1976–2024 (47) |  |
| `female-parttime-workers` | 0000010206 | 2023 | 2024 | 2020–2024 (47) |  |
| `japanese-movers-in` | 0000010101 | 1977–2024 | 2025 | 1975–2025 (47) |  |
| `japanese-movers-out` | 0000010101 | 1975–2024 | 2025 | 1975–2025 (47) |  |
| `kidney-failure-death-rate` | 0003411663 | 2023 | 2024 | 2015–2024 (47) |  |
| `liver-disease-death-rate` | 0003411663 | 2023 | 2024 | 2015–2024 (47) |  |
| `middle-school-teachers-ratio-female` | 0000010205 | 2023 | 2024 | 1975–2024 (47) |  |
| `moving-in-rate-japanese` | 0000010201 | 2000, 2005, 2010, 2015, 2020, 2023 | 2024 | 1975–2024 (47) |  |
| `moving-out-rate-japanese` | 0000010201 | 2000, 2005, 2010, 2015, 2020, 2023 | 2024 | 1975–2024 (47) |  |
| `pneumonia-death-rate` | 0003411663 | 2023 | 2024 | 2015–2024 (47) |  |
| `public-bond-expenses-purpose-prefecture` | 0000010104 | 2021 | 2022 | 1975–2022 (47) |  |
| `senility-death-rate` | 0003411663 | 2023 | 2024 | 2015–2024 (47) |  |
| `spouse-income` | 0000010112 | 2024 | 2025 | 1975–2025 (47) |  |
| `total-area-including-northern-territories-and-takeshima` | 0000010202 | 2023 | 2024 | 1975–2024 (47) |  |

## e-Stat に無い年がある (40 件)

設定にあるのに e-Stat に 1 県も値が無い年がある (補完元の年は除く)。テーマで使う指標を先に、該当する年の多い順。

| 指標 | 表 | 設定の年 | 該当する年 | 全県の値がある年 (県の数) | テーマ |
|---|---|---|---|---|---|
| `carpenter-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2023 (40) | occupation-salary |
| `cook-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `dentist-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020 (38) | occupation-salary |
| `designer-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `doctor-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `nurse-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `nursery-teacher-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `pharmacist-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `practical-nurse-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `school-teacher-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2022–2023 (44) | occupation-salary |
| `security-guard-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `software-engineer-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `taxi-driver-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2021–2022 (47) | occupation-salary |
| `truck-driver-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `university-professor-annual-income` | 0003445758 | 2010–2023 | 2010–2019 | 2020–2023 (47) | occupation-salary |
| `population-growth-rate` | 0000010101 | 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2024 | 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020 | 2021–2024 (47) | aging-society, population-dynamics |
| `care-worker-annual-income` | 0003445758 | 2015–2023 | 2015–2019 | 2020–2023 (47) | occupation-salary |
| `ratio-65-plus` | 0000010201 | 1980, 1985, 1990, 1995, 2000, 2005–2025 | 1980, 1985, 1990, 1995, 2000 | 2005–2024 (47) | aging-society, population-dynamics |
| `young-population-ratio` | 0000010201 | 1980, 1985, 1990, 1995, 2000, 2005–2021, 2024–2025 | 1980, 1985, 1990, 1995, 2000 | 2005–2024 (47) | population-dynamics |
| `housework-avg-time-female` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976, 1981, 1986 | 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) | daily-time-use, gender-participation |
| `housework-avg-time-male` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976, 1981, 1986 | 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) | daily-time-use, gender-participation |
| `divorces-per-total-population` | 0000010201 | 1975–2024 | 2023–2024 | 1975–2022 (47) | aging-society |
| `marriages-per-total-population` | 0000010201 | 1975–2024 | 2023–2024 | 1975–2022 (47) | aging-society |
| `sleep-avg-time-female` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976, 1981 | 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) | daily-time-use |
| `sleep-avg-time-male` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976, 1981 | 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) | daily-time-use |
| `urban-parks` | 0000010108 | 1976–2008, 2023 | 1976–1977 | 1975, 1978–2023 (47) | living-housing |
| `relaxation-avg-time-female` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976 | 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) | cultural-participation |
| `relaxation-avg-time-male` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976 | 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) | cultural-participation |
| `public-phone-count-per-1000` | 0000010208 | 1975–2007, 2024 | 1986–1989 | 1976–1985, 1990–2024 (47) |  |
| `meal-avg-time-female` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976, 1981 | 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) |  |
| `meal-avg-time-male` | 0000010113 | 1976, 1981, 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 | 1976, 1981 | 1986, 1991, 1996, 2001, 2006, 2011, 2016, 2021 (47) |  |
| `urban-park-area-per-person` | 0000010208 | 1976–2018, 2023 | 1976–1977 | 1975, 1978–2023 (47) |  |
| `commercial-and-neighborhood-commercial-area-ratio` | 0000010208 | 1984–2016, 2023 | 1995 | 1975–1994, 1996–2023 (47) |  |
| `elderly-class-lecture-count-per-million` | 0000010207 | 1975–1991, 2020 | 1976 | 1977, 1980, 1983, 1986, 1989, 1992, 1995, 1998, 2001, 2004, 2007, 2010, 2014, 2017, 2020 (47) |  |
| `general-dust-emission-facility-count` | 0000010211 | 1985–2017, 2023 | 1986 | 1985, 1987–2014, 2016–2023 (47) |  |
| `industrial-and-semi-industrial-area-ratio` | 0000010208 | 1983–2015, 2023 | 1995 | 1975–1994, 1996–2023 (47) |  |
| `industrial-exclusive-area-ratio` | 0000010208 | 1975–2021, 2023 | 1995 | 1975–1994, 1996–2023 (47) |  |
| `residential-and-mixed-area-ratio` | 0000010208 | 1981–2013, 2023 | 1995 | 1975–1994, 1996–2023 (47) |  |
| `residential-area-ratio` | 0000010208 | 1976–2008, 2023 | 1995 | 1975–1994, 1996–2023 (47) |  |
| `residential-telephone-subscription-count-per-1000` | 0000010208 | 1975–2004, 2024 | 1985 | 1976–1984, 1986–2024 (47) |  |

## 範囲より前にも年がある (739 件)

設定の最初の年より前に、全県の値がある年がある (基準の切り替えで外した年もここに出る)。テーマで使う指標を先に、該当する年の多い順。上位 40 件 (全件は diff.json)。

| 指標 | 表 | 設定の年 | 該当する年 | 全県の値がある年 (県の数) | テーマ |
|---|---|---|---|---|---|
| `average-age-of-first-marriage-wife` | 0000010101 | 2023 | 1975–2022 | 1975–2023 (47) | aging-society |
| `child-rearing-allowance-recipients` | 0000010110 | 2023 | 1975–2022 | 1975–2023 (47) | local-finance, single-parent-households |
| `elementary-school-count` | 0000010105 | 2023–2024 | 1975–2022 | 1975–2024 (47) | education-culture |
| `high-school-count` | 0000010105 | 2023–2024 | 1975–2022 | 1975–2024 (47) | education-culture |
| `junior-high-school-count` | 0000010105 | 2023–2024 | 1975–2022 | 1975–2024 (47) | education-culture |
| `new-condo-starts` | 0000010108 | 2023–2024 | 1975–2022 | 1975–2024 (47) | living-housing |
| `new-housing-starts` | 0000010108 | 2023–2024 | 1975–2022 | 1975–2024 (47) | living-housing |
| `new-owner-occupied-starts` | 0000010108 | 2023–2024 | 1975–2022 | 1975–2024 (47) | living-housing |
| `new-rental-starts` | 0000010108 | 2023–2024 | 1975–2022 | 1975–2024 (47) | living-housing |
| `residential-land-price-change-rate` | 0000010103 | 2024 | 1976–2023 | 1976–2024 (47) | land-property-market |
| `road-municipal-length` | 0000010108 | 2023 | 1975–2022 | 1975–2023 (47) | roads |
| `road-total-length` | 0000010108 | 2023 | 1975–2022 | 1975–2023 (47) | roads |
| `single-mother-public-assistance-households` | 0000010110 | 2023 | 1975–2022 | 1975–2023 (47) | single-parent-households |
| `sports-park-count` | 0000010108 | 2023 | 1975–2022 | 1975–2023 (47) | sports-participation |
| `active-job-opening-ratio` | 0000010206 | 2022 | 1975–2021 | 1975–2022 (47) | labor-mobility, labor-wages, local-economy |
| `aging-index` | 0000010201 | 2022 | 1975–2021 | 1975–2022 (47) | aging-society |
| `assistance-expenditure-ratio-pref-finance` | 0000010204 | 2022 | 1975–2021 | 1975–2022 (47) | local-finance |
| `child-welfare-expenditure-ratio-pref-finance` | 0000010204 | 2022 | 1975–2021 | 1975–2022 (47) | local-finance |
| `child-welfare-expenses-prefecture` | 0000010104 | 2022 | 1975–2021 | 1975–2022 (47) | local-finance |
| `annual-snow-days` | 0000010102 | 2020 | 1975–1981, 1983–2010, 2012–2018 | 1975–1981, 1983–2010, 2012–2018 (47) | climate |
| `air-cargo-transport` | 0000010103 | 2023 | 1985–2022 | 1985–2023 (47) | freight-logistics |
| `bus-operators` | 0000010103 | 2013 | 1975–2012 | 1975–2013 (47) | regional-transport, geographic-access |
| `annual-clear-days` | 0000010102 | 2020 | 1975–1981, 1983–2009, 2017–2018 | 1975–1981, 1983–2009, 2017–2018 (47) | climate |
| `agricultural-farm-count` | 0000010103 | 2019 | 1975–2004, 2009, 2014 | 1975–2004, 2009, 2014, 2019 (47) | agriculture-production |
| `maximum-snow-depth` | 0000010102 | 2007 | 1975–1985, 1987–2006 | 1975–1985, 1987–2007 (47) | climate |
| `police-officer-count-per-population` | 0000010211 | 2005–2015, 2024 | 1975–2004 | 1975–2024 (47) | safety |
| `infant-mortality-rate-per-1000-births` | 0000010209 | 2008–2018, 2023 | 1980–2007 | 1980–2023 (47) | healthcare |
| `households-on-public-assistance-per-1000` | 0000010210 | 2023 | 1980, 1985, 1990, 1995, 2000–2022 | 1980, 1985, 1990, 1995, 2000–2023 (47) | public-assistance |
| `university-count-per-100k` | 0000010205 | 2002–2013, 2024 | 1975–2001 | 1975–2024 (47) | education-culture |
| `pension-benefit-total` | 0000010110 | 2022 | 1997–2021 | 1997–2022 (47) | aging-society |
| `waste-recycling-rate` | 0000010208 | 2023 | 1999–2022 | 1999–2023 (47) | waste-recycling |
| `construction-industry-count` | 0000010103 | 2023 | 2000–2022 | 2000–2023 (47) | construction-industry |
| `garbage-final-disposal` | 0000010108 | 2022–2023 | 1999–2021 | 1999–2023 (47) | waste-recycling |
| `garbage-total-output` | 0000010108 | 2022–2023 | 1999–2021 | 1999–2023 (47) | waste-recycling |
| `home-helper-users-per-office` | 0000010210 | 2023 | 2000–2022 | 2000–2023 (47) | healthcare |
| `mobile-phone-contract-count-per-1000` | 0000010208 | 2023 | 2000–2022 | 2000–2023 (47) | communication-access |
| `nursing-care-insurance-benefit` | 0000010110 | 2023 | 2000–2022 | 2000–2023 (47) | long-term-care |
| `water-supply-annual-volume` | 0000010108 | 2022 | 2000–2021 | 2000–2022 (47) | water-services |
| `agricultural-output-per-employed-person` | 0000010203 | 2018 | 1989, 1994, 1999–2017 | 1989, 1994, 1999–2018 (47) | agriculture-production |
| `general-hospital-avg-length-of-stay` | 0000010209 | 1995–2017, 2023 | 1975–1994 | 1975–2023 (47) | healthcare |

## 台帳なし・取得失敗・打ち切り・重複行

| 指標 | 表 | 状態 | 理由 |
|---|---|---|---|
| `convenience-store-sales` | 0004032502 | duplicate-rows |  |
