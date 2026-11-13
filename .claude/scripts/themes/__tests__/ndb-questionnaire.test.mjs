import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { QUESTIONS, archiveMemberOf, assertConfigMatches, extractQuestion } from '../ingest-ndb-questionnaire.mjs';

/**
 * NDB 質問票の取り込みが、原典の形の変化で黙って別の値を出さないことを守る。
 * 正しい表から割合が出ることと、表を 1 か所壊すと止まることの両方を固定する
 * (止まる側が無いと、検査が何も見ていなくても全部通ってしまう)。
 */
const require = createRequire(import.meta.url);
const prefectures = require('../../lib/prefectures.cjs').PREFECTURES;

const AGE_CLASSES = ['40～44歳', '45～49歳', '50～54歳', '55～59歳', '60～64歳', '65～69歳', '70～74歳'];
const NAMES = [...prefectures.map((p) => p.prefName), '都道府県判別不可'];

const YES_NO = { question: 8, titlePattern: /現在、たばこを習慣的に吸っている/, answers: ['はい', 'いいえ'], numerator: ['はい'] };
const THREE_WAY = { question: 18, titlePattern: /お酒.*を飲む頻度/, answers: ['毎日', '時々', 'ほとんど飲まない（飲めない）'], numerator: ['毎日'] };
const HEADINGS = {
  8: '特定健診 標準的な質問票（質問項目８）\n現在、たばこを習慣的に吸っている。 ：2023年度',
  18: '特定健診 標準的な質問票（質問項目１８）\nお酒（清酒、焼酎、ビール、洋酒など）を飲む頻度 ：2023年度',
};

/**
 * 原典と同じ並びの表を作る。counts[answer] は年齢 1 階級あたりの人数 (男女・全県で同じ)。
 * overrides は "行:列" → 値 で 1 セルだけ差し替える。
 */
function sheet(spec, counts, overrides = {}) {
  const perPref = spec.answers.length;
  return {
    getCell: (row, col) => ({
      value: (() => {
        const address = `${row}:${col}`;
        if (Object.hasOwn(overrides, address)) return overrides[address];
        if (row === 1 && col === 1) return HEADINGS[spec.question];
        if (row === 4) {
          if (col >= 3 && col <= 9) return AGE_CLASSES[col - 3];
          if (col >= 11 && col <= 17) return AGE_CLASSES[col - 11];
          if (col === 10 || col === 18) return '中計';
          return null;
        }
        const index = Math.floor((row - 6) / perPref);
        if (row < 6 || index >= NAMES.length) return null;
        const answer = spec.answers[(row - 6) % perPref];
        if (col === 1) return NAMES[index];
        if (col === 2) return answer;
        if ((col >= 3 && col <= 9) || (col >= 11 && col <= 17)) return counts[answer];
        if (col === 10 || col === 18) return counts[answer] * AGE_CLASSES.length;
        return null;
      })(),
    }),
  };
}

test('はい/いいえの設問から、47 都道府県の「はい」の割合を出す', () => {
  const { rows, unknownGeography } = extractQuestion(sheet(YES_NO, { はい: 30, いいえ: 70 }), YES_NO);

  assert.equal(rows.length, 47);
  assert.deepEqual(rows.map((r) => r.areaCode), prefectures.map((p) => p.prefCode));
  assert.equal(rows[0].value, 30);
  // 男女 2 × 年齢 7 階級 × (30 + 70)
  assert.equal(rows[0].denominator, 1400);
  assert.equal(unknownGeography.areaCode, null);
});

test('3 択の設問は、指定した選択肢を全選択肢の合計で割る', () => {
  const counts = { 毎日: 20, 時々: 30, 'ほとんど飲まない（飲めない）': 50 };

  const { rows } = extractQuestion(sheet(THREE_WAY, counts), THREE_WAY);

  assert.equal(rows.length, 47);
  assert.equal(rows[46].value, 20);
});

