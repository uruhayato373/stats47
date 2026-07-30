/**
 * 都道府県が area 軸ではなく **cat 軸**に入っている表の写像 (純粋関数)。
 *
 * ## なぜ要るか
 *
 * e-Stat には都道府県を `@area` ではなく分類軸に持つ表がある。
 *   - 患者調査 (0004026104 系): cat03 に `1=全国 2=北海道 … 48=沖縄` の連番
 *   - 畜産統計 (0004047181): cat01 に `1013=都道府県_北海道 …` の任意コード
 *
 * `@area` を読む通常経路ではこれらが構造的に 0 行になる。2026-07-29 に 6 metric が
 * 「cdCat01 の誤座標」と誤診されていた真因がこれ (座標は正しく、軸の形が違った)。
 *
 * ## 写像は必ず**名前で検証**する
 *
 * 連番 (`seq-pref`) は写像そのものは決定的だが、**コードの並びが本当に県コード順か**は
 * 保証されない。誤ればデータが県ごとまるごと入れ替わり、しかも 47 行そろうので
 * 形状ゲートを通ってしまう (最悪の壊れ方)。そこで連番でも必ず CLASS 名と突き合わせ、
 * 1 件でも食い違えば **fail** する。
 */

/**
 * 都道府県コード (5 桁) と正準名。
 *
 * e-Stat の分類軸は「青森」「東京」のように接尾辞を落とした表記を使うことがあるため、
 * 照合は接尾辞 (都/府/県) を除いた短縮形で行う。北海道だけは「北海」にしない
 * (「道」は接尾辞ではなく名前の一部)。
 */
export const PREFECTURES: ReadonlyArray<{ code: string; name: string; short: string }> = [
  ["01000", "北海道", "北海道"], ["02000", "青森県", "青森"], ["03000", "岩手県", "岩手"],
  ["04000", "宮城県", "宮城"], ["05000", "秋田県", "秋田"], ["06000", "山形県", "山形"],
  ["07000", "福島県", "福島"], ["08000", "茨城県", "茨城"], ["09000", "栃木県", "栃木"],
  ["10000", "群馬県", "群馬"], ["11000", "埼玉県", "埼玉"], ["12000", "千葉県", "千葉"],
  ["13000", "東京都", "東京"], ["14000", "神奈川県", "神奈川"], ["15000", "新潟県", "新潟"],
  ["16000", "富山県", "富山"], ["17000", "石川県", "石川"], ["18000", "福井県", "福井"],
  ["19000", "山梨県", "山梨"], ["20000", "長野県", "長野"], ["21000", "岐阜県", "岐阜"],
  ["22000", "静岡県", "静岡"], ["23000", "愛知県", "愛知"], ["24000", "三重県", "三重"],
  ["25000", "滋賀県", "滋賀"], ["26000", "京都府", "京都"], ["27000", "大阪府", "大阪"],
  ["28000", "兵庫県", "兵庫"], ["29000", "奈良県", "奈良"], ["30000", "和歌山県", "和歌山"],
  ["31000", "鳥取県", "鳥取"], ["32000", "島根県", "島根"], ["33000", "岡山県", "岡山"],
  ["34000", "広島県", "広島"], ["35000", "山口県", "山口"], ["36000", "徳島県", "徳島"],
  ["37000", "香川県", "香川"], ["38000", "愛媛県", "愛媛"], ["39000", "高知県", "高知"],
  ["40000", "福岡県", "福岡"], ["41000", "佐賀県", "佐賀"], ["42000", "長崎県", "長崎"],
  ["43000", "熊本県", "熊本"], ["44000", "大分県", "大分"], ["45000", "宮崎県", "宮崎"],
  ["46000", "鹿児島県", "鹿児島"], ["47000", "沖縄県", "沖縄"],
].map(([code, name, short]) => ({ code, name, short }));

const BY_FULL = new Map(PREFECTURES.map((p) => [p.name, p.code]));
const BY_SHORT = new Map(PREFECTURES.map((p) => [p.short, p.code]));

/**
 * 分類軸のメンバー名を照合用に正規化する。**接尾辞はここでは落とさない**。
 *
 * - `都道府県_北海道` → `北海道` (接頭辞を落とす)
 * - `全国農業地域_九州` → `九州`
 * - 空白を除去
 *
 * ★接尾辞 (都/府/県) の除去をここでやってはいけない。`京都` から「都」を落とすと
 * `京` になって京都府が解決できなくなる (テストで実際に検出)。接尾辞の扱いは
 * `lookupPrefectureCode` が「完全名 → 短縮名 → 接尾辞を落とした短縮名」の順に
 * 試すことで吸収する。
 */
