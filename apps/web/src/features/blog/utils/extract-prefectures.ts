/**
 * 都道府県 prefCode → prefName マッピング (47 県固定)。
 * area パッケージの `PREFECTURES` を直接 import する代わりに、
 * 抽出対象の prefCode/prefName を本ファイル内で持つ。
 * (ふるさと納税 widget が対応する範囲とも一致)
 */
const PREFECTURES_DATA: { prefCode: string; prefName: string }[] = [
  { prefCode: "01000", prefName: "北海道" },
  { prefCode: "02000", prefName: "青森県" },
  { prefCode: "03000", prefName: "岩手県" },
  { prefCode: "04000", prefName: "宮城県" },
  { prefCode: "05000", prefName: "秋田県" },
  { prefCode: "06000", prefName: "山形県" },
  { prefCode: "07000", prefName: "福島県" },
  { prefCode: "08000", prefName: "茨城県" },
  { prefCode: "09000", prefName: "栃木県" },
  { prefCode: "10000", prefName: "群馬県" },
  { prefCode: "11000", prefName: "埼玉県" },
  { prefCode: "12000", prefName: "千葉県" },
  { prefCode: "13000", prefName: "東京都" },
  { prefCode: "14000", prefName: "神奈川県" },
  { prefCode: "15000", prefName: "新潟県" },
  { prefCode: "16000", prefName: "富山県" },
  { prefCode: "17000", prefName: "石川県" },
  { prefCode: "18000", prefName: "福井県" },
  { prefCode: "19000", prefName: "山梨県" },
  { prefCode: "20000", prefName: "長野県" },
  { prefCode: "21000", prefName: "岐阜県" },
  { prefCode: "22000", prefName: "静岡県" },
  { prefCode: "23000", prefName: "愛知県" },
  { prefCode: "24000", prefName: "三重県" },
  { prefCode: "25000", prefName: "滋賀県" },
  { prefCode: "26000", prefName: "京都府" },
  { prefCode: "27000", prefName: "大阪府" },
  { prefCode: "28000", prefName: "兵庫県" },
  { prefCode: "29000", prefName: "奈良県" },
  { prefCode: "30000", prefName: "和歌山県" },
  { prefCode: "31000", prefName: "鳥取県" },
  { prefCode: "32000", prefName: "島根県" },
  { prefCode: "33000", prefName: "岡山県" },
  { prefCode: "34000", prefName: "広島県" },
  { prefCode: "35000", prefName: "山口県" },
  { prefCode: "36000", prefName: "徳島県" },
  { prefCode: "37000", prefName: "香川県" },
  { prefCode: "38000", prefName: "愛媛県" },
  { prefCode: "39000", prefName: "高知県" },
  { prefCode: "40000", prefName: "福岡県" },
  { prefCode: "41000", prefName: "佐賀県" },
  { prefCode: "42000", prefName: "長崎県" },
  { prefCode: "43000", prefName: "熊本県" },
  { prefCode: "44000", prefName: "大分県" },
  { prefCode: "45000", prefName: "宮崎県" },
  { prefCode: "46000", prefName: "鹿児島県" },
  { prefCode: "47000", prefName: "沖縄県" },
];

/**
 * 記事タイトル・タグ・本文から都道府県を抽出する。
 *
 * 抽出ロジック (優先度順):
 * 1. frontmatter `prefecture: "13000"` の明示指定 (将来用)
 * 2. tag に `tagKey: "tokyo"` 等の prefecture スラッグが含まれる場合
 * 3. タイトル/本文中の県名出現頻度
 *
 * @returns prefCode 配列 (頻度順、最大 limit 件)
 */
export function extractPrefecturesFromArticle(params: {
  title?: string;
  body?: string;
  tagKeys?: string[];
  explicitPrefCode?: string;
  limit?: number;
}): string[] {
  const { title = "", body = "", tagKeys = [], explicitPrefCode, limit = 3 } = params;

  // 1. 明示指定が最優先
  if (
    explicitPrefCode &&
    PREFECTURES_DATA.some((p) => p.prefCode === explicitPrefCode)
  ) {
    return [explicitPrefCode];
  }

  // 都道府県名 → prefCode 変換マップ (正式名・短縮形)
  const nameToCode: Record<string, string> = {};
  for (const p of PREFECTURES_DATA) {
    nameToCode[p.prefName] = p.prefCode;
    // 「東京都」→「東京」など短縮形も登録 (北海道は短縮形なし)
    const shortName = p.prefName.replace(/(都|道|府|県)$/, "");
    if (shortName !== p.prefName && shortName.length >= 2) {
      nameToCode[shortName] = p.prefCode;
    }
  }

  // 2. tagKey スラッグ → 名前マッピング
  const slugToName: Record<string, string> = {
    hokkaido: "北海道", aomori: "青森県", iwate: "岩手県", miyagi: "宮城県",
    akita: "秋田県", yamagata: "山形県", fukushima: "福島県", ibaraki: "茨城県",
    tochigi: "栃木県", gunma: "群馬県", saitama: "埼玉県", chiba: "千葉県",
    tokyo: "東京都", kanagawa: "神奈川県", niigata: "新潟県", toyama: "富山県",
    ishikawa: "石川県", fukui: "福井県", yamanashi: "山梨県", nagano: "長野県",
    gifu: "岐阜県", shizuoka: "静岡県", aichi: "愛知県", mie: "三重県",
    shiga: "滋賀県", kyoto: "京都府", osaka: "大阪府", hyogo: "兵庫県",
    nara: "奈良県", wakayama: "和歌山県", tottori: "鳥取県", shimane: "島根県",
    okayama: "岡山県", hiroshima: "広島県", yamaguchi: "山口県", tokushima: "徳島県",
    kagawa: "香川県", ehime: "愛媛県", kochi: "高知県", fukuoka: "福岡県",
    saga: "佐賀県", nagasaki: "長崎県", kumamoto: "熊本県", oita: "大分県",
    miyazaki: "宮崎県", kagoshima: "鹿児島県", okinawa: "沖縄県",
  };

  const counts = new Map<string, number>();

  // 3a. タグから抽出 (高重み)
  for (const tag of tagKeys) {
    const name = slugToName[tag.toLowerCase()];
    if (name) {
      const code = nameToCode[name];
      if (code) counts.set(code, (counts.get(code) ?? 0) + 10);
    }
  }

  // 3b. タイトルから抽出 (中重み) — フルネーム優先で重複カウント回避
  for (const p of PREFECTURES_DATA) {
    const idx = title.indexOf(p.prefName);
    if (idx !== -1) {
      counts.set(p.prefCode, (counts.get(p.prefCode) ?? 0) + 5);
    }
  }

  // 3c. 本文から抽出 (低重み・出現回数で加点、短縮形も拾うが重複カウントしない)
  if (body) {
    for (const p of PREFECTURES_DATA) {
      const fullMatches = body.match(new RegExp(p.prefName, "g"));
      if (fullMatches) {
        counts.set(p.prefCode, (counts.get(p.prefCode) ?? 0) + fullMatches.length);
      }
    }
  }

  // スコア降順、同点なら prefCode 昇順
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([code]) => code);
}
