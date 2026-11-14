/**
 * KDP の紹介文とキーワードの組み立てと監査 (2026-11-06 オーナー依頼。正典 kindle-publishing-standards.md)。
 *
 * 紹介文は定型文の差し替えではなく、読者の悩み・読み終えて分かること・想定読者・収録内容を本ごとに持つ。
 * 図と全県表の数、全県表のある指標の一覧 (指標・年・単位) は実際の EPUB を測った kindle-quality.json から入れ、手で書かない。
 * 禁止事項は KDP のメタデータ指針 (https://kdp.amazon.com/en_US/help/topic/G201097560、2026-11-06 確認)、
 * キーワードの規則は https://kdp.amazon.com/en_US/help/topic/G201298500 (同日確認) に合わせる。
 */

export const KDP_DESCRIPTION_MAX_CHARS = 4000;
export const KDP_KEYWORD_SLOTS = 7;
/** 定型の【データについて】が紹介文に占める割合の上限。これを超えると本ごとの内容が薄い */
const MAX_DATA_BLOCK_RATIO = 0.35;

export const LISTING_DATA_BLOCK =
  "【データについて】\n" +
  "e-Stat（政府統計の総合窓口）などの公的統計をもとに編集しています。国・府省・自治体や e-Stat の公認・推奨を示すものではありません。" +
  "収録年と定義は指標ごとに異なり、巻末の出典にまとめています。";

const RESTRICTED = [
  [/https?:\/\/|www\.|[a-z0-9-]+\.(?:jp|com|net|org)\b/i, "Web サイトの URL は載せられない"],
  [/[\w.+-]+@[\w-]+\.\w+/, "メールアドレスは載せられない"],
  [/\b0\d{1,4}-\d{1,4}-\d{3,4}\b/, "電話番号は載せられない"],
  [/レビュー|口コミ|星\d|★/, "レビューや評価の依頼・引用は載せられない"],
  [/[¥￥]\s?\d|\d+\s*円で|販売価格|定価|価格は|割引|セール|無料|読み放題|Kindle Unlimited|購入はこちら/i, "価格や入手方法は載せられない"],
  [/期間限定|今だけ|新発売|近日|開催/, "時期に左右される情報は載せられない"],
  [/ベストセラー|No\.?\s?1|ナンバーワン|唯一の|必ず|絶対に?|確実に/i, "誇張した表現は使わない"],
];
const KEYWORD_RESTRICTED = /ベストセラー|おすすめ|人気|新刊|最新|セール|無料|kindle|best/i;
const REPEATED_OPENING = /^(本書は|この本は|統計の比較を)/;

const compact = (text) => String(text ?? "").replace(/\s/g, "");

/** 新版に KDP が求める冒頭の免責文 (https://kdp.amazon.com/en_US/help/topic/GW7J4WEKBVU25YEC)。 */
export function previousEditionDisclaimer(listing) {
  if (!listing?.replacesAsin) return "";
  const predecessor = (listing.previousEditions ?? []).find((edition) => edition.asin === listing.replacesAsin);
  if (!predecessor) throw new Error(`${listing.id}: replacesAsin と previousEditions が対応しない`);
  return `Previously published as ${predecessor.title} by ${predecessor.author}.`;
}

function contentsLine(facts) {
  const parts = [];
  if (facts.figures > 0) parts.push(`図 ${facts.figures} 点`);
  if (facts.fullTables > 0) parts.push(`47 都道府県の全県表 ${facts.fullTables} 表`);
  // 図も全県表も無い本 (K-S1-14) は、実測した本文の字数を載せる
  if (parts.length === 0 && facts.chars > 0) parts.push(`本文 ${facts.chars.toLocaleString("ja-JP")} 字`);
  if (parts.length === 0) throw new Error("収録内容の実測が無い");
  return `${parts.join("、")}を収録しています。`;
}

/**
 * 比較の単位。全冊が都道府県単位の本で、市区町村ごとの一覧は無い (2026-11-13 オーナー依頼: どの粒度のデータかを紹介文で分かるようにする)。
 * 家計調査の値を載せる本は、県全体でなく県庁所在市の値であることを足す (EPUB の全県表の注記を測った householdCityValues)。
 * 世帯の種類 (二人以上の世帯・勤労者世帯) は指標ごとに違うので、この文には書かない (2026-11-13 の照合で K-S1-01 の勤労者世帯の 4 表と食い違った)。
 * 家計調査以外で県全体でない値を載せる本は、原稿の scopeNote に書く (K-S1-13 の家賃。機械では測れないので別エージェントが本文と照合する)。
 */
