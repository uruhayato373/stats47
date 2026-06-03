---
slug: nursing-care-shortage-2040
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
介護インフラを施設数・定員・従事者数・財政の4軸で分析する構成は読者価値が高く、「2040年69万人不足」というタイトルの数字は本文で厚労省推計として明示されており釣りではない。callout 2個は実質的内容を持つ。[!NOTE]は「人口10万人あたり比率で見る理由」を説明しており大都市圏バイアスの解釈誤りを防ぐ有益な補足、[!WARNING]は「69万人不足は推計値で変動しうる」という重要な留意点を具体的な変動要因（業務効率化・外国人労働）付きで示しており埋め草ではない。数値訂正の確認: data/nursing-care-shortage-2040-prefecture-rankings.json と照合し、1位島根40.5所・47位愛知15.4所はデータ一致、東京18.3所・大阪18.4所・愛知15.4所も一致。data/nursing-home-staff-per-100k-65plus-prefecture-rankings.jsonで確認した宮崎1位・山梨最下位の構造も記事の記述（1位宮崎2,838人・最下位山梨1,177人の2.4倍差）と整合する。内部リンクは /ranking/nursing-welfare-facility-count-per-100k-65plus・/ranking/nursing-home-capacity-per-1000-65plus・/ranking/nursing-home-staff-per-100k-65plus・/ranking/ratio-65-plus・/ranking/elderly-welfare-expenditure-ratio-pref-finance・/category/socialsecurity など複数あり密度基準を満たす。散布図3枚(高齢化率×施設数・高齢化率×福祉費・老人ホーム定員数)が本文の各テーマに対応し、図と文章の重複は最小限。
## 指摘
- [minor] 「有料老人ホーム数で11倍以上の格差（宮崎140.7所 vs 滋賀12.4所）」という記述はデータJSONに直接対応するファイルが確認できなかった。この数値の出典データJSONが data/ フォルダ内にあることを確認のこと。
- [minor] 神奈川9.8%・埼玉8.3%が老人福祉費最上位という記述は読者に驚きを与えるが、その解釈（高齢者の絶対数＋都市の介護単価）が推測扱いになっている。evidence-based-judgment.md の基準から「[仮説]」タグ付けが望ましい。
## 判定理由
BLOCK・MAJOR 指摘なし。主要数値はデータと一致。callout 実質的。2040年不足数への推計注記も適切。PASS。