test('秘匿のセル (10 未満は「‐」) があれば、0 に置き換えずに止まる', () => {
  // 北海道・はい・男性 40〜44 歳
  assert.throws(() => extractQuestion(sheet(YES_NO, { はい: 30, いいえ: 70 }, { '6:3': '‐' }), YES_NO), /suppressed or invalid count/);
  assert.throws(() => extractQuestion(sheet(YES_NO, { はい: 30, いいえ: 70 }, { '6:3': 9 }), YES_NO), /suppressed or invalid count/);
});

test('年齢 7 階級の合計が中計と合わなければ止まる', () => {
  assert.throws(() => extractQuestion(sheet(YES_NO, { はい: 30, いいえ: 70 }, { '6:10': 211 }), YES_NO), /age subtotal/);
});

test('設問文・設問番号・年度が変わっていたら止まる', () => {
  const counts = { はい: 30, いいえ: 70 };
  assert.throws(
    () => extractQuestion(sheet(YES_NO, counts, { '1:1': '特定健診 標準的な質問票（質問項目８）\n朝食を抜くことが週に3回以上ある ：2023年度' }), YES_NO),
    /question wording drift/,
  );
  assert.throws(
    () => extractQuestion(sheet(YES_NO, counts, { '1:1': HEADINGS[8].replace('質問項目８', '質問項目９') }), YES_NO),
    /question number drift/,
  );
  assert.throws(
    () => extractQuestion(sheet(YES_NO, counts, { '1:1': HEADINGS[8].replace('2023年度', '2024年度') }), YES_NO),
    /data year drift/,
  );
});

test('都道府県の並びや選択肢の並びが変わっていたら止まる', () => {
  const counts = { はい: 30, いいえ: 70 };
  // 青森県の行に別の県名
  assert.throws(() => extractQuestion(sheet(YES_NO, counts, { '8:1': '岩手県' }), YES_NO), /geographic row drift/);
  // 北海道の「はい」と「いいえ」が入れ替わる (分子が逆になる壊れ方)
  assert.throws(() => extractQuestion(sheet(YES_NO, counts, { '6:2': 'いいえ' }), YES_NO), /answer row drift/);
  // 年齢階級の見出しがずれる
  assert.throws(() => extractQuestion(sheet(YES_NO, counts, { '4:3': '45～49歳' }), YES_NO), /age class header drift/);
});

test('選択肢が 1 つ増えた表を、古い選択肢の数で読まない', () => {
  const grown = { ...THREE_WAY, answers: ['毎日', '週5〜6日', '時々', 'ほとんど飲まない（飲めない）'] };
  const counts = { 毎日: 20, '週5〜6日': 10, 時々: 30, 'ほとんど飲まない（飲めない）': 40 };

  assert.throws(() => extractQuestion(sheet(grown, counts), THREE_WAY), /answer row drift|geographic row drift/);
});

test('設問表の全指標が、指標定義と同じ設問・年・単位を指している', () => {
  const { METRICS_REGISTRY } = require('../../../../packages/data-configs/src/registry.ts');
  const archives = new Set();

  for (const [key, spec] of Object.entries(QUESTIONS)) {
    const config = METRICS_REGISTRY[key];
    assertConfigMatches(key, config, spec);
    assert.equal(config.source.config.archiveMember, archiveMemberOf(spec.question));
    assert.match(config.description, new RegExp(`質問${spec.question}「`), `${key}: 定義文の設問番号`);
    for (const answer of spec.numerator) assert.ok(config.description.includes(`「${answer}」`), `${key}: 定義文の選択肢`);
    archives.add(config.source.config.provenance.sha256);
  }

  assert.equal(archives.size, 1);
  const questions = Object.values(QUESTIONS).map((s) => s.question);
  assert.equal(new Set(questions).size, questions.length, '同じ設問を 2 つの指標が読んでいない');
});
