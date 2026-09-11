/**
 * metric の極性 (値が高いほど良いか悪いか) の SSOT (2026-07-31 新設)。
 *
 * ## なぜ MetricConfig のフィールドにしないか
 *
 * 2,295 個の config ファイルに optional を散らすと、カバレッジを数える場所が無くなり
 * ラチェット (減ったら落とす) が効かない。1 ファイルに集約して「今どれだけ確定しているか」を
 * 機械が数えられる形にする。
 *
 * ## 推測で埋めない
 *
 * 極性はキーワードでも category でも判定できない。実例:
 *
 *   | title                        | 共通語幹   | 実際の極性 |
 *   |------------------------------|-----------|-----------|
 *   | 刑法犯認知件数 / 刑法犯検挙率  | 刑法犯     | 悪い / 良い |
 *   | 生活保護費 / 生活保護施設定員数 | 生活保護   | 悪い / 良い |
 *   | 死亡者数 / 健康寿命           | 死亡・寿命 | 悪い / 良い |
 *   | 転出率 / 転入超過率           | 人口移動   | 悪い / 良い |
 *
 * したがって**未収載 = 未割当**であり、「たぶん悪い」を書かない。
 * 収載は証拠のある分だけにし、ラチェットで育てる (expected-shape-anomaly.ts と同じ作法)。
 *
 * ## seed の作り方 (2026-07-31)
 *
 * 既に `interpolateReds` が明示指定されている 72 件を母集団とし、title が事故・災害・犯罪・
 * 死亡・被害額・排出量など**争いのない事象**を指すものだけを収載した (54 件)。
 * 判断が割れる 18 件は下の EXCLUDED_FROM_SEED に理由付きで残してある
 * (再調査のたびに同じ議論をしないため)。
 */

export type MetricPolarity = "higher-is-worse" | "higher-is-better" | "neutral";

export interface PolarityEntry {
  polarity: MetricPolarity;
  /** なぜそう言えるのか。空文字は禁止 (テストが弾く) */
  evidence: string;
}

