/**
 * 公開してはいけない「作り手が試していない」断り書きを本文から見つける決定的ゲート。
 *
 * 2026-10-24 に、Excel が無い Mac で書いた操作記事が「検証状況: この制作環境には Excel がなく…確認できていません」を
 * 本文に残したまま公開された。同じ形の断り書きが商品パック記事 13 本 (販売準備原稿の「実機確認は未了です」) と
 * QGIS・マイマップの記事にも残っていた。未検証を正直に書くことは制作中の記録としては正しいが、読者に出す本文には
 * 置かない。検証してから書き直すか、公開しない。
 *
 * 呼び出し元: publish-new-note.sh (新規公開の前)・patch-note-paid-landing.mjs (公開済み本文の PUT 前)・
 * audit-note-unverified.mjs (公開済み全記事の週次監査)。
 *
 * 語は実際に公開された言い回しから作り、記事の内容として正しく使われる語 (「○○課」「[要確認] を付与」
 * 「# 動作確認」「公開事例は確認できていません」) には当たらないようにしている。追加するときはテストに
 * 当たる例と当たらない例の両方を足す。
 */

export const UNVERIFIED_RULES = [
  { code: "verification-status-note", label: "検証状況・検証範囲の断り書き", re: /検証(状況|範囲)\s*[（(:：]/ },
  { code: "production-environment", label: "制作環境・作成側への言及", re: /制作環境|このMac(には|では)|この端末(には|では)|作成側での/ },
  {
    code: "device-unverified",
    label: "実機で確認していない",
    re: /実機[^。]{0,25}?(未了|未確認|できていません|していません|完了していません)/,
  },
  {
    code: "behavior-unverified",
    label: "操作・表示を確認していない",
    re: /(表示|動作|操作|画面|手順)(は|を)?[^。]{0,4}?確認(できていません|していません|は未了|が完了していません)|stats47では(まだ)?確認できていません/,
  },
];

const normalize = (text) => String(text ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");

/** 本文 (Markdown / HTML / テキスト) から断り書きを探す。見つかった規則ごとに 1 件、前後の文を付けて返す。 */
export function findUnverifiedDisclosures(text) {
  const plain = normalize(text);
  const hits = [];
  for (const rule of UNVERIFIED_RULES) {
    const m = plain.match(rule.re);
    if (!m) continue;
    hits.push({ code: rule.code, label: rule.label, excerpt: plain.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).trim() });
  }
  return hits;
}

export function formatDisclosures(hits) {
  return hits.map((h) => `  - ${h.label} (${h.code}): …${h.excerpt}…`).join("\n");
}
