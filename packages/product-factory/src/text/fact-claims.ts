/**
 * 本文から「県 + 値」の主張を取り出し、SSOT と突合するための純関数。
 *
 * ★値だけで突き合わせてはならない (2026-08-12 実測)。書籍が扱う 24 指標 × 全年 = 数千件の
 * 値集合に対して「2% 以内に何かがあるか」を見ると、ほぼどんな数字でも当たってしまう:
 *   545,000 → 静岡県 552,182 に誤一致 / 176,000 → 東京都の**家賃** 175,694 に誤一致
 * (本文は可処分所得の話なのに家賃と一致してしまう)。
 * **どの県の話かを取り、その県の値と比べる**ことで初めて意味のある判定になる。
 */
import { conversionFactor } from "@stats47/data-configs/unit";

/** 47 都道府県名 (「県」等を含む正式名と、本文でよく使う短縮形の両方を拾う)。 */
export const PREFECTURES = [
  "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
  "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
  "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知",
  "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
  "鳥取", "島根", "岡山", "広島", "山口",
  "徳島", "香川", "愛媛", "高知",
  "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
] as const;

/**
 * 「東京都」「東京」どちらでも同じ県として正規化する。
 * ★「北海道」は末尾の「道」を落とすと「北海」になり県として解決できなくなるので、
 *   接尾辞を外す前に完全一致を先に見る (2026-08-12 にテストで検出)。
 */
export function normalizePrefName(name: string): string | null {
  const raw = String(name).trim();
  const list = PREFECTURES as readonly string[];
  if (list.includes(raw)) return raw;
  const s = raw.replace(/[都道府県]$/, "");
  return list.includes(s) ? s : null;
}

export interface FactClaim {
  /** 主張が指す県 (正規化済み)。 */
  readonly pref: string;
  /** 主張された数値。 */
  readonly value: number;
  /** 単位 (円 / 人 / ％ / 倍 / 位 など)。 */
  readonly unit: string;
  /**
   * 文脈から読み取れる代替の単位 (分母つき表記)。**どれか 1 つで一致すれば可**とする。
   * 「人口千人あたり8.55人 … 最下位の秋田県は3.95人」のように分母が文の前半にしか
   * 現れない書き方があり、後半の数値を素の「人」に決め打つと誤検出になる。
   * 決められないものを弾かない (誤検知を出すゲートは運用で無効化される)。
   */
  readonly altUnits?: readonly string[];
  /**
   * 文脈から読み取れる代替の値。負値を語で表す書き方 (「4,687人の転出超過」) を拾う。
   * SSOT は -4,687 で持つので、符号を落としたまま比べると正しい本文が不一致になる。
   */
  readonly altValues?: readonly number[];
  /** 原文の該当箇所。 */
  readonly raw: string;
  /** 行内の位置 (報告用)。 */
  readonly index: number;
}

/**
 * 県名と数値がこの距離以内にあれば「その県の主張」とみなす。
 * 離れるほど係り受けが不明になり誤判定を生むので短く取る
 * (「東京都は623,317円」は 2 文字、「東京都の家賃は月176,000円」でも 9 文字)。
 */
const PROXIMITY = 16;

/**
 * 本文で数値に付く単位。**長いものを先に並べる** (正規表現の交替は最左最長ではなく先勝ち)。
 *
 * ★分母つき単位を切り詰めてはならない (2026-08-12 実測)
 *   「秋田県は通院者率が496人口千対で全国1位」を `人` で切ると単位が「人」になり、
 *   SSOT が「人口千対」で持つ通院者率とは単位が揃わないため比較対象から外れる。
 *   残った素の「人」の指標 (糖尿病死亡者数など) と比べられて、**正しい本文が不一致**になった
 *   (K-S2-01 / K-S2-03 / K-S3-02 で計 36 件。すべて誤検出)。
 *   分母は単位の一部であって省略できない — 正典: `.claude/rules/unit-semantics-standards.md` §4。
 */
const BASE_CLAIM_UNITS = ["円", "人", "％", "%", "位", "件", "世帯"] as const;

/**
 * 単位の交替パターンを作る。**長い順**に並べ、正規表現の先勝ちで最長一致にする。
 *
 * 呼び出し側 (`audit-book-facts`) はその書籍が扱う指標の SSOT 単位を渡す。
 * 固定リストを持たないのは、単位の語彙が e-Stat 由来で 130 種以上あり、手で並べると
 * 必ず取りこぼすため — 実際に「人泊」「人口千対」を落として誤検出を出した。
 * **本文に出うる単位は、その書籍の指標の単位そのもの**なので、そこから作るのが確実。
 */
