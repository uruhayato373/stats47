# selection backfill 2026-09-16-1224

- 実行: 2026-09-16T12:24:46.707Z → 2026-09-16T14:10:47.952Z / model claude-sonnet-5 / concurrency 2
- 対象 53 テーマ 481 指標 / 通過 206 / gate 不合格 17 / 資料なし skip 19 / 未応答 239
- 停止理由: 全対象を処理
- 費用 (API 換算) $89.00 / トークン in 28677956 out 670706
- 再現: `bash .claude/scripts/themes/run-selection-backfill.sh --themes local-finance,education-culture,healthcare,population-dynamics,labor-mobility,regional-energy,forestry-timber,local-services,safety,sports-participation,agriculture-production,construction-industry,health-checkups,local-economy,roads,cultural-participation,business-demography,labor-wages,tourism,manufacturing,water-services,consumer-prices,daily-time-use,gender-participation,landslide-exposure,living-housing,local-government-digital,occupation-salary,climate,fishery-marine,household-assets-debt,innovation-patents,environmental-quality,real-income,land-property-market,natural-environment,ports,regional-transport,single-parent-households,childcare-services,foreign-residents,disability-support,long-term-care,public-assistance,community-participation,communication-access,freight-logistics,railway,retail-commerce,earthquake-exposure,information-industry,geographic-access,waste-recycling`

## テーマ別

| theme | 対象 | 通過 | 不合格 | skip | 未応答 | 状態 |
|---|---|---|---|---|---|---|
| local-finance | 27 | 17 | 1 | 9 | 0 | partial |
| education-culture | 26 | 22 | 1 | 3 | 0 | partial |
| healthcare | 19 | 14 | 4 | 1 | 0 | partial |
| population-dynamics | 23 | 19 | 4 | 0 | 0 | partial |
| labor-mobility | 17 | 16 | 0 | 1 | 0 | partial |
| regional-energy | 17 | 15 | 2 | 0 | 0 | partial |
| forestry-timber | 15 | 14 | 0 | 1 | 0 | partial |
| local-services | 15 | 15 | 0 | 0 | 0 | complete |
| safety | 15 | 14 | 1 | 0 | 0 | partial |
| sports-participation | 12 | 10 | 0 | 2 | 0 | partial |
| agriculture-production | 11 | 10 | 1 | 0 | 0 | partial |
| construction-industry | 11 | 9 | 1 | 1 | 0 | partial |
| health-checkups | 11 | 10 | 0 | 1 | 0 | partial |
| local-economy | 11 | 10 | 1 | 0 | 0 | partial |
| roads | 11 | 6 | 0 | 0 | 5 | partial |
| cultural-participation | 10 | 5 | 1 | 0 | 4 | partial |
| business-demography | 9 | 0 | 0 | 0 | 9 | error |
| labor-wages | 10 | 0 | 0 | 0 | 10 | error |
| tourism | 9 | 0 | 0 | 0 | 9 | error |
| manufacturing | 9 | 0 | 0 | 0 | 9 | error |
| water-services | 9 | 0 | 0 | 0 | 9 | error |
| consumer-prices | 8 | 0 | 0 | 0 | 8 | error |
| daily-time-use | 8 | 0 | 0 | 0 | 8 | error |
| gender-participation | 8 | 0 | 0 | 0 | 8 | error |
| landslide-exposure | 8 | 0 | 0 | 0 | 8 | error |
| living-housing | 8 | 0 | 0 | 0 | 8 | error |
| local-government-digital | 8 | 0 | 0 | 0 | 8 | error |
| occupation-salary | 8 | 0 | 0 | 0 | 8 | error |
| climate | 7 | 0 | 0 | 0 | 7 | error |
| fishery-marine | 7 | 0 | 0 | 0 | 7 | error |
| household-assets-debt | 7 | 0 | 0 | 0 | 7 | error |
| innovation-patents | 7 | 0 | 0 | 0 | 7 | error |
| environmental-quality | 6 | 0 | 0 | 0 | 6 | error |
| real-income | 7 | 0 | 0 | 0 | 7 | error |
| land-property-market | 6 | 0 | 0 | 0 | 6 | error |
| natural-environment | 6 | 0 | 0 | 0 | 6 | error |
| ports | 6 | 0 | 0 | 0 | 6 | error |
| regional-transport | 6 | 0 | 0 | 0 | 6 | error |
| single-parent-households | 6 | 0 | 0 | 0 | 6 | error |
| childcare-services | 5 | 0 | 0 | 0 | 5 | error |
| foreign-residents | 5 | 0 | 0 | 0 | 5 | error |
| disability-support | 5 | 0 | 0 | 0 | 5 | error |
| long-term-care | 5 | 0 | 0 | 0 | 5 | error |
| public-assistance | 5 | 0 | 0 | 0 | 5 | error |
| community-participation | 4 | 0 | 0 | 0 | 4 | error |
| communication-access | 4 | 0 | 0 | 0 | 4 | error |
| freight-logistics | 4 | 0 | 0 | 0 | 4 | error |
| railway | 4 | 0 | 0 | 0 | 4 | error |
| retail-commerce | 4 | 0 | 0 | 0 | 4 | error |
| earthquake-exposure | 3 | 0 | 0 | 0 | 3 | error |
| information-industry | 3 | 0 | 0 | 0 | 3 | error |
| geographic-access | 3 | 0 | 0 | 0 | 3 | error |
| waste-recycling | 3 | 0 | 0 | 0 | 3 | error |

