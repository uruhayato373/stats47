/**
 * 第 11 回 NDB オープンデータ「特定健診 標準的な質問票」の都道府県別表から、設問ごとの回答割合を取り込む。
 *
 * 使い方: node --import tsx .claude/scripts/themes/ingest-ndb-questionnaire.mjs [--write-local]
 *   --write-local を付けると .local/r2/app/stats/<key>/values.json に書く (R2 へは上げない)。
 *
 * 出典の zip と各 xlsx の SHA-256 は指標定義 (data/metrics/<key>.ts の source.config) が持つ。
 * このスクリプトが持つのは「どの設問の、どの選択肢を数えるか」だけ (QUESTIONS)。
 * 原典の形が少しでも変わっていたら assert で止まり、何も書かない。
 *   - zip と xlsx の SHA-256
 *   - 設問番号・設問文・対象年度・年齢階級の見出し
 *   - 47 都道府県 + 都道府県判別不可の行の並びと、選択肢の並び
 *   - 全セルが 10 以上の整数であること (10 未満は「‐」で秘匿される。0 に置き換えない)
 *   - 年齢 7 階級の合計が中計と一致すること
 *
 * 質問 15・17 (遅い夕食・朝食欠食) は ingest-singleparent-nutrition.mjs が同じ zip から取り込んでいる。
 *
 * 公開の順序: 指標定義は isActive: false で登録する → このスクリプトで値を作る → R2 の app/stats/<key>/ へ上げる →
 * isActive: true にする。先に true にすると、値の無いランキングページが配信される (.claude/rules/metric-config-standards.md
 * 「isActive:true ≠ 本番公開」)。R2 へ上げるのは .github/workflows/external-metric-ingest.yml (ingest: ndb-questionnaire)。
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
const prefectures = require('../lib/prefectures.cjs').PREFECTURES;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

const DATA_YEAR = 2023;
const YEAR_NAME = '2023年度';
const UNKNOWN_GEOGRAPHY = '都道府県判別不可';
const AGE_CLASSES = ['40～44歳', '45～49歳', '50～54歳', '55～59歳', '60～64歳', '65～69歳', '70～74歳'];
/** 男性は C〜I 列が年齢 7 階級で J 列が中計、女性は K〜Q 列と R 列 */
const SEX_COLUMNS = { male: { first: 3, subtotal: 10 }, female: { first: 11, subtotal: 18 } };
const HEADER_ROW = 4;
const FIRST_DATA_ROW = 6;
/** 秘匿の下限。原典は 10 未満を「‐」にする */
const MIN_PUBLISHED_COUNT = 10;
const FULL_WIDTH_DIGITS = '０１２３４５６７８９';

/**
 * 指標ごとの、数える設問と選択肢。
 * answers は原典の B 列に並ぶ順 (1 県あたりこの数の行がある)。numerator は割合の分子にする選択肢。
 */
export const QUESTIONS = {
  'health-checkup-blood-pressure-medication-rate': {
    question: 1, titlePattern: /現在、血圧を下げる薬を使用しているか/, answers: ['はい', 'いいえ'], numerator: ['はい'],
  },
  'health-checkup-smoking-rate': {
    question: 8, titlePattern: /現在、たばこを習慣的に吸っている/, answers: ['はい', 'いいえ'], numerator: ['はい'],
  },
  'health-checkup-weight-gain-10kg-rate': {
    question: 9, titlePattern: /20歳の時の体重から10kg以上増加している/, answers: ['はい', 'いいえ'], numerator: ['はい'],
  },
  'health-checkup-exercise-habit-rate': {
    question: 10, titlePattern: /1回30分以上の軽く汗をかく運動を週2日以上、1年以上実施している/, answers: ['はい', 'いいえ'], numerator: ['はい'],
  },
  'health-checkup-daily-activity-rate': {
    question: 11, titlePattern: /歩行又は同等の身体活動を1日1時間以上実施している/, answers: ['はい', 'いいえ'], numerator: ['はい'],
  },
  'health-checkup-fast-walking-rate': {
    question: 12, titlePattern: /ほぼ同じ年齢の同性と比較して歩く速度が速い/, answers: ['はい', 'いいえ'], numerator: ['はい'],
  },
  'health-checkup-fast-eating-rate': {
    question: 14, titlePattern: /人と比較して食べる速度が速い/, answers: ['速い', 'ふつう', '遅い'], numerator: ['速い'],
  },
  'health-checkup-daily-snacking-rate': {
    question: 16, titlePattern: /朝昼夕の3食以外に間食や甘い飲み物を摂取していますか/, answers: ['毎日', '時々', 'ほとんど摂取しない'], numerator: ['毎日'],
  },
  'health-checkup-daily-drinking-rate': {
    question: 18, titlePattern: /お酒（清酒、焼酎、ビール、洋酒など）を飲む頻度/, answers: ['毎日', '時々', 'ほとんど飲まない（飲めない）'], numerator: ['毎日'],
  },
  'health-checkup-sufficient-sleep-rate': {
    question: 20, titlePattern: /睡眠で休養が十分とれている/, answers: ['はい', 'いいえ'], numerator: ['はい'],
  },
};