export function normalizeAreaName(raw: string): string {
  return raw.replace(/^[^_]*_/, "").replace(/[\s　]/g, "");
}

/**
 * 正規化済みの名前 → 都道府県コード。解決できなければ null。
 *
 * 「京都」(短縮名) と「京都府」(完全名) の両方を、「京」を作らずに解決できるよう
 * 完全一致を先に試す。
 */
export function lookupPrefectureCode(normalized: string): string | null {
  return (
    BY_FULL.get(normalized) ??
    BY_SHORT.get(normalized) ??
    BY_SHORT.get(normalized.replace(/[都府県]$/, "")) ??
    null
  );
}

/**
 * 集計行 (全国 / 地域ブロック / 農政局 / 都府県) — 県ではないので落とす。
 *
 * ★`都府県` を含めるのは畜産統計の「全国農業地域_都府県」(北海道以外の合計) 対策。
 * 「京都府」はこの語を含まないので誤爆しない。
 */
export function isAggregateAreaName(raw: string): boolean {
  return /全国|地域|農政局|ブロック|都府県|計$/.test(raw);
}

export interface AreaAxisMember {
  code: string;
  name: string;
}

/**
 * `TABLE_INF.SURVEY_DATE` → 4 桁年。
 *
 * 都道府県を cat 軸に持つ表は **time 軸自体を持たない**ことが多い (単年の調査なので
 * 時間軸を切る必要がない)。応答の値に `@time` が付かないため、年は表のメタから採る。
 * 実測フォーマット: `"202301-202312"` (患者調査 2023) / `"202501-202512"` (畜産統計 2025)。
 *
 * 推測しない: 4 桁年として妥当な値を取り出せなければ null を返し、呼び元が fail する。
 */
export function surveyYearFromDate(surveyDate: unknown): string | null {
  const s = typeof surveyDate === "number" ? String(surveyDate) : surveyDate;
  if (typeof s !== "string") return null;
  const m = /^(\d{4})/.exec(s.trim());
  if (!m) return null;
  const year = Number(m[1]);
  return year >= 1900 && year <= 2100 ? m[1] : null;
}

export interface AreaAxisMapping {
  /** 分類軸コード → 都道府県コード (5 桁) */
  byCode: Map<string, string>;
  /** 県として解決できず、集計行でもなかったメンバー (診断用) */
  unresolved: AreaAxisMember[];
  /** 解決できなかった都道府県 (47 に満たない場合) */
  missingPrefectures: string[];
}

/**
 * 分類軸のメンバー一覧 → 都道府県コード写像。
 *
 * `scheme`:
 *   - `seq-pref`: コード n → 都道府県番号 (n-1)。**名前でも検証**し、1 件でも食い違えば
 *     その要素を unresolved に落とす (黙って別の県に割り当てない)
 *   - `name`: 名前だけで解決する (コードが任意の表用)
 *
 * どちらも集計行 (全国 / 農業地域 / 農政局) は静かに落とす。
 */
export function resolveAreaAxis(
  members: readonly AreaAxisMember[],
  scheme: "seq-pref" | "name",
): AreaAxisMapping {
  const byCode = new Map<string, string>();
  const unresolved: AreaAxisMember[] = [];

  for (const m of members) {
    if (isAggregateAreaName(m.name)) continue;
    const byName = lookupPrefectureCode(normalizeAreaName(m.name));

    if (scheme === "name") {
      if (byName) byCode.set(m.code, byName);
      else unresolved.push(m);
      continue;
    }

    // seq-pref: コード n → 県番号 n-1。名前と一致した場合だけ採用する
    const n = Number(m.code);
    const seq = Number.isInteger(n) && n >= 2 && n <= 48 ? PREFECTURES[n - 2]?.code : undefined;
    if (seq && seq === byName) byCode.set(m.code, seq);
    else unresolved.push(m);
  }

  const mapped = new Set(byCode.values());
  const missingPrefectures = PREFECTURES.filter((p) => !mapped.has(p.code)).map((p) => p.name);

  return { byCode, unresolved, missingPrefectures };
}