export function dataScopeBlock(facts, copy = {}) {
  // 県庁所在市を比べる本 (K-S1-14) のように単位が違う本は、原稿の scopeLead で 1 文目を差し替える
  const lines = [copy.scopeLead ?? "比較の単位は都道府県です。47都道府県を並べて比べます。市区町村ごとの順位や一覧は収録していません。"];
  if (facts.householdCityValues) lines.push("家計調査の指標は、県全体ではなく、各県の県庁所在市（東京都は区部）の世帯を調べた値です。");
  if (copy.scopeNote) lines.push(copy.scopeNote);
  return `【データの範囲】\n${lines.join("")}`;
}

const INDICATOR_HEADING = "【全県の値を表で収録している指標】";

/** 全県表のある指標の一覧 (指標・年・単位)。EPUB の見出しを測った fullTableIndicators から作り、手で書かない。無い本は出さない。 */
export function indicatorBlock(facts) {
  const indicators = facts.fullTableIndicators ?? [];
  if (indicators.length === 0) return "";
  const line = ({ label, period, unit }) => `・${label}（${period}${unit ? `・${unit}` : ""}）`;
  return `${INDICATOR_HEADING}\n${indicators.map(line).join("\n")}`;
}

const DATA_BLOCK_TAIL = "収録年と定義は指標ごとに異なり、巻末の出典にまとめています。";

/** 【データについて】。1 つの統計で年をそろえた本 (K-S1-14) は、原稿の dataSourceLine で末尾の 1 文を差し替える。 */
export function dataBlock(copy = {}) {
  return copy.dataSourceLine ? LISTING_DATA_BLOCK.replace(DATA_BLOCK_TAIL, copy.dataSourceLine) : LISTING_DATA_BLOCK;
}

export function renderListingDescription(copy, facts, disclaimer = "") {
  return [
    disclaimer,
    copy.hook,
    `【この本で分かること】\n${copy.points.map((point) => `・${point}`).join("\n")}`,
    dataScopeBlock(facts, copy),
    indicatorBlock(facts),
    `【こんな方に】\n${copy.forWhom.map((reader) => `・${reader}`).join("\n")}`,
    `【収録内容】\n${contentsLine(facts)}`,
    dataBlock(copy),
  ].filter(Boolean).join("\n\n");
}

/** 別のエージェントが今の EPUB と照合済みか。原稿の約束と本文のずれは機械では見つからないので、台帳へ写す条件にする。 */
export function hasCurrentReview(copy, facts) {
  return Boolean(copy?.review?.epubSha256) && copy.review.epubSha256 === facts?.epubSha256;
}

/**
 * KDP へ送った原稿 (status: submitted / reflected) は、台帳の紹介文・キーワードと一致し続ける。
 * 台帳を手で直すとここで止まる (台帳は原稿から apply で作る)。
 */
export function ledgerDriftIssues(copy, listing, description) {
  if (!["submitted", "reflected"].includes(copy?.status)) return [];
  const issues = [];
  if (listing?.description !== description) issues.push("台帳の紹介文が原稿と違う (台帳を手で直さず、原稿を直して apply する)");
  if (JSON.stringify(listing?.keywords ?? []) !== JSON.stringify(copy.keywords ?? [])) issues.push("台帳のキーワードが原稿と違う");
  return issues;
}

/**
 * 公開 (新刊・既刊の更新) の前提。承認済みか KDP へ送った原稿があり、今の EPUB と照合した
 * 別エージェントのレビューがあること。原稿の無い本を公開しない。
 */
export function publicationCopyIssues(id, copy, facts) {
  if (!copy) return [`${id}: 紹介文の原稿が無い (紹介文の原稿の台帳 kdp.listing-copy に書いて承認を得る)`];
  const issues = [];
  if (!["approved", "submitted", "reflected"].includes(copy.status)) issues.push(`${id}: 原稿が承認されていない (status=${copy.status ?? "なし"})`);
  if (!hasCurrentReview(copy, facts)) issues.push(`${id}: 今の EPUB と照合した別エージェントのレビューが無い`);
  return issues;
}

