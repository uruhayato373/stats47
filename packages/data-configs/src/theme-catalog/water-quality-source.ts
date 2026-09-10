/** 公共用水域の原表掲載行。水域名による結合や全国値の再計算をしない。 */
export const WATER_QUALITY_SOURCE = {
  r2Key: 'app/themes/environmental-quality/water-quality.json',
  period: '2023年度',
  title: '環境省 令和5年度公共用水域水質測定結果・付表1〜3',
  license: { name: 'PDL-1.0', url: 'https://www.env.go.jp/mail.html' },
  definitionUrl: 'https://www.env.go.jp/council/09water/y097-05a.html',
  indexUrl: 'https://www.env.go.jp/water/suiiki/index.html',
  url: 'https://www.env.go.jp/content/000310472.pdf',
  sha256: '447751a64e8987903cb91c6956c0772d22090084dfb50a418a4fabfbdd980c3a',
  mainUrl: 'https://www.env.go.jp/content/000310475.pdf',
  mainSha256:
    '7aa33df09816f42d87aff6c119e74208fab5c8492995d005887cd8c55d98be78',
  national: {
    river: { total: 2576, compliant: 2416 },
    lake: { total: 192, compliant: 101 },
    sea: { total: 590, compliant: 475 },
  },
  rowCounts: { river: 2614, lake: 198, sea: 615 },
  kinds: { river: '河川BOD', lake: '湖沼COD', sea: '海域COD' },
  notes: [
    '2023年度の測定結果です。2025年6月に差し替えられた資料を使用しています。最新年度の測定結果ではありません。',
    '県別は付表1〜3の各県欄に掲載された行を分母とし、原表の○を達成として集計しています。複数県にまたがる水域は各県欄に掲載され、県別掲載行の合計と全国の公式水域数は一致しません。同名の別水域も統合しません。',
    '全国値は本編表3-1の公式集計です。県別掲載行の合計から計算していません。基準は水域の類型と用途により異なるため、異なる水域の濃度平均や総合順位は作りません。',
    '75％値の最大値は、水域内の環境基準点における年間75％水質値の最大値です。原表の平均値とは別の値です。<0.5などの定量下限未満の表記を保持しています。',
    '掲載なしは、当該県欄に対象水域の掲載がないことを示します。濃度ゼロ、未達成、水域が存在しないことを意味しません。',
    '香川県・西汐入川は環境省付表の類型Cと基準値8mg/Lの組み合わせに相違があります。県の同年度原典は類型Dです。付表の表記を保持し、達成判定○は変更していません。',
    '出典：環境省「令和5年度公共用水域水質測定結果」を加工して作成。',
  ],
  anomaly: {
    id: 'river-p027-r063',
    name: '西汐入川',
    prefecture: '37000',
    classInAppendix: 'C',
    limit: 8,
    prefecturalSourceUrl:
      'https://www.pref.kagawa.lg.jp/documents/51308/sokuteikekka.pdf',
    prefecturalSourceClass: 'D',
    prefecturalSourceSha256:
      '6e6bb50a34ca1419a66161b6c25b74cd65db48aa15038b65c45b992ced192c8d',
  },
} as const;