function unitPattern(extra: readonly string[] = []): string {
  const all = [...new Set([...extra, ...BASE_CLAIM_UNITS].map((u) => u.trim()).filter(Boolean))];
  all.sort((a, b) => b.length - a.length);
  return all.map((u) => u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
}

/**
 * 数値の**前**に置かれた分母表現 → SSOT の単位表記。
 *
 * ★語順が 2 通りある (2026-08-12 実測)
 *   「496人口千対」  … 分母が数値の後ろ (単位として直接付く)
 *   「人口千人あたり5.36人」… 分母が数値の前 (読み物としてはこちらが自然)
 *   後者を素の「人」として扱うと、SSOT が「人口千対」で持つ婚姻率・粗出生率と単位が揃わず
 *   比較対象から外れ、残った素の「人」の指標と比べられて**正しい本文が不一致**になる。
 *   分母は単位の一部 — 正典: `.claude/rules/unit-semantics-standards.md` §4。
 */
const LEADING_DENOMINATORS: ReadonlyArray<readonly [RegExp, string]> = [
  [/人口(?:千|1,?000)人?(?:あたり|当たり|当り|対)$/, "人口千対"],
  [/人口(?:10万|100,?000)人?(?:あたり|当たり|当り|対)$/, "人口10万対"],
];

/** 数値の直前 (最大 12 文字) に分母表現があればその SSOT 単位を返す。 */
function leadingDenominator(body: string, numStart: number): string | null {
  const head = body.slice(Math.max(0, numStart - 12), numStart);
  for (const [re, unit] of LEADING_DENOMINATORS) if (re.test(head)) return unit;
  return null;
}

/** 同じ文の中に分母表現があれば、その単位を候補として返す (直前でなくてよい)。 */
function sentenceDenominators(body: string, numStart: number): string[] {
  const start = Math.max(
    body.lastIndexOf("。", numStart - 1) + 1,
    body.lastIndexOf("\n", numStart - 1) + 1,
  );
  const scope = body.slice(start, numStart);
  const out: string[] = [];
  for (const [re, unit] of LEADING_DENOMINATORS) {
    // 文中のどこかに現れればよいので末尾アンカーを外して探す
    if (new RegExp(re.source.replace(/\$$/, "")).test(scope)) out.push(unit);
  }
  return out;
}

/**
 * 1 行から「県 + 値」の主張を取り出す。
 *
 * 県名の**直後**に数値がある場合だけを採る (「東京都は623,317円」)。
 * 逆順 (「623,317円の東京都」) は係り受けが曖昧で誤判定を生みやすいので採らない
 * — 検出漏れは許容し、誤検出を出さないことを優先する。
 */
export function extractFactClaims(line: string, units: readonly string[] = []): FactClaim[] {
  const out: FactClaim[] = [];
  const body = String(line);
  const prefRe = new RegExp(`(${PREFECTURES.join("|")})[都道府県]?`, "g");
  // 負値 (地価変動率など) も取りこぼさない
  const numRe = new RegExp(`(-?[0-9][0-9,]*(?:\\.[0-9]+)?)\\s*(${unitPattern(units)})`, "g");

  const prefs: Array<{ name: string; start: number; end: number }> = [];
  for (const m of body.matchAll(prefRe)) {
    const name = normalizePrefName(m[0]);
    if (name) prefs.push({ name, start: m.index, end: m.index + m[0].length });
  }
  if (prefs.length === 0) return out;

  for (const m of body.matchAll(numRe)) {
    let value = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    const numEnd = m.index + m[0].length;

    // ★全国平均は県の主張ではない。直前に県名が並んでいても係り受けは「全国平均」にある
    //   (実測: 「東北・九州・沖縄の県が下位に並びます。全国平均は328千円で」の 328 が
    //   沖縄県の値として拾われ、正しい本文が不一致になった)。
    if (/(?:全国平均|全国では|全国は|全国の平均)(?:は|が|で)?$/.test(body.slice(Math.max(0, m.index - 8), m.index))) continue;

    // ★語彙的用法は数値の主張ではない (「1人あたり」「1世帯当たり」)。
    //   拾うと素の「人」の指標と比べられて誤検出になる (2026-08-12 実測)。
    //   概数・程度を表す語が続く場合も数値の主張ではない (「1人近く」「3割ほど」)。
    if (/^(?:あたり|当たり|当り|近く|程度|ほど|前後|余り|あまり|ずつ)/.test(body.slice(numEnd))) continue;

    // ★「マイナス18.7‰」「4,687人の転出超過」は負値を語で表す。符号を落として比べると
    //   SSOT の -18.7 と一致せず、正しい本文が不一致になる。
    const before = body.slice(Math.max(0, m.index - 5), m.index);
    if (/(?:マイナス|▲|△)$/.test(before)) value = -value;
    const after = body.slice(numEnd, numEnd + 8);
    const negWord = /(?:転出超過|減少|減|マイナス)/.test(after);

    // ★日本語で最も多いのは「1位は大分県の308.8GJ」のように**数値が県の前**に来る語順。
    //   後方の県を見ないと「3位」が直前の別の県に付いてしまう (2026-08-12 に大量の誤検出)。
    //   数値の直後に助詞をはさんで県名が来る場合は、その県を優先する。
    //   結び付けてよいのは係助詞で直結する場合だけ。読点「、」は節の切れ目なので含めない
    //   (「全国1位、山形県は…」の 1 位は直前の県の話であり、山形の順位ではない)。
    const following = prefs.find(
      (p) => p.start >= numEnd && p.start - numEnd <= 3 && /^[はがので]*$/.test(body.slice(numEnd, p.start)),
    );
    const lead = leadingDenominator(body, m.index);
    const alts = sentenceDenominators(body, m.index);
    if (following) {
      out.push({ pref: following.name, value, unit: lead ?? m[2], altUnits: alts, altValues: negWord ? [-value] : undefined, raw: m[0], index: m.index });
      continue;
    }

    // 直前で最も近い県名を採る
    let best: { name: string; end: number } | null = null;
    for (const p of prefs) {
      if (p.end <= m.index && m.index - p.end <= PROXIMITY) {
        if (!best || p.end > best.end) best = p;
      }
    }
    if (!best) continue;
    out.push({ pref: best.name, value, unit: lead ?? m[2], altUnits: alts, altValues: negWord ? [-value] : undefined, raw: m[0], index: m.index });
  }
  return out;
}

/** SSOT の 1 指標 1 年分。 */
export interface TruthSeries {
  readonly metric: string;
  readonly year: string;
  /** 正規化した県名 → 値 */
  readonly byPref: ReadonlyMap<string, number>;
  /** 正規化した県名 → 順位 */
  readonly rankByPref: ReadonlyMap<string, number>;
  /** SSOT 側の単位 (「千円」「円」「％」など)。本文の単位と揃えるのに使う。 */
  readonly unit?: string;
}

/**
 * SSOT の単位と本文の単位を揃える倍率を返す。揃えられなければ null。
 *
 * ★SSOT は「千円」で持つのに本文は「円」で書くことがある (県民所得 5,204千円 ↔ 5,204,000円)。
 *   換算せずに比べると 1000 倍ずれて**全件が不一致**になり、監査が意味を失う
 *   (2026-08-12 に K-S1-01 で実際に誤検出した)。
 */
export function unitScale(ssotUnit: string | undefined, claimUnit: string): number | null {
  const s = (ssotUnit ?? "").trim();
  // SSOT に単位が無い (取り込み側で欠落) 場合だけは、本文の単位で書かれている前提で 1 とみなす。
  // ここ以外で 1 へフォールバックしてはならない (桁違いが「一致」になる)。
  if (s === "") return 1;
  return conversionFactor(s, claimUnit);
}

export type ClaimVerdict =
  | { readonly kind: "match"; readonly metric: string; readonly year: string }
  | { readonly kind: "mismatch"; readonly nearest: { metric: string; year: string; actual: number } | null }
  | { readonly kind: "unknown-pref" };

/** 相対誤差の許容 (本文は丸めて書かれる)。 */
const TOLERANCE = 0.02;

/**
 * 主張を SSOT と突合する。
 *
 * 「その県のその値」が、書籍が扱ういずれかの指標・年に存在すれば match。
 * 順位 (単位「位」) は rank と突合する。
 */
export function verifyClaim(claim: FactClaim, truth: readonly TruthSeries[]): ClaimVerdict {
  let nearest: { metric: string; year: string; actual: number } | null = null;
  let nearestDiff = Infinity;
  let sawPref = false;

  for (const t of truth) {
    if (claim.unit === "位") {
      const rank = t.rankByPref.get(claim.pref);
      if (rank === undefined) continue;
      sawPref = true;
      if (rank === claim.value) return { kind: "match", metric: t.metric, year: t.year };
      const diff = Math.abs(rank - claim.value) / Math.max(1, Math.abs(rank));
      if (diff < nearestDiff) {
        nearestDiff = diff;
        nearest = { metric: t.metric, year: t.year, actual: rank };
      }
      continue;
    }
    const raw = t.byPref.get(claim.pref);
    if (raw === undefined) continue;
    // SSOT の単位 (千円等) を本文の単位 (円) に揃える。揃えられない組は比較しない。
    // 候補単位 (分母つき表記) のいずれかで揃えば、その解釈で比べる。
    let scale: number | null = null;
    for (const u of [claim.unit, ...(claim.altUnits ?? [])]) {
      const f = unitScale(t.unit, u);
      if (f !== null) { scale = f; break; }
    }
    if (scale === null) continue;
    const actual = raw * scale;
    sawPref = true;
    const near = (v: number): boolean =>
      Math.abs(actual - v) <= Math.max(1, Math.abs(actual) * TOLERANCE);
    if ([claim.value, ...(claim.altValues ?? [])].some(near)) {
      return { kind: "match", metric: t.metric, year: t.year };
    }
    const diff = Math.abs(actual - claim.value) / Math.max(1, Math.abs(actual));
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearest = { metric: t.metric, year: t.year, actual };
    }
  }
  // ★値だけの照合 (単位を無視してその県のどこかに同じ値があるか) は**採らない**。
  //   一度実装して実測したところ、誤値を 3 件注入して検出できたのは 1 件だけだった
  //   (2 倍・5% ずらしが、同じ県の別指標に偶然一致して通ってしまう)。
  //   単位の曖昧さは本文側で解消する — 「3.95人」ではなく「3.95人（人口千対）」と書けば
  //   読者にとっても正確になる。ゲートを緩めて曖昧な本文を通す方向には倒さない。
  if (!sawPref) return { kind: "unknown-pref" };
  return { kind: "mismatch", nearest };
}