/** 明示的に極性が確定した metric のみ。未収載 = 未割当 (推測しない)。 */
export const METRIC_POLARITY: Readonly<Record<string, PolarityEntry>> = {
  // 2026-09-11 テーマ拡充の240指標を定義・母集団ごとに確認。
  // 個々の原典・表番号・取得日時は同じ key の metrics/<key>.ts source/provenance を参照。
  // 実数の大小を住民の厚生や地域の施策成績に読み替えない。被害、達成率、計測母集団を区別する。
  // 歩数・食塩・野菜の改善方向: 厚労省「健康日本21目標値一覧」(2026-09-11確認)
  // https://www.mhlw.go.jp/www1/topics/kenko21_11/t2a.html
  // 長時間労働の抑制方向: 過労死等防止対策大綱 数値目標 (2026-09-11確認)
  // https://www.mhlw.go.jp/content/11201000/001282630.pdf
  // 大綱の「週40時間以上」分母を、本カタログの「年間200日以上」の分母へ転用しない。
  "ambulance-transported-deaths": { polarity: "higher-is-worse", evidence: "消防庁の初診時診断で死亡に分類された搬送人員であり、救命できなかった人的被害の増加を望ましいとは扱わない。" },
  "ambulance-transported-mild": { polarity: "neutral", evidence: "初診時に外来診療相当とされた搬送人員で、軽症者の救急利用と医療へのアクセスを含むため、件数だけで利用の適否を決めない。" },
  "ambulance-transported-moderate": { polarity: "higher-is-worse", evidence: "消防庁の初診時診断で入院診療が必要とされた傷病者数であり、傷病負担の増加を示す。搬送体制の優劣は示さない。" },
  "ambulance-transported-other": { polarity: "neutral", evidence: "初診時分類のその他には診断未確定等が含まれ、重症度や救急医療の成果を一方向に判定できない。" },
  "ambulance-transported-persons": { polarity: "neutral", evidence: "救急自動車の搬送総数は傷病需要と救急アクセスの双方で増減するため、総数の増加だけを良否に結び付けない。" },
  "ambulance-transported-severe": { polarity: "higher-is-worse", evidence: "消防庁が初診時に長期入院を要すると分類した重症者数で、重い傷病による人的負担の増加を示す。" },
  "amusement-industry-employees": { polarity: "neutral", evidence: "事業所所在地別の娯楽業従業者の実数であり、地域人口や労働条件を調整した雇用の充足度ではない。" },
  "amusement-industry-establishments": { polarity: "neutral", evidence: "娯楽業の事業所実数は市場規模と事業所の集約度に左右され、サービス品質や利用機会の充足率を表さない。" },
  "amusement-industry-net-value-added": { polarity: "neutral", evidence: "娯楽業企業の純付加価値額を本所所在地へ帰属させた総額で、住民の所得や地域内全事業所の生産性とは異なる。" },
  "amusement-industry-revenue": { polarity: "neutral", evidence: "娯楽業企業の売上総額は本所集中と企業規模を反映し、利益率や住民の便益を直接表さない。" },
  "beef-cattle-count": { polarity: "neutral", evidence: "肉用目的の飼養頭数は畜産の生産規模で、採算・需要・環境負荷を併せなければ多寡の良否を決められない。" },
  "births-first-child": { polarity: "neutral", evidence: "第1子の出生実数は親世代の人口規模と出産選択を反映し、出生順位の多寡に価値の優劣を付けない。" },
  "births-mother-age25to29": { polarity: "neutral", evidence: "母25〜29歳の出生実数は該当年齢女性の人口構成に依存し、特定の出産年齢を望ましいと順位付けしない。" },
  "births-mother-age30to34": { polarity: "neutral", evidence: "母30〜34歳の出生実数は該当年齢女性の人口構成に依存し、特定の出産年齢を望ましいと順位付けしない。" },
  "births-mother-age35to39": { polarity: "neutral", evidence: "母35〜39歳の出生実数は該当年齢女性の人口構成に依存し、出生実数を個人の妊娠リスクへ読み替えない。" },
  "births-mother-age40plus": { polarity: "neutral", evidence: "母40歳以上の出生実数は年齢構成と出産選択を反映し、出産年齢や子どもに良否を付ける指標ではない。" },
  "births-mother-under25": { polarity: "neutral", evidence: "母25歳未満の出生実数は年齢構成と出産選択を反映し、若年での出産を一律に良い・悪いとしない。" },
  "births-second-child": { polarity: "neutral", evidence: "第2子の出生実数は親世代の人数と家族形成を反映し、出生順位の多寡に価値の優劣を付けない。" },
  "births-third-child-plus": { polarity: "neutral", evidence: "第3子以降の出生実数は家族構成と人口規模に依存し、子どもの人数を世帯の良否へ結び付けない。" },
  "broadband-contract-count-excluding-39-4g": { polarity: "neutral", evidence: "携帯電話LTE等を除く通信契約数は複数契約と世帯・事業所規模を含み、未接続世帯の少なさを直接表さない。" },
  "broadband-service-contract-count": { polarity: "neutral", evidence: "LTE等を含む通信契約総数は一人複数契約を含むため、住民の接続率や通信品質と同一視できない。" },
  "buried-cultural-property-specialist-count": { polarity: "neutral", evidence: "埋蔵文化財の専門職員実数は遺跡・調査需要と組織構成に依存し、全文化財の保存成果や配置の十分さを表さない。" },
  "business-closure-establishments": { polarity: "neutral", evidence: "雇用保険の保険関係消滅は行政上の事業所変動で、倒産や雇用喪失だけを識別する件数ではない。" },
  "business-closure-rate": { polarity: "neutral", evidence: "雇用保険の消滅事業所数を前年末適用数で割る率で、事業再編・退出を含み、すべてを経済的失敗とは解釈しない。" },
  "business-opening-base-establishments": { polarity: "neutral", evidence: "前年末の雇用保険適用事業所数は開廃業率の分母であり、事業の成長や存続の成果を測る値ではない。" },
  "business-opening-establishments": { polarity: "neutral", evidence: "雇用保険関係の新規成立件数は新設と適用範囲の変化を含む行政記録で、純雇用創出や創業成功数とは異なる。" },
  "business-opening-rate": { polarity: "neutral", evidence: "前年末適用数に対する保険関係新規成立率は参入動態で、存続・付加価値・雇用の質を併せなければ良否を決められない。" },
  "child-rearing-allowance-recipients": { polarity: "neutral", evidence: "児童扶養手当受給者数は支援需要と制度への到達をともに反映し、受給者の多寡を生活状態の優劣としない。" },
  "childcare-applicants": { polarity: "neutral", evidence: "保育利用申込者総数は子どもの人数と利用希望の規模であり、受入不足や待機児童数そのものではない。" },
  "community-building-volunteer-participation-rate-10plus": { polarity: "neutral", evidence: "10歳以上のまちづくり活動経験率は参加形態を表すが、活動時間・負担・地域課題の解決成果を測らない。" },
  "construction-employed-age30to54": { polarity: "neutral", evidence: "常住地別の建設業30〜54歳就業者実数は人口と産業規模に依存し、担い手の過不足を単独では示さない。" },
  "construction-employed-age55plus": { polarity: "neutral", evidence: "建設業55歳以上就業者数は年齢構成の内訳で、経験の蓄積と世代交代需要の双方があり年齢に優劣を付けない。" },
  "construction-employed-female": { polarity: "neutral", evidence: "建設業の女性就業者実数は産業規模に依存し、女性の就業機会や待遇の公平性を人数だけでは測れない。" },
  "construction-employed-residents": { polarity: "neutral", evidence: "建設業就業者の常住地別実数であり、勤務地別の施工能力や需要に対する供給の充足度ではない。" },
  "construction-employed-under30": { polarity: "neutral", evidence: "建設業30歳未満の就業者数は年齢構成の内訳で、人数だけでは定着率や育成環境を判断できない。" },
  "construction-private-employees": { polarity: "neutral", evidence: "民営建設事業所の従業者実数は所在地別の産業規模であり、労働条件や施工需要との適合を示さない。" },
  "consumer-consultation-accepted-cases": { polarity: "neutral", evidence: "消費生活相談の受付数はトラブルの発生と窓口の認知・利用の双方で増え、相談対応の成果とは異なる。" },
  "daily-steps-female-20to64-age-adjusted": { polarity: "higher-is-better", evidence: "20〜64歳女性の年齢調整平均歩数は身体活動量で、健康日本21の日常歩数増加の方向に沿う。個人の最適量は断定しない。" },
  "daily-steps-male-20to64-age-adjusted": { polarity: "higher-is-better", evidence: "20〜64歳男性の年齢調整平均歩数は身体活動量で、健康日本21の日常歩数増加の方向に沿う。個人の最適量は断定しない。" },
  "dairy-cattle-holdings": { polarity: "neutral", evidence: "乳用牛の飼養戸数は経営の分散・集約の程度を反映し、戸数の多さだけで生乳供給力や採算を判断できない。" },
  "debris-flow-special-warning-zone-count": { polarity: "neutral", evidence: "土石流の特別警戒区域指定数は危険箇所と行政指定の進捗の双方を反映し、実被害件数や未指定地の安全性を表さない。" },
  "debris-flow-warning-zone-count": { polarity: "neutral", evidence: "土石流の警戒区域指定数は区域の区切り方・指定進捗で変わり、実際の発生頻度や住民の危険度とは異なる。" },
  "delivery-clinic-count": { polarity: "neutral", evidence: "分娩取扱診療所の実数は地域の出生需要・病院との分担で変わり、施設の分娩能力や到達時間を直接示さない。" },
  "delivery-hospital-count": { polarity: "neutral", evidence: "分娩取扱病院の実数は診療所との分担や集約化に左右され、分娩能力や周産期医療成果を施設数だけでは測れない。" },
  "design-application-count": { polarity: "neutral", evidence: "意匠の出願件数は権利化活動の量で、審査結果・新規性の価値・事業化成果を直接示さない。" },
  "design-registration-count": { polarity: "neutral", evidence: "意匠登録件数は権利取得の量で、利用実績・経済価値・地域住民への利益とは同一でない。" },
  "designated-museum-visitors": { polarity: "neutral", evidence: "指定施設の入館者延べ数は施設数・観光客・催事によって変わり、住民参加率や教育成果を表さない。" },
  "domestic-travel-consumption-by-destination": { polarity: "neutral", evidence: "訪問先別の日本人旅行消費総額は観光需要と価格を反映し、混雑・住民負担・地域への純利益を含む評価ではない。" },
  "elementary-school-gymnasium-count": { polarity: "neutral", evidence: "小学校体育館設置数は学校数や学校規模に左右され、児童の利用可能性や施設の状態を直接表さない。" },
  "elementary5-fitness-score-female": { polarity: "higher-is-better", evidence: "公立小学5年女子の実技8項目得点合計で、調査の採点基準上は高得点ほど測定された体力・運動能力が高い。" },
  "elementary5-fitness-score-male": { polarity: "higher-is-better", evidence: "公立小学5年男子の実技8項目得点合計で、調査の採点基準上は高得点ほど測定された体力・運動能力が高い。" },
  "elementary5-weekly-exercise-420min-rate-female": { polarity: "neutral", evidence: "公立小学5年女子の週420分以上という時間区分の割合で、運動の強度・過負荷・楽しさを含む健康の良否は判定できない。" },
  "elementary5-weekly-exercise-420min-rate-male": { polarity: "neutral", evidence: "公立小学5年男子の週420分以上という時間区分の割合で、運動の強度・過負荷・楽しさを含む健康の良否は判定できない。" },
  "employees-weekly-hours-60plus-count": { polarity: "higher-is-worse", evidence: "年間200日以上働く雇用者の週60時間以上就業は長時間労働の負担を示す。大綱の週40時間以上分母とは混同しない。" },
  "employees-weekly-hours-60plus-rate": { polarity: "higher-is-worse", evidence: "年間200日以上働く雇用者に占める週60時間以上の割合は長時間労働の負担で、減少方向が望ましい。大綱の目標率とは分母が違う。" },
  "employment-location-quotient-health-welfare": { polarity: "neutral", evidence: "医療福祉の従業者構成比の全国比で、産業特化と高齢化に伴う需要を反映するが医療の充足度や質は示さない。" },
  "employment-location-quotient-information-communication": { polarity: "neutral", evidence: "情報通信業の従業者構成比の全国比で、産業特化を示すが他産業との均衡や住民の雇用機会の良否は決められない。" },
  "employment-location-quotient-manufacturing": { polarity: "neutral", evidence: "製造業の従業者構成比の全国比で、工業への特化を示すが多角化や生産性との比較なしに大小の優劣は決められない。" },
  "enterprise-net-value-added-all-industries": { polarity: "neutral", evidence: "企業本所所在地に帰属する全産業の純付加価値総額であり、住民一人当たりの豊かさや地域内生産性ではない。" },
  "fit-fip-installed-capacity": { polarity: "neutral", evidence: "FIT・FIP認定設備の累積容量は導入規模で、発電実績・設備利用率・需要・立地影響を考慮した成果ではない。" },
  "fit-fip-new-approved-installed-capacity": { polarity: "neutral", evidence: "制度開始後の新規認定分の累積容量で、当年の増設量や稼働発電量ではなく、大小だけで地域の電力事情を評価しない。" },
  "fit-transition-installed-capacity": { polarity: "neutral", evidence: "旧制度から移行した設備容量は制度区分の残高で、新たな発電設備の増設や脱炭素成果を表さない。" },
  "five-year-residence-other-prefecture": { polarity: "neutral", evidence: "5年間に他県から移った現在居住者の実数で、移動動機・人口規模・期間中の再移動を含む生活の良否は判断できない。" },
  "five-year-residence-same-address": { polarity: "neutral", evidence: "5年前と同じ住所の住民数は定着と移動機会の制約の双方に読め、転居しないことを一律に優位としない。" },
  "food-manufacturing-employees": { polarity: "neutral", evidence: "食料品製造業の従業者数は工場立地と産業規模を示し、生産性・賃金・労働環境の良否を示さない。" },
  "food-manufacturing-establishments": { polarity: "neutral", evidence: "食料品製造事業所数は規模と集約度に依存し、供給力や事業継続性を件数だけでは判断できない。" },
  "food-manufacturing-shipment-amount": { polarity: "neutral", evidence: "食料品製造品出荷総額は生産量・価格・事業所規模で変わり、純利益や一人当たり生産性とは異なる。" },
  "foreign-employing-establishment-count": { polarity: "neutral", evidence: "外国人雇用の届出事業所数は産業規模と雇用の広がりを示すが、待遇・権利保障・定着の成果を示さない。" },
  "foreign-worker-count": { polarity: "neutral", evidence: "届出対象の外国人労働者実数は人口・産業・在留資格構成に依存し、国籍や人数を地域の良否へ結び付けない。" },
  "forestry-hired-workers": { polarity: "neutral", evidence: "林業経営体の雇用者実数は事業規模と雇用方式に依存し、安全性・労働条件・必要人員の充足を示さない。" },
  "forestry-internal-workers": { polarity: "neutral", evidence: "林業の内部労働者数は世帯員・構成員等の労働形態の内訳で、雇用者との優劣を付ける値ではない。" },
  "forestry-management-entities": { polarity: "neutral", evidence: "林業経営体の実数は森林資源と経営集約度に左右され、森林管理の質や持続性を単独で示さない。" },
  "forestry-mushroom-output-value": { polarity: "neutral", evidence: "栽培きのこ類の産出総額は生産規模と価格を反映し、収益性や環境負荷との比較なしに良否を決められない。" },
  "forestry-output-value": { polarity: "neutral", evidence: "林業産出総額は木材・きのこ等の生産規模と価格を反映し、森林の持続性や所得分配を含む評価ではない。" },
  "forestry-timber-output-value": { polarity: "neutral", evidence: "木材生産の産出総額は生産規模・樹種・価格に依存し、再造林や資源循環の十分さを単独で示さない。" },
  "furusato-donation-amount-prefecture": { polarity: "neutral", evidence: "県庁自身のふるさと納税受入額は収入の一面で、募集経費・税流出・県内市町村収入を含む純効果ではない。" },
  "furusato-donation-count-prefecture": { polarity: "neutral", evidence: "県庁への寄附件数は一件当たり金額や反復寄附で変わり、実質財源や住民便益の大小を示さない。" },
  "furusato-fundraising-cost-prefecture": { polarity: "neutral", evidence: "県庁の募集経費総額は募集規模にも比例し、受入額との比や純収入なしに効率の良否を決められない。" },
  "furusato-return-gift-procurement-cost-prefecture": { polarity: "neutral", evidence: "返礼品調達費総額は寄附規模・商品構成と地域事業者への支払を反映し、総額だけを負担増として評価しない。" },
  "furusato-return-gift-shipping-cost-prefecture": { polarity: "neutral", evidence: "返礼品送付費総額は発送件数・距離・商品特性で変わり、一件当たりの物流効率とは異なる。" },
  "furusato-tax-deduction-municipal-prefecture": { polarity: "neutral", evidence: "住民課税側の市町村民税控除額は税収減と寄附者の制度利用を反映し、受入側収入を含む県全体の収支ではない。" },
  "furusato-tax-deduction-prefectural-prefecture": { polarity: "neutral", evidence: "住民課税側の道府県民税控除額は制度利用と課税規模に依存し、県の受入寄附を差し引いた純効果ではない。" },
  "general-perinatal-center-count": { polarity: "neutral", evidence: "総合周産期センターの指定施設数は役割と地域配置の指標で、NICU病床数・分娩能力・到達時間を示さない。" },
  "gini-coefficient-financial-assets": { polarity: "higher-is-worse", evidence: "世帯員ベースの等価金融資産分布のジニ係数は高いほど不均等度が大きい。資産水準そのものの高低とは区別する。" },
  "health-checkup-breakfast-skipping-rate": { polarity: "neutral", evidence: "特定健診受診者の朝食欠食頻度の回答割合で、摂取内容・勤務形態・全住民の健康状態を含む単調な良否は決められない。" },
  "health-checkup-late-dinner-rate": { polarity: "neutral", evidence: "特定健診受診者の就寝前夕食頻度の回答割合で、生活時間や食事内容を併せず地域の健康の良否へ直結させない。" },
  "heatstroke-emergency-transports": { polarity: "higher-is-worse", evidence: "消防庁が熱中症として集計した救急搬送は健康被害による搬送で、件数増は被害負担の増加を示す。" },
  "home-medical-visit-cases": { polarity: "neutral", evidence: "医療施設による訪問診療件数は在宅医療需要と提供体制の双方を反映し、未充足需要や患者の改善成果を直接示さない。" },
  "home-nursing-visit-cases": { polarity: "neutral", evidence: "病院・診療所の訪問看護指導件数は療養需要と支援提供をともに反映し、看護成果や全訪問看護の充足率ではない。" },
  "household-survey-clothing-footwear-expenditure": { polarity: "neutral", evidence: "二人以上世帯の秋2か月平均の衣料費は価格・世帯人数・購入時期で変わり、家計の余裕と支出負担の双方に読める。" },
  "household-survey-consumption-expenditure": { polarity: "neutral", evidence: "二人以上世帯の秋2か月平均消費支出は人数・年齢・物価に依存し、同額の消費で得られる生活水準を比較した値ではない。" },
  "household-survey-culture-recreation-expenditure": { polarity: "neutral", evidence: "二人以上世帯の教養娯楽費は余暇の利用と家計負担の双方を含み、支出額から充実度を一方向に評価しない。" },
  "household-survey-education-expenditure": { polarity: "neutral", evidence: "二人以上世帯の教育費は子どもの人数と学齢に依存し、教育機会の厚みと家計負担を額だけでは分けられない。" },
  "household-survey-food-expenditure": { polarity: "neutral", evidence: "二人以上世帯の食料費は世帯人数・価格・外食構成に依存し、栄養状態や可処分所得の余裕を直接示さない。" },
  "household-survey-furniture-household-goods-expenditure": { polarity: "neutral", evidence: "二人以上世帯の家具家事用品費は買替え時期・耐久財購入で変わり、設備の充実と家計負担の双方に読める。" },
  "household-survey-healthcare-expenditure": { polarity: "neutral", evidence: "二人以上世帯の保健医療費は傷病需要と医療利用をともに反映し、高額であることを良い医療や悪い健康と断定しない。" },
  "household-survey-housing-expenditure": { polarity: "neutral", evidence: "二人以上世帯の住居費は持家率と賃貸価格に強く依存し、持家の帰属家賃を含む住環境の価値ではない。" },
  "household-survey-other-expenditure": { polarity: "neutral", evidence: "その他の消費支出には異なる用途が混在し、世帯構成と支出選択を調整しなければ額の良否を判断できない。" },
  "household-survey-transport-communication-expenditure": { polarity: "neutral", evidence: "二人以上世帯の交通通信費は移動需要・自動車購入・通信利用で変わり、アクセスの良さと負担を額だけでは分けられない。" },
  "household-survey-utilities-expenditure": { polarity: "neutral", evidence: "二人以上世帯の光熱水道費は気候・住宅性能・料金に左右され、地域の生活の良否を支出額だけでは決められない。" },
  "housing-land-debt-per-household": { polarity: "neutral", evidence: "無負債世帯を含む平均住宅土地負債は持家取得・住宅価格・世帯年齢に依存し、所得や資産を伴わない返済困難度ではない。" },
  "inbound-travel-consumption-by-destination": { polarity: "neutral", evidence: "訪日外国人の訪問先別消費総額は観光規模と価格を示し、地域への純利益・混雑・生活負担の評価ではない。" },
  "inbound-visit-sample-by-destination": { polarity: "neutral", evidence: "訪問回答の重み付け前標本数は推計の観測規模を示すための値で、推計訪問者数や観光成果へ読み替えない。" },
  "inbound-visitors-by-destination": { polarity: "neutral", evidence: "宿泊と日帰りを含む外国人訪問者の推計人数は観光量であり、消費・混雑・受入能力との関係なしに良否を決められない。" },
  "individual-evacuation-plan-coverage-rate": { polarity: "higher-is-better", evidence: "名簿掲載要支援者に対して個別避難計画を備えた割合が高いほど計画整備が進んでいる。避難成功率や計画の質とは区別する。" },
  "individual-evacuation-plan-covered-persons": { polarity: "neutral", evidence: "計画を備えた実人数は名簿規模に依存するため、人数だけでは未作成者の割合や支援の十分さを評価できない。" },
  "individual-evacuation-plan-listed-persons": { polarity: "neutral", evidence: "避難行動要支援者名簿の人数は地域の支援需要と自治体の掲載基準を反映し、整備成果や実被害の数ではない。" },
  "information-private-employees": { polarity: "neutral", evidence: "民営情報通信事業所の従業者実数は産業立地規模であり、住民の情報アクセスや雇用の質を表さない。" },
  "information-private-establishments": { polarity: "neutral", evidence: "民営情報通信事業所数は企業の分散・集約と市場規模に依存し、デジタル化の成果や生産性とは異なる。" },
  "interprefecture-net-migration-age15to24": { polarity: "neutral", evidence: "15〜24歳の県間純移動は進学・就職先の配置に依存し、転出先で得た機会を無視して移動を良否に分けられない。" },
  "interprefecture-net-migration-age25to34": { polarity: "neutral", evidence: "25〜34歳の県間純移動は就職・家族形成・住居選択を含み、純流入だけで本人や地域の厚生を判断しない。" },
  "junior-high-school-gymnasium-count": { polarity: "neutral", evidence: "中学校体育館の実数は学校数と規模に左右され、生徒の利用可能性や施設品質を直接示さない。" },
  "k6-known-score-estimated-persons-12plus": { polarity: "neutral", evidence: "K6得点が判明した推計人数は割合の分母であり、こころの不調の人数や調査品質そのものとは異なる。" },
  "k6-score10plus-estimated-persons-12plus": { polarity: "higher-is-worse", evidence: "K6の10点以上は心理的苦痛が高い区分の推計人数であり、不調を抱える負担の増加を示す。精神疾患の診断数ではない。" },
  "k6-score10plus-rate-12plus": { polarity: "higher-is-worse", evidence: "K6得点判明者に占める10点以上の割合は心理的苦痛の高い区分の広がりで、低下方向を望ましいとする。診断率とはしない。" },
  "landslide-special-warning-zone-count": { polarity: "neutral", evidence: "土砂災害特別警戒区域の指定数は危険箇所と指定進捗の双方に依存し、被害件数や未指定地の安全性を表さない。" },
  "landslide-warning-zone-count": { polarity: "neutral", evidence: "土砂災害警戒区域の指定数は区域の設定と行政調査で変わり、少ない県ほど災害に安全とは解釈しない。" },
  "landslip-special-warning-zone-count": { polarity: "neutral", evidence: "地滑り特別警戒区域の指定数は地形と法的指定の進捗に依存し、現実の被害や発生確率を直接示さない。" },
  "landslip-warning-zone-count": { polarity: "neutral", evidence: "地滑り警戒区域の指定数は範囲の区切り方・調査進捗にも左右され、指定数の多寡を対策の良否に使わない。" },
  "laundry-beauty-bath-industry-employees": { polarity: "neutral", evidence: "洗濯理容美容浴場業の従業者実数は市場・人口規模を示し、賃金や利用者サービスの充足率とは異なる。" },
  "laundry-beauty-bath-industry-establishments": { polarity: "neutral", evidence: "洗濯理容美容浴場業の事業所数は小規模店の分散と人口規模に依存し、利用者の満足や経営持続性を直接示さない。" },
  "laundry-beauty-bath-industry-net-value-added": { polarity: "neutral", evidence: "洗濯理容美容浴場業の企業純付加価値総額は本所所在地と企業規模に依存し、住民一人当たりの豊かさではない。" },
  "laundry-beauty-bath-industry-revenue": { polarity: "neutral", evidence: "洗濯理容美容浴場業の企業売上総額は価格と企業本所の集中を含み、利益率やサービスの質と同一視できない。" },
  "layer-hen-count": { polarity: "neutral", evidence: "6か月以上の採卵鶏成鶏めすの飼養羽数は生産規模で、需要・採算・飼養環境を併せなければ良否を判断できない。" },
  "long-term-care-certified-persons": { polarity: "neutral", evidence: "要支援要介護認定者数は高齢人口と認定への到達を反映し、未申請者や必要支援の充足を含めた地域の健康状態ではない。" },
  "media-production-employees": { polarity: "neutral", evidence: "映像音声文字情報制作業の従業者実数は産業立地の規模であり、作品の質・働き方・地域文化の豊かさを直接示さない。" },
  "media-production-establishments": { polarity: "neutral", evidence: "映像音声文字情報制作業の事業所実数は事業の分散と集約を反映し、制作能力や文化的価値とは一致しない。" },
  "media-production-net-value-added": { polarity: "neutral", evidence: "映像音声文字情報制作企業の純付加価値総額は本所所在地に帰属し、撮影地や制作現場への利益配分を表さない。" },
  "media-production-revenue": { polarity: "neutral", evidence: "映像音声文字情報制作企業の売上総額は本所集中・価格・企業規模を反映し、作品の社会的価値や採算ではない。" },
  "medical-physicians-age-40-59": { polarity: "neutral", evidence: "40〜59歳の医師実数は年齢構成の内訳で、経験と地域需要を調整しない人数の多寡に優劣を付けない。" },
  "medical-physicians-age-60-plus": { polarity: "neutral", evidence: "60歳以上の医師実数は経験の蓄積と世代交代需要の双方に読め、医師の年齢だけで医療の良否を判定しない。" },
  "medical-physicians-emergency-medicine": { polarity: "neutral", evidence: "救急科医師の実数は人口・搬送需要・広域受入に依存し、救急対応の充足度や成果を人数だけでは判断できない。" },
  "medical-physicians-obstetrics-gynecology": { polarity: "neutral", evidence: "産婦人科系医師の実数は出生需要と診療分担に左右され、分娩対応力や患者の到達時間そのものではない。" },
  "medical-physicians-pediatrics": { polarity: "neutral", evidence: "小児科医師の実数は小児人口と広域診療機能に依存し、小児医療の質や必要人員の充足率ではない。" },
  "medical-physicians-under-40": { polarity: "neutral", evidence: "40歳未満の医師実数は年齢構成と養成施設立地を反映し、人数だけを医療の質や定着の成果へ読み替えない。" },
  "metabolic-syndrome-prevalence-among-checkup-recipients": { polarity: "higher-is-worse", evidence: "特定健診受診者内でメタボリックシンドローム基準に該当する割合は健康リスク保有の広がりを示す。全住民の有病率ではない。" },
  "municipal-mental-health-consultation-extended-persons": { polarity: "neutral", evidence: "市区町村の精神保健福祉相談延人員は支援需要と相談アクセスをともに反映し、疾患数やこころの不調の悪化率ではない。" },
  "museum-like-facility-visitors": { polarity: "neutral", evidence: "博物館類似施設の入館者延べ数は施設規模・催事・観光に依存し、地域住民の利用率や学習成果とは異なる。" },
  "national-quasi-national-park-visits": { polarity: "neutral", evidence: "国立国定公園の利用者延べ数は観光規模と資源利用の圧力をともに示し、自然保全と混雑を併せなければ良否を決められない。" },
  "natural-disaster-deaths": { polarity: "higher-is-worse", evidence: "消防庁の自然災害による死亡者数は人的被害であり、人数が増えるほど被害が大きい。" },
  "natural-disaster-destroyed-houses": { polarity: "higher-is-worse", evidence: "消防庁の自然災害による全壊住家棟数は居住資産の重大な被害であり、棟数増は被害拡大を示す。" },
  "natural-disaster-half-destroyed-houses": { polarity: "higher-is-worse", evidence: "消防庁の自然災害による半壊住家棟数は住家被害の実数で、増加は復旧を要する被害の増加を示す。" },
  "natural-disaster-injured-persons": { polarity: "higher-is-worse", evidence: "消防庁の自然災害による負傷者数は人的被害の実数であり、負傷者の増加を望ましいとは扱わない。" },
  "natural-disaster-missing-persons": { polarity: "higher-is-worse", evidence: "消防庁の自然災害による行方不明者数は安否不明の人的被害であり、増加は被害負担が大きい方向である。" },
  "natural-disaster-partially-damaged-houses": { polarity: "higher-is-worse", evidence: "消防庁の自然災害による住家一部破損棟数は建物被害の実数であり、増加は復旧負担の拡大を示す。" },
  "new-cancer-incidence-count": { polarity: "higher-is-worse", evidence: "全国がん登録の新規悪性新生物罹患数は疾病負担を示す。検診・登録把握や年齢構成の差を調整した予防成績ではない。" },
  "nonprimary-enterprises-count": { polarity: "neutral", evidence: "非農林漁業の会社個人企業数は本所所在地別の事業規模と集約度であり、純創業や事業持続性の成果ではない。" },
  "nonprimary-enterprises-employees": { polarity: "neutral", evidence: "企業本所所在地に帰属する非農林漁業の従業者実数であり、実際の勤務地別雇用や住民の雇用機会とは異なる。" },
  "nonprimary-enterprises-under5-count": { polarity: "neutral", evidence: "常用雇用者0〜4人の企業数は規模構成の内訳で、小規模企業の多さを大企業に対する優劣へ読み替えない。" },
  "nonprimary-enterprises-under5-employees": { polarity: "neutral", evidence: "常用雇用者0〜4人企業の従業者実数は自営等を含む企業規模構成であり、労働条件や成長性を直接表さない。" },
  "nonregular-continuation-wish-rate": { polarity: "neutral", evidence: "非正規雇用者の継続希望割合は本人の希望と選択可能性を反映し、満足度や待遇改善を必ず意味するわけではない。" },
  "nonregular-employees-count": { polarity: "neutral", evidence: "非正規雇用者の実数は労働人口と就業選択を含み、本人の希望や所得を伴わない雇用形態の良否を決めない。" },
  "nonregular-job-change-wish-rate": { polarity: "neutral", evidence: "非正規雇用者の転職希望割合は不満と新しい機会への希望の双方を含み、高さを一律に悪化と解釈しない。" },
  "patent-application-count": { polarity: "neutral", evidence: "特許出願件数は権利化を求めた活動量で、審査結果・発明価値・事業化成功を直接表さない。" },
  "patent-inventor-count": { polarity: "neutral", evidence: "特許出願の延べ発明者数は重複計上を含む活動量で、研究者の実人数や研究品質を測るものではない。" },
  "patent-registration-count": { polarity: "neutral", evidence: "特許登録件数は権利取得の量で、利用実績・存続・経済価値を確認せず地域の革新性を順位付けできない。" },
  "pig-count": { polarity: "neutral", evidence: "子取り用・種おす・肥育等を含む豚の総飼養頭数は生産規模であり、需給・採算・飼養環境の良否は示さない。" },
  "pm25-compliant-general-station-count": { polarity: "neutral", evidence: "PM2.5基準を達成した測定局の実数は測定網の規模に依存し、未達成局の割合や住民曝露を単独では評価できない。" },
  "pm25-general-station-compliance-rate": { polarity: "higher-is-better", evidence: "有効一般局のうち長短両方のPM2.5環境基準を達成する割合は高いほど測定局での基準適合が進む。住民曝露割合ではない。" },
  "pm25-general-station-count": { polarity: "neutral", evidence: "一般環境大気測定局の総数は監視網の規模であり、多く設置する必要性と監視の充実を区別せず大気の良否へ読み替えない。" },
  "pm25-valid-general-station-count": { polarity: "neutral", evidence: "年間250日以上等の要件を満たす有効一般局の実数は監視網と稼働状況を示し、大気基準の達成そのものではない。" },
  "poverty-support-new-consultation-cases": { polarity: "neutral", evidence: "生活困窮者自立支援の新規相談数は困窮需要と制度到達をともに反映し、相談数増を生活の悪化や支援成功と断定しない。" },
  "prefectural-assembly-female-share": { polarity: "neutral", evidence: "議会の女性構成比は代表構成を示すが、均衡や機会の公平性を測るには人口構成等との比較が必要で、無制限の上昇を良しとしない。" },
  "prefectural-auto-environment-tax-application-count": { polarity: "neutral", evidence: "県の自動車税環境性能割の申告総件数は取引と課税業務の規模で、オンライン化の進捗や利便性そのものではない。" },
  "prefectural-auto-environment-tax-online-application-count": { polarity: "neutral", evidence: "自動車税環境性能割のオンライン申請実数は総申請規模に依存するため、利用浸透を比較するには総件数との比が要る。" },
  "prefectural-auto-environment-tax-online-application-rate": { polarity: "higher-is-better", evidence: "同じ県税申告手続の総件数に占めるオンライン利用割合で、高いほど電子利用が進んでいる。利用者満足や制度全体の効率とは区別する。" },
  "prefectural-cultural-property-protection-expenditure": { polarity: "neutral", evidence: "県庁の文化財保護決算額は対象資産・修復需要・国費を含み、支出総額だけで保存成果や費用対効果を評価できない。" },
  "prefectural-dx-applicable-procedure-count": { polarity: "neutral", evidence: "オンライン化対象の手続数は実施対象業務の範囲を示す分母であり、手続が多いことを行政改善の成果とはしない。" },
  "prefectural-dx-online-procedure-count": { polarity: "neutral", evidence: "オンライン化済み手続の実数は対象業務数に依存し、対象数との比や利用実績を伴わなければ県間の進捗比較にならない。" },
  "prefectural-dx-online-procedure-rate": { polarity: "higher-is-better", evidence: "調査で指定された対象手続に占めるオンライン化済みの割合で、高いほど対象範囲の対応が進む。全行政手続の率ではない。" },
  "prefectural-eltax-online-application-rate": { polarity: "higher-is-better", evidence: "対象の地方税申告手続に占めるeLTAX申請の割合は電子利用の進捗を示す。税制度の良否や住民満足を直接示すものではない。" },
  "prefectural-manager-female-share": { polarity: "neutral", evidence: "県職員管理職の女性構成比は人員構成で、採用母集団や昇進機会との比較なしに無制限の増加を良いと判定しない。" },
  "prefectural-public-building-floor-area": { polarity: "neutral", evidence: "県有建物の延面積は保有規模と行政需要を反映し、維持負担・稼働率・サービス供給を併せなければ良否を決められない。" },
  "prefectural-recruitment-online-application-rate": { polarity: "higher-is-better", evidence: "職員採用試験の対象申込に占めるオンライン申請率は電子利用の進捗を示す。採用の公平性や応募者の質を表すものではない。" },
  "prefecture-designated-cultural-property-count": { polarity: "neutral", evidence: "県指定等の文化財件数は指定範囲と歴史資産の分布に依存し、保存状態・登録分を含む全文化財の量・保全成果とは異なる。" },
  "private-establishment-net-value-added": { polarity: "neutral", evidence: "民営事業所の純付加価値総額は事業所集積と規模を示し、人口や投入労働を調整した豊かさ・生産性ではない。" },
  "public-construction-contract-amount": { polarity: "neutral", evidence: "500万円以上の公共工事請負額は施工需要・災害復旧・価格に左右され、必要性や費用対効果を伴う成果ではない。" },
  "public-construction-contract-count": { polarity: "neutral", evidence: "500万円以上の公共工事請負件数は発注単位と施工需要に依存し、件数が多いほど公共サービスが良いとは判断しない。" },
  "public-school-closures-cumulative": { polarity: "neutral", evidence: "公立学校廃校の累積件数は児童減少・統合・学校再配置の履歴で、通学負担と教育環境改善の双方があり一律の損失とはしない。" },
  "public-water-aged-pipe-length": { polarity: "higher-is-worse", evidence: "法定耐用年数を超えた管路延長は経年設備の維持更新負担を示し、長いほど対応対象が多い。漏水や破損の実測量とは区別する。" },
  "public-water-pipe-aging-rate": { polarity: "higher-is-worse", evidence: "年度末管路延長に対する耐用年数超過管路の割合は経年化の進行を示し、高いほど維持更新負担が大きい。実損傷率ではない。" },
  "public-water-pipe-length": { polarity: "neutral", evidence: "水道管路総延長は供給区域の広さと人口密度に左右され、給水普及や効率の良否を延長単独では判断できない。" },
  "public-water-pipe-renewal-rate": { polarity: "higher-is-better", evidence: "年度末管路総延長に対する年度内更新延長の割合で、高いほど設備更新が進む。優先順位・費用効率や破損削減とは区別する。" },
  "public-water-renewed-pipe-length": { polarity: "neutral", evidence: "年度内の更新管路実延長はネットワーク規模に左右され、総延長や更新需要を伴わず県間の整備十分性を判断できない。" },
  "raw-milk-production": { polarity: "neutral", evidence: "年間生乳生産量は飼養規模と生産条件に依存し、需給均衡・酪農所得・環境負荷を含む良否の指標ではない。" },
  "regional-business-co2-emissions-estimate": { polarity: "higher-is-worse", evidence: "環境省標準的手法で推計した業務その他部門のCO₂排出は温暖化への負荷であり、排出量増加は負荷増大方向を示す。" },
  "regional-business-final-energy-consumption": { polarity: "neutral", evidence: "業務他部門の直接エネルギー消費量は経済活動規模・気候・効率に依存し、サービス水準を伴わない消費減を良いと断定しない。" },
  "regional-co2-emissions-estimate": { polarity: "higher-is-worse", evidence: "対象のエネルギー起源等CO₂推計排出総量は温暖化への負荷で、増加は負荷増大方向である。全温室効果ガスや直接実測値ではない。" },
  "regional-household-car-final-energy-consumption": { polarity: "neutral", evidence: "家庭乗用車の直接エネルギー消費は移動需要・交通手段・効率を反映し、移動機会が失われた消費減まで望ましいとはしない。" },
  "regional-household-co2-emissions-estimate": { polarity: "higher-is-worse", evidence: "環境省の家庭部門CO₂推計排出量は温暖化への負荷であり、多いほど対象部門の排出負荷が大きい。住民の責任の順位ではない。" },
  "regional-household-final-energy-consumption": { polarity: "neutral", evidence: "家庭の直接エネルギー消費は世帯数・気候・住居性能で変わり、住環境や暖冷房の充足を伴わず小さいほど良いとはしない。" },
  "regional-industry-co2-emissions-estimate": { polarity: "higher-is-worse", evidence: "環境省の産業部門CO₂推計排出量は温暖化への負荷であり、多いほど排出負荷が大きい。生産規模で調整した効率指標ではない。" },
  "regional-industry-final-energy-consumption": { polarity: "neutral", evidence: "産業部門の直接エネルギー消費は生産量と業種構成に依存し、生産停止による減少と省エネルギー改善を単独では区別できない。" },
  "regional-perinatal-center-count": { polarity: "neutral", evidence: "地域周産期センターの認定数は総合センターとの役割分担や配置に依存し、NICU病床数や分娩能力の量ではない。" },
  "regional-transport-co2-emissions-estimate": { polarity: "higher-is-worse", evidence: "環境省の運輸部門CO₂推計排出量は温暖化への負荷であり、多いほど対象輸送分の負荷が大きい。航空を含む全輸送の値ではない。" },
  "regional-waste-co2-emissions-estimate": { polarity: "higher-is-worse", evidence: "一般廃棄物焼却のCO₂推計排出量は温暖化への負荷であり、排出増は負荷増大方向を示す。廃棄物処理の全環境負荷ではない。" },
  "registered-museum-visitors": { polarity: "neutral", evidence: "登録博物館の入館者延べ数は施設数・観光・企画展に依存し、住民の学習機会の充足率や教育成果ではない。" },
  "residential-land-transaction-median-price": { polarity: "neutral", evidence: "100〜300㎡未満住宅地の取引単価中央値は立地需要と購入負担の双方を表し、売り手と買い手で評価方向が異なる。" },
  "residential-land-transaction-sample-count": { polarity: "neutral", evidence: "対象条件に合う住宅地取引の標本数は価格分布の観測規模であり、住宅取得機会や地域の取引総量とは同一でない。" },
  "residential-official-land-median-price": { polarity: "neutral", evidence: "100〜300㎡未満住宅地の公示価格中央値は資産価値と取得負担の双方に読め、価格上昇を地域の良さと断定しない。" },
  "residential-official-land-point-count": { polarity: "neutral", evidence: "対象条件に合う公示標準地数は標準地配置と標本構成を示し、住宅供給数や市場の発展度を表さない。" },
  "retail-employees": { polarity: "neutral", evidence: "小売事業所の従業者実数は人口・商業集積・雇用形態に依存し、労働条件や消費者の利便性を人数だけでは評価できない。" },
  "road-bridge-condition-iii-count": { polarity: "higher-is-worse", evidence: "最新診断の道路橋区分Ⅲは早期措置が必要な状態で、その施設数増は対応を要する劣化負担の増加を示す。" },
  "road-bridge-condition-iv-count": { polarity: "higher-is-worse", evidence: "最新診断の道路橋区分Ⅳは緊急措置が必要な状態で、その施設数増は深刻な維持管理上の負担の増加を示す。" },
  "road-bridge-diagnosed-count": { polarity: "neutral", evidence: "道路橋の診断済み実数は保有規模と点検の進捗に依存し、分母なしに点検充足率や橋の健全性を表さない。" },
  "road-tunnel-condition-iii-count": { polarity: "higher-is-worse", evidence: "最新診断の道路トンネル区分Ⅲは早期措置が必要な状態で、施設数が多いほど対応対象の劣化負担が大きい。" },
  "road-tunnel-condition-iv-count": { polarity: "higher-is-worse", evidence: "最新診断の道路トンネル区分Ⅳは緊急措置が必要な状態で、施設数が多いほど深刻な維持管理負担が大きい。" },
  "road-tunnel-diagnosed-count": { polarity: "neutral", evidence: "道路トンネルの診断済み実数は保有規模と点検活動を反映し、未診断を含む点検充足度や健全性そのものではない。" },
  "roundwood-hinoki-production-volume": { polarity: "neutral", evidence: "ひのき素材生産量は樹種資源と伐採需要に依存し、再造林や採算を伴わなければ持続的林業の良否を判断できない。" },
  "roundwood-production-volume": { polarity: "neutral", evidence: "素材生産総量は森林資源と市況に依存し、生産拡大と資源維持の両面を検討せず多いほど良いとはしない。" },
  "roundwood-sugi-production-volume": { polarity: "neutral", evidence: "すぎ素材生産量は樹種資源と伐採需要に依存し、再造林や採算を伴わなければ持続的林業の良否を判断できない。" },
  "salt-intake-female-age-adjusted": { polarity: "higher-is-worse", evidence: "成人女性の年齢調整平均食塩摂取量は健康日本21の減塩目標の対象であり、高い方向を摂取過多の改善方向とは扱わない。" },
  "salt-intake-male-age-adjusted": { polarity: "higher-is-worse", evidence: "成人男性の年齢調整平均食塩摂取量は健康日本21の減塩目標の対象であり、高い方向を摂取過多の改善方向とは扱わない。" },
  "sawmill-count": { polarity: "neutral", evidence: "製材工場数は産業規模と工場集約度に依存し、処理能力・生産性・事業継続の良否を数だけでは判断できない。" },
  "sawnwood-shipment-volume": { polarity: "neutral", evidence: "製材品出荷量は生産規模と木材需要を示し、価格・採算・原料の持続性を伴う評価ではない。" },
  "single-father-employment-rate": { polarity: "neutral", evidence: "労働力状態が判明した父子世帯の父の就業割合は就業と育児支援の状況を反映し、希望する就業の実現や労働条件を示さない。" },
  "single-households-age65plus-female": { polarity: "neutral", evidence: "65歳以上女性の単独世帯実数は人口・寿命・居住選択を反映し、一人暮らしを孤立や生活困難と同一視しない。" },
  "single-households-age65plus-male": { polarity: "neutral", evidence: "65歳以上男性の単独世帯実数は人口・家族構成・居住選択を反映し、一人暮らしを孤立や生活困難と同一視しない。" },
  "single-mother-employment-rate": { polarity: "neutral", evidence: "労働力状態が判明した母子世帯の母の就業割合は生活維持と就業機会の双方を含み、所得や労働条件を伴わず良否を決められない。" },
  "single-mother-households-income-100to199": { polarity: "neutral", evidence: "所得100〜199万円に属する母子世帯の実数は母集団規模と所得構成の内訳で、人数だけでは貧困率や生活の十分さを測れない。" },
  "single-mother-households-income-200to299": { polarity: "neutral", evidence: "所得200〜299万円に属する母子世帯の実数は所得分布の一階級で、世帯人数・物価・全体比を伴わず良否を付けない。" },
  "single-mother-households-income-300to399": { polarity: "neutral", evidence: "所得300〜399万円に属する母子世帯の実数は所得分布の一階級で、階級間移動や世帯構成を伴う所得改善の指標ではない。" },
  "single-mother-households-income-400to499": { polarity: "neutral", evidence: "所得400〜499万円に属する母子世帯の実数は所得分布の一階級で、母子世帯全体の所得水準を単独で表さない。" },
  "single-mother-households-income-500plus": { polarity: "neutral", evidence: "所得500万円以上の母子世帯実数は階級別の規模で、全世帯比や世帯人数を伴わず地域全体の豊かさと読み替えない。" },
  "single-mother-households-income-under100": { polarity: "neutral", evidence: "所得100万円未満の母子世帯実数は母集団規模と所得構成の内訳で、等価所得や世帯人数を調整した貧困率とは異なる。" },
  "single-mother-public-assistance-households": { polarity: "neutral", evidence: "現に生活保護を受けた母子世帯数は困窮需要と制度への到達を反映し、受給減を生活改善と自動的には解釈できない。" },
  "specific-health-checkup-participation-rate": { polarity: "higher-is-better", evidence: "特定健診の推計対象者に占める受診者の割合が高いほど対象者への健診実施が進む。疾病の少なさとは区別する。" },
  "specific-health-guidance-completion-rate": { polarity: "higher-is-better", evidence: "特定保健指導対象者に占める指導終了者の割合が高いほど対象者への実施が進む。体重減少等の結果指標ではない。" },
  "steep-slope-special-warning-zone-count": { polarity: "neutral", evidence: "急傾斜地崩壊の特別警戒区域指定数は危険箇所と指定進捗をともに反映し、被害実績や未指定地の安全性を示さない。" },
  "steep-slope-warning-zone-count": { polarity: "neutral", evidence: "急傾斜地崩壊の警戒区域指定数は調査範囲・区切り方・行政指定で変わり、発生確率や対策成果そのものではない。" },
  "trademark-application-count": { polarity: "neutral", evidence: "商標出願件数は権利化活動の量で、登録結果・ブランド価値・事業継続を直接表さない。" },
  "trademark-registration-count": { polarity: "neutral", evidence: "商標登録件数は取得した権利の量で、実使用・売上・ブランドの評価を確認せず多いほど事業成果が良いとはしない。" },
  "tsunami-evacuation-building-count": { polarity: "neutral", evidence: "津波避難ビルの指定棟数は津波危険区域と既存建物の分布に依存し、収容人数・到達時間・必要人数の充足率ではない。" },
  "tsunami-evacuation-tower-count": { polarity: "neutral", evidence: "避難タワー等の棟数は地形と整備方式に左右され、避難ビルとの代替や収容力を伴わず少ない県の備えが劣るとはしない。" },
  "vacant-housing-excluding-rental-sale-secondary": { polarity: "neutral", evidence: "賃貸売却二次的住宅以外の空き家実数は利用状況の分類で、管理不全や危険な空き家だけを数えた指標ではない。" },
  "vacant-housing-for-rent": { polarity: "neutral", evidence: "賃貸用空き家の実数は募集在庫と住宅市場規模を反映し、流動性の確保と需給不一致の双方に読める。" },
  "vacant-housing-for-sale": { polarity: "neutral", evidence: "売却用空き家の実数は売買在庫と取引過程を反映し、管理不全や住宅不足を単独で示すものではない。" },
  "vacant-housing-secondary-residences": { polarity: "neutral", evidence: "別荘や時々使う住宅を含む二次的住宅の実数は利用形態の内訳で、放置住宅や資源浪費と同一視しない。" },
  "vegetable-intake-female-age-adjusted": { polarity: "higher-is-better", evidence: "成人女性の年齢調整平均野菜摂取量は健康日本21の摂取増加の方向に沿う。個人の疾病予防効果や上限のない増量は断定しない。" },
  "vegetable-intake-male-age-adjusted": { polarity: "higher-is-better", evidence: "成人男性の年齢調整平均野菜摂取量は健康日本21の摂取増加の方向に沿う。個人の疾病予防効果や上限のない増量は断定しない。" },
  // 全国学力・学習状況調査 平均正答率
  "academic-achievement-test-average-rate": { polarity: "higher-is-better", evidence: "学力調査の平均正答率は到達度そのもので、高いほど良い (争いのない事象)" },
  // 救急搬送 病院収容所要時間
  "ambulance-hospital-arrival-time": { polarity: "higher-is-worse", evidence: "救急搬送の所要時間は長いほど悪い (争いのない事象)" },
  // BOD汚濁負荷量 / 生化学的酸素要求量（BOD）の汚濁負荷量
  "bod-pollution-load": { polarity: "higher-is-worse", evidence: "水質汚濁負荷は多いほど悪い (争いのない事象)" },
  // 建物火災出火件数 / 総数
  "building-fire-count": { polarity: "higher-is-worse", evidence: "火災の発生・死傷・損害は多いほど悪い (争いのない事象)" },
  // 火災出火件数
  "building-fire-count-per-100-thousand-people": { polarity: "higher-is-worse", evidence: "火災の発生・死傷・損害は多いほど悪い (争いのない事象)" },
  // 建物火災出火件数 / 人口10万人当たり
  "building-fire-count-per-100k": { polarity: "higher-is-worse", evidence: "火災の発生・死傷・損害は多いほど悪い (争いのない事象)" },
  // 建物火災損害額 / 建物火災1件当たり
  "building-fire-damage-amount-per-building-fire": { polarity: "higher-is-worse", evidence: "火災の発生・死傷・損害は多いほど悪い (争いのない事象)" },
  // COD汚濁負荷量 / 化学的酸素要求量（COD）の汚濁負荷量
  "cod-pollution-load": { polarity: "higher-is-worse", evidence: "水質汚濁負荷は多いほど悪い (争いのない事象)" },
  // 家計調査の大分類別支出額（二人以上世帯）
  "clothing-footwear-expenditure-total": { polarity: "neutral", evidence: "支出額は消費の厚みと家計負担の両方に読め、世帯構成にも左右されるため大小を良し悪しと解釈しない" },
  "culture-recreation-expenditure-total": { polarity: "neutral", evidence: "支出額は消費の厚みと家計負担の両方に読め、世帯構成にも左右されるため大小を良し悪しと解釈しない" },
  "education-expenditure-total": { polarity: "neutral", evidence: "教育費は子どもの人数と学齢に強く依存し、機会の厚みと家計負担の両方に読めるため大小を良し悪しと解釈しない" },
  "furniture-household-expenditure-total": { polarity: "neutral", evidence: "支出額は消費の厚みと家計負担の両方に読め、世帯構成にも左右されるため大小を良し悪しと解釈しない" },
  "health-medical-expenditure-total": { polarity: "neutral", evidence: "保健医療支出は健康負担と医療アクセスの両方に読め、世帯の年齢構成にも左右されるため大小を良し悪しと解釈しない" },
  "housing-expenditure-total": { polarity: "neutral", evidence: "住居支出は住環境の厚みと家計負担の両方に読め、持家率にも左右されるため大小を良し悪しと解釈しない" },
  "other-living-expenditure-total": { polarity: "neutral", evidence: "支出額は消費の厚みと家計負担の両方に読め、世帯構成にも左右されるため大小を良し悪しと解釈しない" },
  "transport-communication-expenditure-total": { polarity: "neutral", evidence: "交通・通信支出は移動や利用の活発さと家計負担の両方に読めるため大小を良し悪しと解釈しない" },
  "utilities-expenditure-total": { polarity: "neutral", evidence: "光熱・水道支出は気候や住宅性能、価格に左右され、大小だけで家計の良し悪しを解釈できない" },
  // 刑法犯認知件数（人口千人当たり） / 人口1000人当たり
  "crime-rate-per-1k": { polarity: "higher-is-worse", evidence: "犯罪の認知件数は多いほど悪い (争いのない事象)" },
  // 刑法犯認知件数 / 総数（旧統計）
  "criminal-recognition-count": { polarity: "higher-is-worse", evidence: "犯罪の認知件数は多いほど悪い (争いのない事象)" },
  // 死亡数
  "death-count": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 脳血管疾患による死亡者数 / 総数
  "deaths-cerebrovascular-disease": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 脳血管疾患による死亡者数 / 人口10万人当たり
  "deaths-cerebrovascular-disease-per-100k": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 心疾患による死亡者数
  "deaths-heart-disease-excl-hypertensive-per-100k": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 認知症死亡率
  "dementia-death-rate": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 早期新生児死亡数
  "early-neonatal-deaths": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 火災死傷者数 / 事故当たり
  "fire-damage-casualties-per-accident": { polarity: "higher-is-worse", evidence: "火災の発生・死傷・損害は多いほど悪い (争いのない事象)" },
  // 火災死傷者数 / 人口当たり
  "fire-damage-casualties-per-population": { polarity: "higher-is-worse", evidence: "火災の発生・死傷・損害は多いほど悪い (争いのない事象)" },
  // 火災死亡者数
  "fire-deaths-per-100k": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 火災のための消防機関出動回数
  "fire-dispatch-for-building-fire-count-per-100k": { polarity: "higher-is-worse", evidence: "火災の発生・死傷・損害は多いほど悪い (争いのない事象)" },
  // 水害被災市区町村数（一般資産等）
  "flood-affected-municipalities": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害被災河川・海岸数（一般資産等）
  "flood-affected-rivers": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害死傷者数（計）
  "flood-casualties-total": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害橋梁被害額
  "flood-damage-bridge": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害一般資産等被害額
  "flood-damage-general-assets": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害公共土木施設被害額
  "flood-damage-public-infrastructure": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害道路被害額
  "flood-damage-road": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害被害額合計
  "flood-damage-total": { polarity: "higher-is-worse", evidence: "水害の被害・死傷は多いほど悪い (争いのない事象)" },
  // 水害死者数
  "flood-deaths": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 労働災害発生の頻度
  "frequency-of-occupational-accidents": { polarity: "higher-is-worse", evidence: "労働災害の頻度・重さは大きいほど悪い (争いのない事象)" },
  // ごみ最終処分量
  "garbage-final-disposal": { polarity: "higher-is-worse", evidence: "ごみの排出・最終処分量は多いほど環境負荷が大きい (争いのない事象)" },
  // ごみ総排出量
  "garbage-total-output": { polarity: "higher-is-worse", evidence: "ごみの排出・最終処分量は多いほど環境負荷が大きい (争いのない事象)" },
  // 乳児死亡数
  "infant-deaths": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 情報通信費 消費支出に占める割合
  "information-communication-coefficient": { polarity: "neutral", evidence: "通信費の割合は利用の活発さとも家計負担とも読め、大小を良し悪しと解釈しない" },
  // 情報通信費 支出額
  "information-communication-expenditure": { polarity: "neutral", evidence: "通信費の支出額は利用の活発さとも家計負担とも読め、大小を良し悪しと解釈しない" },
  // 知能犯認知件数
  "intellectual-crime-per-100k": { polarity: "higher-is-worse", evidence: "犯罪の認知件数は多いほど悪い (争いのない事象)" },
  // 腎不全による死亡者数 / 総数
  "kidney-failure-death-count": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 腎不全による死亡者数 / 人口10万人当たり
  "kidney-failure-death-rate": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 肝疾患による死亡者数 / 総数
  "liver-disease-death-count": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 肝疾患による死亡者数 / 人口10万人当たり
  "liver-disease-death-rate": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 新生児死亡数
  "neonatal-deaths": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 肺炎による死亡者数 / 総数
  "pneumonia-death-count": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 肺炎による死亡者数 / 人口10万人当たり
  "pneumonia-death-rate": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 凶悪犯認知件数
  "serious-crime-per-100k": { polarity: "higher-is-worse", evidence: "犯罪の認知件数は多いほど悪い (争いのない事象)" },
  // 日本語指導が必要な児童生徒数
  "students-requiring-japanese-instruction": { polarity: "neutral", evidence: "人数は支援需要の規模を示すが、児童生徒の多様性や受入状況にも左右され、大小を良し悪しと解釈しない" },
  // 交通事故死傷者数（高齢者） / 65歳以上
  "traffic-accident-casualties-elderly-65plus": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故死傷者数 / 事故100件当たり
  "traffic-accident-casualties-per-100-accidents": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故死傷者数 / 人口当たり
  "traffic-accident-casualties-per-population": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故発生件数 / 総数
  "traffic-accident-count": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故発生件数 / 道路1000km当たり
  "traffic-accident-count-per-1000-km": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故発生件数 / 人口当たり
  "traffic-accident-count-per-population": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故死者数 / 事故100件当たり
  "traffic-accident-deaths-per-100-accidents": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 交通事故死者数 / 人口10万人当たり
  "traffic-accident-deaths-per-100k": { polarity: "higher-is-worse", evidence: "死亡は多いほど悪い (争いのない事象)" },
  // 交通事故負傷者数 / 総数
  "traffic-accident-injuries": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故負傷者数 / 人口10万人当たり
  "traffic-accident-injuries-per-100k": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 交通事故発生件数（人口10万人当たり） / 10万人当たり換算
  "traffic-accident-per-100k": { polarity: "higher-is-worse", evidence: "交通事故の発生・死傷は多いほど悪い (争いのない事象)" },
  // 粗暴犯認知件数
  "violent-crime-per-100k": { polarity: "higher-is-worse", evidence: "犯罪の認知件数は多いほど悪い (争いのない事象)" },
  // 労働災害の重さの程度
  "work-accident-severity": { polarity: "higher-is-worse", evidence: "労働災害の頻度・重さは大きいほど悪い (争いのない事象)" },
};

