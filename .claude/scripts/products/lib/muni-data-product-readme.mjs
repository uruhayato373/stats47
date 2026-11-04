/** 商品に同梱する README を組み立てる。数値は渡された実データから出し、手で書かない。 */
const yen = (n) => n.toLocaleString('en-US');
const table = (header, records) =>
  [header, header.map(() => '---'), ...records].map((cells) => `| ${cells.join(' | ')} |`).join('\n');

function blankSection(rows, recon, spec) {
  const noRow = rows.filter((r) => r.note.includes('元データに行なし'));
  const blank = rows.filter((r) => r.value == null && !r.note.includes('元データに行なし'));
  const worst = [...recon.byYear].sort((a, b) => Number(b.diffPct) - Number(a.diffPct))[0];
  const noRowLarge = noRow.filter((r) => spec.noRowHighlights?.includes(r.code)).map((r) => `${r.year} 年の${r.name}`);
  return `## 値が空の行

値が空の行は ${blank.length.toLocaleString()} 行、元データに行そのものが無いものは ${noRow.length.toLocaleString()} 行あります。どちらも 0 に置き換えず、空のまま注記の列に理由を書きました。値が 0 の行は 0 のまま載せています。

${spec.blankExplanation}
空の値と行なしによる全国合計の取りこぼしは年によって違い、最大は ${worst.year} 年の ${worst.diffPct}% です。年ごとの差は検算表 (\`*_national_check.csv\`) にあります。
${noRowLarge.length ? `${noRowLarge.join('、')} は元データに行がありません。特別区部の 23 区の値は行政区の別表にあります。\n` : ''}
空の値を県計との差から逆算しないでください。秘匿された値は公表されていないものとして扱います。`;
}

function geoSection({ geo, boundaryFile }) {
  if (!geo) return '## 境界データ\n\nこの版には同梱していません。\n';
  const c = geo.checks;
  const renamed = geo.renamed.length
    ? geo.renamed.map((r) => `${r.code} ${r.census} → ${r.current}`).join('、')
    : 'ありません';
  const wards = [...new Set(geo.remapped.map((r) => r.to))].length;
  return `## 境界データ (\`${boundaryFile}\`)

CSV の自治体コードと \`code\` で結合する GeoJSON です。属性は \`code\`・\`pref\`・\`name\` の 3 つで、値は入れていません。座標は世界測地系 (JGD2011) の経緯度です。

- **元データ**: e-Stat「令和 2 年国勢調査 町丁・字等別境界データ」を都道府県ごとに取得し、町丁・字等を自治体単位に結合しました。頂点は ${geo.simplify} に間引いています。
- **時点**: 2020 年 10 月 1 日です。以後の境界の変更は反映していません。自治体コードの突合で見つかった違いは、コードの変更 ${geo.remapped.length} 件 (${wards} 市の区の再編。市の単位では影響なし)、名称の変更は ${renamed}。
- **水面**: 水面調査区 (HCODE 8154) は除きました。湖や湾の一部が含まれないので、面積を計算する用途には向きません。
- **対象外**: 北方領土は元データに含まれません。自治体の名称がない東京湾の区域 (コード 13199、人口 0) は除きました。行政区 (東京 23 区を含む) の境界は含まず、東京都特別区部は 1 つの形です。
- **県境**: 元データは県境の接合処理をしていないため、県境に細い隙間や重なりが残ることがあります。
- **形の数**: ${c.features.toLocaleString()} 自治体、ポリゴン ${c.parts.toLocaleString()} 個 (飛び地や離島を含む)。
- **検算**: 取得した全町丁の人口の合計は ${c.population.toLocaleString()} 人です。結合後の面積は元データの面積の合計に対して ${(c.calcArea / c.srcArea).toFixed(4)} 倍で、自治体ごとに最もずれたのは${c.worstAreaRatio.name}の ${c.worstAreaRatio.ratio} 倍です。
`;
}

export function renderReadme({ metric, spec, rows, wardRows, recon, geo, boundaryFile, symbolsChecked, generatedAt, today }) {
  const years = recon.byYear.map((y) => y.year);
  const [first, last] = [years[0], years.at(-1)];
  const latest = recon.byYear.at(-1);
  const municipalities = new Set(rows.map((r) => r.code)).size;
  const wards = new Set(wardRows.map((r) => r.code)).size;
  const counts = recon.byPrefYear.reduce((m, r) => ({ ...m, [r.kind]: (m[r.kind] ?? 0) + 1 }), {});
  const issues = (spec.knownIssues ?? []).filter((n) => n.expectPrefDiff != null);
  return `# 市区町村別 ${spec.title} ${first}〜${last} 年 (最新境域の時系列)

${municipalities.toLocaleString()} 自治体の ${spec.title}を、${first} 年から ${last} 年まで 1 ファイルの時系列にそろえたデータです。地図に結合する境界データも付けています。

## ファイル

| ファイル | 内容 |
|---|---|
| \`${metric}_municipalities_utf8.csv\` | 自治体 ${municipalities.toLocaleString()} 件 × ${years.length} 年 (${rows.length.toLocaleString()} 行)。UTF-8 |
| \`${metric}_municipalities_utf8bom.csv\` | 同じ内容の BOM 付き。Excel で直接開くときはこちら |
| \`${metric}_wards_utf8.csv\` / \`_utf8bom.csv\` | 別表。政令市の区と東京 23 区 ${wards} 件 (${wardRows.length.toLocaleString()} 行) |
| \`${metric}_national_check.csv\` | 各年の全国合計の検算表 |
${geo ? `| \`${boundaryFile}\` | 結合用の境界データ |\n` : ''}
自治体の表は市町村と「東京都 特別区部」(コード 13100) の 1 件で全国を分けています。政令市は市全体が 1 行で、区は別表です。**自治体の表と別表を足すと二重に数えます。**

