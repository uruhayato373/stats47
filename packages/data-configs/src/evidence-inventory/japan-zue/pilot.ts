import type { EvidenceContentRole } from "../types";

export type JapanZuePilotStatus = "existing-live" | "local-ready-publication-pending";

export interface JapanZuePilotItem {
  evidenceId: string;
  question: string;
  metricKeys: string[];
  surveyIds: string[];
  provenanceUrls: string[];
  placements: EvidenceContentRole[];
  status: JapanZuePilotStatus;
  nextAction: string;
}

/**
 * 人が一次資料・指標定義・地理粒度を確認した最初の10件。
 * 書籍の文章・見出し・数値は保持せず、独立した問いとstats47のlineageだけを持つ。
 */
export const JAPAN_ZUE_PILOT_ITEMS: readonly JapanZuePilotItem[] = [
  {
    evidenceId: "japan-zue-2025-26-p054-table02",
    question: "子どもが生まれやすい地域差は、雇用や住まいの条件とどう重なるか？",
    metricKeys: ["total-fertility-rate"],
    surveyIds: ["vital-statistics"],
    provenanceUrls: ["https://www.mhlw.go.jp/toukei/list/81-1.html"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "出生・雇用・住宅費を同一年でそろえ、相関ではなく地域条件の比較として構成する",
  },
  {
    evidenceId: "japan-zue-2025-26-p071-figure01",
    question: "求人が増えても失業率が同じ方向に動かないのはなぜか？",
    metricKeys: ["unemployment-rate", "active-job-opening-ratio"],
    surveyIds: ["census", "job-placement-statistics", "labor-market-annual"],
    provenanceUrls: ["https://www.stat.go.jp/data/roudou/", "https://www.mhlw.go.jp/toukei/list/114-1.html"],
    placements: ["theme", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "分母と調査体系が異なる2指標を同一尺度に見せず、景気局面ごとに比較する",
  },
  {
    evidenceId: "japan-zue-2025-26-p077-table01",
    question: "最低賃金の地域差は、家賃や物価を含めるとどこまで残るか？",
    metricKeys: ["minimum-wage-by-region"],
    surveyIds: ["minimum-wage"],
    provenanceUrls: ["https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/minimumichiran/"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "名目額と生活費調整後を混同せず、別チャートで提示する",
  },
  {
    evidenceId: "japan-zue-2025-26-p131-figure02",
    question: "農業産出額が大きい県は、何をどの規模で生産しているのか？",
    metricKeys: ["agricultural-output"],
    surveyIds: [],
    provenanceUrls: ["https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "総額と品目構成を分け、規模だけで優劣を断定しない",
  },
  {
    evidenceId: "japan-zue-2025-26-p393-table02",
    question: "宿泊者が多いのに客室が埋まらない地域では何が起きているか？",
    metricKeys: ["total-overnight-guests", "room-utilization-rate"],
    surveyIds: ["accommodation-survey"],
    provenanceUrls: ["https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "延べ人数と稼働率の単位を分離し、施設供給量の違いを注記する",
  },
  {
    evidenceId: "japan-zue-2025-26-p436-table02",
    question: "日本語の学習支援を必要とする子どもは、どの地域で増えているか？",
    metricKeys: ["students-requiring-japanese-instruction"],
    surveyIds: ["japanese-language-instruction-survey"],
    provenanceUrls: [
      "https://www.mext.go.jp/b_menu/houdou/31/09/1421569_00007.htm",
      "https://www.mext.go.jp/content/20260525-mxt_kyokoku-000049811_03.pdf",
    ],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "local-ready-publication-pending",
    nextAction: "ローカルR2値をreviewし、公開承認後にsnapshot生成・R2反映・ランキング公開を行う",
  },
  {
    evidenceId: "japan-zue-2025-26-p457-table01",
    question: "生活保護の世帯数と世帯千対では、地域の見え方がどう変わるか？",
    metricKeys: ["households-on-public-assistance", "households-on-public-assistance-per-1000"],
    surveyIds: ["public-assistance-survey", "census"],
    provenanceUrls: ["https://www.mhlw.go.jp/toukei/list/74-16.html"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "実数と世帯千対を切り替え可能にし、制度利用を地域評価へ短絡させない",
  },
  {
    evidenceId: "japan-zue-2025-26-p458-table02",
    question: "乳児死亡の実数と出生千対は、なぜ別々に見る必要があるか？",
    metricKeys: ["infant-deaths", "infant-mortality-rate-per-1000-births"],
    surveyIds: ["vital-statistics"],
    provenanceUrls: ["https://www.mhlw.go.jp/toukei/list/81-1.html"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "小標本の年次変動を明示し、単年順位だけで医療水準を断定しない",
  },
  {
    evidenceId: "japan-zue-2025-26-p460-figure01",
    question: "病床が多い地域ほど、医療へのアクセスは本当に良いのか？",
    metricKeys: ["general-hospital-bed-count-per-100k"],
    surveyIds: ["medical-facility-survey"],
    provenanceUrls: ["https://www.mhlw.go.jp/toukei/list/79-1.html"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "病床密度をアクセスの代理変数に限定し、医師数・移動時間と合わせて考察する",
  },
  {
    evidenceId: "japan-zue-2025-26-p467-table01",
    question: "平均余命の地域差は、年齢と性別を分けるとどんな形で現れるか？",
    metricKeys: ["average-life-expectancy-male", "average-life-expectancy-female-20", "average-life-expectancy-female-65"],
    surveyIds: [],
    provenanceUrls: ["https://www.mhlw.go.jp/toukei/list/6-17.html"],
    placements: ["ranking", "survey", "theme", "area", "blog", "youtube", "instagram", "x"],
    status: "existing-live",
    nextAction: "出生時平均余命と年齢別平均余命を同じ値として扱わず、系列別に表示する",
  },
] as const;

export const JAPAN_ZUE_MASTER_CONTENT = {
  contentKey: "japanese-instruction-support-2025",
  title: "日本語の支援が必要な子どもは、どこに多い？",
  question: "都道府県別人数の差は、外国人住民数だけで説明できるのか？",
  metricKeys: ["students-requiring-japanese-instruction", "resident-foreigner-population"],
  surveyIds: ["japanese-language-instruction-survey"],
  provenanceUrls: [
    "https://www.mext.go.jp/b_menu/houdou/31/09/1421569_00007.htm",
    "https://www.mext.go.jp/content/20260525-mxt_kyokoku-000049811_03.pdf",
  ],
  lineage: {
    evidenceId: "japan-zue-2025-26-p436-table02",
    landingRoute: "/ranking/students-requiring-japanese-instruction",
    landingStatus: "inactive-publication-pending",
    primaryContentRole: "youtube",
    derivativeContentRoles: ["instagram", "x"],
  },
  article: {
    status: "draft-ready-review-pending",
    intendedChannels: ["blog", "note"],
    lead: "日本語の指導が必要な児童生徒は、外国籍だけではありません。文部科学省の2025年度調査を都道府県別に見ると、支援ニーズは一部の大都市に限られず、人数と学校側の受入体制を分けて考える必要があります。",
    sections: [
      {
        heading: "全国で8万4,759人。まずは『誰を数えた統計か』を確認する",
        body: "文部科学省の2025年度調査では、日本語指導が必要な児童生徒は外国籍7万3,313人、日本国籍1万1,446人、合計8万4,759人です。ここで数えているのは外国人住民全体ではなく、公立学校で日本語指導が必要と判断された児童生徒です。国籍と支援ニーズを同じものとして扱わないことが、地域差を読む出発点です。",
        metricKeys: ["students-requiring-japanese-instruction"],
      },
      {
        heading: "人数が多いのは愛知・神奈川・東京・大阪",
        body: "都道府県別の合計人数は、愛知県1万5,712人、神奈川県1万373人、東京都8,409人、大阪府7,920人が上位です。埼玉県5,924人、静岡県5,538人、千葉県4,857人も多く、首都圏だけでなく製造業が集積する地域にも支援ニーズが見えます。ただし、これは人数の比較であり、児童生徒数に占める割合や学校1校あたりの負担を示すものではありません。",
        metricKeys: ["students-requiring-japanese-instruction"],
      },
      {
        heading: "外国人住民が多い県ほど支援ニーズも多い、で終わらせない",
        body: "外国人住民数は背景を考えるための重要な指標ですが、児童生徒の年齢構成、就学状況、在留資格、家庭で使う言語、学校側の把握方法によって必要な支援は変わります。次の分析では同じ対象年の外国人人口と児童生徒数をそろえ、実数と人口あたりを別チャートにします。相関が見えても、外国人住民数だけを原因とは断定しません。",
        metricKeys: ["students-requiring-japanese-instruction", "resident-foreigner-population"],
      },
      {
        heading: "地域を比べる目的は順位づけではなく、支援体制を考えること",
        body: "人数が少ない県でも、対象児童生徒が少数の学校へ分散していれば支援者の配置は難しくなります。反対に人数が多くても、拠点校や専門人材を共有できる地域があります。人数、児童生徒数に占める割合、学校数、支援員・日本語指導担当者の配置を順に重ね、どの地域にどの支援が必要かを考える材料として使います。",
        metricKeys: ["students-requiring-japanese-instruction"],
      },
    ],
    editorialSafeguards: [
      "国籍と日本語指導ニーズを同一視しない",
      "実数と人口あたりを同じランキングに混在させない",
      "地域・学校・児童生徒を優劣で評価しない",
      "書籍の見出し・文章・図表表現を転用しない",
    ],
  },
  youtube: {
    experimentId: "EXP-006",
    status: "brief-ready-slot-pending",
    experimentCapacity: {
      maxMasters: 3,
      plannedMasters: 3,
      availableSlots: 0,
      assignment: "unassigned",
      reason: "EXP-006の3枠は実収入・子育て・納豆で計画済み。置換はオーナー判断と実験SSOT更新後に行う",
    },
    registration: {
      status: "not-registered-no-slot",
      postsSsot: ".claude/state/sns/posts.json",
      utmPolicy: ".claude/scripts/lib/sns-utm.cjs",
    },
    targetDurationMinutes: 8,
    claim: "支援ニーズは大都市だけの問題ではなく、人数と受入体制を分けて見る必要がある",
    chapters: [
      { start: "00:00", title: "地図で最初の違和感を確認" },
      { start: "00:45", title: "調査が数えている児童生徒の定義" },
      { start: "02:00", title: "47都道府県の分布" },
      { start: "04:00", title: "外国籍・日本国籍を分けて見る" },
      { start: "05:30", title: "人口規模だけでは読めない点" },
      { start: "07:00", title: "地域の支援体制へ問いをつなぐ" },
    ],
  },
  derivatives: [
    { contentKey: "japanese-instruction-support-2025", platform: "instagram", postType: "reel", parentContentKey: "japanese-instruction-support-2025", parentPlatform: "youtube", sourceTimecode: "00:00-00:35", status: "planned-unregistered" },
    { contentKey: "japanese-instruction-support-2025", platform: "instagram", postType: "reel", parentContentKey: "japanese-instruction-support-2025", parentPlatform: "youtube", sourceTimecode: "03:40-04:20", status: "planned-unregistered" },
    { contentKey: "japanese-instruction-support-2025", platform: "x", postType: "video", parentContentKey: "japanese-instruction-support-2025", parentPlatform: "youtube", sourceTimecode: "00:00-00:35", status: "planned-unregistered" },
    { contentKey: "japanese-instruction-support-2025", platform: "x", postType: "video", parentContentKey: "japanese-instruction-support-2025", parentPlatform: "youtube", sourceTimecode: "05:30-06:10", status: "planned-unregistered" },
  ],
} as const;