const toFullWidth = (n) => String(n).replace(/\d/g, (d) => FULL_WIDTH_DIGITS[Number(d)]);

/** zip の中での xlsx の名前 (設問番号は全角、設問名の後ろは全角の空白) */
export const archiveMemberOf = (question) =>
  `08_特定健診_問診項目/標準的な質問票（質問項目${toFullWidth(question)}）　都道府県別性年齢階級別分布.xlsx`;

/**
 * 1 設問のシートから 47 都道府県の回答割合を取り出す。
 * sheet は getCell(row, col).value を持てばよい (ExcelJS の worksheet)。
 */
export function extractQuestion(sheet, spec) {
  const cell = (row, col) => sheet.getCell(row, col).value;
  const heading = String(cell(1, 1));
  assert.ok(heading.includes(`質問項目${toFullWidth(spec.question)}）`), 'NDB question number drift');
  assert.match(heading, spec.titlePattern, 'NDB question wording drift');
  assert.ok(heading.includes(`：${YEAR_NAME}`), 'NDB data year drift');
  for (const { first, subtotal } of Object.values(SEX_COLUMNS)) {
    AGE_CLASSES.forEach((label, i) => assert.equal(cell(HEADER_ROW, first + i), label, 'NDB age class header drift'));
    assert.equal(cell(HEADER_ROW, subtotal), '中計', 'NDB subtotal header drift');
  }
  assert.ok(spec.numerator.length > 0 && spec.numerator.every((a) => spec.answers.includes(a)), 'numerator must be answers');

  const names = [...prefectures.map((p) => p.prefName), UNKNOWN_GEOGRAPHY];
  const observations = names.map((name, index) => {
    const counts = Object.fromEntries(spec.answers.map((answer) => [answer, 0]));
    spec.answers.forEach((answer, offset) => {
      const row = FIRST_DATA_ROW + index * spec.answers.length + offset;
      assert.equal(cell(row, 1), name, 'NDB geographic row drift');
      assert.equal(String(cell(row, 2)), answer, 'NDB answer row drift');
      for (const { first, subtotal } of Object.values(SEX_COLUMNS)) {
        const byAge = AGE_CLASSES.map((_, i) => cell(row, first + i));
        const total = cell(row, subtotal);
        for (const value of [...byAge, total]) {
          assert.ok(
            typeof value === 'number' && Number.isSafeInteger(value) && value >= MIN_PUBLISHED_COUNT,
            'NDB suppressed or invalid count',
          );
        }
        assert.equal(byAge.reduce((a, b) => a + b, 0), total, 'NDB age subtotal');
        counts[answer] += total;
      }
    });
    const denominator = spec.answers.reduce((sum, answer) => sum + counts[answer], 0);
    const numerator = spec.numerator.reduce((sum, answer) => sum + counts[answer], 0);
    assert.ok(denominator > 0, 'NDB empty denominator');
    const value = (numerator / denominator) * 100;
    assert.ok(value > 0 && value < 100, 'NDB share out of range');
    return { areaCode: index < prefectures.length ? prefectures[index].prefCode : null, areaName: name, numerator, denominator, value };
  });
  // 表は判別不可の行で終わる。行が増えていたら設問の形が変わっている
  const endRow = FIRST_DATA_ROW + names.length * spec.answers.length;
  assert.ok(!names.includes(String(cell(endRow, 1) ?? '')), 'NDB unexpected extra geographic rows');

  const rows = observations.slice(0, prefectures.length);
  assert.equal(new Set(rows.map((r) => r.areaCode)).size, prefectures.length, 'NDB duplicate prefecture');
  return { rows, unknownGeography: observations.at(-1) };
}