/**
 * seed 時に**判断が割れた**ため収載しなかったもの (2026-07-31)。
 *
 * 「まだ調べていない」ではなく「調べた上で機械が決めるべきでないと判断した」記録。
 * 後から根拠が出れば METRIC_POLARITY へ移す。ここに残すのは同じ議論の再演を防ぐため。
 */
export const EXCLUDED_FROM_SEED: ReadonlyArray<{ key: string; reason: string }> = [
  // 人工妊娠中絶実施率
  { key: "abortion-rate", reason: "価値判断が分かれる指標で、良し悪しを機械が決めるべきでない" },
  // 労働者災害補償保険給付平均支給額
  { key: "average-payment-amount-of-workers-compensation-insurance-benefits", reason: "災害の重さとも補償の手厚さとも読める" },
  // 刑法犯認知件数に占める風俗犯の割合
  { key: "criminal-recognition-count-of-prostitution-crime-rate", reason: "構成比。他罪種が減れば分母効果で上がるため絶対的な悪化と一致しない" },
  // 刑法犯認知件数に占める凶悪犯の割合
  { key: "criminal-recognition-count-of-serious-crime-rate", reason: "構成比。他罪種が減れば分母効果で上がるため絶対的な悪化と一致しない" },
  // 刑法犯認知件数に占める窃盗犯の割合
  { key: "criminal-recognition-count-of-theft-crime-rate", reason: "構成比。他罪種が減れば分母効果で上がるため絶対的な悪化と一致しない" },
  // 刑法犯認知件数に占める粗暴犯の割合
  { key: "criminal-recognition-count-of-violent-crime-rate", reason: "構成比。他罪種が減れば分母効果で上がるため絶対的な悪化と一致しない" },
  // 女性所定内給与額
  { key: "female-scheduled-earnings", reason: "給与額なので高い方が良い。Reds 指定自体が誤りで、色の是正が要る" },
  // 金融負債残高
  { key: "financial-debt-balance", reason: "負債の重さとも経済規模・投資活動の大きさとも読める" },
  // 消防機関出動回数
  { key: "fire-department-dispatch-count-per-100-thousand-people", reason: "火災だけでなく救急出動も含むため、多さが医療アクセスを表す場合がある" },
  // 等価可処分所得ジニ係数
  { key: "gini-coefficient-disposable-income", reason: "格差の大きさを悪とするのは価値判断を含む" },
  // 入院受療率 / 人口10万人当たり
  { key: "inpatient-rate-per-100k", reason: "疾病の多さとも入院医療へのアクセスの良さとも読める" },
  // 国民健康保険給付金額
  { key: "national-health-insurance-benefits", reason: "負担の重さとも給付の手厚さとも読める" },
  // 国民医療費
  { key: "national-medical-expense-total", reason: "負担の重さとも医療アクセスの良さとも読める" },
  // 国民年金保険料全額免除割合
  { key: "national-pension-full-exemption-rate", reason: "低所得層の多さとも救済制度が機能していることとも読める" },
  // 国民年金保険料申請一部免除割合
  { key: "national-pension-partial-exemption-rate", reason: "低所得層の多さとも救済制度が機能していることとも読める" },
  // 老衰による死亡者数 / 総数
  { key: "senility-death-count", reason: "老衰死の多さは他死因に対する相対的な少なさ=長寿の裏返しでもあり、悪いと断定できない" },
  // 老衰による死亡者数 / 人口10万人当たり
  { key: "senility-death-rate", reason: "老衰死の多さは他死因に対する相対的な少なさ=長寿の裏返しでもあり、悪いと断定できない" },
  // 労働者災害補償保険給付率
  { key: "workers-compensation-insurance-benefits-rate", reason: "災害の多さとも補償の行き届きとも読める" },
];

/**
 * カバレッジの下限 (増加専用ラチェット)。
 *
 * 極性が付いた metric を**減らさない**ための床。metric を消して分母が減るのは正常なので
 * 件数そのものではなく「収載件数」で見る。増やすときだけこの定数を上げる。
 */
export const MIN_POLARITY_COVERAGE = 67;

/** 極性を引く。未収載なら null (既定に化けない)。 */
export function findMetricPolarity(key: string): PolarityEntry | null {
  return METRIC_POLARITY[key] ?? null;
}
