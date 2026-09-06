/** Edition-only corrections. Public blog originals are not mutated by book generation. */
export interface EditorialCorrection {
  readonly before: string;
  readonly after: string;
  readonly reason: string;
}

export const KINDLE_EDITORIAL_CORRECTIONS: Readonly<Record<string, readonly EditorialCorrection[]>> = {
  "expenditure-structure-comparison": [{
    before: '民生費・土木費・人件費・衛生費・商工費の5つの目的別歳出割合から浮かび上がった構造を整理します。',
    after: '民生費・土木費・衛生費・商工費は目的別、人件費は性質別の分類です。人件費は他の目的別費目にも含まれるため、これら五つを重ならない歳出の内訳として足すことはできません。分類を分けて、各指標の構成比を振り返ります。',
    reason: 'personnel-expenditure-ratio-pref-finance の指標定義。性質別と目的別の構成比を排他的内訳として合計しない。',
  }],
  "real-disposable-income-reversal": [{
    before: 'この散布図は、横軸に1人当たり県民所得、縦軸に家賃控除後可処分所得をとったものです。両者が単純に比例するなら右肩上がりの直線に47都道府県が並ぶはずですが、実際には東京都だけが右下に大きく外れ、埼玉県・奈良県が左上に外れる「ねじれ」が見られます。',
    after: 'この散布図は、横軸に1人当たり県民所得、縦軸に家賃控除後可処分所得をとっています。東京都は横軸・縦軸とも掲載値が最大で、図の右上に位置します。二つの軸は対象年、母集団、金額の期間が異なるため、点の並びを家賃の効果として説明することはできません。',
    reason: '同梱散布図と図表入力の東京都の位置を照合。県民所得と家計調査由来の差引値は別母集団・別年であり、家賃効果の証拠ではない。',
  }],
  "engel-coefficient-prefecture-ranking": [{
    before: 'エンゲル係数を下げるには「食費を減らす」だけでなく、「消費支出全体を見直す」視点も重要です。固定費（通信費・保険料・サブスク）の削減で消費支出の構造を変えれば、食費の割合は相対的に下がります。',
    after: '食費が変わらないまま他の消費支出を減らすと、分母が小さくなるため、エンゲル係数は上がります。支出総額を減らせたことと、食費の割合が下がることは別です。家計の見直しでは、係数を下げること自体を目標にせず、必要な支出と収支を実額で確認します。',
    reason: '食料費÷消費支出×100。分子一定で分母を減らすと比率は上昇する。保険料を一律に消費支出とする例示も除去する。',
  }],
};

export function correctBookArticle(slug: string, body: string): string {
  for (const correction of KINDLE_EDITORIAL_CORRECTIONS[slug] ?? []) {
    if (body.split(correction.before).length !== 2) {
      throw new Error(`Editorial correction source changed: ${slug}. Re-review the source before generating an edition.`);
    }
    body = body.replace(correction.before, correction.after);
  }
  return body;
}
