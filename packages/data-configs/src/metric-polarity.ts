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
export const MIN_POLARITY_COVERAGE = 58;

/** 極性を引く。未収載なら null (既定に化けない)。 */
export function findMetricPolarity(key: string): PolarityEntry | null {
  return METRIC_POLARITY[key] ?? null;
}