## gate 不合格 (prompt か gate の問題を疑う。30% 超なら停止条件)

| theme | rankingKey | reasons |
|---|---|---|
| local-finance | child-welfare-expenditure-ratio-pref-finance | quote-not-found |
| education-culture | art-museum-count | quote-length:5 |
| healthcare | medical-physicians-age-60-plus | quote-not-found |
| healthcare | home-nursing-visit-cases | quote-not-found |
| healthcare | life-expectancy-0-male | quote-not-found |
| healthcare | life-expectancy-0-female | quote-not-found |
| population-dynamics | births-mother-age25to29 | quote-length:6 |
| population-dynamics | births-mother-age30to34 | quote-length:6 |
| population-dynamics | births-mother-age35to39 | quote-length:6 |
| population-dynamics | births-mother-age40plus | quote-length:6 |
| regional-energy | regional-industry-final-energy-consumption | url-unreachable:403 |
| regional-energy | regional-business-final-energy-consumption | url-unreachable:403 |
| safety | disaster-relief-expenses-prefecture | quote-not-found |
| agriculture-production | cultivated-area | quote-length:162 |
| construction-industry | construction-employed-residents | quote-not-found |
| local-economy | employed-people-ratio-primary | quote-not-found |
| cultural-participation | hobby-participation-rate-painting | quote-length:8 |

## 一次資料を見つけられなかった指標 (翌朝: 人が資料を探すか、context への降格を検討)