## 列

| 列 | 内容 |
|---|---|
| 自治体コード | 全国地方公共団体コードの 5 桁 (検査数字なし)。先頭の 0 が消えないよう、文字列として読み込んでください |
| 都道府県 / 自治体名 | 別表の自治体名は「札幌市 中央区」の形 |
| 年 | 実績の暦年 |
| 値 | ${spec.unit}。元データのままで、換算も補完もしていません |
| 単位 | ${spec.unit} |
| 注記 | その行で気をつけることを \`; \` 区切りで記載 |

## 指標の定義

${spec.definition}

${spec.yearMeaning}

${table(['年', '元の調査'], spec.yearSources.map((s) => [s.years, s.survey]))}

## 時系列を比べるときの注意

${spec.cautions.map((c) => `- ${c}`).join('\n')}

## 境域のそろえ方

元データ (社会・人口統計体系の市区町村データ) は、e-Stat が廃置分合処理をしたデータです。合併前の年の値も合併後の範囲に組み替えられているので、当方で値の再計算はしていません。全年の自治体コードが現在の一覧 (${municipalities.toLocaleString()} 自治体) に収まることを確かめ、一覧にそろえて行を並べました。

e-Stat の注意書きが挙げる例外は次の 3 つです。出典: https://www.e-stat.go.jp/notice-use-of-statical-data 「４．廃置分合処理済データについて」

- 甲府市と富士河口湖町の組替済みデータに、旧上九一色村の値は含まれません (注記の列に記載)。
- 市制施行した市町村は、市制施行前の時点について旧市町村の値が表示されます。
- 区域が変更された町は、変更前の時点について変更前の町の値が表示されます。

## 注記の読み方

| 注記 | 意味 |
|---|---|${symbolsChecked ? '' : `
| 元データ空欄 (記号未確認) | 元データに値がありません。秘匿 (X) か該当なし (−) かはこの版では区別していません |`}
| 元データ記号 X など | e-Stat の統計表の記号です |
| 元データに行なし | 元データにその地域・年の行がありません |
| ${Object.values(spec.yearNotes ?? {}).join(' / ')} | 調査が切り替わった年です |
| 元データ要確認 | 県計や区の合計と一致しない値です。元データの値をそのまま載せています |
${symbolsChecked ? '' : '\n空の値の記号は e-Stat API で取り直しておらず、すべて「記号未確認」です。\n'}
${blankSection(rows, recon, spec)}

## 検算

各年の自治体の合計を、同じ指標の都道府県の値の合計と照合しました。全 ${recon.byPrefYear.length.toLocaleString()} の県×年のうち、説明のつかない差は ${recon.unexplained.length} 件です。${last} 年は県別 ${yen(latest.prefTotal)}、自治体 ${yen(latest.muniTotal)}、差 ${yen(latest.diff)} ${spec.unit} (${latest.diffPct}%) でした。

| 差の理由 | 県×年 |
|---|---|
| 値の空く自治体があり、差がその分と見なせる | ${(counts.blank ?? 0).toLocaleString()} |
| 空欄がなく、差が ±${spec.roundingTolerance} 以内 (丸め) | ${(counts.rounding ?? 0).toLocaleString()} |
| ${spec.crossPrefMergers?.[0]?.label ?? '県またぎ'} | ${(counts['cross-pref'] ?? 0).toLocaleString()} |
| 元データ要確認 | ${(counts['source-inconsistency'] ?? 0).toLocaleString()} |

元データ要確認の ${issues.length} 件は次のとおりです。

${issues.map((n) => `- ${n.year} 年 ${rows.find((r) => r.code === n.code)?.name}: ${n.note} (県別 − 自治体 = ${yen(n.expectPrefDiff)} ${spec.unit})`).join('\n')}

${geoSection({ geo, boundaryFile })}
## 出典と作成日

- 値: 政府統計の総合窓口 (e-Stat) 「${spec.sourceLabel}」(統計表 ${spec.estat.statsDataId}) を加工して作成
- 項目の定義: ${spec.definitionUrl}
${geo ? '- 境界: 政府統計の総合窓口 (e-Stat) 「令和 2 年国勢調査 町丁・字等別境界データ」を加工して作成\n' : ''}- 値の取得: ${generatedAt?.slice(0, 10) ?? '不明'} / このファイルの作成: ${today}

このデータを使った成果物には、上記の元の出典を記載してください。
`;
}
