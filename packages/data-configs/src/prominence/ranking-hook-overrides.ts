/**
 * 問いかけコピー (hook) の手動上書き。**例外だけ**を置く。
 *
 * 原則は `derive-ranking-hook.ts` の導出規則で賄い、ここには
 * 「規則では意味が変わってしまう」「規則では長すぎる」ものだけを書く。
 * 全ランキングぶんを列挙しないこと — それをやると `isFeatured` (2,295 件中 8 件しか
 * 設定されなかった) と同じく維持されなくなる。
 *
 * 追加する前に、まず導出規則側を直せないか検討する。1 件のために規則を歪めるくらいなら
 * ここへ 1 行足す方が良いが、同じ形の不自然さが 10 件以上あるなら規則の不足を疑う。
 *
 * 初期値は旧 `HOME_FEATURED_RANKINGS` の hook 8 本。人が書いた編集コピーなので捨てない。
 * 加えて全件監査で長さ・述語・専門語が不自然と確定した少数だけを置く。
 * このモジュールは何も import しない。
 */

export const RANKING_HOOK_OVERRIDES: Readonly<Record<string, string>> = {
  // 「年間日照時間」から「年間」を落とす編集判断。導出では落とさない。
  "annual-sunshine-duration": "日照時間が最も長い県は？",
  // 「総人口」→「人口」。
  "total-population": "人口が最も多い県は？",
  // 将来推計。「最も多い/高い」ではなく「増える」を問う。導出では表現できない。
  "future-population-change-rate-2050": "2050年、人口が増える県は？",
  "agricultural-output": "農業産出額が最も多い県は？",
  // 「財政力指数」→「財政力」。指数という語を落として平易にする編集判断。
  "fiscal-strength-index-prefecture": "財政力が最も高い県は？",
  // 予想を裏切る形の問い。導出では作れない。
  "annual-clear-days": "快晴日数1位は沖縄？",
  "retirement-allowance-admin-prefecture": "退職手当が最も多い県は？",
  // 「1世帯当たり1か月間の消費支出」相当の長い title を短く言い換える。
  "consumption-expenditure-multi-person-households-per-month":
    "最も消費支出が多い県は？",
  "convenience-store-sales-monthly": "コンビニの販売額が多い県は？",
  "designated-difficult-disease": "難病受給者証を持つ人が多い県は？",
  "disposable-income-worker-households": "勤労者世帯の可処分所得が高い県は？",
  "elderly-household-detail": "高齢者がいる世帯が多い県は？",
  "fishery-management-orgs": "漁業管理組織が多い県は？",
  "hobby-activity-singleperson": "単身世帯主で趣味をした人が多い県は？",
  "hobby-participation-rate-music-listening": "音楽を聴いた人が多い県は？",
  "hospital-staff-by-occupation": "保健所の常勤職員が多い県は？",
  "industrial-land-price": "工業地の価格が高い県は？",
  "mental-health-application": "精神障害に関する申請等が多い県は？",
  "non-car-vehicle-insurance-consumption-expenditure":
    "自動車以外の輸送保険料が多い県は？",
  "rental-car-consumption-expenditure": "レンタカー等への支出が多い県は？",
  "retail-sales-amount-by-prefecture": "小売業の年間販売額が多い県は？",
  "retail-sales-area-by-class": "小売業の売場面積が広い県は？",
  "smartphone-usage-students": "スマホを使う学生の学業時間が長い県は？",
  "smartphone-usage-time-by-age": "スマホ・パソコン利用者が多い県は？",
  "study-participation-rate-business-skills": "ビジネスを学んだ人が多い県は？",
  "total-area-prefecture-ratio": "県内で面積割合が高い市区町村は？",
  "traffic-accident-death-by-age": "路上交通事故の死亡者が多い県は？",
  "treatment-rate-musculoskeletal-inpatient":
    "筋骨格系疾患で入院する人が多い県は？",
  "treatment-rate-musculoskeletal-outpatient":
    "筋骨格系疾患で外来受診する人が多い県は？",
  "treatment-rate-neurosis-inpatient": "神経症等で入院する人が多い県は？",
  "treatment-rate-neurosis-outpatient": "神経症等で外来受診する人が多い県は？",
  "treatment-rate-osteoporosis-inpatient": "骨粗しょう症で入院する人が多い県は？",
  "treatment-rate-osteoporosis-outpatient":
    "骨粗しょう症で外来受診する人が多い県は？",
};

/**
 * hookと同じ監査で「正準名のままでは読者に伝わりにくい」と確定した表示名の例外。
 * 共通規則で扱える行動者率79件はここへ列挙しない。
 */
export const RANKING_READER_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  "annual-sunshine-duration": "日照時間",
  "total-population": "人口",
  "fiscal-strength-index-prefecture": "自治体の財政力",
  "consumption-expenditure-multi-person-households-per-month":
    "二人以上世帯の1か月の消費支出",
  "convenience-store-sales-monthly": "コンビニの年間販売額",
  "designated-difficult-disease": "指定難病受給者証を持つ人の数",
  "disposable-income-worker-households": "勤労者世帯の可処分所得",
  "elderly-household-detail": "65歳以上の人がいる世帯数",
  "fishery-management-orgs": "漁業管理組織の延べ数",
  "hobby-activity-singleperson": "単身世帯主で趣味・娯楽をした人の数",
  "hobby-participation-rate-music-listening":
    "CD・スマホなどで音楽を聴いた人の割合",
  "hospital-staff-by-occupation": "保健所の常勤職員数",
  "industrial-land-price": "工業地の標準価格",
  "mental-health-application": "精神障害に関する申請・通報・届出件数",
  "non-car-vehicle-insurance-consumption-expenditure":
    "自動車以外の輸送機器保険料への支出",
  "rental-car-consumption-expenditure": "レンタカー・カーシェアへの支出",
  "retail-sales-amount-by-prefecture": "小売業の年間商品販売額",
  "retail-sales-area-by-class": "小売業の売場面積",
  "smartphone-usage-students": "スマホを使う学生の学業時間",
  "smartphone-usage-time-by-age": "スマホ・パソコン利用者数",
  "study-participation-rate-business-skills":
    "情報処理を除くビジネス学習をした人の割合",
  "total-area-prefecture-ratio": "県内で市区町村が占める面積割合",
  "traffic-accident-death-by-age": "路上交通事故の死亡者数",
  "treatment-rate-musculoskeletal-inpatient":
    "筋骨格系疾患で入院治療を受ける人の割合",
  "treatment-rate-musculoskeletal-outpatient":
    "筋骨格系疾患で外来受診する人の割合",
  "treatment-rate-neurosis-inpatient": "神経症等で入院治療を受ける人の割合",
  "treatment-rate-neurosis-outpatient": "神経症等で外来受診する人の割合",
  "treatment-rate-osteoporosis-inpatient":
    "骨粗しょう症で入院治療を受ける人の割合",
  "treatment-rate-osteoporosis-outpatient":
    "骨粗しょう症で外来受診する人の割合",
};