/** 指標定義と、このスクリプトの設問表が同じものを指していることを確かめる */
export function assertConfigMatches(key, config, spec) {
  // 公開 (isActive) は問わない。R2 に値を上げる前は非公開のまま取り込めるようにする
  // (値の無い公開中の指標は、空のランキングページとして配信されてしまう)
  assert.ok(config, `Register config first: ${key}`);
  assert.equal(config.source.kind, 'external');
  assert.equal(config.source.fetcherKey, 'manual');
  assert.equal(config.source.config.archiveMember, archiveMemberOf(spec.question), `archiveMember drift: ${key}`);
  assert.equal(config.source.config.provenance.table, archiveMemberOf(spec.question), `provenance.table drift: ${key}`);
  assert.equal(config.unit, '％', `Metric unit drift: ${key}`);
  assert.deepEqual(config.years, { from: DATA_YEAR, to: DATA_YEAR }, `Metric years drift: ${key}`);
  assert.equal(config.yearFormat, 'fiscal', `Metric year semantics drift: ${key}`);
  assert.equal(config.display.conversionFactor, 1);
  assert.deepEqual(config.entities, ['prefecture']);
}

async function loadArchive(source, directory) {
  const path = join(directory, 'ndb11-questionnaire.zip');
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(source.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  assert.equal(sha(bytes), source.sha256, 'Official file changed');
  await mkdir(directory, { recursive: true });
  await writeFile(path, bytes);
  return bytes;
}

async function main() {
  const Excel = require('exceljs');
  const JSZip = require('jszip');
  const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
  const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
  const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');

  const { values: options } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': { type: 'string', default: join(tmpdir(), 'stats47-ndb-questionnaire-source') },
      out: { type: 'string', default: '.local/verification/themes/ndb-questionnaire-source.json' },
    },
  });

  const entries = Object.entries(QUESTIONS).map(([key, spec]) => {
    const config = METRICS_REGISTRY[key];
    assertConfigMatches(key, config, spec);
    return { key, spec, config };
  });
  const archives = new Set(entries.map(({ config }) => `${config.source.config.provenance.url} ${config.source.config.provenance.sha256}`));
  assert.equal(archives.size, 1, 'All questionnaire metrics must read the same archive');
  const { url, sha256 } = entries[0].config.source.config.provenance;

  const zip = await JSZip.loadAsync(await loadArchive({ url, sha256 }, resolve(options['source-dir'])));
  const generatedAt = new Date().toISOString();
  const files = [];
  const series = [];
  for (const { key, spec, config } of entries) {
    const member = config.source.config.archiveMember;
    const bytes = await zip.file(member)?.async('nodebuffer');
    assert.ok(bytes, `NDB archive member missing: ${member}`);
    assert.equal(sha(bytes), config.source.config.memberSha256, `NDB archive member changed: ${key}`);
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(bytes);
    const sheet = workbook.getWorksheet('質問項目');
    assert.ok(sheet, 'NDB sheet missing');
    const { rows, unknownGeography } = extractQuestion(sheet, spec);

    const payload = parseStatsValuesPayload({
      metricKey: key,
      entityKind: 'prefecture',
      rows: rows.map(({ areaCode, areaName, value }) => ({
        areaCode, areaName, value, unit: config.unit, yearCode: String(DATA_YEAR), yearName: YEAR_NAME,
      })),
      meta: {
        generatedAt,
        rowCount: rows.length,
        areaCount: rows.length,
        yearRange: [String(DATA_YEAR), String(DATA_YEAR)],
        recipe: buildRecipe(config),
      },
    });
    const content = JSON.stringify(payload);
    files.push({ key: `app/stats/${key}/values.json`, content, sha256: sha(content) });
    const sorted = [...rows].sort((a, b) => b.value - a.value);
    series.push({
      metricKey: key,
      question: spec.question,
      year: DATA_YEAR,
      unit: config.unit,
      prefectures: rows.length,
      // 原典に全国の行は無い。47 県の合算は参考値で、判別不可は含めない
      pooledShareOf47: (rows.reduce((s, r) => s + r.numerator, 0) / rows.reduce((s, r) => s + r.denominator, 0)) * 100,
      highest: { areaName: sorted[0].areaName, value: sorted[0].value },
      lowest: { areaName: sorted.at(-1).areaName, value: sorted.at(-1).value },
      unknownGeographyRespondents: unknownGeography.denominator,
      rows,
    });
  }

  // 全指標の抽出と形の検査が通ってから書く (途中まで書いた状態を残さない)
  if (options['write-local']) {
    for (const file of files) {
      const destination = resolve(root, '.local/r2', file.key);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.content);
    }
  }
  const report = {
    status: 'PASS',
    generatedAt,
    localStaged: options['write-local'],
    source: { url, sha256 },
    metrics: series.length,
    rows: series.reduce((n, s) => n + s.prefectures, 0),
    files: files.map(({ content, ...file }) => file),
    series,
  };
  await mkdir(dirname(resolve(options.out)), { recursive: true });
  await writeFile(resolve(options.out), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, metrics: report.metrics, rows: report.rows, localStaged: report.localStaged, out: options.out }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