| theme | rankingKey | モデルの理由 |
|---|---|---|
| local-finance | per-capita-total-expenditure-pref-municipal | 「歳出決算総額 人口1人当たり」「住民一人当たり歳出額 説明」等で検索し、総務省 地方財政白書（30czb01-10.html, r03czb01-10.html 等）や e-Stat dbview (sid=0000010204) を WebFetch で複数回試みたが、総務省サイトは同一URLでも取得のたびに文字化けし本文を安定して逐語確認できず、lg.jp の財政用語集にも歳出決算総額そのものの説明は見つからなかったため、確実な一次資料の逐語引用を得られなかった。 |
| local-finance | avg-salary-police-prefecture | 「地方公務員給与実態調査 警察職 平均給与月額 都道府県」等で検索し、総務省 teiin-kyuuyo02.html、teiin-kyuuyo02_R5_kekka.html、kyuuyo_jc_1.html、および e-stat の統計表ページ(toukei=00200211)をWebFetchしたが、いずれも文字化けでの取得失敗、または警察職に言及する逐語文を本文中に確認できなかったため、一次資料からの逐語引用を得られなかった。 |
| local-finance | furusato-donation-amount-prefecture | 総務省ふるさと納税ポータルの archive ページ、news ページ、about/mechanism/policy 各ページ、報道資料ページ(01zeimu04_02000127.html)、および令和7・8年度現況調査結果PDF(001084951.pdf等)をWebFetchしたが、いずれも文字化けまたはPDFバイナリ非対応で本文の逐語テキストを取得できなかった。 |
| local-finance | furusato-donation-count-prefecture | 同上。総務省ふるさと納税現況調査関連ページ・PDFを複数試みたが、文字化けまたはPDF解析不可のため受入件数に関する逐語引用を取得できなかった。 |
| local-finance | furusato-fundraising-cost-prefecture | 募集経費に関する記述を探して総務省の告示改正PDF(000826061.pdf)や現況調査結果PDFを試みたが、いずれもバイナリ解析不可で逐語引用を取得できなかった。 |
| local-finance | furusato-return-gift-procurement-cost-prefecture | 返礼品調達費に関する記述を探して総務省の関連ページ・PDFを試みたが、文字化けまたはPDF解析不可のため逐語引用を取得できなかった。 |
| local-finance | furusato-return-gift-shipping-cost-prefecture | 「総務省 ふるさと納税に関する現況調査 令和8年度 返礼品 送付費」等で検索し、総務省の報道資料PDF（https://www.soumu.go.jp/main_content/001084951.pdf、https://www.soumu.go.jp/main_content/000960670.pdf）および関連html（archive/、menu_news/s-news/01zeimu04_02000127.html、01zeimu04_02000162.html）を複数回WebFetchしたが、PDFはバイナリとして解析不能、htmlはエンコーディング崩れで本文を逐語抽出できず、機械照 |
| local-finance | furusato-tax-deduction-municipal-prefecture | 「ふるさと納税 市町村民税 道府県民税 控除額 現況調査 総務省」で検索し、soumu.go.jpのmechanism/deduction.html・mechanism/about.html・furusato/about/・080430_2_kojin.html等を複数回WebFetchしたが、道府県民税や市町村民税控除額の都道府県別集計に関する逐語引用を安定して取得できず（同一ページでも取得結果が回により矛盾し文字化けも頻発）、信頼できる原文一致の引用を得られなかった。 |
| local-finance | furusato-tax-deduction-prefectural-prefecture | 同上の検索・取得を試みたが、道府県民税控除額（県内課税分）に特化した記述を含む一次資料ページ・PDFから機械照合可能な逐語引用を取得できなかったため見送った。 |
| education-culture | elementary-school-students-per-teacher | 「教員一人当たり児童数」定義 学校基本調査／少人数教育 白書などで検索したが、文部科学省の該当解説ページ（例: mext.go.jp/b_menu/toukei/001/08030520/010.htm）は404、mext公表PDF（20241213-mxt_chousa01-000037551_01.pdf等）や統計局の対応ページ（stat.go.jp/library/faq/faq22/faq22a02.html）はいずれも文字化け・バイナリ化しており本文を一字一句取得できなかったため一次資料での裏付けを断念した。 |
| education-culture | prefectural-cultural-property-protection-expenditure | 指定URL(文化庁 https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/pdf/94396001_01.pdf)をWebFetchで取得したが、PDFがバイナリ/エンコード化され本文抽出不可だった。「文化庁 地方における文化行政 文化関係経費 都道府県 文化財保護費 決算額」等で検索したが、都道府県別決算額を記載した読み取り可能な代替一次資料(HTML)は見つからなかった。 |
| education-culture | buried-cultural-property-specialist-count | 指定URL(文化庁 https://www.bunka.go.jp/seisaku/bunkazai/shokai/pdf/94356801_01.pdf)および代替候補(令和6年度版 94191101_01.pdf、奈良文化財研究所ミラーPDF、CiNii解説ページ)をいずれもWebFetchで試みたが、PDFは本文抽出不可、CiNiiページは空白で、専門職員数の定義・記述を引用できる読み取り可能な一次資料が得られなかった。 |
| healthcare | medical-physicians-emergency-medicine | 「救急科 医師数 都道府県」「医師偏在指標 診療科別 救急科」「令和6年医師・歯科医師・薬剤師統計 診療科別」などで検索し、厚労省 ishi/24 の概況ページ・R06_1gaikyo.pdf・R06_gaikyo-b1.pdf、旧年度の kekka1-2-3.html（/04/,/06/）、医師偏在対策の各種PDF（0000194394.pdf、001634535.pdf）を確認したが、いずれもPDFが本文抽出不可、または該当HTMLページに救急科医師数の具体的記述が見当たらず、逐語引用できる一次資料を確認できなかった。 |
| labor-mobility | employees-weekly-hours-60plus-count | 「週60時間以上就業する雇用者数（人数、役員を除く・年間200日以上）」に一致する具体的な人数を明記した一次資料を、就業構造基本調査の結果の概要（stat.go.jp/data/shugyou/2022/pdf/kgaiyou.pdf）や労働経済白書（mhlw.go.jp/stf/wp/hakusyo/roudou）で探したが、本文中の記述はいずれも割合（％）表現にとどまり、定義に一致する人数の逐語引用可能な一文を確認できなかった。 |
| forestry-timber | forestry-internal-workers | 「2025年農林業センサス 林業経営体 内部労働力 定義」等で調査したが、maff.go.jp/j/tokei/census/afc/2025/gaiyou.html はWebFetchの要約でのみ「林業経営体の経営内部の労働力について、個人ごとに把握していた生年月及び過去1年間のふだんの状況等」という記述を確認できたものの、括弧内の言い換えが要約由来で逐語性が確認できず、また関連PDF（index-11.pdf, census_25.pdf, index-28.pdf等）は403エラーやバイナリ化けで本文を検証できなかったため、逐語引用可能な一次資料に到達できなかった。 |
| sports-participation | daily-steps-male-20to64-age-adjusted | 厚生労働省の指定URL https://www.mhlw.go.jp/content/001675215.pdf および代替の結果概要PDF https://www.mhlw.go.jp/content/10900000/001603146.pdf をWebFetchで複数回取得したが、いずれも圧縮バイナリとして扱われ本文テキストを一字一句抽出できなかった。第三者サイト（wic-net.com）経由の再現テキストも取得のたびに文言が微妙に異なり（「である。」调「です。」表記揺れ等）、逐語引用として機械照合できる確実な一次資料本文を確認できなかったため見送った。 |
| sports-participation | daily-steps-female-20to64-age-adjusted | 厚生労働省の指定URL https://www.mhlw.go.jp/content/001675215.pdf をWebFetchで取得したが圧縮バイナリでテキスト抽出不可、mhlw.go.jp/stf/newpage_66279.html 経由で見つけた別PDF（001603146.pdf）も同様に抽出不可だった。第三者サイトの再現テキストは取得の都度表現が変わり逐語引用の信頼性を確保できなかったため見送った。 |
| construction-industry | construction-employed-age30to54 | 「30〜54歳 建設業 就業者数 国勢調査」「30〜54歳 建設業 中核層」等で検索し、国土交通白書（mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n1111000.html）や国土交通省・厚生労働省の各種PDF（001191669.pdf、001180947.pdf、001566406.pdf等）を確認したが、いずれも29歳以下・55歳以上の二区分の言及に留まり、30〜54歳という年齢区分を明示的に記述した一次資料本文を取得できなかった。 |
| health-checkups | dental-checkup-persons-per-1000 | 「社会生活統計指標 歯科健診受診延人員 人口千人当たり I13208」「社会・人口統計体系 解説編 保健医療」等で検索し、e-stat.go.jp/dbview?sid=0000010209、stat.go.jp/data/ssds/shihyou.html、e-stat.go.jp/stat-search/file-download?statInfId=000032169024 等を確認したが、I13208という指標コードや「歯科健診受診延人員（人口千人当たり）」の定義を明記した一次資料の本文を取得できず（stat.go.jpは文字化けで読解不可、PDFはバイナリで解析不可）、逐語引用に使え |

## role の推奨 (夜間バッチは書かない。人が theme-designer 経由で判断)

| theme | rankingKey | 現在 | 推奨 | 理由 |
|---|---|---|---|---|
| local-finance | future-burden-ratio | secondary | primary | 将来負担という現在負担とは異なる時間軸を示す健全化判断比率の柱であり、テーマの「現在と将来の負担」を扱ううえで実質公債費比率と並ぶ代表性を持つため primary への格上げを検討する余地がある。 |
| local-finance | maintenance-repair-expenses-prefecture | secondary | primary | 白書が毎年独立して定義・決算額を公表しており、公共施設維持管理という章の中心的な問いを直接表すためprimary格上げが検討に値する。 |
| local-finance | prefectural-public-building-floor-area | secondary | context | 単年データであり時系列比較ができないため、支出指標を補足する文脈情報としての位置付けが妥当である。 |
| local-finance | avg-age-admin-prefecture | secondary | context | 平均年齢はそれ単独では財政指標ではなく、給与水準を解釈するための背景情報として位置付けるのが妥当である。 |
| education-culture | university-count | secondary | context | 一次資料の記述は調査対象の一覧としての言及に留まり、大学数固有の政策的位置付けを示す記述が見つからなかったため。 |
| education-culture | study-participation-rate-business | secondary | context | 単年（2021年）データで時系列比較ができないため、他の複数年指標を補う文脈情報として扱うのが適切と考えられる。 |
| education-culture | total-museum-count | secondary | primary | 博物館総数は地域の文化施設供給量を示す最も基礎的な代表指標であり、館種別指標(美術博物館数)や入館者数指標の前提となるため主指標に近い扱いが妥当である。 |
| education-culture | art-museum-count | secondary | context | 美術博物館数は博物館総数の内訳の一つであり、単独では代表性が弱く館種別の補足情報として文脈的に用いるのが妥当である。 |
| healthcare | general-perinatal-center-count | secondary | primary | ハイリスク分娩対応拠点の有無は周産期医療アクセスの代表的な問いに直結するため。 |
| healthcare | life-expectancy-0-male | secondary | primary | 平均寿命は保健福祉水準を総合的に示す代表指標として厚生労働省が位置づけており、健康アウトカムの中心指標になり得る。 |
| healthcare | life-expectancy-0-female | secondary | primary | 女性の平均寿命も男性と並ぶ代表的な健康アウトカム指標であり、性別の健康格差を示す主要指標になり得る。 |
| healthcare | new-cancer-incidence-count | secondary | primary | がんは主要死因であり、罹患数は死亡数と並ぶ疾病負荷の中心的な指標になり得る。 |
| population-dynamics | movers-in | secondary | context | 外国人転入者数のみに限定された実数であり、県間移動全体を代表する指標ではないため、文脈情報として扱うのが資料の区分と整合する。 |
| population-dynamics | births-mother-age40plus | secondary | context | 件数が他の年齢階級より少なく変動が大きいため、参考情報としての位置づけがより適切である。 |
| population-dynamics | births-third-child-plus | secondary | context | 出生順位という補足的な内訳であり、テーマの主要な自然増減指標を補完する位置づけにとどまるため。 |
| population-dynamics | five-year-residence-other-prefecture | secondary | primary | 県間の人口移動を扱う章の中心的な問いに直接答える指標であり、国勢調査という同一基準の全数調査に基づくため代表性が高い。 |
| population-dynamics | future-population | secondary | primary | 将来推計人口の章の中心指標であり、IPSSという単一の公式推計に基づき都道府県間比較が可能なため。 |
| population-dynamics | future-population-change-rate-2050 | secondary | primary | 規模の異なる都道府県間で人口減少の速さを直接比較できる共通尺度であり、将来推計人口の実数指標を補う中心的な指標になるため。 |
| labor-mobility | employment-mobility-rate | secondary | primary | テーマの中心的問い（離職・転職・新規就業をまとめた地域の就業異動の活発さ）を直接表す唯一の合成指標であるため。 |
| labor-mobility | non-regular-employment-rate | secondary | primary | 非正規雇用と雇用の安定性章の代表指標であり、白書でも都道府県間の顕著な差が繰り返し取り上げられているため。 |
| labor-mobility | nonregular-employees-count | secondary | context | 率指標である非正規雇用率の規模感を補う参考値としての性格が強く、単独では地域比較の主指標になりにくいため。 |
| labor-mobility | employees-weekly-hours-60plus-rate | secondary | primary | 厚生労働省の労働経済白書が長時間労働是正の進捗を測る代表指標として繰り返し取り上げているため、テーマの中心指標として扱う価値がある。 |
| labor-mobility | commuter-ratio-to-other-municipalities | secondary | primary | 国勢調査の結果概要で都道府県比較の柱として扱われており、通勤・昼間人口の章の代表指標になり得る。 |
| regional-energy | fit-fip-installed-capacity | secondary | primary | A表が都道府県別認定・導入量の合計を公表の中心に据えていることから、章立て「FIT・FIPの再エネ導入設備容量」の主指標として扱う余地がある。 |
| regional-energy | regional-co2-emissions-estimate | secondary | primary | 現況推計は環境省が全国共通基準で公表する代表的な排出量指標であり、章立て「地域のCO2排出量推計」の主指標として扱う余地がある。 |
| regional-energy | regional-waste-co2-emissions-estimate | secondary | context | 一般廃棄物焼却由来の推計は非エネルギー起源の限定的な発生源であり、エネルギー消費規模比較というテーマの主眼からは補足的な文脈情報にとどまるため。 |
| forestry-timber | forestry-management-entities | secondary | primary | 2025年農林業センサスの結果概要が林業経営体数を全国見出しの中心指標として扱っており、テーマの代表指標になり得るため。 |
| forestry-timber | forestry-internal-workers | secondary | context | 定義変更（従事日数階級別集計への変更）があり時系列比較に注意が必要なため、参考情報としての位置づけが妥当と考えられる。 |
| local-services | number-of-hotel-facilities | secondary | context | データ源が衛生行政報告例で経済センサス系の他指標と調査主体・基準が異なるため、比較の主軸ではなく背景情報としての位置づけがより適切と考えられる。 |
| local-services | number-of-hotel-rooms | secondary | context | 施設数と同じ調査に基づき、宿泊業の規模を補足する背景情報であり、飲食・生活関連サービス業比較というテーマの主軸からはやや外れるため。 |
| safety | disaster-recovery-expenses-prefecture | secondary | context | 財政データは物理的被害と異なる文脈情報であり、章の主指標というより背景説明として位置付ける方が適切。 |
| safety | individual-evacuation-plan-coverage-rate | secondary | primary | 内閣府調査が市町村の政策進捗目標として毎年公表しており、避難施設整備の章の中心指標になり得るため。 |
| safety | individual-evacuation-plan-listed-persons | secondary | context | 作成率や作成人数の母数を示す背景データであり、単独では読者の意思決定に直結しにくいため文脈情報として位置づけるのが妥当である。 |
| sports-participation | sports-park-count | secondary | context | 単年・総数のみで人口比補正がなく、社会体育施設数と重複する供給側の参考情報にとどまるため。 |
| sports-participation | daily-steps-male-20to64-age-adjusted | secondary | context | 一次資料の逐語確認ができず根拠が弱いため、確認できるまでは参考情報として扱うのが妥当。 |
| sports-participation | daily-steps-female-20to64-age-adjusted | secondary | context | 一次資料の逐語確認ができず根拠が弱いため、確認できるまでは参考情報として扱うのが妥当。 |
| agriculture-production | dairy-cattle-count | secondary | primary | 畜産・酪農章の中心指標として、乳用牛飼養頭数は酪農生産規模を都道府県別に直接示すため主要指標に位置付けるべきである。 |
| agriculture-production | beef-cattle-count | secondary | primary | 肉用牛飼養頭数は乳用牛と対をなす畜産構造の主要指標であり、章の中心的な比較軸となるため。 |
| construction-industry | construction-employed-under30 | secondary | primary | 国土交通白書が建設業の高齢化・若年入職減少を担い手確保の中心課題と位置付けているため、章「建設業の担い手構成と職種別待遇」の主指標にふさわしい。 |
| construction-industry | construction-employed-age30to54 | secondary | context | この年齢帯を単独で扱う一次資料の言及が見つからず、29歳以下・55歳以上の対比の残差として位置付けるのが妥当なため。 |
| construction-industry | construction-employed-age55plus | secondary | primary | 国土交通白書が建設業の担い手不足を象徴する数値として全産業比較付きで明示しており、テーマの主要な問いを直接表すため。 |
| construction-industry | public-construction-contract-amount | secondary | primary | 施工地別の公共工事受注という独立した章立てが存在し、金額は事業規模比較の代表的指標であるため。 |
| health-checkups | health-checkup-recipients | secondary | context | 特定健診（医療保険者ベース）とは異なる自治体健診の延人員であり、受診率の分母定義とも異なるため参考値として位置付けるほうが読者の混同を避けられる。 |
| local-economy | private-establishment-net-value-added | secondary | primary | 事業所所在地に按分された付加価値額は地域の実際の生産基盤を最も直接的に表すため、県民所得と並ぶ主指標に格上げする余地がある。 |
| roads | road-length-per-km2 | secondary | primary | 面積差を考慮した密度指標は都道府県比較で実延長より解釈しやすく、章の代表指標に近い役割を果たしうるため。 |

## 実行エラー

- roads: roads#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- cultural-participation: cultural-participation#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- business-demography: business-demography#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | business-demography#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- labor-wages: labor-wages#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | labor-wages#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- tourism: tourism#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | tourism#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- manufacturing: manufacturing#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | manufacturing#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- water-services: water-services#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | water-services#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- consumer-prices: consumer-prices#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | consumer-prices#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- daily-time-use: daily-time-use#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | daily-time-use#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- gender-participation: gender-participation#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | gender-participation#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- landslide-exposure: landslide-exposure#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | landslide-exposure#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- living-housing: living-housing#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | living-housing#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- local-government-digital: local-government-digital#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | local-government-digital#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- occupation-salary: occupation-salary#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | occupation-salary#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- climate: climate#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | climate#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- fishery-marine: fishery-marine#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | fishery-marine#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- household-assets-debt: household-assets-debt#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | household-assets-debt#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- innovation-patents: innovation-patents#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | innovation-patents#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- environmental-quality: environmental-quality: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- real-income: real-income#1: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo) | real-income#2: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- land-property-market: land-property-market: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- natural-environment: natural-environment: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- ports: ports: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- regional-transport: regional-transport: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- single-parent-households: single-parent-households: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- childcare-services: childcare-services: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- foreign-residents: foreign-residents: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- disability-support: disability-support: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- long-term-care: long-term-care: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- public-assistance: public-assistance: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- community-participation: community-participation: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- communication-access: communication-access: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- freight-logistics: freight-logistics: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- railway: railway: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- retail-commerce: retail-commerce: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- earthquake-exposure: earthquake-exposure: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- information-industry: information-industry: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- geographic-access: geographic-access: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
- waste-recycling: waste-recycling: claude CLI error: You've hit your session limit · resets 12:40am (Asia/Tokyo)