/** KDP が受け付けない内容の検査。台帳の紹介文を KDP へ送る前にも使う。 */
export function restrictedDescriptionIssues(description) {
  const body = String(description ?? "").replace(/^Previously published as .*$/m, "");
  const issues = RESTRICTED.filter(([pattern]) => pattern.test(body)).map(([, message]) => message);
  if (String(description ?? "").length > KDP_DESCRIPTION_MAX_CHARS) issues.push(`紹介文は ${KDP_DESCRIPTION_MAX_CHARS} 字以内`);
  return issues;
}

/**
 * 1 冊の原稿の監査。errors が空なら規則を満たす。
 * books: { id, listing, copy, facts, description } の全冊ぶん。冊間の重複を見るので全冊を渡す。
 * bookText は EPUB の本文 (手元に EPUB がある Mac でだけ渡す)。無ければキーワードの本文照合を飛ばし skipped に記す。
 */
export function auditListingCopy(id, books, bookText) {
  const entry = books.find((book) => book.id === id);
  const errors = [];
  const skipped = [];
  if (!entry?.copy) return { errors: [`${id}: 原稿が無い`], skipped };
  const { copy, listing, description } = entry;

  errors.push(...restrictedDescriptionIssues(description));
  errors.push(...ledgerDriftIssues(copy, listing, description));

  if (listing.replacesAsin && !description.startsWith(previousEditionDisclaimer(listing))) {
    errors.push("新版は紹介文の冒頭に旧版の刊行情報が要る");
  }
  if (REPEATED_OPENING.test(copy.hook)) errors.push("冒頭は読者の悩みから始める (「本書は」で始めない)");
  if (!/[？?]|たい|か分から|ない/.test(copy.hook)) errors.push("冒頭に読者の悩みや知りたいことが無い");

  if (!entry.facts) {
    errors.push("収録内容の実測 (kindle-quality.json) が無い");
  } else {
    if (entry.facts.epubPath !== listing.epubPath) errors.push("実測の版が台帳の EPUB と違う。kindle:quality --write で測り直す");
    if (!description.includes(contentsLine(entry.facts))) errors.push("収録内容が実測と一致しない");
    if (!Array.isArray(entry.facts.fullTableIndicators) || typeof entry.facts.householdCityValues !== "boolean") {
      errors.push("実測に指標の一覧が無い。kindle:quality --write で測り直す");
    } else {
      // ブロックの終わり (空行) まで照合する。前方一致だと、実測に無い 1 文や 1 行が後ろに足されていても通る
      const indicators = indicatorBlock(entry.facts);
      if (!description.includes(`${dataScopeBlock(entry.facts, copy)}\n\n`)) errors.push("データの範囲が実測と一致しない");
      if (indicators ? !description.includes(`${indicators}\n\n`) : description.includes(INDICATOR_HEADING)) {
        errors.push("収録している指標が実測と一致しない");
      }
    }
  }

  const dataRatio = compact(LISTING_DATA_BLOCK).length / compact(description).length;
  if (dataRatio > MAX_DATA_BLOCK_RATIO) errors.push(`定型文の割合 ${(dataRatio * 100).toFixed(0)}% が上限 ${MAX_DATA_BLOCK_RATIO * 100}% を超える`);

  const own = [copy.hook, ...copy.points, ...copy.forWhom].map(compact);
  for (const other of books) {
    if (other.id === id || !other.copy) continue;
    const theirs = new Set([other.copy.hook, ...other.copy.points, ...other.copy.forWhom].map(compact));
    const shared = own.filter((text) => theirs.has(text));
    if (shared.length) errors.push(`${other.id} と同じ文が ${shared.length} 件ある`);
  }

  if (new Set(copy.keywords).size !== KDP_KEYWORD_SLOTS) errors.push(`キーワードは重複なしで ${KDP_KEYWORD_SLOTS} 枠すべて使う`);
  const titleText = compact(`${listing.title}${listing.subtitle ?? ""}`);
  for (const keyword of copy.keywords) {
    if (KEYWORD_RESTRICTED.test(keyword)) errors.push(`キーワードに宣伝語がある: ${keyword}`);
    if (titleText.includes(compact(keyword))) errors.push(`題名にある語はキーワードに重ねない: ${keyword}`);
    if (bookText !== undefined && !compact(bookText).includes(compact(keyword))) {
      errors.push(`本文に無い語をキーワードにしている: ${keyword}`);
    }
  }
  if (bookText === undefined) skipped.push("キーワードの本文照合 (EPUB が無い)");
  return { errors, skipped };
}
