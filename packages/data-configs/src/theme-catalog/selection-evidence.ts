import type { MetricSelection } from "./types";

/**
 * 一次資料で裏付けた選定根拠 (selection) の置き場 — `expanded.ts` 由来の指標専用。
 *
 * どこに書くかの規則 (混在させない):
 * - 指標が `packages/data-configs/src/theme-catalog/<theme>.ts` の `metrics[]` に**インラインで**
 *   定義されている → その `selection` を直接書く (このファイルには書かない)
 * - 指標が `expanded.ts` の spec tuple (31 テーマ) / 既存テーマ拡張 tuple (67 章) で定義されている
 *   → tuple に selection の欄が無いので **ここ** に `[themeKey][rankingKey]` で書く。
 *   `makeCatalog` / `extensionMetric` が定型 selection より優先して読む
 *
 * ★このファイルは `.claude/scripts/themes/selection-backfill.mjs apply` が丸ごと再生成する
 *   (JSON 形式の TS)。手で書く場合も同じ形を保つ。規約: `.claude/rules/theme-catalog-standards.md` §4
 */
export const SELECTION_EVIDENCE: Record<string, Record<string, MetricSelection>> = {
  "agriculture-production": {
    "agricultural-farm-count": {
      "proposedBy": "「農家の数は減っていますか。」（農林水産省）",
      "sourceUrl": "https://www.maff.go.jp/j/heya/kodomo_sodan/0103/05.html",
      "surveyedAt": "2026-09-16",
      "rationale": "農林水産省は農家数が20年間で約56%減少したことを公式解説として示しており、農業の担い手基盤の縮小を端的に表す指標であることが分かる。農業産出額（総額）や就業者1人当たり産出額とは異なる角度から、農業を営む経営単位の数そのものの変化を捉えられるため、テーマの「農家数を別々の指標として比較する」という位置付けに合致する。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "自分の地域で農業を営む世帯数はどれだけ減っているか。",
      "targetReaderOrDecision": "農業の担い手基盤の縮小度合いを把握したい読者。"
    },
    "agricultural-output": {
      "proposedBy": "生産農業所得統計の概要（農林水産省）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/nougyou_sansyutu/gaiyou/",
      "surveyedAt": "2026-09-16",
      "rationale": "農林水産省は農業産出額を都道府県別の品目生産量に農家庭先販売価格を乗じて算出する統計として位置付けており、農業生産の実態を金額で評価し農政の企画立案に資する資料と説明している。これは都道府県間で同一手法により推計される総額指標であり、テーマ「農業の生産力を都道府県別に見る」の中心指標として、規模の大小をまず把握する役割を果たす。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県の農業生産の規模は全国の中でどの位置にあるか。",
      "targetReaderOrDecision": "都道府県別の農業生産規模を比較したい読者。"
    },
    "agricultural-output-per-employed-person": {
      "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標 C 経済基盤（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010203",
      "surveyedAt": "2026-09-16",
      "rationale": "総務省統計局の社会・人口統計体系「C 経済基盤」の統計表には、農業産出額を就業者数で割った「就業者1人当たり農業産出額（販売農家）」がコードC0410101として都道府県別に整備されている。総額指標である農業産出額だけでは人口・就業者規模の違いが反映されないため、この1人当たり指標を併置することで、テーマの説明にある「総額と1人当たりを混同しない」比較軸を担保できる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "農業就業者1人が生み出す産出額は都道府県によってどう異なるか。",
      "targetReaderOrDecision": "生産性の観点で都道府県の農業を比較したい読者。"
    },
    "beef-cattle-count": {
      "proposedBy": "農林水産省「畜産統計調査の概要（乳用牛及び肉用牛）」肉用牛の定義",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/gaiyou_tokei/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "農林水産省は肉用牛を乳用牛とは別に「肉用を目的として飼養している牛」として区別して定義し、家畜改良増殖目標の増殖目標算定や食料需給表（飼料自給率）の算定に利用していると説明している。乳用牛飼養頭数と並置することで、都道府県ごとの畜産構造（酪農地帯か肉用牛産地か）の違いを比較可能にし、テーマの畜産章の中心指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "肉用牛の飼養規模は乳用牛とどう異なる分布を都道府県別に持つのか。",
      "targetReaderOrDecision": "肉用牛生産振興策を検討する行政・畜産経営分析者。"
    },
    "core-agricultural-workers": {
      "proposedBy": "令和3年版 食料・農業・農村白書 第1部第1章第1節（1）基幹的農業従事者（農林水産省）",
      "sourceUrl": "https://www.maff.go.jp/j/wpaper/w_maff/r3/r3_h/trend/part1/chap1/c1_1_01.html",
      "surveyedAt": "2026-09-16",
      "rationale": "食料・農業・農村白書は基幹的農業従事者数の減少と高齢化を農業の持続的発展に関わる重要課題として取り上げており、65歳以上が全体の7割を占める点も指摘している。農家数が経営単位の数を示すのに対し、基幹的農業従事者数は実際に農業に従事する人の数を示すため、農家数とは異なる角度から労働力の担い手不足を補完的に把握できる指標である。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "実際に農業に主として従事している人はどれだけ減り、高齢化しているか。",
      "targetReaderOrDecision": "農業労働力の担い手不足を政策上の論点として検討する読者。"
    },
    "dairy-cattle-count": {
      "proposedBy": "農林水産省「畜産統計調査の概要（乳用牛及び肉用牛）」調査の目的・乳用牛の定義",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/gaiyou_tokei/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "農林水産省は畜産統計における乳用牛を「搾乳を目的として飼養している牛」と明確に定義し、酪農および肉用牛生産の近代化基本方針における地域別飼養頭数目標の策定など行政施策の基礎資料として利活用されると位置付けている。都道府県別の乳用牛飼養頭数は、農業産出額や農家数とは異なる畜産部門の生産規模を直接示す指標であり、テーマの「畜産・酪農の飼養規模と生産量」章を支える基礎データとなる。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ],
      "readerQuestion": "都道府県ごとに酪農（乳用牛）の飼養規模はどれくらい違うのか。",
      "targetReaderOrDecision": "酪農振興策や飼養頭数目標を検討する行政関係者・研究者。"
    },
    "dairy-cattle-holdings": {
      "proposedBy": "農林水産省「畜産統計調査の概要（乳用牛及び肉用牛）」調査の目的・乳用牛の定義",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/gaiyou_tokei/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "畜産統計は「規模別・飼養状態別飼養戸数」を把握することを目的の一つとして明記しており、飼養頭数だけでなく飼養戸数を併記することで1戸当たり規模（経営の大規模化・集約化の進展）を都道府県間で比較できるようにしている。乳用牛飼養戸数は、頭数指標を補完し、産地の経営構造の違いを示す観点でテーマに資する。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "乳用牛を飼養する農家の数は都道府県でどう違い、1戸当たりの飼養規模はどう変化しているか。",
      "targetReaderOrDecision": "酪農経営の集約化・大規模化の動向を分析する研究者・自治体担当者。"
    },
    "layer-hen-count": {
      "proposedBy": "農林水産省「畜産統計調査の概要（豚、採卵鶏及びブロイラー）」採卵鶏調査の対象・定義",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/gaiyou/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "採卵鶏調査は成鶏めす1,000羽以上の飼養者を対象に飼養羽数を毎年調査しており、種鶏やひなを除いた成鶏めすに限定することで、実際に鶏卵を生産する規模を都道府県間で比較可能な形で示している。これは牛・豚とは異なる畜種として、テーマの飼養規模比較を完結させる補完的な指標である。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "採卵鶏（鶏卵生産）の飼養規模は都道府県ごとにどのように分布しているか。",
      "targetReaderOrDecision": "鶏卵生産の産地構造を分析する研究者・行政担当者。"
    },
    "pig-count": {
      "proposedBy": "農林水産省「畜産統計調査の概要（豚、採卵鶏及びブロイラー）」調査の目的・豚の定義",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/gaiyou/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "畜産統計調査は豚の飼養頭数・経営タイプ別頭数を毎年2月1日現在で把握し、食料・農業・農村基本計画における飼養頭羽数指標の設定・検証や食料需給表（飼料自給率）の算定に用いられると説明している。豚飼養頭数は牛とは異なる畜種の生産規模を示し、都道府県別の畜産構造の多様性を把握するうえで欠かせない補完的指標である。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "豚の飼養は特定の都道府県にどれだけ集中しているのか。",
      "targetReaderOrDecision": "食料自給率・畜産行政の基礎資料を確認する政策担当者。"
    },
    "raw-milk-production": {
      "proposedBy": "牛乳乳製品統計調査の概要（農林水産省）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/gyunyu/gaiyou/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "農林水産省の牛乳乳製品統計調査は都道府県別の生乳生産量を移出入量とあわせて把握することを調査の役割として明記しており、畜産・酪農分野に特化した地域別の生産規模を示す資料となっている。農業産出額や耕地面積が農業全般の規模を示すのに対し、生乳生産量は畜産・酪農という特定分野の生産量を直接表すため、章立て「畜産・酪農の飼養規模と生産量」に対応する補完的な指標である。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "自分の都道府県は酪農・牛乳生産でどれだけの規模を持つか。",
      "targetReaderOrDecision": "畜産・酪農分野の都道府県別生産規模を把握したい読者。"
    }
  },
  "construction-industry": {
    "architect-annual-income": {
      "proposedBy": "厚生労働省「賃金構造基本統計調査」一般_都道府県別_職種（特掲）DB 統計表・グラフ表示（政府統計の総合窓口 e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003445758",
      "surveyedAt": "2026-09-16",
      "rationale": "この調査は職種別・都道府県別に賃金実態を明らかにする厚生労働省の基幹統計であり、建築技術者という職種区分を含んでいる。建設業の担い手を論じる章立てにおいて、就業者数だけでなく処遇（年収）水準を都道府県別に示すことで、待遇面から担い手確保の課題を読み解く読者の問いを補完する。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "建築技術者の年収はどの都道府県で高いか。",
      "targetReaderOrDecision": "建設業への就職・転職先を検討する求職者や処遇改善策を検討する事業者。"
    },
    "construction-employed-age55plus": {
      "proposedBy": "令和7年版 国土交通白書 第1部第1章第1節「直面する課題」③国土交通分野における担い手不足（国土交通省）",
      "sourceUrl": "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n1111000.html",
      "surveyedAt": "2026-09-16",
      "rationale": "国土交通白書は建設業を担い手不足が特に深刻な産業として名指しし、55歳以上就業者比率が全産業平均を上回る一方29歳以下が下回るという年齢構成の偏りを、担い手確保という政策課題を裏付ける中心指標として提示している。都道府県別に55歳以上就業者数を見ることは、この高齢化がどの地域でより深刻かを把握し、担い手不足対策の優先地域を検討する読者の問いに直接応える。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "建設業の高齢化はどの都道府県で特に進んでいるか。",
      "targetReaderOrDecision": "地域の建設業担い手確保策を検討する自治体・業界団体の担当者。"
    },
    "construction-employed-female": {
      "proposedBy": "国土交通省「建設産業における女性の定着促進に向けた取組について」（国土交通省 不動産・建設経済局建設業課）",
      "sourceUrl": "https://www.mlit.go.jp/totikensangyo/const/totikensangyo_const_tk1_000088.html",
      "surveyedAt": "2026-09-16",
      "rationale": "国土交通省は女性技術者・技能者の就業者数の増加傾向を担い手多様化の成果指標としつつ、定着が不十分であるという課題を示しており、都道府県別の女性就業者数はこの全国的な傾向が地域ごとにどの程度実現しているかを確認する材料になる。担い手の多様性という切り口で55歳以上就業者数とは異なる角度からテーマを補完する。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "建設業の女性就業者はどの都道府県で多いか。",
      "targetReaderOrDecision": "建設業の担い手多様化施策を検討する行政・企業の人事担当者。"
    },
    "construction-employed-under30": {
      "proposedBy": "令和7年版 国土交通白書 第1部第1章第1節「直面する課題」（国土交通省）",
      "sourceUrl": "https://www.mlit.go.jp/hakusyo/mlit/r06/hakusho/r07/html/n1111000.html",
      "surveyedAt": "2026-09-16",
      "rationale": "国土交通白書は建設業就業者の29歳以下の割合が全産業平均より低く、高齢化が深刻化していると明記している。若年層の入職状況が建設業の担い手確保の中心課題であることを示しており、テーマの章「建設業の担い手構成と職種別待遇」を都道府県別に検証する際、この年齢層の就業者数は将来の担い手確保力を測る代表的な指標になる。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "自分の都道府県では建設業に29歳以下の若い就業者がどれだけいるか。",
      "targetReaderOrDecision": "建設業の将来の担い手確保策を検討する自治体・業界団体。"
    },
    "public-construction-contract-amount": {
      "proposedBy": "政府統計の総合窓口 e-Stat「項目定義（C：産業）」建設工事受注動態統計調査に基づく項目定義（総務省）",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
      "surveyedAt": "2026-09-16",
      "rationale": "同一の項目定義において請負契約額は件数と対をなす指標として定義されており、1件当たりの規模の違いを踏まえた金額ベースでの公共工事受注規模を都道府県別に把握できる。件数のみでは捉えられない大型工事の集中度合いなどを補完し、施工地別の公共工事受注の実態を多面的に示す。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "公共工事の受注額はどの都道府県で大きいか。",
      "targetReaderOrDecision": "地域の公共工事市場規模を金額面から把握したい建設業者や財政担当者。"
    },
    "public-construction-contract-count": {
      "proposedBy": "政府統計の総合窓口 e-Stat「項目定義（C：産業）」建設工事受注動態統計調査に基づく項目定義（総務省）",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/C",
      "surveyedAt": "2026-09-16",
      "rationale": "この定義は公共工事の請負契約件数が建設工事受注動態統計調査に基づく施工都道府県別の集計値であり、1件500万円以上という対象基準が明確にされていることを示している。テーマの章立てにある「施工地別の公共工事受注」を都道府県間で比較する際、件数は契約額とは異なる案件数の多寡という角度から地域の公共工事受注動向を捉える指標になる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "公共工事の受注件数はどの都道府県で多いか。",
      "targetReaderOrDecision": "地域の公共工事市場規模を把握したい建設業者や地方議会関係者。"
    }
  },
  "cultural-participation": {
    "hobby-participation-rate-art-appreciation": {
      "proposedBy": "令和3年社会生活基本調査 調査票Ａに基づく結果 生活行動編（地域）趣味・娯楽98-2-2「男女,従業上の地位,趣味・娯楽の種類別行動者率(有業者)－全国，都道府県」（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003456661",
      "surveyedAt": "2026-09-16",
      "rationale": "総務省統計局の社会生活基本調査は全国・都道府県別に趣味・娯楽の種類ごとの行動者率を公表しており、美術鑑賞はその独立した項目としてテレビ等の視聴と区別して定義されている。行動者率は10歳以上人口に占める行動者数の割合として算出されるため都道府県間で同一基準の比較が可能であり、文化芸術への参加率を直接示す代表的な指標として本テーマの中心に位置づけられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の住む都道府県では、実際に美術館やギャラリーで作品を鑑賞する人がどれくらいいるのか。",
      "targetReaderOrDecision": "文化施設の利用促進策を検討する自治体職員・文化政策担当者。"
    },
    "hobby-participation-rate-classical-music": {
      "proposedBy": "令和3年社会生活基本調査 調査票Ａに基づく結果 生活行動編（地域）趣味・娯楽98-2-2「男女,従業上の地位,趣味・娯楽の種類別行動者率(有業者)－全国，都道府県」（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003456661",
      "surveyedAt": "2026-09-16",
      "rationale": "本調査ではクラシック音楽鑑賞がコンサート会場での鑑賞行動として定義されており、自宅での音楽鑑賞や他の鑑賞行動とは別立てで都道府県別行動者率が算出されている。同じ調査手法・同じ行動者率の定義を用いるため他の鑑賞系指標と時系列・地域の両面で比較可能であり、音楽という別領域の参加実態を補う位置づけとなる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "地元でクラシックコンサートに足を運ぶ人はどれくらいいるのか、他の鑑賞活動と比べて多いのか少ないのか。",
      "targetReaderOrDecision": "音楽ホール・コンサートホールの運営方針を検討する施設関係者。"
    },
    "hobby-participation-rate-theater": {
      "proposedBy": "令和3年社会生活基本調査 調査票Ａに基づく結果 生活行動編（地域）趣味・娯楽98-2-2「男女,従業上の地位,趣味・娯楽の種類別行動者率(有業者)－全国，都道府県」（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003456661",
      "surveyedAt": "2026-09-16",
      "rationale": "社会生活基本調査では演芸・演劇・舞踊鑑賞が美術鑑賞とは別のカテゴリーとして都道府県別に集計されており、舞台芸術への参加という美術鑑賞とは異なる文化行動を捉えている。同一調査・同一定義の行動者率のため美術鑑賞や音楽鑑賞と並べて比較しても基準がぶれず、参加行動の多角的な把握という補完的な角度をテーマに与える。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "演劇や舞踊などの舞台芸術を鑑賞する住民の割合は、美術鑑賞と比べてどう違うのか。",
      "targetReaderOrDecision": "舞台芸術振興策の優先度を検討する文化行政担当者。"
    },
    "library-lending-books": {
      "proposedBy": "社会教育調査 平成27年度 統計表 図書館調査（平成26年度間）86「図書の貸出業務等の実施状況（都道府県別）（前年度間）」（文部科学省）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003348634",
      "surveyedAt": "2026-09-16",
      "rationale": "文部科学省の社会教育調査は図書館調査の一環として都道府県別に図書の貸出業務における貸出冊数（総数・うち児童）を集計しており、この数値が社会・人口統計体系の都道府県データにも取り込まれている。鑑賞・制作という個人の行動者率とは異なり、図書館という施設の利用実績を冊数という実数で捉える指標であり、鑑賞系の行動者率とは異なる角度から文化・生涯学習への参加度を補完する。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality",
        "readerValue"
      ],
      "readerQuestion": "地元の図書館はどれくらい活発に利用されているのか、貸出冊数の推移はどうなっているか。",
      "targetReaderOrDecision": "図書館の運営計画を立てる自治体の図書館担当課。"
    },
    "total-museum-count": {
      "proposedBy": "社会教育調査 平成20年度 統計表 博物館調査（博物館）91「種類別博物館数（都道府県別）」（文部科学省）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003021737",
      "surveyedAt": "2026-09-16",
      "rationale": "文部科学省の社会教育調査は博物館を含む社会教育施設を3年ごとに都道府県別に調査しており、博物館数は登録博物館・博物館相当施設を含む館数として集計される。行動者率が個人の参加行動を示すのに対し、博物館数は施設の供給側の量を示す指標であり、テーマの説明が求める「参加」と「施設」を分けて比較する軸のうち施設側を担う位置づけとなる。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の住む都道府県にはどれくらいの数の博物館・美術館があるのか。",
      "targetReaderOrDecision": "文化施設の整備計画を検討する自治体の文化財・博物館行政担当者。"
    }
  },
  "education-culture": {
    "designated-museum-visitors": {
      "proposedBy": "社会教育調査 統計表107「博物館の入館者数（全国）（前年度間）」（文部科学省・政府統計の総合窓口e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/database?toukei=00400004&layout=dataset&statdisp_id=0003079876",
      "surveyedAt": "2026-09-16",
      "rationale": "博物館法第31条に基づく指定施設(旧称・博物館相当施設)は登録博物館とは別区分で入館者総数が集計されており、国・独立行政法人・企業・学校法人など多様な設置主体を含む点で登録博物館と性格が異なる。この指標を加えることで、登録博物館だけでは捉えられない指定施設側の利用実績を補い、都道府県の博物館利用の全体像を登録・指定の両面から比較できる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "登録博物館以外の指定施設はどれくらい利用されているか。",
      "targetReaderOrDecision": "文化施設の設置形態別の利用状況を比較したい行政担当者。"
    },
    "elementary-school-education-cost-per-student": {
      "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標－都道府県の指標－ E 教育（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010205",
      "surveyedAt": "2026-09-16",
      "rationale": "小学校教育費（児童1人当たり）は1979年から続く長期時系列の指標として都道府県別に収録されており、家庭や自治体が小学校段階でどの程度の教育費を投じているかを比較できる。教育費のかけ方という既存論点を、義務教育の入口である小学校段階について補強する役割を持つ。",
      "adoptionCriteria": [
        "comparability",
        "dataQuality",
        "complementarity"
      ],
      "readerQuestion": "自分の県の小学校教育費は全国平均と比べて高いのか低いのか。",
      "targetReaderOrDecision": "教育費の地域差に関心を持つ保護者・自治体の教育予算担当者。"
    },
    "high-school-advancement-rate": {
      "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標－都道府県の指標－ E 教育（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010205",
      "surveyedAt": "2026-09-16",
      "rationale": "総務省統計局の社会・人口統計体系は、高等学校卒業者の進学率を都道府県別に共通の定義で長期にわたり収録しており、進学率の地域差を時系列で比較する際の基礎データとなっている。高等教育への進路という章の問いに直接対応する指標であり、他の教育費や大学数の指標と組み合わせることで地域の学ぶ基盤を多面的に把握できる。",
      "adoptionCriteria": [
        "comparability",
        "representativeness",
        "dataQuality"
      ],
      "readerQuestion": "自分の県の高校生はどれくらいの割合で進学しているのか、他県と比べて高いのか低いのか。",
      "targetReaderOrDecision": "地域の教育到達度を都道府県間で比較したい読者・自治体の教育政策担当者。"
    },
    "library-books": {
      "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標－都道府県の指標－ G 文化・スポーツ（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010107",
      "surveyedAt": "2026-09-16",
      "rationale": "図書館蔵書数は文化・スポーツ分野の都道府県別指標として収録されており、図書館という社会教育施設が地域にどれだけの蔵書規模で存在するかを示す基礎データである。図書館と読書環境という章において、施設数や貸出冊数と組み合わせて地域の読書基盤の厚みを表す代表的な指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "自分の県の図書館は他県と比べて蔵書規模が大きいのか小さいのか。",
      "targetReaderOrDecision": "地域の図書館サービス水準を比較したい読者・図書館行政担当者。"
    },
    "library-lending-books": {
      "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標－都道府県の指標－ G 文化・スポーツ（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010107",
      "surveyedAt": "2026-09-16",
      "rationale": "図書館館外貸出冊数は蔵書数と対になって同じ体系に収録されている指標であり、施設の量だけでなく実際にどれだけ利用されているかという利用実績を都道府県別に比較できる。図書館と読書環境の章において、蔵書数（供給）と貸出冊数（利用）を対にして示すことで地域差をより立体的に捉えられる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "図書館の蔵書が多い県は、実際に貸出も多く利用されているのか。",
      "targetReaderOrDecision": "図書館の利用実態を蔵書規模と合わせて評価したい読者・自治体担当者。"
    },
    "museum-like-facility-visitors": {
      "proposedBy": "社会教育調査 統計表135「博物館類似施設の入館者数（都道府県別）」（文部科学省・政府統計の総合窓口e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/database?stat_infid=000007536728&layout=dataset&statdisp_id=0003020664",
      "surveyedAt": "2026-09-16",
      "rationale": "社会教育調査は登録・指定以外の施設を「博物館類似施設」として別区分で入館者総数を都道府県別に集計しており、この区分には博物館法上の登録・指定を受けていない多数の資料館・記念館等が含まれる。登録博物館・指定施設の入館者数と合わせて見ることで、地域の博物館利用の裾野の広さを補完的に把握できる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "登録・指定を受けていない博物館類似施設はどれだけ利用されているか。",
      "targetReaderOrDecision": "地域の文化施設利用の全体像を把握したい読者。"
    },
    "prefecture-designated-cultural-property-count": {
      "proposedBy": "文化庁「都道府県・市町村指定等文化財の件数」解説ページ（文化庁）",
      "sourceUrl": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/kensu.html",
      "surveyedAt": "2026-09-16",
      "rationale": "文化庁は都道府県・市町村が文化財保護条例に基づき指定した文化財件数を公表しており、同一の文化財が複数区分で重複計上される場合がある点を明示的に注記している。この注記は、都道府県指定等文化財件数を地域比較に用いる際に単純な文化財総数として読まないよう促すものであり、テーマの「文化財の指定・保護と所在地」章で件数の解釈上の留意点として位置づけられる。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ],
      "readerQuestion": "都道府県指定等文化財の件数は都道府県ごとにどう異なるか、その数値はどこまで実数を表すか。",
      "targetReaderOrDecision": "地域の文化財保護の状況を比較したい読者・自治体職員。"
    },
    "public-school-closures-cumulative": {
      "proposedBy": "廃校施設活用状況実態調査について（文部科学省大臣官房文教施設企画・防災部施設助成課）",
      "sourceUrl": "https://www.mext.go.jp/a_menu/shotou/zyosei/yoyuu_00002.htm",
      "surveyedAt": "2026-09-16",
      "rationale": "文部科学省は廃校を児童生徒数減少に伴う学校統合・廃止の結果として定義しており、都道府県別の廃校発生延べ数はその地域で学校統合がどれだけ進んだかを示す実績指標となる。これは「学校の規模と廃校の実績」の章で学校数の減少（小学校数・中学校数）の背景を説明する補完指標になる。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "自分の地域では過去にどれくらいの学校が統合・廃止されてきたのか。",
      "targetReaderOrDecision": "学校統合の進み方や廃校施設の活用を検討する自治体担当者・地域住民。"
    },
    "registered-museum-visitors": {
      "proposedBy": "社会教育調査 統計表107「博物館の入館者数（全国）（前年度間）」（文部科学省・政府統計の総合窓口e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/database?toukei=00400004&layout=dataset&statdisp_id=0003079876",
      "surveyedAt": "2026-09-16",
      "rationale": "社会教育調査は博物館を「登録博物館」と「博物館相当施設」に区分して入館者総数を集計しており、登録博物館は博物館法第2条の登録要件を満たした施設として統計上明確に区分される。この区分に沿って都道府県別の入館者数を見ることで、法的に位置づけられた博物館がどれだけ地域住民に利用されているかを比較でき、テーマの「文化・社会教育の施設」章の中心的な利用実績指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県の登録博物館はどれだけ来館者を集めているか。",
      "targetReaderOrDecision": "地域の文化施設の利用実態を把握したい自治体職員・研究者。"
    },
    "study-participation-rate-business": {
      "proposedBy": "令和3年社会生活基本調査 表75-2-2「男女,学習・自己啓発・訓練の種類別行動者率(10歳以上)－全国，都道府県」（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003456245",
      "surveyedAt": "2026-09-16",
      "rationale": "社会生活基本調査は学習・自己啓発・訓練の種類別行動者率を都道府県別に集計しており、商業実務・ビジネス関係はその内訳区分の一つとして表章されている。学校を卒業した後の社会人が実際にどのような内容の学び直しをしているかを示す数少ない全国比較可能な指標であり、生涯学習と学び直しという章の問いを具体的な学習内容の面から補完する。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "自分の県の社会人は仕事関連の学び直し（商業実務・ビジネス関係）にどれくらい取り組んでいるのか。",
      "targetReaderOrDecision": "地域の生涯学習・リスキリングの実態に関心を持つ読者・人材育成担当者。"
    },
    "total-museum-count": {
      "proposedBy": "社会教育調査 年次統計1「種類別博物館数の推移」（文部科学省・政府統計の総合窓口e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003082666",
      "surveyedAt": "2026-09-16",
      "rationale": "社会教育調査は博物館を総合・科学・歴史・美術など館種別に集計し、その合計を「種類別博物館数の推移」として示している。都道府県別の博物館総数はまず地域にどれだけ博物館が存在するかという供給量の基礎指標であり、入館者数などの利用指標を解釈する前提として位置づけられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県には博物館がいくつあるか。",
      "targetReaderOrDecision": "文化施設の地域配置を把握したい読者・自治体職員。"
    },
    "university-count-per-100k": {
      "proposedBy": "社会・人口統計体系 都道府県データ 社会生活統計指標－都道府県の指標－ E 教育（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010205",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ社会・人口統計体系の教育分野に収録される大学数（人口10万人当たり）は、大学が集積する地域と少ない地域の差を人口規模で調整して比較できるよう標準化された指標であり、地域における高等教育機関の集積度そのものを表す。大学と地域人材という章の問いにおいて、進学率とは異なる「供給側」の角度から地域差を補完する。",
      "adoptionCriteria": [
        "comparability",
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "自分の県には人口あたりでどれだけ大学があり、大学進学のための移動が必要になりやすいのか。",
      "targetReaderOrDecision": "進学先の地域選択や高等教育政策を検討する読者・自治体担当者。"
    }
  },
  "forestry-timber": {
    "artificial-forest-area": {
      "proposedBy": "令和6年度 森林・林業白書 第I部第1章第2節「森林整備の動向」（林野庁）",
      "sourceUrl": "https://www.rinya.maff.go.jp/j/kikaku/hakusyo/r6hakusyo_h/all/chap1_2_1.html",
      "surveyedAt": "2026-09-16",
      "rationale": "白書は人工造林面積を毎年度の森林整備実施状況を示す代表的な指標として公表しており、伐採後の再造林や新規植栽の進み具合を測る政策的な注目指標である。都道府県別に見ることで、森林資源の循環利用がどの地域で進んでいるかという補完的な視点を提供する。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ]
    },
    "forest-area-ratio": {
      "proposedBy": "令和6年度 森林・林業白書 第I部第1章第1節「森林の整備・保全」（林野庁）",
      "sourceUrl": "https://www.rinya.maff.go.jp/j/kikaku/hakusyo/r6hakusyo_h/all/chap1_1_1.html",
      "surveyedAt": "2026-09-16",
      "rationale": "白書は森林面積を国土面積に対する割合として示すことで、実面積の大小だけでは分からない地域の森林依存度を表現している。森林面積割合は実面積（woodland-area）を補う比率指標として、都道府県間の森林率の違いを比較可能な形で示す。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ]
    },
    "forest-road-length": {
      "proposedBy": "「路網整備の推進について」（林野庁）",
      "sourceUrl": "https://www.rinya.maff.go.jp/j/seibi/sagyoudo/romousuisin.html",
      "surveyedAt": "2026-09-16",
      "rationale": "林野庁は林道を含む路網の延長を、木材の搬出や森林施業の効率化を左右する基盤整備の到達度として提示し、目標延長との差を政策課題としている。都道府県別の林道延長は、木材生産を支えるインフラ整備の地域差を示す補完的指標として有用である。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ]
    },
    "forestry-hired-workers": {
      "proposedBy": "愛知県「2020年農林業センサス結果 利用上の注意」用語の解説（農林水産省の定義を引用）",
      "sourceUrl": "https://www.pref.aichi.jp/soshiki/toukei/noucentyuui2020kakuteiti.html",
      "surveyedAt": "2026-09-16",
      "rationale": "農林業センサスの用語解説は「雇用者」を林業経営のために雇った常雇い・臨時雇いの合計と定義しており、経営体の外部から調達される労働力を明確に区分している。これは経営体内部の家族・役員労働力（内部労働者数）と対をなす概念であり、雇用者数を都道府県別に比較することで、地域ごとに林業経営が雇用労働にどれだけ依存しているかを読み取る指標になる。",
      "adoptionCriteria": [
        "dataQuality",
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "自分の県の林業は雇用労働にどの程度依存しているか。",
      "targetReaderOrDecision": "地域の林業雇用の実態を把握したい行政・研究者。"
    },
    "forestry-management-entities": {
      "proposedBy": "農林水産省「2025年農林業センサス結果の概要（概数値）」（令和7年2月1日現在）林業経営体調査結果",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kekka_gaiyou/noucen/040909/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "2025年農林業センサスの結果概要は林業経営体数を全国の中心的な見出し指標として掲げ、5年前（2020年）との増減率まで示している。これは林業を担う経営主体の裾野が都道府県間でどう異なるか、また全国的な減少傾向の中で各県がどの位置にあるかを比較する代表的な指標であり、労働力（雇用者・内部労働者）や産出額と組み合わせて経営構造を読み解く土台になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "readerValue"
      ],
      "readerQuestion": "自分の県の林業経営体数はこの5年でどれだけ変化したか。",
      "targetReaderOrDecision": "林業経営構造の変化を把握したい行政・研究者。"
    },
    "forestry-mushroom-output-value": {
      "proposedBy": "農林水産省「林業産出額の概要」（林業産出額統計）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/ringyou_sansyutu/gaiyou/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "林業産出額の内訳のひとつである栽培きのこ類生産部門は、ほだ木又は培養基を用いてきのこ類を生産する活動と定義されており、素材生産である木材生産部門とは性格の異なる産出額として区分されている。この指標を用いることで、木材生産だけでなく特用林産物としてのきのこ栽培が都道府県ごとにどれだけ林業産出額に寄与しているかを木材生産産出額と対比して把握でき、テーマが指摘する「木材・きのこ以外」を含む産出額構成の理解にも資する。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ]
    },
    "forestry-output-value": {
      "proposedBy": "農林水産省「林業産出額の概要」（林業産出額統計）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/ringyou_sansyutu/gaiyou/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "農林水産省は林業産出額統計の目的を、林業生産の実態を金額で評価し林業行政の企画立案の基礎資料とすることと説明している。都道府県別に林業産出額を並べることで、各地域の林業生産規模の違いを金額ベースで一目で比較でき、テーマの主要な問いである都道府県別の森林・林業の姿を最も直接的に示す指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ]
    },
    "forestry-timber-output-value": {
      "proposedBy": "農林水産省「林業産出額の概要」（林業産出額統計）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/ringyou_sansyutu/gaiyou/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "林業産出額は木材生産・栽培きのこ類生産・薪炭生産・林野副産物採取の4部門で構成されると説明されており、木材生産部門は伐木から用材に供される素材を生産する活動と定義されている。木材生産産出額は林業産出額の内訳のうち素材生産という林業の本来的な活動を切り出した指標であり、林業産出額全体との比較で木材生産の比重を都道府県別に把握する補完的な指標として位置付けられる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ]
    },
    "roundwood-hinoki-production-volume": {
      "proposedBy": "政府統計の総合窓口 e-Stat「木材統計調査 確報 平成30年木材需給報告書」都道府県別、月別統計 表1-2-2「素材需給の動向 素材生産量 主要部門別、樹種別素材生産量」（農林水産省）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003415785",
      "surveyedAt": "2026-09-16",
      "rationale": "木材統計調査（木材需給報告書）の統計表は素材生産量を針葉樹の中でも「あかまつ・くろまつ、すぎ、ひのき、からまつ、えぞまつ・とどまつ、その他」に樹種区分して都道府県別・月別に集計しており、ひのきはすぎと並ぶ主要樹種の一つとして継続的に把握される項目である。テーマが県別の素材生産の内訳を比較する上で、代表的な高付加価値樹種であるひのきの生産量は他樹種との違いを示す指標になる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の県はひのきの素材生産でどの程度の位置にあるか。",
      "targetReaderOrDecision": "木材産業の樹種別強みを把握したい行政・事業者。"
    },
    "roundwood-production-volume": {
      "proposedBy": "「木材統計調査の概要」（農林水産省）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/mokuzai/gaiyou/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "農林水産省の木材統計調査は素材生産量を都道府県別・樹種別に算出する調査方法を明示しており、木材需給報告書がこの指標を地域比較の基礎資料として設計していることが分かる。素材生産量は木材産業の生産面を代表する中心指標として本テーマの比較軸になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ]
    },
    "roundwood-sugi-production-volume": {
      "proposedBy": "令和6年度 森林・林業白書 第I部第2章第1節「林業の動向」（林野庁）",
      "sourceUrl": "https://www.rinya.maff.go.jp/j/kikaku/hakusyo/r6hakusyo_h/all/chap2_1_1.html",
      "surveyedAt": "2026-09-16",
      "rationale": "白書は樹種別の素材生産量の中でスギが過半を占める主力樹種であることを示しており、全体の素材生産量（roundwood-production-volume）だけでは見えないスギ生産への地域集中度を補完的に把握できる。これにより都道府県ごとの林業構造の違いを樹種別に比較できる。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ]
    },
    "sawmill-count": {
      "proposedBy": "農林水産省「木材統計調査の概要」調査の概要（用語の解説）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/mokuzai/gaiyou/",
      "surveyedAt": "2026-09-16",
      "rationale": "木材統計調査は製材工場を「動力の出力数が7.5kW未満の工場を除く」事業所と明確に定義した上で全国・都道府県別に工場数を調査しており、この定義がカタログの単位「工場（7.5kW以上）」と一致する。製材工場数は素材の受け皿となる加工基盤の規模を都道府県間で比較する代表的な指標であり、素材生産量や出荷量と組み合わせて地域の木材産業構造を捉えるのに資する。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality",
        "comparability"
      ],
      "readerQuestion": "自分の県には製材工場がどれだけ集積しているか。",
      "targetReaderOrDecision": "地域の木材加工業の集積度を評価したい自治体・事業者。"
    },
    "sawnwood-shipment-volume": {
      "proposedBy": "農林水産省「木材統計調査の概要」調査の概要（用語の解説）",
      "sourceUrl": "https://www.maff.go.jp/j/tokei/kouhyou/mokuzai/gaiyou/",
      "surveyedAt": "2026-09-16",
      "rationale": "木材統計調査は製材品出荷量を「手持ち材による販売・自家消費分」と「賃びき材」の総量として明確に定義しており、素材生産量（原木段階）とは異なる出荷段階の実態を示す。この定義に基づく製材品出荷量は都道府県別に継続調査されているため、素材生産量や製材工場数と組み合わせることで、原木生産から製品出荷までの木材産業の流れを都道府県間で比較する補完的な指標となる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality",
        "comparability"
      ],
      "readerQuestion": "自分の県の製材工場はどれだけの製材品を実際に出荷しているか。",
      "targetReaderOrDecision": "木材産業の出荷実態を把握したい行政・事業者。"
    },
    "woodland-area": {
      "proposedBy": "令和6年度 森林・林業白書 第I部第1章第1節「森林の整備・保全」（林野庁）",
      "sourceUrl": "https://www.rinya.maff.go.jp/j/kikaku/hakusyo/r6hakusyo_h/all/chap1_1_1.html",
      "surveyedAt": "2026-09-16",
      "rationale": "白書は森林面積を国土面積との対比で示し、日本の森林資源量を測る最も基本的な指標として位置付けている。都道府県別の森林面積を比較することで、各地域がどれだけの森林資源を有するかという本テーマの出発点となる問いに直接答えられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ]
    }
  },
  "health-checkups": {
    "health-checkup-breakfast-skipping-rate": {
      "proposedBy": "厚生労働省「標準的な質問票」（別紙３、特定健康診査の質問票）",
      "sourceUrl": "https://www.mhlw.go.jp/content/10900000/001081581.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "この資料は特定健診の全国共通「標準的な質問票」の質問17として、朝食欠食の定義文言と「はい・いいえ」の二択形式を定めている。NDBオープンデータの朝食欠食割合はこの質問17への回答を都道府県別に集計したものであり、健診受診率やメタボ該当割合と同じ質問票に基づくため、生活習慣と健診の関係を都道府県間で比較する上で他の健診系指標と並ぶ補完的な生活習慣指標になる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "dataQuality"
      ]
    },
    "health-checkup-late-dinner-rate": {
      "proposedBy": "厚生労働省「第11回NDBオープンデータ」特定健診（質問票）データセット 「標準的な質問票（質問項目１～22）都道府県別性年齢階級別分布」",
      "sourceUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221_00017.html",
      "surveyedAt": "2026-09-16",
      "rationale": "NDBオープンデータは特定健診の標準的な質問票（22項目）の回答結果を都道府県別・性・年齢階級別に集計して公表しており、就寝前2時間以内の夕食といった生活習慣に関する回答もこの枠組みの一部として都道府県比較が可能になっている。これは健診の受診率やメタボ該当割合とは異なり、健診受診者の生活習慣そのものを都道府県別に映す指標であり、章立て「食習慣と栄養」を都道府県別の生活習慣データで補完する役割を持つ。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ]
    },
    "health-checkup-recipients": {
      "proposedBy": "総務省統計局「地域保健・健康増進事業報告（地域保健・老人保健事業報告）令和２年度地域保健・健康増進事業報告 地域保健編 第１章 総括編」第1表 保健所及び市区町村が実施した健康診断受診延人員",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004027740",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計は保健所・市区町村が実施する健康診断（生活習慣病health checkupを含む）の受診延人員を都道府県別に把握し、地方自治体の保健施策を評価するための基礎資料とすることを目的として整理されている。特定健診（医療保険者ベース）とは別に、自治体が独自に実施する健診の利用実績を示すため、特定健診受診率を補完する角度からの指標として位置付けられる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ]
    },
    "metabolic-syndrome-prevalence-among-checkup-recipients": {
      "proposedBy": "厚生労働省「特定健康診査・特定保健指導に関するデータ」ページ 都道府県別一覧 見出し「メタボリックシンドローム（該当者数・予備群者数・割合）」",
      "sourceUrl": "https://www.mhlw.go.jp/stf/newpage_03092.html",
      "surveyedAt": "2026-09-16",
      "rationale": "同ページの都道府県別一覧には受診率・実施率とは別に「メタボリックシンドローム（該当者数・予備群者数・割合）」という項目が設けられており、健診を受診した人の中でメタボ該当者・予備群がどれだけいるかを分けて集計している。これは受診率とは異なり「受診者の健康状態」を映す指標であり、受診率が高い県ほど健康というわけではない点を補足する複合性のある指標である。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ]
    },
    "salt-intake-female-age-adjusted": {
      "proposedBy": "令和6年国民健康・栄養調査結果の概要 第1章「体格及び生活習慣に関する都道府県の状況」（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/content/10900000/001603146.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "同資料は食塩摂取量の男女別平均（男性10.5g、女性8.9g）を示し、健康日本21（第三次）の目標値7gにはいずれも達していないと位置付けている。女性の値を男性と分けて集計することで、対象を分けて見る食習慣の章で性別ごとの目標未達状況を都道府県間で比較できる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ]
    },
    "salt-intake-male-age-adjusted": {
      "proposedBy": "令和6年国民健康・栄養調査結果の概要 第1章「体格及び生活習慣に関する都道府県の状況」（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/content/10900000/001603146.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "同資料は食塩摂取量の全国平均が男性10.5g、女性8.9gと男女で1.6g以上の差があることを示し、都道府県別の年齢調整比較でも上位群・下位群に有意差があるとしている。男性の食塩摂取量は生活習慣病リスクに直結する指標であり、対象を分けて見る食習慣の章で男女別の地域差を読者に示す根拠になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "readerValue"
      ]
    },
    "specific-health-checkup-participation-rate": {
      "proposedBy": "厚生労働省「特定健康診査・特定保健指導に関するデータ」ページ 都道府県別一覧 見出し「特定健康診査（対象者数・受診者数・実施率）」",
      "sourceUrl": "https://www.mhlw.go.jp/stf/newpage_03092.html",
      "surveyedAt": "2026-09-16",
      "rationale": "厚生労働省はこのページで都道府県別一覧のデータを「特定健康診査（対象者数・受診者数・実施率）」という見出しで整理しており、対象者数と受診者数から実施率（受診率）を都道府県ごとに算出する構造になっている。これはテーマの中心的な問い「40〜74歳の特定健診受診率を都道府県間で比較する」に直接対応する代表指標であり、同一の医療保険者報告データに基づくため都道府県間・年度間の比較可能性も担保されている。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ]
    },
    "specific-health-guidance-completion-rate": {
      "proposedBy": "厚生労働省「特定健康診査・特定保健指導に関するデータ」ページ 都道府県別一覧 見出し「特定保健指導（対象者数・終了者数・実施率）」",
      "sourceUrl": "https://www.mhlw.go.jp/stf/newpage_03092.html",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ都道府県別一覧の中で「特定保健指導（対象者数・終了者数・実施率）」という別見出しが設けられており、受診率（特定健診）とは分母・分子の異なる別の実施率として区別して集計されている。受診後に保健指導まで終了した割合を都道府県別に示すため、受診率だけでは見えない「指導の実行段階」を補う指標として、健診受診率と組み合わせて読む価値がある。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ]
    },
    "vegetable-intake-female-age-adjusted": {
      "proposedBy": "令和6年国民健康・栄養調査結果の概要 第1章「体格及び生活習慣に関する都道府県の状況」（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/content/10900000/001603146.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "同資料は野菜摂取量を男性268.6g、女性250.3gと男女別に明示しており、女性の値は男性より約18g少ない。都道府県別の年齢調整比較でも上位群・下位群に有意差があると述べられており、対象を分けて見る食習慣の章で女性の摂取実態を独立して比較する根拠になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ]
    },
    "vegetable-intake-male-age-adjusted": {
      "proposedBy": "令和6年国民健康・栄養調査結果の概要 第1章「体格及び生活習慣に関する都道府県の状況」（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/content/10900000/001603146.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "厚生労働省の結果概要は野菜摂取量を男女別に集計・公表しており、同資料は都道府県別に年齢調整した値で上位群・下位群の間に有意な差があるとしている。男性の値を女性と分けて示すことで、対象を分けて見る食習慣の章で性差の実態を都道府県間比較できる代表的な栄養指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "readerValue"
      ]
    }
  },
  "healthcare": {
    "ambulance-transported-deaths": {
      "proposedBy": "令和7年版 消防白書 附属資料2-5-5「救急自動車による事故種別傷病程度別搬送人員の状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69514.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防庁は搬送人員を初診時の傷病程度別に5区分しており、そのうち死亡は搬送時点で救命に至らなかった件数を示す定義済みの区分である。救急搬送の重篤度構成を把握するうえで、死亡区分は他の区分と切り離して比較できる指標であり、地域の救急対応の結果の一端を示す。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ]
    },
    "ambulance-transported-mild": {
      "proposedBy": "令和7年版 消防白書 附属資料2-5-5「救急自動車による事故種別傷病程度別搬送人員の状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69514.html",
      "surveyedAt": "2026-09-16",
      "rationale": "軽症は入院加療を要しない外来診療にとどまるものと定義されており、消防白書は令和6年中の搬送人員の46.9％が軽症とその他で占められると説明している。軽症搬送の多さは救急車の適正利用の議論に直結するため、地域比較の観点で読者にとって関心の高い区分である。",
      "adoptionCriteria": [
        "readerValue",
        "dataQuality"
      ]
    },
    "ambulance-transported-moderate": {
      "proposedBy": "令和7年版 消防白書 附属資料2-5-5「救急自動車による事故種別傷病程度別搬送人員の状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69514.html",
      "surveyedAt": "2026-09-16",
      "rationale": "中等症は重症・軽症のいずれにも該当しない入院診療を要するものと定義されており、搬送人員のうち最大のボリュームを占める区分である。この定義に基づく区分は、救急搬送の重篤度分布の中間層を把握するうえで他の区分と組み合わせて用いる補完的な指標となる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ]
    },
    "ambulance-transported-other": {
      "proposedBy": "令和7年版 消防白書 附属資料2-5-5「救急自動車による事故種別傷病程度別搬送人員の状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69514.html",
      "surveyedAt": "2026-09-16",
      "rationale": "その他区分は医師の診断を受けなかった搬送や傷病程度不明のケースなどをまとめたものであり、死亡・重症・中等症・軽症のいずれにも分類されない残余を可視化する。この区分を含めることで搬送人員の内訳を漏れなく把握でき、他の傷病程度区分の解釈を補う役割を持つ。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ]
    },
    "ambulance-transported-persons": {
      "proposedBy": "令和7年版 消防白書 附属資料2-5-4「救急自動車による都道府県別事故種別救急搬送人員」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69513.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防庁は消防白書の附属資料として、救急自動車による搬送人員を都道府県別・事故種別に整理して毎年公表しており、令和6年中データは単位を人として都道府県間で直接比較できる形で示されている。この総数は救急医療アクセスの需要規模を表す最も基本的な指標であり、地域の医療アクセスや救急搬送の負荷を把握するテーマの問いに直結する。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ]
    },
    "ambulance-transported-severe": {
      "proposedBy": "令和7年版 消防白書 附属資料2-5-5「救急自動車による事故種別傷病程度別搬送人員の状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69514.html",
      "surveyedAt": "2026-09-16",
      "rationale": "重症は3週間以上の入院加療を要するものと明確に定義されており、救急搬送のうち特に医療資源を要する重篤なケースを切り出して都道府県間で比較できる。この区分は医療供給体制への負荷を測る補完的な指標として、搬送人員全体の内訳を細分化する役割を持つ。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ]
    },
    "annual-emergency-dispatches-per-1000": {
      "proposedBy": "令和6年版 消防白書 第2章第5節1「救急業務の実施状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r6/chapter2/section5/68130.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書は救急出動件数を昭和38年の集計開始以来の過去最多として位置付け、少子高齢化の進展を需要増大の要因として明示している。人口当たりに換算することで、救急搬送体制へのアクセス負荷を都道府県間で比較できる指標となり、地域の医療アクセスの章で緊急時アクセスの側面を補完する。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "高齢化の進む自分の地域では、救急車の出動がどれほど増えているのか。",
      "targetReaderOrDecision": "救急医療体制の逼迫度を確認したい住民や消防・医療の政策担当者。"
    },
    "delivery-clinic-count": {
      "proposedBy": "厚生労働省 令和5年医療施設（静態・動態）調査 全国編 第111表「一般診療所数，分娩の状況・都道府県－指定都市・特別区・中核市（再掲）別」（e-Stat公表）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004024910",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ医療施設調査の第111表は一般診療所（診療所側）の分娩取扱数を都道府県別に集計しており、病院とは異なる開設形態の周産期医療供給を捉える。診療所は病院に比べ小規模で地域密着型の分娩を担うことが多く、病院の指標と組み合わせることで施設種別ごとの供給構造の違いを補完的に示せる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "分娩を取り扱う診療所は病院とどのような比率で存在しているか。",
      "targetReaderOrDecision": "地域の産科医療体制を評価する保健医療政策担当者。"
    },
    "delivery-hospital-count": {
      "proposedBy": "厚生労働省 令和5年医療施設（静態・動態）調査 全国編 第73表「病院数，分娩の状況・都道府県－指定都市・特別区・中核市（再掲）別」（e-Stat公表）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004024872",
      "surveyedAt": "2026-09-16",
      "rationale": "医療施設調査は病院ごとに分娩取扱の有無を都道府県別に集計しており、この第73表が分娩を取り扱う病院数を都道府県単位で比較できる一次資料である。分娩取扱病院数は周産期医療の供給主体のうち病院側の役割を示し、施設の集約・撤退が進む中で地域の出産環境を把握する基礎データとなる。",
      "adoptionCriteria": [
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の県では分娩を取り扱う病院がどれだけ残っているか。",
      "targetReaderOrDecision": "出産・周産期医療の地域アクセスを検討する妊婦や自治体担当者。"
    },
    "general-perinatal-center-count": {
      "proposedBy": "東京都保健医療局「周産期医療とは」（周産期医療体制の解説ページ）",
      "sourceUrl": "https://www.hokeniryo.metro.tokyo.lg.jp/iryo/kyuukyuu/syusankiiryo/syusankiiryotoha",
      "surveyedAt": "2026-09-16",
      "rationale": "総合周産期母子医療センターはM-FICU・NICUを備え、常時母体・新生児搬送を受け入れる高度周産期医療の最上位拠点として都道府県が指定する施設であり、ハイリスク妊娠・分娩への対応力を都道府県間で比較する代表指標となる。分娩取扱施設数だけでは測れない高度医療の受け皿の有無を示す点で、供給の質的側面を補完する。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "ハイリスク分娩に対応できる高度医療拠点は自分の地域にあるか。",
      "targetReaderOrDecision": "周産期医療の重点整備地域を検討する自治体・医療計画担当者。"
    },
    "home-care-worker-annual-income": {
      "proposedBy": "賃金構造基本統計調査令和２年以降 一般_都道府県別_職種（特掲）DB（厚生労働省）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003445758",
      "surveyedAt": "2026-09-16",
      "rationale": "本データベースは賃金構造基本統計調査を「主要産業に雇用される労働者の賃金の実態を明らかにする統計調査」と位置づけ、職種（訪問介護員を含む145の小分類）・都道府県別に賃金を提供している。訪問介護従事者の平均年収は、医療・健康テーマにおける医療人材確保の裏付けとなる待遇水準を都道府県間で比較できる指標であり、医療人材の地域偏在を扱う既存論点を労働条件の面から補完する。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "訪問介護従事者の年収は都道府県によってどれくらい差があるのか。",
      "targetReaderOrDecision": "介護人材の処遇改善策を検討する自治体・事業者向け。"
    },
    "home-helper-users-per-office": {
      "proposedBy": "社会・人口統計体系 都道府県データ「Ｊ 福祉・社会保障」（総務省統計局、表番号0000010210）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010210",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計表は都道府県データの「福祉・社会保障」分野の一項目として「訪問介護利用者数（訪問介護1事業所当たり）」をJ05109というコードで定義しており、1975年度から2023年度まで都道府県別に長期時系列で収録している。事業所総数ではなく1事業所当たりの利用者数を示すため、地域ごとの訪問介護サービスの供給密度・事業所規模を比較する補助指標として、医療・健康テーマの「地域の医療アクセス」や「訪問診療と訪問看護の実施」の章を補完する位置づけになる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の住む都道府県の訪問介護事業所は、全国と比べて多くの利用者を抱えて運営されているのか。",
      "targetReaderOrDecision": "在宅介護サービスの供給体制を地域比較したい行政・介護事業者向け。"
    },
    "home-medical-visit-cases": {
      "proposedBy": "厚生労働省 令和5年医療施設（静態・動態）調査 全国編 第166表「一般診療所数（重複計上）；実施件数，在宅医療サービス・開設者・病床の有無別」（e-Stat公表）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004026440",
      "surveyedAt": "2026-09-16",
      "rationale": "医療施設調査は在宅患者訪問診療の実施件数を病院・一般診療所別、開設者別に集計しており、入院・外来とは異なる在宅医療の実施量を都道府県ごとに比較できる。在宅患者訪問診療の件数は、高齢化に伴い需要が増す在宅医療体制の実際の稼働状況を示す指標として、施設数だけでは分からない利用実態を補完する。",
      "adoptionCriteria": [
        "comparability",
        "readerValue"
      ],
      "readerQuestion": "自分の地域で訪問診療がどの程度の件数実施されているか。",
      "targetReaderOrDecision": "在宅医療の受け皿を評価する高齢者・家族や在宅医療政策担当者。"
    },
    "k6-score10plus-rate-12plus": {
      "proposedBy": "国民生活基礎調査 健康02「世帯人員（12歳以上），悩みやストレスの有－悩みやストレスの原因（複数回答）－無・こころの状態（点数階級）・性別」（厚生労働省）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0002040959",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計表は国民生活基礎調査の健康票で、12歳以上の世帯人員についてK6の「こころの状態（点数階級）」を集計していることを示しており、同調査は保健・医療・福祉に関する国民生活の基礎資料を得ることを目的とした基幹統計である。K6が10点以上の割合は心理的苦痛を抱える人の推定割合を表し、身体的な医療資源・アウトカムだけでなく、医療・健康テーマの「こころの状態と相談・受療」の章でメンタルヘルス面から地域差を捉える指標として位置づけられる。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality",
        "complementarity"
      ],
      "readerQuestion": "自分の住む都道府県で心理的苦痛を感じている人（K6が10点以上）はどれくらいの割合いるのか。",
      "targetReaderOrDecision": "地域のメンタルヘルス施策を検討する自治体・保健関係者向け。"
    },
    "medical-physicians-age-40-59": {
      "proposedBy": "令和6(2024)年医師・歯科医師・薬剤師統計の概況 全体概況「1 医師」年齢階級別医師数（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/ishi/24/dl/R06_1gaikyo.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "統計概況は40〜59歳にあたる「40～49歳」「50～59歳」の各階級が全体の約2割ずつを占めることを示しており、この中堅層は診療の中核を担う世代として位置付けられている。40〜59歳の医師数を都道府県別に見ることで、地域医療を支える中核世代の厚みを比較でき、40歳未満・60歳以上の各層と合わせて年齢構成の全体像を補完する。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "地域医療の中核を担う40〜59歳の医師はどれくらいいるか。",
      "targetReaderOrDecision": "地域医療の中核世代の厚みを比較したい読者。"
    },
    "medical-physicians-obstetrics-gynecology": {
      "proposedBy": "令和6(2024)年医師・歯科医師・薬剤師統計の概況 全体概況「1 医師」主たる診療科別医師数（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/ishi/24/dl/R06_1gaikyo.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "統計概況は産婦人科と産科を区別しつつ、合計人数も併記しており、出産や周産期医療を支える医師層として個別に把握されている。産婦人科系の医師数を都道府県別に比較することで、出産できる施設の供給や周産期医療体制の地域差を捉える手がかりとなり、小児科・救急科とともに政策上特に確保が求められる診療科の偏在を示す指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の都道府県で出産を診てもらえる産婦人科医はどれくらいいるか。",
      "targetReaderOrDecision": "出産・周産期医療の体制を確認したい妊産婦や自治体担当者。"
    },
    "medical-physicians-pediatrics": {
      "proposedBy": "令和6(2024)年医師・歯科医師・薬剤師統計の概況 全体概況「1 医師」主たる診療科別医師数（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/ishi/24/dl/R06_1gaikyo.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "統計概況は主たる診療科別に医師数を集計しており、小児科はその中の主要な区分の一つとして個別に人数が示されている。小児科は子どもの受診アクセスに直結する診療科であり、都道府県別の小児科医師数を比較することで、地域ごとの小児医療提供体制の厚みの違いを把握でき、産婦人科・救急科と並ぶ政策上重要な診療科偏在の論点を補完する。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の都道府県で子どもを診てもらえる小児科医はどれくらいいるか。",
      "targetReaderOrDecision": "子育て世帯や自治体の小児医療体制の担当者。"
    },
    "medical-physicians-under-40": {
      "proposedBy": "令和6(2024)年医師・歯科医師・薬剤師統計の概況 全体概況「1 医師」年齢階級別医師数（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/ishi/24/dl/R06_1gaikyo.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "厚生労働省の統計概況は医師を年齢階級別に集計しており、若手医師（30〜39歳など）が医師全体の中でどの程度の割合を占めるかを示している。40歳未満の医師数はこの若手層の厚みを都道府県別に比較でき、将来の医療人材供給力や後継世代の分布を把握する指標として、医療人材の章の中で年代構成を捉える基礎資料となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の都道府県には若手医師がどれくらいいるか。",
      "targetReaderOrDecision": "地域の将来的な医師供給力を見たい読者。"
    },
    "municipal-mental-health-consultation-extended-persons": {
      "proposedBy": "地域保健・健康増進事業報告 統計表「市区町村が実施した精神保健福祉相談等の被支援実人員－延人員，都道府県－指定都市・特別区－中核市－その他政令市、相談等の種類別」（厚生労働省）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/files?stat_infid=000040423490",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計表は、市区町村が実施した精神保健福祉相談等の延人員を都道府県単位（指定都市・特別区・中核市・その他政令市の別）と相談等の種類別に集計するものであり、地域保健・健康増進事業報告は「地域住民の健康の保持や増進のために保健所や市区町村が行う保健施策について把握し、国や地方公共団体が今後実施する施策を効率的・効果的に推進するための基礎資料を得ること」を目的とした全国統一調査として毎年度実施されている。医療機関の受療ではなく市区町村窓口での精神保健相談の利用実績を捉える指標であり、こころの状態と相談・受療という章の論点において、医療供給側の指標（医師数・病床数）とは異なる、住民が身近な行政窓口で受けた精神保健相談の実施状況という角度からテーマを補完する。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の住む都道府県では、市区町村の精神保健福祉相談はどれくらい利用されているか。",
      "targetReaderOrDecision": "地域の精神保健福祉相談体制の利用実態を把握したい自治体職員・住民。"
    },
    "new-cancer-incidence-count": {
      "proposedBy": "「2023年全国がん登録罹患数・率報告」の結果について（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/stf/newpage_68548.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この報道発表は全国がん登録に基づく新規罹患数と年齢調整罹患率を公表し、全ての病院・指定診療所からの診断情報を登録・管理する仕組みであることを説明している。がんは主要死因の一つであり、罹患数の都道府県比較は死亡数だけでは捉えられない疾病負荷の実態を示すため、医療・健康テーマの「がんの新規罹患と疾病の死亡」の章で死亡指標を補完する一次データとなる。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の住む都道府県で新たにがんと診断される人はどれくらいいるのか、全国と比べて多いのか少ないのか。",
      "targetReaderOrDecision": "地域のがん対策・検診体制を検討する保健医療関係者向け。"
    },
    "regional-perinatal-center-count": {
      "proposedBy": "東京都保健医療局「周産期医療とは」（周産期医療体制の解説ページ）",
      "sourceUrl": "https://www.hokeniryo.metro.tokyo.lg.jp/iryo/kyuukyuu/syusankiiryo/syusankiiryotoha",
      "surveyedAt": "2026-09-16",
      "rationale": "地域周産期母子医療センターは総合センターほどの高度集中治療設備は持たないが、産科・小児科を備え比較的高度な周産期医療を常時担う施設として都道府県が別枠で認定しており、総合センターとは異なる中間的な医療圏の受け皿の広がりを示す。両区分を分けて比較することで、地域の周産期医療網の階層構造が把握できる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "総合センターを補完する中核的な周産期医療施設はどれだけ整備されているか。",
      "targetReaderOrDecision": "周産期医療圏の階層的な整備状況を確認したい医療計画担当者。"
    }
  },
  "labor-mobility": {
    "commuter-ratio-to-other-municipalities": {
      "proposedBy": "令和2年国勢調査 従業地・通学地による人口・就業状態等集計結果 結果の概要（総務省統計局）",
      "sourceUrl": "https://www.stat.go.jp/data/kokusei/2020/kekka/pdf/outline_04.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "国勢調査の結果概要は、他市区町村・他県への通勤通学者比率を都道府県間で比較し、大都市圏近郊の県で顕著に高いことを示す代表的な地域指標として扱っている。この比率は職住が同一市区町村内で完結しない働き方の広がりを表し、通勤・昼間人口の章で就業異動や職業紹介圏の広さを読み解く土台になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "自分の県では、他の市区町村や県外へ通勤・通学する人の割合はどのくらいか。",
      "targetReaderOrDecision": "都市圏の通勤圏設定や広域交通政策を検討する自治体・国土交通担当者。"
    },
    "employees-weekly-hours-60plus-rate": {
      "proposedBy": "令和4年版 労働経済の分析 第1部第3章「労働時間・賃金等の動向」（厚生労働省）",
      "sourceUrl": "https://www.mhlw.go.jp/stf/wp/hakusyo/roudou/21/1-3.html",
      "surveyedAt": "2026-09-16",
      "rationale": "労働経済白書は週60時間以上就労する雇用者の割合を長時間労働是正の進捗を示す代表的な指標として位置付け、働き方改革関連法の施行前後で男女別・年次別に比較している。この割合を都道府県別に見ることで、長時間就業の是正が地域でどこまで進んでいるかを、労働時間や人手不足の章と結び付けて評価できる。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "週60時間以上働く雇用者の割合は、地域や年によってどう変化しているか。",
      "targetReaderOrDecision": "長時間労働是正の政策効果を地域別に把握したい労働行政の担当者。"
    },
    "monthly-average-actual-working-hours-female": {
      "proposedBy": "統計FAQ 16D-Q01「平均的な就業時間」（総務省統計局）",
      "sourceUrl": "https://www.stat.go.jp/library/faq/faq16/faq16d01.html",
      "surveyedAt": "2026-09-16",
      "rationale": "統計局のFAQは、平均的な就業時間を捉える調査として労働力調査と並び毎月勤労統計調査の月間実労働時間数を挙げており、これが働き方の実態を測る公式な指標であることを裏付けている。女性の実労働時間を都道府県別・時系列で見ることで、非正規雇用や短時間就業の広がりが地域の労働時間水準にどう反映されているかを、他の雇用指標と組み合わせて補完的に読み解ける。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "女性の月間実労働時間数は、地域や年によってどのように変化しているか。",
      "targetReaderOrDecision": "女性の働き方や労働時間の地域差を調べたい研究者・自治体の男女共同参画担当者。"
    },
    "non-regular-employment-rate": {
      "proposedBy": "平成27年版男女共同参画白書 第1部 コラム「地域における男女の仕事と暮らし」（内閣府男女共同参画局）",
      "sourceUrl": "https://www.gender.go.jp/about_danjo/whitepaper/h27/zentai/html/honpen/b1_s00_03.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この白書は総務省「就業構造基本調査」を用いて、有業者に占める正規雇用割合（裏返せば非正規雇用割合）が都道府県によって10ポイント以上開くことを示している。これは非正規雇用率が地域間で大きく異なる代表的な指標であることを裏付け、「非正規雇用と雇用の安定性」章での都道府県比較の根拠となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "readerValue"
      ],
      "readerQuestion": "自分の県の非正規雇用率は全国的に見て高い方か低い方か。",
      "targetReaderOrDecision": "地域の雇用の安定性を比較したい読者・自治体の雇用政策担当者。"
    },
    "nonregular-continuation-wish-rate": {
      "proposedBy": "平成18年度 年次経済財政報告（経済財政白書）第1節「雇用の変化とその影響」（内閣府）",
      "sourceUrl": "https://www5.cao.go.jp/j-j/wp/wp-je06/06-00301.html",
      "surveyedAt": "2026-09-16",
      "rationale": "経済財政白書は非正規雇用者本人が現在の就業形態の継続を希望する割合を政府統計から取り上げ、性別・年齢層によって大きく異なることを示している。この論点は、非正規雇用者数や非正規雇用率だけでは分からない「働き方への満足度・安定志向」という角度を補い、非正規雇用と雇用の安定性章の解釈に厚みを与える。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "非正規で働く人のうち、今の働き方を続けたいと考えている人はどれくらいいるのか。",
      "targetReaderOrDecision": "非正規雇用の質や安定性を数だけでなく本人の意向から読み取りたい読者。"
    },
    "nonregular-employees-count": {
      "proposedBy": "令和4年版男女共同参画白書 第1部第2節「就業」（内閣府男女共同参画局）",
      "sourceUrl": "https://www.gender.go.jp/about_danjo/whitepaper/r04/zentai/html/honpen/b1_s02_01.html",
      "surveyedAt": "2026-09-16",
      "rationale": "白書は非正規雇用労働者の実数を男女別に示しており、割合だけでなく絶対数の把握が政策議論で重視されていることを裏付ける。都道府県別の非正規の職員・従業員数は、人口規模の異なる地域間で非正規雇用の「量」を比較する補完指標として、率指標である非正規雇用率と組み合わせて読む価値がある。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "自分の県には非正規で働く人が実際に何人くらいいるのか。",
      "targetReaderOrDecision": "地域の非正規雇用の規模を実数で把握したい読者。"
    },
    "nonregular-job-change-wish-rate": {
      "proposedBy": "平成9年就業構造基本調査 用語の解説「転職希望者」（総務省統計局）",
      "sourceUrl": "https://www.stat.go.jp/data/shugyou/1997/4.html",
      "surveyedAt": "2026-09-16",
      "rationale": "就業構造基本調査の用語解説は「転職希望者」を、現在の仕事を続けながら別の仕事も持ちたい「追加就業希望者」と明確に区別し、現職を離れて他の仕事に移ることを望む人と定義している。非正規雇用者に限ってこの割合を見ることで、非正規という雇用形態そのものへの不満や不安定さが仕事の移動意欲にどう表れているかを、離職・転職を扱うテーマの問いに直接結び付けて読み解ける。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "非正規雇用で働く人のうち、どれくらいの人が今の仕事を辞めて別の仕事に変わりたいと考えているか。",
      "targetReaderOrDecision": "非正規雇用の待遇改善策や正社員転換支援策を検討する地方自治体の労働政策担当者。"
    }
  },
  "living-housing": {
    "average-persons-per-general-household": {
      "proposedBy": "政府統計の総合窓口 e-Stat「社会・人口統計体系 都道府県データ」社会生活統計指標 A 人口・世帯（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010201",
      "surveyedAt": "2026-09-16",
      "rationale": "社会・人口統計体系は都道府県別に「一般世帯の平均人員」を単位「人」で整備しており、世帯規模の地域差を同一基準で比較できる指標として位置付けている。持ち家・借家の1住宅当たり延べ面積と組み合わせることで、住戸の広さを世帯人員あたりの水準として読み替えられ、どれくらいの広さに住むかという章の問いを補強する。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "この都道府県の一般世帯は平均して何人で暮らしているのか。",
      "targetReaderOrDecision": "住宅の広さや世帯構成の変化を地域比較したい読者が基準となる世帯規模を確認する場面。"
    },
    "earthquake-renovation-rate": {
      "proposedBy": "令和5年住宅・土地統計調査の結果の概要（茨城県企画部統計課、令和5年住宅・土地統計調査結果）",
      "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/zyutaku/zyu-tochi-r05/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "耐震改修工事の実施割合は資料内でリフォーム工事全般とは別に単独項目として集計されており、住宅ストックの防災上の安全性という、広さや所有形態とは異なる質的側面を補完する指標として位置付けられている。低い実施率が全国的傾向であることも比較の材料になる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "持ち家の耐震改修はどの程度進んでいるのか、地域によって差があるのか。",
      "targetReaderOrDecision": "防災・住宅政策を担当する自治体職員。"
    },
    "housing-land-debt-per-household": {
      "proposedBy": "2019年全国家計構造調査 家計資産・負債に関する結果 都道府県表（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003426515",
      "surveyedAt": "2026-09-16",
      "rationale": "全国家計構造調査の都道府県別集計は、資産・負債の種類を「住宅・土地のための負債」と「住宅・土地以外の負債」に区分して1世帯当たり負債現在高を示しており、住宅取得に伴う負債だけを切り出して都道府県間で比較できる。持ち家率や住宅取得の実態と合わせて読むことで、住まいを取得する際の負債負担の地域差を捉える指標となる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "この都道府県の世帯は住宅・土地のためにどれくらいの負債を抱えているのか。",
      "targetReaderOrDecision": "住宅取得を検討する読者や住宅政策担当者が地域の負債水準を把握する場面。"
    },
    "new-condo-starts": {
      "proposedBy": "建築着工統計調査報告（令和5年計分）報道発表資料（国土交通省総合政策局情報政策課建設経済統計調査室）",
      "sourceUrl": "https://www.mlit.go.jp/report/press/joho04_hh_001203.html",
      "surveyedAt": "2026-09-16",
      "rationale": "国土交通省の建築着工統計調査報告は、新設住宅着工を持家・貸家・分譲住宅など利用関係別に区分して全体の増減要因を説明しており、分譲住宅の着工動向が新設住宅市場全体の変化を左右する主要因の一つとして扱われている。これは住宅ストックが今後どう増えていくかという将来側面を、既存ストックの空き家・広さの指標に補う位置付けとなる。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "分譲住宅の新設着工はここ数年で増えているのか減っているのか。",
      "targetReaderOrDecision": "住宅市場の供給動向を分析する事業者・政策担当者。"
    },
    "new-housing-starts": {
      "proposedBy": "国土交通省 報道発表資料「建築着工統計調査報告（令和6年度計分）」（国土交通省）",
      "sourceUrl": "https://www.mlit.go.jp/report/press/joho04_hh_001299.html",
      "surveyedAt": "2026-09-16",
      "rationale": "国土交通省の建築着工統計調査は新設住宅着工戸数を毎年度公表しており、住宅ストックへの新規フローの総量を示す代表指標である。住宅ストックは余っているかという章の問いに対し、既存ストックの空き家率と対比させることで供給側の動きを把握する土台になる。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ],
      "readerQuestion": "自分の地域では新しい住宅がどれくらい建てられているのか。",
      "targetReaderOrDecision": "住宅市場の需給動向を把握したい行政・事業者・住民"
    },
    "new-owner-occupied-starts": {
      "proposedBy": "国土交通省 報道発表資料「建築着工統計調査報告（令和6年度計分）」（国土交通省）",
      "sourceUrl": "https://www.mlit.go.jp/report/press/joho04_hh_001299.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この報道発表は新設住宅着工戸数を持家・貸家・分譲住宅の利用関係別に分けて増減を説明しており、持家着工数は持ち家取得という住まい方の選択を示す内訳指標である。貸家着工数と対比することで、住宅着工の利用関係別比較の章が問う「持家と貸家のどちらが増えているか」に直接答えられる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "自分の地域では持家の新築がどれくらい増減しているのか。",
      "targetReaderOrDecision": "持家取得を検討する世帯や住宅供給を計画する事業者"
    },
    "new-rental-starts": {
      "proposedBy": "国土交通省 報道発表資料「建築着工統計調査報告（令和6年度計分）」（国土交通省）",
      "sourceUrl": "https://www.mlit.go.jp/report/press/joho04_hh_001299.html",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ報道発表は貸家着工戸数の増減を持家と並べて示しており、賃貸住宅供給の動向を表す内訳指標である。持家着工数との対比によって、単身化や世帯構成の変化に伴う賃貸需要の高まりが供給側にどう反映されているかを、住宅着工の利用関係別比較の章で確認できる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "自分の地域では賃貸住宅の新築がどれくらい増減しているのか。",
      "targetReaderOrDecision": "賃貸住宅の供給動向を把握したい事業者・入居検討者"
    },
    "renovation-rate": {
      "proposedBy": "令和5年住宅・土地統計調査の結果の概要（茨城県企画部統計課、令和5年住宅・土地統計調査結果）",
      "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/zyutaku/zyu-tochi-r05/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "持ち家における増改築・改修工事の実施割合を全国共通の調査基準で示すもので、住宅ストックの更新・維持がどの程度進んでいるかを表す指標として資料に登場する。空き家率や延べ面積といったストック量の指標を補い、既存住宅の質的な更新状況という別角度からテーマを支える。",
      "adoptionCriteria": [
        "complementarity",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "持ち家のリフォームはどの程度進んでいるのか、地域差はあるか。",
      "targetReaderOrDecision": "住宅リフォーム需要を分析する事業者や住宅政策担当者。"
    },
    "single-households-age65plus-female": {
      "proposedBy": "令和6年版高齢社会白書 第1章第1節3「家族と世帯」（内閣府）",
      "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_1_3.html",
      "surveyedAt": "2026-09-16",
      "rationale": "同白書は女性の一人暮らし高齢者の割合が男性より高く、令和2年時点で22.1％、将来は29.3％まで上昇すると見込んでいることを示している。女性の単独世帯数を都道府県別に比較することで、高齢期の一人暮らしという単身化の実態を男女差込みで把握でき、世帯構成の変化を読む章の中心的な補完材料となる。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "この都道府県では65歳以上の女性で一人暮らしをしている人がどれくらいいるのか。",
      "targetReaderOrDecision": "高齢者福祉・見守り施策を検討する自治体職員が単身高齢女性の規模を把握する場面。"
    },
    "single-households-age65plus-male": {
      "proposedBy": "令和6年版高齢社会白書 第1章第1節3「家族と世帯」（内閣府）",
      "sourceUrl": "https://www8.cao.go.jp/kourei/whitepaper/w-2024/html/zenbun/s1_1_3.html",
      "surveyedAt": "2026-09-16",
      "rationale": "高齢社会白書は65歳以上の一人暮らしの者の割合を男女別に示し、令和2年時点で男性15.0％、将来は26.1％まで上昇すると見込んでいる。男性の単独世帯数を都道府県別に見ることで、単身化が進む世帯構成の変化を男女別に比較でき、住む世帯はどう変わるかという章の問いに直接つながる。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "この都道府県では65歳以上の男性で一人暮らしをしている人がどれくらいいるのか。",
      "targetReaderOrDecision": "高齢者福祉・見守り施策を検討する自治体職員が単身高齢男性の規模を把握する場面。"
    },
    "vacant-housing-excluding-rental-sale-secondary": {
      "proposedBy": "令和5年住宅・土地統計調査の結果の概要（茨城県企画部統計課、令和5年住宅・土地統計調査結果）",
      "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/zyutaku/zyu-tochi-r05/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "賃貸・売却用や別荘等の二次的住宅を除いた、いわゆる放置される可能性の高い空き家の増減を示す指標として資料内で個別に集計・報告されている。これは市場に出回らない空き家問題（老朽化・管理不十分な空き家）を捉える点で、賃貸用の空き家とは異なる角度からの補完的な指標である。",
      "adoptionCriteria": [
        "complementarity",
        "comparability",
        "readerValue"
      ],
      "readerQuestion": "市場に出ていない、管理が行き届いていない可能性のある空き家はどれだけ増えているか。",
      "targetReaderOrDecision": "空き家の管理・除却政策を検討する自治体担当者。"
    },
    "vacant-housing-for-rent": {
      "proposedBy": "令和5年住宅・土地統計調査の結果の概要（茨城県企画部統計課、令和5年住宅・土地統計調査結果）",
      "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/zyutaku/zyu-tochi-r05/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "空き家全体の内訳として賃貸用の空き家が最大比率を占めることを示す資料であり、空き家率という総量指標だけでは見えない空き家の用途構成を補う位置付けになっている。賃貸市場の供給過剰の程度を都道府県間で比較する際の内訳指標として機能する。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "空き家のうちどれだけが賃貸用として供給過剰になっているのか。",
      "targetReaderOrDecision": "賃貸住宅市場の需給を分析する不動産事業者・自治体担当者。"
    },
    "vacant-housing-for-sale": {
      "proposedBy": "政府統計の総合窓口 e-Stat「項目定義」H 居住（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/H",
      "surveyedAt": "2026-09-16",
      "rationale": "住宅・土地統計調査は空き家を賃貸用・売却用・二次的住宅・その他に区分しており、売却用の空き家は新築・中古を問わず市場に出ている流通可能な空き家ストックを示す。持ち家率・空き家率という総量指標だけでは見えない「売却可能な余剰住宅」の地域差を捉えられるため、住宅ストックの余り方を問うテーマの補完指標として位置付けられる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "この都道府県では空き家のうちどれだけが売却待ちの住宅なのか。",
      "targetReaderOrDecision": "空き家対策や不動産流通の担当者が地域の流通可能な空き家量を把握する場面。"
    },
    "vacant-housing-rate": {
      "proposedBy": "令和5年住宅・土地統計調査の結果の概要（茨城県企画部統計課、令和5年住宅・土地統計調査結果）",
      "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/zyutaku/zyu-tochi-r05/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "総務省が実施する住宅・土地統計調査の結果を都道府県が公式に解説したもので、総住宅数に占める空き家の割合を前回調査と比較する形で示している。この定義・比較方法は全国共通であり、都道府県間で住宅ストックの余剰度を比較する際の基準指標として使われることを示している。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県の住宅ストックはどれだけ余っているか、他県と比べて空き家率は高いのか。",
      "targetReaderOrDecision": "住宅政策担当者や空き家対策を検討する自治体職員。"
    },
    "vacant-housing-secondary-residences": {
      "proposedBy": "政府統計の総合窓口 e-Stat「項目定義」H 居住（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/H",
      "surveyedAt": "2026-09-16",
      "rationale": "二次的住宅（別荘等）は週末や休暇時の保養目的で保有され、ふだんは人が住んでいない住宅と定義され、売却用・賃貸用の空き家とは利用動機が異なる。空き家全体を性質別に分解することで、住宅ストックの余剰が「流通待ち」なのか「保養用の保有」なのかを区別でき、既存の空き家率指標を補完する。",
      "adoptionCriteria": [
        "complementarity"
      ],
      "readerQuestion": "この都道府県の空き家のうち、別荘のように保養目的で保有されている住宅はどれくらいか。",
      "targetReaderOrDecision": "観光地・別荘地を抱える自治体が住宅ストックの性質を把握する場面。"
    }
  },
  "local-economy": {
    "employment-location-quotient-health-welfare": {
      "proposedBy": "地域の経済2011 第3章第2節1「各地域の生産と産業構造の変遷」（内閣府）",
      "sourceUrl": "https://www5.cao.go.jp/j-j/cr/cr11/chr11030201.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この内閣府資料は「特化係数でみた産業構造の特徴」という見出しの下で各地域の産業別特化度を分析しており、医療・福祉は高齢化が進む地域ほど就業の受け皿として比重が高まりやすい業種であるため、全国平均比でどれだけ特化しているかを示すことは、地域の所得形成の基盤を支える産業構成を読み解く上で読者への実用的な材料になる。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "高齢化が進む地域で医療・福祉は雇用の受け皿としてどれだけ全国平均より特化しているか。",
      "targetReaderOrDecision": "地域の医療・介護人材需給や産業構造の変化を把握したい住民・自治体担当者。"
    },
    "employment-location-quotient-information-communication": {
      "proposedBy": "地域の経済2011 第3章第2節1「各地域の生産と産業構造の変遷」（内閣府）",
      "sourceUrl": "https://www5.cao.go.jp/j-j/cr/cr11/chr11030201.html",
      "surveyedAt": "2026-09-16",
      "rationale": "同資料は特化係数を「産業構造がどの分野に偏っているかを表す」指標と説明しており、情報通信業のように東京圏への集積が指摘される業種では、就業者数の実数比較だけでは捉えにくい地域間の偏りを、全国平均を基準とした比率で示せる点に意義がある。既存の就業者産業構成の論点を補完し、成長産業への特化度という別角度からの比較材料になる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "情報通信業の集積は自分の地域でどの程度進んでいるか、全国平均と比べて多いのか少ないのか。",
      "targetReaderOrDecision": "デジタル産業誘致や人材誘致策を検討する地域政策担当者。"
    },
    "employment-location-quotient-manufacturing": {
      "proposedBy": "地域の経済2011 第3章第2節1「各地域の生産と産業構造の変遷」（内閣府）",
      "sourceUrl": "https://www5.cao.go.jp/j-j/cr/cr11/chr11030201.html",
      "surveyedAt": "2026-09-16",
      "rationale": "内閣府の地域経済分析は、特化係数を「地域が全国平均の産業構造と比べてどの産業に特化しているか」を測る指標として位置付けており、製造業はこの資料が実際に取り上げる業種区分（繊維・化学・機械類など）を含む代表的な対象である。地域経済テーマで「どの産業で働いているか」を全国基準と比較して読み解くには、単なる就業者構成比だけでなく、全国平均を基準とした偏りの大きさを示す特化係数が補完的な視点を与える。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "自分の都道府県は製造業に強く特化しているのか、それとも全国平均並みなのか。",
      "targetReaderOrDecision": "地域の産業誘致や雇用政策を検討する自治体職員・事業者。"
    },
    "enterprise-net-value-added-all-industries": {
      "proposedBy": "令和3年経済センサス-活動調査 用語の解説（大阪府）",
      "sourceUrl": "https://www.pref.osaka.lg.jp/o040090/toukei/e-census/r3_census_yougo_.html",
      "surveyedAt": "2026-09-16",
      "rationale": "経済センサス‐活動調査の用語解説は純付加価値額を売上から費用総額を差し引き給与総額と租税公課を加えた額と定義しており、これは企業等（本所）単位で集計される値である。全産業の企業純付加価値額は、本社機能が立地する都道府県にどれだけの企業活動から生み出された価値が集約されているかを示すため、事業所の実態を按分する後者の指標とは異なる角度から地域への価値の帰属を捉える指標になる。",
      "adoptionCriteria": [
        "dataQuality",
        "complementarity"
      ],
      "readerQuestion": "本社機能が集まる都道府県では、企業活動から生み出された付加価値がどれだけ集約されているか。",
      "targetReaderOrDecision": "企業誘致や本社機能立地の効果を検討する自治体・投資関係者。"
    },
    "private-establishment-net-value-added": {
      "proposedBy": "令和3年経済センサス-活動調査 用語の解説（大阪府）",
      "sourceUrl": "https://www.pref.osaka.lg.jp/o040090/toukei/e-census/r3_census_yougo_.html",
      "surveyedAt": "2026-09-16",
      "rationale": "用語解説は純付加価値を「生産活動によって新たに生み出された価値」と定義しており、この値を実際に事業が行われている事業所の所在地に按分して集計することで、本社所在地に偏らず、実際の生産活動が行われる現場ベースで地域の稼ぐ力を比較できる。企業純付加価値額（本所ベース）と対にすることで、本社集約分と現場分の両面から地域経済への価値配分を読み解ける。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "自分の地域に実際にある事業所は、どれだけの付加価値を生み出しているか。",
      "targetReaderOrDecision": "地域産業の実際の稼ぐ力を把握したい住民や地域経済分析の実務者。"
    }
  },
  "local-finance": {
    "avg-age-admin-prefecture": {
      "proposedBy": "総務省「地方公務員給与実態調査」調査目的（政府統計の総合窓口 e-Stat 統計表情報）",
      "sourceUrl": "https://www.e-stat.go.jp/statistics/00200211",
      "surveyedAt": "2026-09-16",
      "rationale": "本調査は地方公務員の給与実態を明らかにし、給与制度の基礎資料を得ることを目的としており、都道府県別比較表では一般行政職について平均年齢を平均給与月額と並べて公表している。平均年齢は職員構成の高齢化・若返りの度合いを示し、将来の退職手当や昇給に伴う人件費の見通しを左右するため、給与水準（平均給与月額）だけでは捉えられない負担構造の側面を補う指標である。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "都道府県の一般行政職員の年齢構成はどう異なるか。",
      "targetReaderOrDecision": "将来の人件費負担の見通しを立てたい財政担当者・読者。"
    },
    "avg-salary-admin-prefecture": {
      "proposedBy": "総務省「地方公務員給与実態調査」地方公共団体別給与等の比較(1)ラスパイレス指数及び平均年齢・平均給与月額等 都道府県（政府統計の総合窓口 e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003132176",
      "surveyedAt": "2026-09-16",
      "rationale": "地方公務員給与実態調査の都道府県別比較表は、全職種・一般職員に続いて「一般職員のうち一般行政職」を独立した職員区分として設け、平均給与月額を都道府県ごとに比較できる形で公表している。これは職種横断の平均値では見えない一般行政職固有の給与水準を示し、テーマの章「行政部門の職員数と職種別給与」において人件費の地域差を職種別に把握するための基準的な指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "都道府県の一般行政職員の給与水準はどの程度か。",
      "targetReaderOrDecision": "都道府県の人件費・職員給与を職種別に比較したい読者。"
    },
    "avg-salary-education-prefecture": {
      "proposedBy": "総務省「地方公務員給与実態調査」調査目的（政府統計の総合窓口 e-Stat 統計表情報）",
      "sourceUrl": "https://www.e-stat.go.jp/statistics/00200211",
      "surveyedAt": "2026-09-16",
      "rationale": "本調査は地方公務員給与の実態把握と制度の基礎資料整備を目的とし、都道府県別比較表では教育公務員を一般行政職・警察職と並ぶ独立した職員区分として平均給与月額を公表している。教育公務員は都道府県人件費の中で大きな比重を占める職種であり、一般行政職の給与水準と並べて比較することで、テーマの章「行政部門の職員数と職種別給与」における職種間の給与差を捉える補完的な指標となる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "都道府県の教育公務員の給与水準は一般行政職と比べてどう違うか。",
      "targetReaderOrDecision": "教員給与を含む都道府県人件費の構造を理解したい読者。"
    },
    "child-rearing-allowance-recipients": {
      "proposedBy": "用語の定義 J1401 児童扶養手当受給者数（福祉行政報告例－社会福祉行政業務報告－、厚生労働省政策統括官付参事官付行政報告統計室）",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/J",
      "surveyedAt": "2026-09-16",
      "rationale": "厚生労働省の福祉行政報告例に基づく定義は、児童扶養手当受給者数がひとり親家庭等に対する現金給付制度の年度末利用実績であることを明示している。歳出側の児童福祉費・児童福祉費割合が支出の規模を示すのに対し、この指標は給付を受ける世帯・児童の実人数という需要側の指標であり、「児童福祉への支出と公的給付」の章で支出と受給実態を突き合わせる補完材料になる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality",
        "readerValue"
      ],
      "readerQuestion": "この都道府県でひとり親家庭等が児童扶養手当をどれだけ受給しているか。",
      "targetReaderOrDecision": "児童福祉費の支出規模と実際の受給者数を突き合わせたい読者。"
    },
    "child-welfare-expenses-prefecture": {
      "proposedBy": "地方財政の状況（総務省、令和7年3月）第1部 4 地方経費の内容「目的別歳出」民生費",
      "sourceUrl": "https://www.soumu.go.jp/main_content/000998475.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "地方財政白書は目的別歳出のうち民生費の内訳として児童福祉費の決算額と前年度比の増減を示しており、都道府県においても児童福祉費は民生費の中で大きな構成比を占める費目として扱われている。児童福祉費の実額を把握することは「児童福祉への支出と公的給付」の章で都道府県間の子育て関連支出の規模を比較する出発点になる。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ],
      "readerQuestion": "この都道府県は児童福祉にどれだけの決算額を支出しているか。",
      "targetReaderOrDecision": "子育て関連の財政支出規模を都道府県ごとに把握したい読者。"
    },
    "maintenance-repair-expenses-prefecture": {
      "proposedBy": "地方財政の状況（総務省、令和7年3月）第1部 4 地方経費の内容「性質別歳出」",
      "sourceUrl": "https://www.soumu.go.jp/main_content/000998475.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "地方財政白書は維持補修費を「地方公共団体が管理する施設等の維持に要する経費」と定義し、決算額と前年度比の増減を毎年公表している。投資的経費（新規整備）と対になる既存施設の維持管理コストを示す指標であり、「公共施設の量と維持・建設への支出」の章で施設の老朽化対応に係る財政負担を都道府県間・経年で比較する材料になる。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "この都道府県は既存の公共施設の維持管理にどれだけ歳出を割いているか、それは増加傾向にあるか。",
      "targetReaderOrDecision": "公共施設の老朽化対応コストを地域間・時系列で比較したい読者。"
    },
    "ordinary-construction-expenses-prefecture": {
      "proposedBy": "政府統計の総合窓口 e-Stat「項目の定義」D 行政基盤 D310406 普通建設事業費（都道府県財政）（総務省・社会・人口統計体系）",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/D",
      "surveyedAt": "2026-09-16",
      "rationale": "この定義は普通建設事業費を「公共又は公用施設の新増設・更新等に要する経費」と明確に位置付けており、都道府県が道路・庁舎・学校等の施設整備にどれだけ歳出を投じているかを示す代表的な投資的経費の指標である。テーマ「公共施設の量と維持・建設への支出」の章において、支出額の面から施設整備の実態を把握するために直接必要な指標であり、他の経常的経費とは異なる角度から歳出を捉える点で補完性も持つ。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "都道府県は施設の新増設・更新にどれだけの経費を投じているか。",
      "targetReaderOrDecision": "都道府県の投資的経費・公共施設整備状況を比較したい読者。"
    },
    "police-department-staff": {
      "proposedBy": "総務省統計局「社会・人口統計体系」用語の定義 D 行政基盤 D1205「警察部門職員数」",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/D",
      "surveyedAt": "2026-09-16",
      "rationale": "社会・人口統計体系の用語定義は、警察部門職員数を都道府県職員のうち警察関係部門に属する職員数として明確に定義しており、都道府県間で同一基準の職員数を比較できる指標であることを示している。これは地方財政テーマの「行政部門の職員数と職種別給与」という章立てが求める、性質別歳出（人件費）の内訳を職種別に把握するための基礎データとして機能する。",
      "adoptionCriteria": [
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県の警察職員数は他の都道府県と比べて多いのか少ないのか。",
      "targetReaderOrDecision": "都道府県の治安関連人件費や職員配置の規模を比較したい読者。"
    },
    "prefectural-general-administration-staff": {
      "proposedBy": "政府統計の総合窓口 e-Stat「項目の定義」D 行政基盤 D1201 一般行政部門職員数（都道府県）（総務省・社会・人口統計体系）",
      "sourceUrl": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/D",
      "surveyedAt": "2026-09-16",
      "rationale": "この定義は一般行政部門職員を教育・公安を除く議会事務局や総務・税務・民生など主要な行政分野に属する職員として都道府県間で統一的に区分しており、行政部門の職員数を比較する基礎データとなる。テーマの章「行政部門の職員数と職種別給与」において、人件費や組織規模の地域差を捉える代表的な指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "都道府県の一般行政を担う職員数はどれくらいか。",
      "targetReaderOrDecision": "都道府県の行政組織規模や職員配置を比較したい読者。"
    },
    "prefectural-public-building-floor-area": {
      "proposedBy": "総務省「公共施設状況調査」統計表情報（政府統計の総合窓口 e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/statistics/00200252",
      "surveyedAt": "2026-09-16",
      "rationale": "公共施設状況調査は住民福祉の向上と地方公共団体の能率的な行政に資する資料作成を目的として、道路や公園をはじめとする公共施設の現況を都道府県・市町村ごとに把握するものであり、都道府県有建物の延面積はその中核的な施設ストック指標である。普通建設事業費という支出額の指標と対をなし、施設の「量」の側面からテーマ「公共施設の量と維持・建設への支出」を補完する。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "都道府県が保有する建物のストック量はどの程度か。",
      "targetReaderOrDecision": "施設整備の支出額だけでなく保有ストックの規模も知りたい読者。"
    }
  },
  "local-services": {
    "amusement-industry-employees": {
      "proposedBy": "大阪府 令和3年経済センサス‐活動調査 用語の解説（大阪府統計課）",
      "sourceUrl": "https://www.pref.osaka.lg.jp/o040090/toukei/e-census/r3_census_yougo_.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この用語解説は「従業者数」を調査日時点で事業所に所属して働く全ての人と定義しており、事業所所在地別に集計されることが前提になっている。娯楽業の従業者数は事業所単位で都道府県に帰属するため、飲食・生活関連サービス業全体の雇用規模を都道府県間で比較する際の基準として使え、テーマが問う「どの県で娯楽業の雇用が厚いか」に直接答える指標になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ]
    },
    "amusement-industry-establishments": {
      "proposedBy": "日本標準産業分類（平成25年10月改定）生活関連サービス業，娯楽業 中分類80「娯楽業」（総務省統計局・政府統計の総合窓口 e-Stat 分類基準）",
      "sourceUrl": "https://www.e-stat.go.jp/classifications/terms/10/03/80",
      "surveyedAt": "2026-09-16",
      "rationale": "娯楽業は映画・演劇などの興行や娯楽施設の提供を行う事業所として中分類80に定義され、映像・音声・文字情報制作業（中分類41）とは異なる大分類N「生活関連サービス業，娯楽業」に属する。事業所数を都道府県別に比較することで、テーマ章「映像制作・娯楽関連産業の事業活動」における娯楽提供側の産業集積を、制作側の産業と対比して把握できる代表的な指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "娯楽業の事業所はどの都道府県に多いか。",
      "targetReaderOrDecision": "地域の娯楽関連産業の集積度を確認したい読者。"
    },
    "amusement-industry-net-value-added": {
      "proposedBy": "大阪府 令和3年経済センサス‐活動調査 用語の解説（大阪府統計課）",
      "sourceUrl": "https://www.pref.osaka.lg.jp/o040090/toukei/e-census/r3_census_yougo_.html",
      "surveyedAt": "2026-09-16",
      "rationale": "用語解説は「純付加価値額」を生産額から中間投入を差し引いた新たに生み出された価値と定義しており、売上高とは異なり中間投入を控除した実質的な経済貢献を示す。娯楽業の純付加価値額は売上高と同じ企業本所所在地別・令和2年実績のため、売上高だけでは見えない収益性や地域経済への実質的な寄与度を補完的に示し、テーマの「事業活動を比較する」という問いに対して売上高とは異なる角度を加える。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue",
        "dataQuality"
      ]
    },
    "amusement-industry-revenue": {
      "proposedBy": "大阪府 令和3年経済センサス‐活動調査 用語の解説（大阪府統計課）",
      "sourceUrl": "https://www.pref.osaka.lg.jp/o040090/toukei/e-census/r3_census_yougo_.html",
      "surveyedAt": "2026-09-16",
      "rationale": "用語解説は「売上（収入）金額」を令和2年1年間の販売・役務提供による実現額と定義しており、これは企業単位（本所所在地別）で集計される経理項目である。娯楽業の売上高は従業者数（事業所所在地別）とは調査年・帰属地の基準が異なるため、両者を単純に割って生産性指標とはできない点に注意しつつ、企業活動の規模を都道府県間で比較する独自の切り口を提供する。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "dataQuality"
      ]
    },
    "laundry-beauty-bath-industry-employees": {
      "proposedBy": "日本標準産業分類（平成25年[2013年]10月改定）中分類78「洗濯・理容・美容・浴場業」解説（総務省・政府統計の総合窓口e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/classifications/terms/10/03/78",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ産業中分類78の定義に基づき、従業者数は事業所数だけでは分からない業界の雇用規模・労働集約度を補足する。テーマは事業所・従業者を2021年6月1日時点の事業所所在地別として揃えており、事業所数と従業者数を並べることで、1事業所あたりの平均規模という角度から地域差を補完的に把握できる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "洗濯・理容・美容・浴場業の事業所は都道府県ごとにどれくらいの雇用を生んでいるのか。",
      "targetReaderOrDecision": "地域の生活関連サービス業の雇用規模を把握したい読者。"
    },
    "laundry-beauty-bath-industry-establishments": {
      "proposedBy": "日本標準産業分類（平成25年[2013年]10月改定）中分類78「洗濯・理容・美容・浴場業」解説（総務省・政府統計の総合窓口e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/classifications/terms/10/03/78",
      "surveyedAt": "2026-09-16",
      "rationale": "テーマの説明が明示する「産業中分類78」の対象範囲そのものを定義しており、事業所数指標がどのようなサービス業を集計しているかを裏付ける。この定義により、洗濯・理容・美容・浴場業の事業所数は都道府県間で同一の産業区分に基づき比較でき、飲食店数と対比させる際の基準が明確になる。",
      "adoptionCriteria": [
        "comparability",
        "representativeness"
      ],
      "readerQuestion": "洗濯・理容・美容・浴場業の事業所はどの都道府県に多いのか。",
      "targetReaderOrDecision": "生活関連サービス業の事業所集積を都道府県間で比較したい読者。"
    },
    "laundry-beauty-bath-industry-net-value-added": {
      "proposedBy": "日本標準産業分類（平成25年10月改定）生活関連サービス業，娯楽業 中分類78「洗濯・理容・美容・浴場業」（総務省統計局・政府統計の総合窓口 e-Stat 分類基準）",
      "sourceUrl": "https://www.e-stat.go.jp/classifications/terms/10/03/78",
      "surveyedAt": "2026-09-16",
      "rationale": "総務省の日本標準産業分類は洗濯業・理容業・美容業・浴場業をまとめて中分類78「洗濯・理容・美容・浴場業」として定義しており、これはテーマ説明の「産業中分類78」と一致する公式の業種区分である。この定義に基づく企業純付加価値額は、飲食店と対比される生活関連サービス業の経済的な生産価値を都道府県別に測る指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "自分の都道府県で洗濯・理容・美容・浴場業はどれほどの付加価値を生み出しているか。",
      "targetReaderOrDecision": "地域の生活関連サービス業の経済規模を比較したい読者。"
    },
    "laundry-beauty-bath-industry-revenue": {
      "proposedBy": "統計局ホームページ「経済構造実態調査」用語の解説（総務省統計局）",
      "sourceUrl": "https://www.stat.go.jp/data/kkj/kekka/yougo.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この計算式は、売上高（収入）金額が費用総額や給与総額などを差し引く前の事業規模の基礎値であることを示しており、テーマが売上高を事業所・従業者とは別に企業本所所在地別・2020年時点で扱う理由と対応する。売上高は生産性の代理指標ではなく、あくまで企業規模を示す実額として位置づけられることが、この式からも裏付けられる。",
      "adoptionCriteria": [
        "dataQuality",
        "complementarity"
      ],
      "readerQuestion": "洗濯・理容・美容・浴場業の企業規模（売上高）はどの都道府県で大きいのか。",
      "targetReaderOrDecision": "事業所数・従業者数だけでは分からない企業規模を知りたい読者。"
    },
    "media-production-employees": {
      "proposedBy": "日本標準産業分類（平成25年10月改定）情報通信業 中分類41「映像・音声・文字情報制作業」（総務省統計局・政府統計の総合窓口 e-Stat 分類基準）",
      "sourceUrl": "https://www.e-stat.go.jp/classifications/terms/10/03/41",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ中分類41の定義に基づき、従業者数は事業所数と対になる雇用規模の指標であり、映像・音声・文字情報制作業がどの都道府県でどれだけの雇用を生んでいるかを事業所所在地別に比較できる。事業所数だけでは把握できない事業所あたりの規模の違いを補い、地域の産業集積の厚みを示す補完的な指標となる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "映像・音声・文字情報制作業の従業者は各都道府県でどの程度の規模か。",
      "targetReaderOrDecision": "地域の映像制作関連の雇用規模を確認したい読者。"
    },
    "media-production-establishments": {
      "proposedBy": "日本標準産業分類（平成25年10月改定）情報通信業 中分類41「映像・音声・文字情報制作業」（総務省統計局・政府統計の総合窓口 e-Stat 分類基準）",
      "sourceUrl": "https://www.e-stat.go.jp/classifications/terms/10/03/41",
      "surveyedAt": "2026-09-16",
      "rationale": "総務省の産業分類上、映像・音声・文字情報制作業は映画・テレビ番組・出版などを担う独立した中分類41として定義されており、生活関連サービス業とは異なる情報通信業に属する。事業所数は、経済センサス‐活動調査の事業所所在地別データとして都道府県別の集積状況を比較する基礎指標であり、テーマ章「映像制作・娯楽関連産業の事業活動」の中心的な把握単位となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "映像・音声・文字情報制作業の事業所はどの都道府県に集積しているか。",
      "targetReaderOrDecision": "映像・コンテンツ産業の地域集積を確認したい読者や事業者。"
    },
    "media-production-net-value-added": {
      "proposedBy": "令和3年経済センサス‐活動調査 用語の解説（大阪府 統計課、総務省・経済産業省公表資料に基づく解説）",
      "sourceUrl": "https://www.pref.osaka.lg.jp/o040090/toukei/e-census/r3_census_yougo_.html",
      "surveyedAt": "2026-09-16",
      "rationale": "用語解説は純付加価値額を企業の生産活動が新たに生み出した価値として定義しており、売上高が示す規模とは異なり、中間投入を差し引いた実質的な稼ぐ力を表す。映像・音声・文字情報制作業についてこの値を都道府県別に比較することで、売上高だけでは分からない収益性・付加価値創出力の地域差を補完的に把握できる。",
      "adoptionCriteria": [
        "complementarity",
        "representativeness"
      ],
      "readerQuestion": "映像・音声・文字情報制作業はどの都道府県でより高い付加価値を生み出しているか。",
      "targetReaderOrDecision": "地域産業の稼ぐ力を比較したい政策担当者・研究者。"
    },
    "media-production-revenue": {
      "proposedBy": "令和3年経済センサス‐活動調査 用語の解説（大阪府 統計課、総務省・経済産業省公表資料に基づく解説）",
      "sourceUrl": "https://www.pref.osaka.lg.jp/o040090/toukei/e-census/r3_census_yougo_.html",
      "surveyedAt": "2026-09-16",
      "rationale": "経済センサス‐活動調査の用語解説によれば、売上（収入）金額は令和2年1年間の実績を企業単位・企業本所所在地別に集計した値であり、事業所単位・2021年6月時点の事業所数・従業者数とは基準年・帰属先が異なる。この違いを踏まえたうえで、映像・音声・文字情報制作業の企業売上高は地域の産業規模を金額ベースで示す代表的な指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ],
      "readerQuestion": "映像・音声・文字情報制作業の企業売上高は本社所在地ベースでどの都道府県が大きいか。",
      "targetReaderOrDecision": "映像制作関連企業の立地・市場規模を比較したい読者。"
    },
    "number-of-hotel-facilities": {
      "proposedBy": "衛生行政報告例（抜粋）厚生労働省医薬・生活衛生局生活衛生課 公表資料",
      "sourceUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/seikatsu-eisei/seikatsu-eisei21/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "厚生労働省が旅館業法上の許可施設として毎年度集計・公表している項目であることが明記されており、経済センサスの飲食店・生活関連サービス業とは異なる行政許可ベースの一次資料である。宿泊関連施設数は飲食・生活関連サービス業の集積と合わせて地域の生活関連産業の広がりを補足する角度を提供する。",
      "adoptionCriteria": [
        "dataQuality",
        "complementarity"
      ],
      "readerQuestion": "宿泊業の営業施設はどの都道府県に多いのか。",
      "targetReaderOrDecision": "飲食・生活関連サービス業と宿泊業の分布を合わせて見たい読者。"
    },
    "number-of-hotel-rooms": {
      "proposedBy": "衛生行政報告例（抜粋）厚生労働省医薬・生活衛生局生活衛生課 公表資料",
      "sourceUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/seikatsu-eisei/seikatsu-eisei21/index.html",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ衛生行政報告例で施設数と併せて客室数が集計項目として明記されており、施設数だけでは測れない宿泊受入容量の規模を示す。件数（施設数）と規模（客室数）を両方見ることで、都道府県ごとの宿泊業の実質的な供給力を補完的に把握できる。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "都道府県ごとに宿泊施設はどれくらいの部屋数を持っているのか。",
      "targetReaderOrDecision": "宿泊業の供給力（規模）を都道府県間で比較したい読者。"
    },
    "restaurant-count-per-1000": {
      "proposedBy": "日本標準産業分類（平成25年[2013年]10月改定）中分類76「飲食店」解説（総務省・政府統計の総合窓口e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/classifications/terms/10/03/76",
      "surveyedAt": "2026-09-16",
      "rationale": "この分類定義は、飲食店数という指標がどの範囲の事業所を数えているかを都道府県共通の基準で明確にしており、テーマの説明にある「飲食店数と生活関連サービス業を比較する」という問いの分子側を規定する。標準産業分類に基づくため都道府県間・年次間で同一基準の比較が可能であり、テーマの主要な問いである「どの県で飲食店が多いか」を直接表す指標として位置づけられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "人口あたりでどの都道府県に飲食店が多いのか。",
      "targetReaderOrDecision": "都道府県の生活関連サービス業の集積度を比較したい読者。"
    }
  },
  "population-dynamics": {
    "births-first-child": {
      "proposedBy": "政府統計の総合窓口(e-Stat) 人口動態調査 人口動態統計 確定数 保管統計表「出生数，都道府県（特別区－指定都市再掲）・出生順位・性別」統計表(厚生労働省)",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003411918",
      "surveyedAt": "2026-09-16",
      "rationale": "出生順位は同じ母親が生んだ子の通算順序として定義されており、第1子はその最初の出生を意味する。この統計表は都道府県別に出生順位別の出生数を整理しているため、第1子出生数を地域別に比較すれば、新規に子どもを持ち始める世帯の動向を把握でき、テーマの章「出生と母の年齢・出生順位」の中核的な内訳指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ]
    },
    "births-mother-under25": {
      "proposedBy": "人口動態調査 人口動態統計 確定数 出生上巻「出生数，都道府県（特別区－指定都市再掲）・性・母の年齢（５歳階級）別」（厚生労働省）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003411631",
      "surveyedAt": "2026-09-16",
      "rationale": "厚生労働省の人口動態調査確定数は、出生数を都道府県・性・母の年齢（５歳階級）別に区分した統計表を公表しており、母の年齢層別の出生数を都道府県ごとに比較できる一次データとなっている。母が25歳未満の出生数を都道府県間で比較することは、テーマの出生と母の年齢・出生順位の章が扱う、若い世代の出産動向の地域差を把握する上で直接的な材料となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "若い世代の出産は都道府県によってどれくらい差があるか。",
      "targetReaderOrDecision": "少子化・若年出産の地域差を分析したい行政・研究者。"
    },
    "births-second-child": {
      "proposedBy": "政府統計の総合窓口(e-Stat) 人口動態調査 人口動態統計 確定数 保管統計表「出生数，都道府県（特別区－指定都市再掲）・出生順位・性別」統計表(厚生労働省)",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003411918",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ定義に基づき、第2子は母親にとって2番目の出生を指す区分として都道府県別に集計されている。第1子出生数と対比させることで、追加で子どもを持つ世帯の割合や地域差を捉えることができ、テーマの章における出生順位別の内訳把握を補完する指標となる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ]
    },
    "births-third-child-plus": {
      "proposedBy": "人口動態調査 人口動態統計 確定数 保管統計表（報告書非掲載表）「出生10 出生数，都道府県（特別区－指定都市再掲）・出生順位・性別」（厚生労働省）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003411918",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計表は出生数を都道府県別・出生順位別に区分しており、出生順位が同じ母親の出生子の累積総数として定義されている。第3子以降の出生数はこの出生順位区分の一部であり、単純な出生総数だけでは見えない多子世帯の分布や地域差を捉える補完的な切り口になる。人口動態統計は戸籍法に基づく届出の全数調査であり毎月実施される公的統計であるため、都道府県間比較や経年比較の基礎として安定している。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ]
    },
    "five-year-residence-other-prefecture": {
      "proposedBy": "令和2年国勢調査 移動人口の男女・年齢等集計「男女，年齢（5歳階級），5年前の常住地・現住地別人口－全国，都道府県，市区町村」（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003447398",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ集計表には「他県から」という分類が設けられており、現住地の常住者のうち5年前に他都道府県に住んでいたと回答した人数を都道府県別に把握できる。これは県間の人口移動を扱う章で、どこからどこへ移動が生じているかを国勢調査という同一基準の全数調査で比較する際の中心的な指標になり、行政・研究双方で利用される公的データという点で読者にとっても信頼性が高い。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ]
    },
    "five-year-residence-same-address": {
      "proposedBy": "令和2年国勢調査 移動人口の男女・年齢等集計「男女，年齢（5歳階級），5年前の常住地・現住地別人口－全国，都道府県，市区町村」（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0003447398",
      "surveyedAt": "2026-09-16",
      "rationale": "この表は5年前の常住地を「現住所」（移動なし）から「他県から」まで同一の分類軸で全国・都道府県・市区町村について集計しており、5年前と同じ住所に住み続けた人口は移動人口の裏返しとして地域の定住性を示す基礎値になる。国勢調査は5年ごとに全数を対象とする公的統計であるため、都道府県間で同一基準の比較が可能であり、人口移動の内訳を読み解く章の土台データとして位置付けられる。",
      "adoptionCriteria": [
        "comparability",
        "dataQuality"
      ]
    },
    "future-population": {
      "proposedBy": "「日本の地域別将来推計人口（令和5年推計）」の概要（国立社会保障・人口問題研究所, 日本地理学会2024年秋季学術大会発表要旨）",
      "sourceUrl": "https://www.jstage.jst.go.jp/article/ajg/2024s/0/2024s_92/_article/-char/ja/",
      "surveyedAt": "2026-09-16",
      "rationale": "この推計は2020年国勢調査を出発点とし、コーホート要因法という統一的な推計手法を都道府県・市区町村に適用しており、将来推計人口は自然増減と社会増減の仮定を組み込んだ将来の人口構造を都道府県間で同一基準で比較できる唯一の公式値である。人口が今後どう変わるかという将来推計の章にとって代表的な指標であり、行政・研究の計画立案でも参照される。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ]
    },
    "future-population-change-rate-2050": {
      "proposedBy": "「日本の地域別将来推計人口（令和5年推計）」の概要（国立社会保障・人口問題研究所, 日本地理学会2024年秋季学術大会発表要旨）",
      "sourceUrl": "https://www.jstage.jst.go.jp/article/ajg/2024s/0/2024s_92/_article/-char/ja/",
      "surveyedAt": "2026-09-16",
      "rationale": "資料は2020年から2050年までの30年間の増減率を都道府県ごとに算出しており、東京都のみが増加し秋田県が最大の減少率となることを明示している。実数の将来推計人口だけでは規模の違う都道府県間の変化幅を比較しにくいため、増減率という共通尺度に変換したこの指標は、どの地域で人口減少が急速に進むかを読者が直接比較するのに役立つ。",
      "adoptionCriteria": [
        "comparability",
        "readerValue"
      ]
    },
    "high-school-advancement-rate": {
      "proposedBy": "中学校卒業者、高等学校卒業者、短期大学卒業者及び大学卒業者の進路の推移（文部科学省）",
      "sourceUrl": "https://www.mext.go.jp/a_menu/shotou/career/05010501/001.htm",
      "surveyedAt": "2026-09-16",
      "rationale": "文部科学省の資料は大学等進学者の範囲を大学学部から専攻科まで明確に定義しており、進学率の算定対象を厳密にしている。この定義に基づく進学率は、高校卒業後に進学のため県外へ移動する可能性がある層の規模を都道府県間で比較する際の基礎となり、県外就職割合と対をなす指標として卒業後の進路の全体像を補う。",
      "adoptionCriteria": [
        "dataQuality",
        "complementarity"
      ],
      "readerQuestion": "高校卒業後、進学する若者の割合は都道府県でどう異なるか。",
      "targetReaderOrDecision": "進学率と就職率を対比して若年層の進路動向を分析したい読者。"
    },
    "high-school-graduates-out-of-prefecture-job-ratio": {
      "proposedBy": "学校基本調査 卒業後の状況調査「就職先別 県外就職者数（都道府県別）」（文部科学省）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/database?stat_infid=000023610097&layout=dataset&statdisp_id=0003066060",
      "surveyedAt": "2026-09-16",
      "rationale": "文部科学省の学校基本調査は就職先別県外就職者数（都道府県別）として、高校卒業後に就職した者のうち県外に就職した人数を都道府県別に集計しており、これが高校卒業者の県外就職割合の一次データとなっている。この指標は、卒業後すぐに地元を離れる若年層の流出圧力を都道府県間で比較する際の代表的な材料であり、テーマの若年層の県間移動と卒業後の進路の章を支える。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "高校卒業後、県内に残らず県外に就職する若者はどれくらいいるか。",
      "targetReaderOrDecision": "高校卒業者の地元定着施策を検討する教育・労働行政担当者。"
    },
    "interprefecture-net-migration-age15to24": {
      "proposedBy": "地域課題分析レポート2024年秋号 第1章(2)「人々の地域移動のタイミング」（内閣府政策統括官（経済財政分析担当）、令和6年12月）",
      "sourceUrl": "https://www5.cao.go.jp/j-j/cr/cr24-3/chr24-3_01-02.html",
      "surveyedAt": "2026-09-16",
      "rationale": "内閣府の地域課題分析レポートは、東京圏への転入超過について、すべての地域において20代前半が最も多くなっていると分析しており、15~24歳前後の若年層の移動が地域間人口移動の中心的な年齢層であることを示している。県間転入超過数をこの年齢層で見ることは、テーマの若年層の県間移動と卒業後の進路という章の中心的な問いに直結する。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "進学・就職期の若者はどの都道府県に流出・流入しているか。",
      "targetReaderOrDecision": "若年層の地元定着策を検討する地方自治体の政策担当者。"
    },
    "interprefecture-net-migration-age25to34": {
      "proposedBy": "地域課題分析レポート2024年秋号 第1章(2)「人々の地域移動のタイミング」（内閣府政策統括官（経済財政分析担当）、令和6年12月）",
      "sourceUrl": "https://www5.cao.go.jp/j-j/cr/cr24-3/chr24-3_01-02.html",
      "surveyedAt": "2026-09-16",
      "rationale": "同レポートは、20代前半に次いで多い年齢層として多くの地域で20代後半が挙げられると述べており、就職後数年が経過した20代後半から30代前半の層も地域間移動の主要な担い手であることを示している。25~34歳の県間転入超過数を見ることで、進学・卒業直後の移動である15~24歳の層とは異なる、就業安定期の移動傾向を補完的に捉えられる。",
      "adoptionCriteria": [
        "complementarity",
        "representativeness"
      ],
      "readerQuestion": "就職後数年が経過した層はどの地域に定着・流出しているか。",
      "targetReaderOrDecision": "若手社会人の定住施策を検討する地方自治体の政策担当者。"
    }
  },
  "regional-energy": {
    "electricity-demand": {
      "proposedBy": "社会・人口統計体系 都道府県データ「Ｈ　居住」統計表（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010208",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計表には都道府県別の「#H05107_電力需要量」が単位Ｍｗｈで収録されており、最終エネルギー消費量（TJ、全エネルギー種を含む）とは異なり電力という単一エネルギー種のみに着目した需要規模を示す。テーマが電源構成を別統計として扱う方針である以上、電力需要そのものの地域差を確認する補完的な指標として位置付けられる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability"
      ],
      "readerQuestion": "電力だけに着目すると、どの都道府県の需要が大きいのか。",
      "targetReaderOrDecision": "電力需給や再エネ導入計画を検討する読者。"
    },
    "final-energy-consumption": {
      "proposedBy": "社会・人口統計体系 都道府県データ「Ｈ　居住」統計表（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010108",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計表は都道府県別に「H5701_最終エネルギー消費量」を単位TJで収録しており、47都道府県が同一基準・同一時点で並ぶため、地域間のエネルギー消費規模を直接比較できる。テーマ冒頭で最終エネルギー消費量を規模の中心指標として扱う際、この一次資料が定義と単位の根拠になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "自分の都道府県はエネルギーをどれだけ消費しているのか、他県と比べて多いのか少ないのか。",
      "targetReaderOrDecision": "都道府県のエネルギー政策担当者や地域比較を行う分析者。"
    },
    "final-energy-consumption-per-capita": {
      "proposedBy": "社会・人口統計体系 都道府県データ「Ｈ　居住」統計表（総務省統計局）",
      "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0000010108",
      "surveyedAt": "2026-09-16",
      "rationale": "同じ統計表に「H5702_1人当たり最終エネルギー消費量」が単位GJで人口規模の異なる都道府県間でも比較できる形で収録されている。規模指標である最終エネルギー消費量だけでは人口の多い県が常に上位になるため、1人当たり指標を並置することで規模と普及の両面から地域差を捉えられる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "人口規模を調整すると、どの都道府県が住民1人あたり多くエネルギーを使っているのか。",
      "targetReaderOrDecision": "人口差を除いた実質的なエネルギー効率を比較したい読者。"
    },
    "fit-fip-installed-capacity": {
      "proposedBy": "再生可能エネルギー電子申請 事業計画認定情報 情報公表ページ（資源エネルギー庁）",
      "sourceUrl": "https://www.fit-portal.go.jp/publicinfosummary",
      "surveyedAt": "2026-09-16",
      "rationale": "資源エネルギー庁はA表として都道府県別の認定量・導入量を公表しており、これは新規認定分と移行認定分を合わせた累積の導入設備容量を都道府県間で比較するための一次資料となっている。テーマの章立てにある「FIT・FIPの再エネ導入設備容量」を都道府県別に把握する上で、この合計値は規模を示す代表的な指標である。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ]
    },
    "fit-fip-new-approved-installed-capacity": {
      "proposedBy": "再生可能エネルギー電子申請 事業計画認定情報 情報公表ページ（資源エネルギー庁）",
      "sourceUrl": "https://www.fit-portal.go.jp/publicinfosummary",
      "surveyedAt": "2026-09-16",
      "rationale": "情報公表ページは新規認定分を「本制度開始後に新たに認定を受けた設備」と明確に定義しており、旧制度からの移行分と区別して集計されている。この定義に基づき新規認定分は、FIT・FIP制度開始以降に都道府県でどれだけ新たな再エネ導入が進んだかを示す指標として、合計の導入設備容量とは異なる政策効果の角度を提供する。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ]
    },
    "fit-transition-installed-capacity": {
      "proposedBy": "再生可能エネルギー電子申請 事業計画認定情報 情報公表ページ（資源エネルギー庁）",
      "sourceUrl": "https://www.fit-portal.go.jp/publicinfosummary",
      "surveyedAt": "2026-09-16",
      "rationale": "情報公表ページは移行認定分を、法施行日時点で既に発電を開始していた設備や旧余剰電力買取制度からの特例太陽光発電設備が本制度へ移行したものと定義しており、新規認定分とは発生時期・制度的性格が異なることが示されている。このため移行認定分は、制度開始前からの既存導入分を都道府県別に切り分けて把握するための、新規認定分を補完する指標として扱われる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ]
    },
    "regional-business-co2-emissions-estimate": {
      "proposedBy": "都道府県別・部門別CO2排出量の現況推計（2023年度版）（環境省 脱炭素地域づくり支援サイト）",
      "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/suikei.html",
      "surveyedAt": "2026-09-16",
      "rationale": "業務その他部門は標準的手法に基づく活動量按分により全都道府県で同一の算定手法により推計されており、オフィス・商業施設など第三次産業の集積がエネルギー消費と排出量に与える影響を比較する補完的な視点を提供します。産業部門・家庭部門とは異なる活動主体を捉える点でテーマの都道府県比較に寄与します。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "オフィスや商業施設が集積する都道府県は業務部門のCO2排出量も多いのか。",
      "targetReaderOrDecision": "都市部のエネルギー消費構造を分析したい自治体職員や研究者。"
    },
    "regional-co2-emissions-estimate": {
      "proposedBy": "部門別CO2排出量の現況推計 都道府県別・部門別CO2排出量の現況推計ページ（環境省 脱炭素地域づくり支援サイト）",
      "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/suikei.html",
      "surveyedAt": "2026-09-16",
      "rationale": "環境省は地方公共団体実行計画の算定手法編マニュアルに基づき、全市区町村・都道府県の部門別CO2排出量を標準的手法で現況推計しており、これは都道府県別エネルギー消費統計等の公表データを基に作成された全国共通基準の推計値である。テーマの章立てにある「地域のCO2排出量推計」の合計値は、エネルギー消費の規模を排出量という別角度から都道府県間で比較するための指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ]
    },
    "regional-household-car-final-energy-consumption": {
      "proposedBy": "都道府県別エネルギー消費統計 統計表ファイル一覧ページ（資源エネルギー庁・e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/files?toukei=00551006",
      "surveyedAt": "2026-09-16",
      "rationale": "同統計は運輸部門のうち家庭（家計）の乗用車利用に限定して都道府県別のエネルギー消費量を推計しており、営業用輸送等は対象外であることが区分の定義から読み取れる。このため家庭乗用車の消費量は、家庭部門の消費とは異なる移動面の消費実態を捉える補完的な指標として都道府県間比較に用いることができる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ]
    },
    "regional-household-co2-emissions-estimate": {
      "proposedBy": "都道府県別・部門別CO2排出量の現況推計（2023年度版）（環境省 脱炭素地域づくり支援サイト）",
      "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/suikei.html",
      "surveyedAt": "2026-09-16",
      "rationale": "家庭部門のCO2排出量推計は世帯を単位として全都道府県で統一手法により算出され、テーマが扱う1人当たりエネルギー消費や住宅太陽光普及と並べて、家庭のエネルギー利用が地域の排出量にどう反映されるかを補完的に示す指標になります。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "住宅の太陽光設備率が高い都道府県は家庭部門のCO2排出量が低い傾向にあるか。",
      "targetReaderOrDecision": "家庭のエネルギー消費とCO2排出の関係を確認したい読者。"
    },
    "regional-household-final-energy-consumption": {
      "proposedBy": "都道府県別エネルギー消費統計 統計表ファイル一覧ページ（資源エネルギー庁・e-Stat）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/files?toukei=00551006",
      "surveyedAt": "2026-09-16",
      "rationale": "この統計は企業・事業所他部門、家庭部門、運輸（家庭）の3区分で都道府県別のエネルギー消費量を推計しており、家庭部門はそのうち家計のエネルギー使用実態を都道府県間で比較できる中心的な区分として明示されている。テーマが規模と普及を都道府県別に比較する構成であることから、家庭部門の消費量は生活面の消費規模を示す代表的な指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ]
    },
    "regional-industry-co2-emissions-estimate": {
      "proposedBy": "都道府県別・部門別CO2排出量の現況推計（2023年度版）（環境省 脱炭素地域づくり支援サイト）",
      "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/suikei.html",
      "surveyedAt": "2026-09-16",
      "rationale": "本ページは産業部門を含む部門別CO2排出量を全市区町村・都道府県単位で共通の算定手法に基づき推計し公表するもので、地方公共団体実行計画の策定根拠として用いられています。産業部門は製造業等の集積度が高い都道府県ほど排出量が大きくなりやすく、エネルギー消費規模の都道府県差を裏付ける補完的な指標として位置付けられます。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の都道府県の産業部門からのCO2排出量は全国でどの位置にあるか。",
      "targetReaderOrDecision": "地方公共団体の脱炭素計画担当者や産業立地とエネルギー消費の関係を調べたい読者。"
    },
    "regional-transport-co2-emissions-estimate": {
      "proposedBy": "運輸部門（自動車）CO2排出量推計データ（環境省 脱炭素地域づくり支援サイト）",
      "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/car.html",
      "surveyedAt": "2026-09-16",
      "rationale": "環境省の運輸部門推計は自動車の保有・利用状況に基づき算出されており、テーマの説明が「運輸は家庭乗用車に限り、営業用輸送等を含みません」と明記する自動車中心の定義と対応します。既存統計とは異なる推計手法で都道府県別に運輸由来の排出量を示す点で、エネルギー消費量とは別角度から地域の自動車利用実態を補完します。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自動車利用が多い都道府県は運輸部門のCO2排出量も多いのか。",
      "targetReaderOrDecision": "自動車依存度と地域の排出量の関係を確認したい自治体・研究者。"
    },
    "regional-waste-co2-emissions-estimate": {
      "proposedBy": "都道府県別・部門別CO2排出量の現況推計（2023年度版）（環境省 脱炭素地域づくり支援サイト）",
      "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/suikei.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この注記は、現況推計が非エネルギー起源CO2のうち一般廃棄物の焼却分だけを特別に算出対象としていることを明示しており、他の産業・業務・家庭・運輸の各部門とは異なるプラスチックごみ焼却由来という固有の発生源を捉える指標であることを裏付けます。エネルギー消費統計だけでは見えない廃棄物処理起源の排出量を補完する役割を持ちます。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "一般廃棄物の焼却によるCO2排出量は都道府県でどれくらい差があるか。",
      "targetReaderOrDecision": "廃棄物処理由来の排出を含めた地域の脱炭素対策を検討する自治体担当者。"
    },
    "solar-panel-housing-rate": {
      "proposedBy": "統計局ホームページ 統計トピックス「省エネルギー設備等の住宅への普及について」（総務省統計局、住宅・土地統計調査）",
      "sourceUrl": "https://www.stat.go.jp/data/jyutaku/topics/topi863.html",
      "surveyedAt": "2026-09-16",
      "rationale": "住宅・土地統計調査は「太陽光を利用した発電機器あり」の住宅数・普及率を持ち家・借家別に集計しており、太陽光発電の普及を世帯・住宅という単位で捉える一次資料である。FIT/FIPの導入設備容量（事業者側の規模）とは異なり、住宅単位での普及度という角度から都道府県間の差を補完的に示せる。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "自分の住む都道府県では、どれくらいの住宅が太陽光発電を導入しているのか。",
      "targetReaderOrDecision": "住宅の再エネ導入状況に関心を持つ一般読者や地域政策担当者。"
    }
  },
  "roads": {
    "road-bridge-diagnosed-count": {
      "proposedBy": "国土交通省道路局 報道発表資料「橋梁等の2025年度（令和７年度）点検結果をとりまとめ～道路メンテナンス年報（３巡目２年目）の公表～」",
      "sourceUrl": "https://www.mlit.go.jp/report/press/road01_hh_002135.html",
      "surveyedAt": "2026-09-16",
      "rationale": "国土交通省は道路法改正に基づき全ての橋梁について5年に1度の点検・健全性診断を義務付けており、道路メンテナンス年報でその実施・診断状況を都道府県別に取りまとめている。これは道路実延長や交通量とは異なり、既存ストックの老朽化・維持管理という角度からの指標であり、「道路橋の架設年度と橋梁・トンネルの健全性」章の中心となる診断母数を提供する。",
      "adoptionCriteria": [
        "dataQuality",
        "readerValue",
        "representativeness"
      ],
      "readerQuestion": "自分の都道府県の橋はどれくらい点検・診断が進んでいるか。",
      "targetReaderOrDecision": "橋梁の老朽化対策の進捗を確認したい自治体・住民。"
    }
  },
  "safety": {
    "consumer-consultation-accepted-cases": {
      "proposedBy": "千葉県「令和6年度の消費生活相談の概要について」（千葉県環境生活部くらし安全推進課）",
      "sourceUrl": "https://www.pref.chiba.lg.jp/seikouan/press/2025/r6-soudangaiyou.html",
      "surveyedAt": "2026-09-16",
      "rationale": "都道府県の消費生活センターが年度ごとに受け付けた相談件数を集計・公表し、前年度比の増減率まで示していることから、この件数が消費者被害の規模と変化を捉える基礎指標として自治体自身に位置付けられていることが分かる。消費者庁の地方消費者行政の現況調査はこうした都道府県ごとの集計を全国横断で束ねたものであり、テーマの「犯罪と消費者被害」章で都道府県間の消費者トラブルの多寡を比較する材料になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "readerValue"
      ],
      "readerQuestion": "自分の住む都道府県では消費生活相談の件数が増えているのか減っているのか。",
      "targetReaderOrDecision": "消費者行政担当者や住民が消費者被害の動向を把握する際の参考情報。"
    },
    "disaster-recovery-expenses-prefecture": {
      "proposedBy": "国土交通省水管理・国土保全局「災害復旧事業の概要」（防災）",
      "sourceUrl": "https://www.mlit.go.jp/mizukokudo/river/hukkyu_jigyou.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この解説は災害復旧事業が地方公共団体の財政力に応じた国庫負担のもとで実施される制度であることを示しており、都道府県決算における災害復旧費は被災後にどれだけの復旧支出が発生したかを金額で表す指標となる。棟数指標が被害の物理的規模を示すのに対し、復旧費は財政負担という別の軸から都道府県間の災害影響を比較できる。",
      "adoptionCriteria": [
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "災害からの復旧にはどれくらいの財政負担がかかっているのか。",
      "targetReaderOrDecision": "都道府県財政を分析する研究者や地方財政担当者。"
    },
    "fire-department-emergency-car-count-per-100k": {
      "proposedBy": "令和6年版 消防白書 第2章第5節2「救急業務の実施体制」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r6/chapter2/section5/68132.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書は救急自動車の保有台数を救急業務の実施体制を示す基礎データとして毎年公表しており、地域の救急対応力を測る代表的な指標として位置づけている。社会・人口統計体系による人口10万人当たりの台数は都道府県間の比較を可能にし、火災・救急需要という章の中で消防ポンプ台数と並ぶ体制面の補完指標となる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "救急車の配備密度は都道府県ごとにどれくらい差があるか。",
      "targetReaderOrDecision": "救急医療体制の地域差を把握したい住民や医療・防災政策の検討者。"
    },
    "fire-department-member-count-per-100-thousand-people": {
      "proposedBy": "令和5年版 消防白書 第2章第1節「消防組織」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r5/chapter2/section1/66820.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書は全国の消防職員のうち実際に消火・救助・救急活動に従事する消防吏員の人数を集計しており、これは消防組織の人的な対応能力を表す代表的な数値である。人口10万人当たりに換算することで、消防水利数（施設面）と対をなす人員面の備えとして都道府県間の消防体制を比較でき、災害・火災に対する地域の対応力を測る指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "人口当たりの消防職員数は地域によってどれだけ差があるのか。",
      "targetReaderOrDecision": "消防力の整備指針に基づき人員配置を検討する消防本部・総務省担当者。"
    },
    "fire-department-pump-car-count-per-100-thousand-people": {
      "proposedBy": "平成30年版 消防白書 第2章第1節2「消防防災施設等」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/h30/chapter2/section1/38289.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書は消防ポンプ自動車を消防活動の基盤となる装備として位置づけており、地域の消防力を測る具体的な物量指標として扱っている。社会・人口統計体系では1975年から2022年まで人口10万人当たりの台数として都道府県別に長期間比較できるため、犯罪や交通事故とは異なる「火災への備え」という角度からテーマの安全性を補完する指標になる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県は人口当たりの消防ポンプ自動車の台数が他地域と比べて多いか少ないか。",
      "targetReaderOrDecision": "地域の消防・防火体制の充実度を確認したい住民や自治体防災担当者。"
    },
    "fire-department-water-count-per-100-thousand-people": {
      "proposedBy": "消防水利の基準（昭和39年12月10日消防庁告示第7号）（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/laws/kokuji/post27/",
      "surveyedAt": "2026-09-16",
      "rationale": "消防庁告示は消防水利を消火栓・防火水槽・河川・井戸など消火活動に不可欠な水利施設として法的に定義しており、一定の貯水量・給水能力の基準を課している。人口10万人当たりの消防水利数は、火災発生時に地域がどれだけ消火資源を備えているかという供給側の備えを示す指標であり、火災・救急需要という章の中で被害発生指標を補完する。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の地域には人口当たりどれだけの消防水利があるのか。",
      "targetReaderOrDecision": "消防力の整備計画を検討する消防本部・自治体担当者。"
    },
    "flood-affected-municipalities": {
      "proposedBy": "水害統計調査の概要（国土交通省水管理・国土保全局）",
      "sourceUrl": "https://www.mlit.go.jp/statistics/details/t-other-2_tk_000289.html",
      "surveyedAt": "2026-09-16",
      "rationale": "被災市区町村数は、市区町村ごとの現地調査結果を都道府県経由で集計する仕組みに基づいており、被害額とは異なり水害の「広がり」（面的な被災範囲）を示す指標である。被害額指標と組み合わせることで、局地的な大規模被害か広域にわたる小規模被害かという水害の性格の違いを都道府県間で比較できる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "水害で被災した市区町村数が多い都道府県は、被害が広域に及んでいるのか。",
      "targetReaderOrDecision": "水害の被災範囲の広がりを確認したい防災担当者・研究者。"
    },
    "flood-damage-general-assets": {
      "proposedBy": "水害統計調査の概要（国土交通省水管理・国土保全局）",
      "sourceUrl": "https://www.mlit.go.jp/statistics/details/t-other-2_tk_000289.html",
      "surveyedAt": "2026-09-16",
      "rationale": "水害統計調査は治水行政の基礎資料を得るために一般資産（家屋・家庭用品・農漁家資産・事業所資産・農作物）の被害額を市区町村単位で積み上げて集計しており、水害の経済的被害規模を都道府県間で比較する代表的な指標となる。洪水と浸水という章立てのもとで、被害の「量」を金額で示す軸として機能する。",
      "adoptionCriteria": [
        "representativeness",
        "dataQuality"
      ],
      "readerQuestion": "水害による資産被害額が大きい都道府県はどこか。",
      "targetReaderOrDecision": "治水対策の優先度を検討する地方自治体・防災担当者。"
    },
    "individual-evacuation-plan-coverage-rate": {
      "proposedBy": "内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」（令和8年調査、令和8年4月1日現在）",
      "sourceUrl": "https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "この調査は個別避難計画の作成率を市町村単位で毎年集計しており、避難行動要支援者に対する自治体の備えの進捗を直接示す政策目標指標として扱われている。作成率が低い階級が過半数を占めるという記述は、地域差が大きい現状を政府自身が課題として明示しており、避難施設整備の章で都道府県間の取組差を確認する読者の問いに直接応える。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "自分の住む地域では要支援者の個別避難計画がどの程度進んでいるか。",
      "targetReaderOrDecision": "個別避難計画の進捗を確認したい住民や福祉・防災担当の自治体職員。"
    },
    "individual-evacuation-plan-covered-persons": {
      "proposedBy": "内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」（令和8年調査、令和8年4月1日現在）",
      "sourceUrl": "https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "この資料は個別避難計画が作成された要支援者の実人数を全国集計として公表しており、作成率（割合）だけでは見えない絶対的な達成規模を示す指標として位置づけられている。名簿掲載人数と対にして都道府県別に見ることで、避難施設整備の章において「どれだけの人が実際に守られる計画を持っているか」という読者の問いに答えられる。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "実際に個別避難計画が作成されている要支援者は何人いるのか。",
      "targetReaderOrDecision": "要配慮者支援の実効性を確認したい住民や福祉・防災担当者。"
    },
    "individual-evacuation-plan-listed-persons": {
      "proposedBy": "内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」（令和8年調査、令和8年4月1日現在）",
      "sourceUrl": "https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "避難行動要支援者名簿の掲載者数は、市町村が把握している要支援者の母数として個別避難計画の作成対象範囲を定める基礎データであり、この調査資料では名簿掲載者を基準に平時からの情報提供割合などが算出されている。掲載人数の規模を都道府県別に見ることで、要支援者数と計画整備の負荷の大きさという避難施設整備の背景を読者が把握できる。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "自分の地域で避難行動要支援者名簿に登録されている人数はどれくらいか。",
      "targetReaderOrDecision": "要支援者対策の規模感を把握したい自治体防災・福祉担当者。"
    },
    "natural-disaster-deaths": {
      "proposedBy": "令和7年版 消防白書 附属資料1-5-2「令和6年1月1日から12月31日までの間に発生した自然災害等による都道府県別被害状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書の附属資料1-5-2は、暴風・豪雨・地震など自然災害全般による被害を都道府県別に集計した公式表であり、死者数はその中で人的被害の最も重い区分として扱われている。自然災害の人的被害を都道府県間で比較する際の代表的な指標であり、住家被害や経済被害と並んで「人的・住家被害と復旧支出」の章の中心的な軸となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "令和6年に自然災害による死者数が多かった都道府県はどこか。",
      "targetReaderOrDecision": "防災計画の優先地域を検討する自治体・国の防災担当者。"
    },
    "natural-disaster-destroyed-houses": {
      "proposedBy": "令和7年版 消防白書 附属資料「資料1-5-2 令和6年1月1日から12月31日までの間に発生した自然災害等による都道府県別被害状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書はこの資料で自然災害を暴風・地震・津波など多様な現象として定義したうえで、都道府県別の住家被害を全壊・半壊・一部破損に区分して集計している。全壊棟数は住家の機能喪失という最も重い被害を示す指標であり、能登半島地震のように特定の都道府県に被害が集中する状況を都道府県間で比較する際の代表的な尺度となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability"
      ],
      "readerQuestion": "自分の県では自然災害でどれだけの住宅が全壊したのか。",
      "targetReaderOrDecision": "地域防災計画の担当者や住宅再建支援制度を検討する自治体職員。"
    },
    "natural-disaster-half-destroyed-houses": {
      "proposedBy": "令和7年版 消防白書 附属資料「資料1-5-2 令和6年1月1日から12月31日までの間に発生した自然災害等による都道府県別被害状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書の被害集計は住家被害を全壊・半壊・一部破損の三区分で都道府県別に公表しており、半壊は修理により再建可能な中程度の被害を示す。全壊のみでは捉えられない、より広い範囲で発生する生活再建ニーズを都道府県間で比較するために、全壊棟数と並ぶ補完的な指標として位置付けられる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "全壊には至らないが修理が必要な住宅被害は、どの都道府県に多いのか。",
      "targetReaderOrDecision": "被災者生活再建支援金の制度設計に関わる自治体職員。"
    },
    "natural-disaster-injured-persons": {
      "proposedBy": "令和7年版 消防白書 附属資料1-5-2「令和6年1月1日から12月31日までの間に発生した自然災害等による都道府県別被害状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この備考は附属資料1-5-2表全体の集計上の注意点を示すものであり、負傷者数を含む同表の各数値がこの端数処理ルールの下で都道府県別に集計されていることを意味する。負傷者数は死者・行方不明者に至らない人的被害を捉える指標であり、重篤度の低い被害まで含めることで自然災害の人的被害を過小評価しないための補完的な軸となる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自然災害による負傷者数が多い都道府県は、死者・行方不明者数が多い都道府県と一致するか。",
      "targetReaderOrDecision": "災害医療・救急体制の需要を見積もる担当者。"
    },
    "natural-disaster-missing-persons": {
      "proposedBy": "令和7年版 消防白書 附属資料1-5-2「令和6年1月1日から12月31日までの間に発生した自然災害等による都道府県別被害状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この備考は同じ附属資料1-5-2表が対象とする「自然災害」の範囲を定義しており、行方不明者数もこの定義に基づき暴風・地震・津波など多様な災害種別を横断して都道府県別に計上されている。死者数だけでは捕捉できない、災害直後の捜索・救助が続く被害の規模を示す点で死者数を補完する指標となる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自然災害による行方不明者が発生した都道府県はどこで、死者数との差はどの程度か。",
      "targetReaderOrDecision": "災害時の捜索・救助体制を検討する防災担当者。"
    },
    "natural-disaster-partially-damaged-houses": {
      "proposedBy": "令和7年版 消防白書 附属資料「資料1-5-2 令和6年1月1日から12月31日までの間に発生した自然災害等による都道府県別被害状況」（総務省消防庁）",
      "sourceUrl": "https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html",
      "surveyedAt": "2026-09-16",
      "rationale": "消防白書の同一資料では一部破損住家も全壊・半壊と並ぶ被害区分として都道府県別に集計されており、令和6年能登半島地震のように長野県などで一部破損のみが発生した県もあるなど、被害の裾野の広がりを示す。全壊・半壊だけでは見えない軽微な被害の地域差を補完的に把握できる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "軽微な住宅被害まで含めると、被害はどこまで広がっているのか。",
      "targetReaderOrDecision": "災害廃棄物処理や応急修理支援を計画する自治体職員。"
    },
    "tsunami-evacuation-building-count": {
      "proposedBy": "内閣府「津波避難ビル・津波避難タワー等に関する取組調査結果について」（令和5年4月1日現在調査）",
      "sourceUrl": "https://www.bousai.go.jp/jishin/tsunami/hinan/pdf/sanko_1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "内閣府は全国40都道府県678市区町村を対象に津波避難ビルの整備状況を毎年調査しており、耐震性など安全性の観点から整備数の質を確認する政策資料として公表している。この指標は洪水・自然災害の章において、避難施設整備の物理的な備えを都道府県別に比較する代表的な指標であり、個別避難計画（ソフト面）と対をなす補完的な角度を提供する。",
      "adoptionCriteria": [
        "representativeness",
        "complementarity"
      ],
      "readerQuestion": "自分の地域には津波から緊急避難できるビルがどれだけ整備されているか。",
      "targetReaderOrDecision": "沿岸自治体の津波避難施設整備状況を確認したい住民や防災担当者。"
    },
    "tsunami-evacuation-tower-count": {
      "proposedBy": "高知市ホームページ「津波避難センター・津波避難タワー」（高知市地域防災推進課）",
      "sourceUrl": "https://www.city.kochi.kochi.jp/soshiki/12/tunamihinann-ct.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この市の公式ページは、津波避難タワー等が「自然地形の高台や高い建物等が無く津波からの避難が困難な地域」を対象に整備される緊急避難インフラであることを示しており、内閣府が都道府県別に集計する整備数はこうした地域の避難環境整備の進み具合を可視化する指標として位置付けられる。テーマの「避難施設と個別避難計画の整備」章において、都道府県ごとの整備の遅速を比較する材料になる。",
      "adoptionCriteria": [
        "representativeness",
        "readerValue"
      ],
      "readerQuestion": "自分の住む都道府県では津波避難タワー等の整備がどの程度進んでいるか。",
      "targetReaderOrDecision": "沿岸部の防災担当者や住民が避難環境の整備状況を把握する際の参考情報。"
    }
  },
  "sports-participation": {
    "community-sports-facility-count-per-million": {
      "proposedBy": "体育・スポーツ施設現況調査 調査の概要（スポーツ庁）",
      "sourceUrl": "https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/gaiyou/1368164.htm",
      "surveyedAt": "2026-09-16",
      "rationale": "スポーツ庁のこの調査は、社会体育施設を含む体育・スポーツ施設の設置者別現在数を明らかにし、スポーツ振興施策の基礎データとすることを目的として掲げており、社会体育施設数は都道府県のスポーツ供給基盤を示す代表的な行政データである。テーマが「施設数から利用者数は推計しない」と明示する中で、この指標は参加率と対にして供給側だけを比較する役割を担う。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県には人口当たりどれくらい社会体育施設があるか。",
      "targetReaderOrDecision": "地域のスポーツ施設整備計画を検討する自治体職員。"
    },
    "elementary-school-gymnasium-count": {
      "proposedBy": "体育・スポーツ施設現況調査（令和6年度）調査の概要（スポーツ庁）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00402101&tstat=000001088795",
      "surveyedAt": "2026-09-16",
      "rationale": "本調査はスポーツ振興施策の基礎資料として学校体育施設の設置者別現在数を3年周期・都道府県単位で把握することを目的としており、小学校体育館設置箇所数は供給側の代表指標として都道府県間で同一基準の比較が可能である。テーマが「参加と供給を分けて比較する」方針を取る中で、施設数は行動者率・観覧率という参加指標に対する供給側の裏付けとなる。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の住む都道府県には小学校の体育館がどれだけ整備されているか。",
      "targetReaderOrDecision": "都道府県のスポーツ施設整備状況を把握したい住民・自治体担当者"
    },
    "elementary5-fitness-score-female": {
      "proposedBy": "令和7年度 全国体力・運動能力、運動習慣等調査の結果について（概要）（スポーツ庁）",
      "sourceUrl": "https://www.mext.go.jp/sports/content/20251217-spt_sseisaku02-000046317_000101.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "同資料は体力合計点の傾向を男女別に示しており、女子の値を男子と並置することで性別による体力差や地域差を同一基準で比較できる。悉皆調査に基づくため欠損が少なく、テーマの子どもの体力章において男子指標を補完する対の指標として機能する。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の県の小学5年女子の体力は男子と比べてどう違うか。",
      "targetReaderOrDecision": "男女別の体力差を確認したい学校体育担当者"
    },
    "elementary5-fitness-score-male": {
      "proposedBy": "令和7年度 全国体力・運動能力、運動習慣等調査の結果について（概要）（スポーツ庁）",
      "sourceUrl": "https://www.mext.go.jp/sports/content/20251217-spt_sseisaku02-000046317_000101.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "スポーツ庁の概要資料は体力合計点を性別・学校段階別に前年度比・コロナ前水準比で継続的に追跡する中心指標として扱っており、悉皆調査であるため都道府県別の比較にも耐えるデータ品質を持つ。テーマの「子どもの体力・運動習慣と学校体育館」の章で、施設整備や運動時間と並べて子どもの体力状況そのものを示す代表指標となる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の県の小学5年男子の体力は全国的に見てどの水準か。",
      "targetReaderOrDecision": "子どもの体力向上施策を検討する教育関係者・保護者"
    },
    "elementary5-weekly-exercise-420min-rate-female": {
      "proposedBy": "令和7年度全国体力・運動能力、運動習慣等調査 都道府県別集計（小学校児童）（スポーツ庁）",
      "sourceUrl": "https://www.mext.go.jp/sports/content/20260113-spt_sseisaku02-000046317_0000001.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "同集計は小学校女子についても男子と同一基準で週420分以上運動する割合を都道府県別に示しており、男子指標と対にすることで性別による運動習慣差を比較できる。体力合計点という結果指標と運動時間という行動を結び付ける補完的な指標として、子どもの体力章で機能する。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "readerValue"
      ],
      "readerQuestion": "自分の県の小学5年女子は男子と比べてどれだけ運動しているか。",
      "targetReaderOrDecision": "男女別の運動習慣差を把握したい保護者・学校関係者"
    },
    "elementary5-weekly-exercise-420min-rate-male": {
      "proposedBy": "令和7年度全国体力・運動能力、運動習慣等調査 都道府県別集計（小学校児童）（スポーツ庁）",
      "sourceUrl": "https://www.mext.go.jp/sports/content/20260113-spt_sseisaku02-000046317_0000001.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "この都道府県別集計は小学校男子について1週間の総運動時間を60分未満・60分以上420分未満・420分以上のカテゴリで都道府県別に集計しており、420分以上の割合は運動習慣が十分に形成されているかを示す行動指標となる。体力合計点が結果指標であるのに対し、本指標は運動習慣という行動面を補完し、テーマの「成人の身体活動と歩数」に対応する子ども版の参加指標として位置付けられる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "complementarity"
      ],
      "readerQuestion": "自分の県の小学5年男子はどれくらいの割合で週420分以上運動しているか。",
      "targetReaderOrDecision": "子どもの運動習慣づくり施策を検討する自治体・学校"
    },
    "hobby-participation-rate-sports-spectating": {
      "proposedBy": "令和3年社会生活基本調査 生活行動に関する結果（茨城県版）第4節「趣味・娯楽」スポーツ観覧の項（茨城県企画部統計課）",
      "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/syakai/syakaichor3/kodo.html",
      "surveyedAt": "2026-09-16",
      "rationale": "この資料はスポーツ観覧をテレビ・スマートフォン・パソコンでの視聴を除いた「会場での観戦」に限定して定義しており、自らプレーする「行う」スポーツとは異なる需要側の行動を捉えている。この定義の違いにより、施設利用の別側面（観戦需要）を「行う」参加率と切り分けて比較できる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県では、スポーツを会場で観戦する人はどれくらいいるか。",
      "targetReaderOrDecision": "スタジアムやアリーナ整備を検討する地域スポーツ行政担当者。"
    },
    "junior-high-school-gymnasium-count": {
      "proposedBy": "体育・スポーツ施設現況調査（令和6年度）調査の概要（スポーツ庁）",
      "sourceUrl": "https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00402101&tstat=000001088795",
      "surveyedAt": "2026-09-16",
      "rationale": "同調査は学校段階別に施設の設置数を把握しており、中学校体育館設置箇所数は小学校分と並べることで学校段階間の施設整備差を都道府県別に比較できる。テーマの章立てにある「子どもの体力・運動習慣と学校体育館」において、小学校指標を補完する対の指標として機能する。",
      "adoptionCriteria": [
        "comparability",
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "中学校の体育館整備は小学校と比べてどの程度進んでいるか。",
      "targetReaderOrDecision": "学校施設整備の地域差を確認したい教育委員会・保護者"
    },
    "sports-annual-participation-rate-10plus": {
      "proposedBy": "令和3年社会生活基本調査 生活行動に関する結果（茨城県版）第3節「スポーツ」（茨城県企画部統計課）",
      "sourceUrl": "https://www.pref.ibaraki.jp/kikaku/tokei/fukyu/tokei/betsu/syakai/syakaichor3/kodo.html",
      "surveyedAt": "2026-09-16",
      "rationale": "総務省の社会生活基本調査を基に都道府県（茨城県）が公表したこの資料は、過去1年間にスポーツを行った人の割合を5年前の調査と比較する形で示しており、参加率が全国共通の設問・周期で継続測定される代表指標であることを裏付けている。この定義と経年比較の枠組みは、テーマが問う「スポーツ参加の都道府県差」を数値で捉える土台になる。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県では何割の人が実際にスポーツをしているか、全国や過去と比べて増えているか減っているか。",
      "targetReaderOrDecision": "都道府県のスポーツ振興計画担当者や、地域のスポーツ参加状況を把握したい読者。"
    },
    "sports-park-count": {
      "proposedBy": "公園とみどり：都市公園の種類（国土交通省都市局）",
      "sourceUrl": "https://www.mlit.go.jp/toshi/park/toshi_parkgreen_tk_000138.html",
      "surveyedAt": "2026-09-16",
      "rationale": "国土交通省のこの解説は、運動公園を都市公園法上の都市基幹公園の一種として、主に運動利用を目的に一定の面積規模で配置される公園と定義しており、社会体育施設（屋内外の体育施設）とは所管・分類が異なる屋外の大規模運動空間であることを示している。この定義の違いにより、同じ供給側指標でも社会体育施設数とは別角度の施設整備状況を比較できる。",
      "adoptionCriteria": [
        "complementarity",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県にはどれくらい運動公園があるか、社会体育施設とは何が違うか。",
      "targetReaderOrDecision": "都市公園整備・緑地行政を担当する自治体職員。"
    }
  },
  "tsunami-exposure": {
    "tsunami-evacuation-building-count": {
      "proposedBy": "内閣府「津波避難ビル・津波避難タワー等に関する取組調査結果について」(令和5年4月時点調査 参考資料1)",
      "sourceUrl": "https://www.bousai.go.jp/jishin/tsunami/hinan/pdf/sanko_1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "内閣府の調査は海岸線を有する、または津波の遡上等で被害が想定される全国40都道府県678市区町村を対象に津波避難ビルの指定・整備状況を集計しており、対象外の7県は調査そのものの範囲外であることが示されている。これはテーマ説明にある「40県が調査対象で、対象外7県は0件と扱わない」という取り扱いの直接的な根拠になり、津波避難ビル数を都道府県間で比較する際の前提を裏付ける。",
      "adoptionCriteria": [
        "representativeness",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "自分の都道府県には津波避難ビルが何棟指定・整備されているか。",
      "targetReaderOrDecision": "沿岸自治体の防災担当者や津波リスクのある地域の住民が避難先の整備状況を把握する際の参考情報。"
    },
    "tsunami-evacuation-tower-count": {
      "proposedBy": "内閣府「津波避難ビル・津波避難タワー等に関する取組調査結果について」(令和5年4月時点調査 参考資料1)",
      "sourceUrl": "https://www.bousai.go.jp/jishin/tsunami/hinan/pdf/sanko_1.pdf",
      "surveyedAt": "2026-09-16",
      "rationale": "同調査は津波避難タワー等の内訳をやぐら型・建物型・マウンド型・人工地盤・避難シェルターに分類しており、やぐら型が6割以上を占めると明記している。これは津波避難ビルとは異なる構造・立地特性を持つ施設群であることを示しており、ビル数だけでは捉えられない沿岸防災インフラの補完的な整備状況を都道府県別に比較する根拠となる。",
      "adoptionCriteria": [
        "complementarity",
        "comparability",
        "dataQuality"
      ],
      "readerQuestion": "津波避難タワー等はどのような型が多く、自分の都道府県にはどの程度整備されているか。",
      "targetReaderOrDecision": "津波避難ビルが少ない地域でタワー等による代替整備状況を確認したい自治体・住民。"
    }
  }
};
