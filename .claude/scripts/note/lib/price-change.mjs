/**
 * note の価格変更の判定 (ネットワークに触らない部分)。価格の履歴は data/products/price-history.json。
 */
const countAttachments = (body) => (String(body).match(/embedded-service="attachment"/g) ?? []).length;

/** 実験の未適用の変更を返す。実験が無い・適用先の指定が台帳に無いときは止める */
export function plannedChanges(history, experimentId, productKey = null) {
  if (!history.experiments.some((experiment) => experiment.id === experimentId)) throw new Error(`実験が台帳に無い: ${experimentId}`);
  const planned = history.changes.filter(
    (change) => change.experimentId === experimentId && change.status === "planned" && (!productKey || change.productKey === productKey),
  );
  if (productKey && planned.length === 0) throw new Error(`未適用の変更が台帳に無い: ${productKey}`);
  return planned;
}

/**
 * 更新の前に止める条件。価格が台帳と違う記事を別の版で上書きしない。
 * 下書きは公開版と違うときだけ止める (note は編集画面を開くだけで公開版と同じ下書きを自動保存する)。
 */
export function preflightProblems(change, published, draft = null) {
  const problems = [];
  if (published.user?.urlname !== "stats47" || published.status !== "published") problems.push("帰属または公開状態が不正");
  const sameAsPublished = draft && String(draft.body) === String(published.body) && draft.name === published.name && Number(draft.price) === Number(published.price);
  if (published.has_draft && !sameAsPublished) problems.push("公開版と違う下書きがある");
  if (Number(published.price) !== change.fromYen) problems.push(`公開中の価格 ${published.price} が台帳の変更前 ${change.fromYen} と違う`);
  return problems;
}

/** 更新の後の読み戻し。価格だけが変わり、本文・有料の境界・添付・タグは同じであること */
export function liveProblems(change, before, after) {
  const problems = [];
  if (Number(after.price) !== change.toYen) problems.push(`価格が ${after.price}`);
  if (after.status !== "published") problems.push("公開状態が変わった");
  if (String(after.body) !== String(before.body)) problems.push("本文が変わった");
  if (after.separator !== before.separator) problems.push("有料の境界が変わった");
  if (countAttachments(after.body) !== countAttachments(before.body)) problems.push("添付の数が変わった");
  if ((after.hashtag_notes ?? []).length !== (before.hashtag_notes ?? []).length) problems.push("ハッシュタグの数が変わった");
  return problems;
}
