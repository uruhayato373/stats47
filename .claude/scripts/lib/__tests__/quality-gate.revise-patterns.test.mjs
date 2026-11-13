/**
 * critic が書き直しで繰り返し REVISE にした型の gate (BLOG-REVISE-PATTERNS-01、2026-11-14 追加) の回帰テスト。
 * 実行: node --test .claude/scripts/lib/__tests__/quality-gate.revise-patterns.test.mjs
 *
 * - related-link: 関連記事の紹介の表示名が、リンク先の現在の題と無関係 / 旧題のまま
 * - year: 節の本文が語る年と、貼った図の年が 1 つも重ならず、断りも無い
 *
 * 実際に critic が止めた形を注入して発火し、正しい書き方では発火しないことを両方固定する。
 * 最後に、送り箱 (contents/blog) の公開済み記事すべてに当てて誤検知 0 件を固定する
 * (誤検知の多い gate は blocker にしない、というカードの停止条件。stats-table-id-lint と同じ手順)。
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { lintFigureYearMention } from '../figure-year-lint.mjs';
import { lintRelatedLinkNames } from '../related-link-lint.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const GATE = path.resolve(__dirname, '../../blog/quality-gate.mjs');

// ---------------------------------------------------------------- related-link
const TITLES = {
  'healthy-life-expectancy-male-female-gap': {
    current: ['健康寿命の男女差は、都道府県でどこまで開くのか'],
    ledger: '健康寿命の男女差は、都道府県でどこまで開くのか',
  },
  'unhealthy-period-gender-prefecture-gap': {
    current: ['不健康な期間は女性の方が長い？都道府県別の男女差'],
    // 送り箱で題を書き直している最中。台帳はまだ旧題
    ledger: '日常生活に制限のある期間の男女差',
  },
  'fukui-happiness': {
    current: ['なぜ福井は幸福度が高いのか'],
    ledger: 'なぜ福井は幸福度が高いのか',
  },
};
const resolve = (slug) => TITLES[slug] ?? null;
const links = (md) => lintRelatedLinkNames(md, { resolve }).hits.map((h) => `${h.kind}:${h.slug}`);

test('related-link: 題と語を 1 つも共有しない表示名は止める', () => {
  assert.deepEqual(
    links('関連: [米の消費量と収穫量](/blog/healthy-life-expectancy-male-female-gap)'),
    ['no-overlap:healthy-life-expectancy-male-female-gap']
  );
});

test('related-link: 書き直しで変えた旧題のままの表示名は止める', () => {
  const r = lintRelatedLinkNames(
    '姉妹記事の [日常生活に制限のある期間の男女差](/blog/unhealthy-period-gender-prefecture-gap) も参照。',
    { resolve }
  );
  assert.deepEqual(r.hits.map((h) => h.kind), ['stale-title']);
  assert.match(r.blockers[0], /RELATED_LINK_STALE_TITLE/);
  assert.match(r.blockers[0], /不健康な期間は女性の方が長い/);
});

test('related-link: 題の言い換え・汎用語つき・カタカナひらがな違いは通す', () => {
  for (const md of [
    '[健康寿命の男女差](/blog/healthy-life-expectancy-male-female-gap)',
    '[健康寿命の男女差を扱った記事](/blog/healthy-life-expectancy-male-female-gap)',
    '[不健康な期間の男女差](/blog/unhealthy-period-gender-prefecture-gap)',
    '[ナゼ福井](/blog/fukui-happiness)',
    '[なぜ福井](/blog/fukui-happiness)',
  ]) {
    assert.deepEqual(links(md), [], md);
  }
});

test('related-link: 汎用語だけの表示名・題を引けない slug・source-link カード・他の種類のリンクは判定しない', () => {
  assert.deepEqual(links('[別記事](/blog/healthy-life-expectancy-male-female-gap)'), []);
  assert.deepEqual(links('[こちらの記事](/blog/healthy-life-expectancy-male-female-gap)'), []);
  assert.deepEqual(links('[全く別の話](/blog/unknown-slug)'), []);
  assert.deepEqual(
    links('<source-link href="/blog/healthy-life-expectancy-male-female-gap">米の消費量</source-link>'),
    []
  );
  assert.deepEqual(links('[米の消費量](/ranking/rice-consumption)'), []);
});

test('related-link: 同じ食い違いは blocker 1 件にまとめる', () => {
  const md =
    '[米の消費量](/blog/healthy-life-expectancy-male-female-gap)\n\n[米の消費量](/blog/healthy-life-expectancy-male-female-gap)';
  const r = lintRelatedLinkNames(md, { resolve });
  assert.equal(r.hits.length, 2);
  assert.equal(r.blockers.length, 1);
});

// ---------------------------------------------------------------- figure-year
const chart = (base, year) => ({
  base,
  json: { title: '指標', year: String(year), data: [] },
  source: { kind: 'ranking', year: String(year) },
});
const AREA_2020 = chart('area-ratio', 2020);
const fig = (base) => `![図](data/${base}.svg)`;
const years = (md, charts) => lintFigureYearMention(md, charts).hits.map((h) => h.figureYears.join(','));

test('year: 本文が 2023年 を語る節に 2020年 の図を貼り、断りが無ければ止める (area-ratio-prefecture-gap の形)', () => {
  const md = `## 面積の割合\n\n2023年の可住地面積割合は大阪府が最も高く、47県の差は大きいです。\n\n${fig('area-ratio')}\n`;
  const r = lintFigureYearMention(md, [AREA_2020]);
  assert.deepEqual(r.hits.map((h) => h.figureYears), [[2020]]);
  assert.match(r.blockers[0], /FIGURE_YEAR_MISMATCH/);
  assert.match(r.blockers[0], /2023年/);
});

test('year: 縦長版 (-ig) の画像でも同じ図の年で判定する', () => {
  const md = `## 面積の割合\n\n2023年の割合は大阪府が最も高いです。\n\n${fig('area-ratio-ig')}\n`;
  assert.deepEqual(years(md, [AREA_2020]), ['2020']);
});

test('year: 図の年を本文・代替テキスト・見出しのどこかに書けば通す', () => {
  for (const md of [
    `## 面積の割合\n\n2023年の割合は大阪府が最も高いです。図は2020年の値です。\n\n${fig('area-ratio')}\n`,
    `## 面積の割合\n\n2023年の割合は大阪府が最も高いです。\n\n![2020年の可住地面積割合](data/area-ratio.svg)\n`,
    `## 2020年の面積の割合\n\n2023年の割合は大阪府が最も高いです。\n\n${fig('area-ratio')}\n`,
    `## 面積の割合\n\n2020年と2023年を比べると、大阪府は最も高いままです。\n\n${fig('area-ratio')}\n`,
  ]) {
    assert.deepEqual(years(md, [AREA_2020]), [], md);
  }
});

test('year: 年の違いを断る言い回しがあれば通す', () => {
  const md = `## 面積の割合\n\n2023年の割合は大阪府が最も高いです。図は最新年の公表値を使っています。\n\n${fig('area-ratio')}\n`;
  assert.deepEqual(years(md, [AREA_2020]), []);
});

test('year: 本文に年が無い節・年の取れない図・図の無い節は判定しない', () => {
  assert.deepEqual(years(`## 割合\n\n大阪府が最も高いです。\n\n${fig('area-ratio')}\n`, [AREA_2020]), []);
  const noYear = { base: 'x', json: { title: '指標', data: [] }, source: { kind: 'derived' } };
  assert.deepEqual(years(`## 割合\n\n2023年の割合です。\n\n${fig('x')}\n`, [noYear]), []);
  assert.deepEqual(years('## 割合\n\n2023年の割合です。\n', [AREA_2020]), []);
});

test('year: 時系列の範囲「2013-2018」は時点の年に数えない', () => {
  const series = {
    base: 'trend',
    json: { title: '推移', data: [] },
    source: { kind: 'manual', year: '2013-2018' },
  };
  assert.deepEqual(years(`## 推移\n\n2023年の値です。\n\n${fig('trend')}\n`, [series]), []);
});

// ---------------------------------------------------------------- 配線
function runGate(md, charts) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'qg-revise-'));
  const data = path.join(dir, 'data');
  fs.mkdirSync(data);
  fs.writeFileSync(path.join(dir, 'article.md'), md);
  for (const c of charts) {
    fs.writeFileSync(
      path.join(data, `${c.base}.svg`),
      '<svg viewBox="0 0 960 404" width="960" height="404"></svg>'
    );
    fs.writeFileSync(path.join(data, `${c.base}.json`), JSON.stringify(c.json));
    fs.writeFileSync(path.join(data, `${c.base}.source.json`), JSON.stringify(c.source));
  }
  try {
    let out;
    try {
      out = execFileSync('node', [GATE, path.join(dir, 'article.md')], { encoding: 'utf8' });
    } catch (e) {
      out = e.stdout; // blocker があると exit 1。stdout の JSON を読む
    }
    return JSON.parse(out);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('quality-gate: 図の年の食い違いが blocker と checks に出て、図の年を書けば 0 件', () => {
  const head = '---\ntitle: "t"\nseoTitle: "s"\ndescription: "テスト用の記事です。"\npublished: false\n---\n\n';
  const bad = runGate(
    `${head}## 面積の割合\n\n2023年の割合は大阪府が最も高いです。\n\n${fig('area-ratio')}\n`,
    [AREA_2020]
  );
  assert.equal(bad.checks.figureYearMismatch, 1);
  assert.ok(bad.blockers.some((b) => b.startsWith('FIGURE_YEAR_MISMATCH')));

  const good = runGate(
    `${head}## 面積の割合\n\n2023年の割合は大阪府が最も高いです。図は2020年の値です。\n\n${fig('area-ratio')}\n`,
    [AREA_2020]
  );
  assert.equal(good.checks.figureYearMismatch, 0);
  assert.ok(!good.blockers.some((b) => b.startsWith('FIGURE_YEAR_MISMATCH')));
});

// ---------------------------------------------------------------- 公開済み記事での誤検知 0 件
const OUTBOX = path.join(ROOT, 'contents/blog');
const publishedSlugs = fs.existsSync(OUTBOX)
  ? fs.readdirSync(OUTBOX).filter((slug) => {
      const file = path.join(OUTBOX, slug, 'article.md');
      return fs.existsSync(file) && /^published:\s*true\s*$/m.test(fs.readFileSync(file, 'utf8'));
    })
  : [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}

// 本物の旧題リンク (誤検知ではない)。送り箱の記事が、同時に書き直した姉妹記事の旧題で紹介している。
// 2026-11-14 の実測で 2 件。直したら消す (増やさない)。
const KNOWN_STALE_LINKS = new Set([
  'yamaguchi-food-culture->kochi-food-culture:stale-title',
  'yamaguchi-food-culture->miyazaki-food-culture:stale-title',
]);

// 送り箱は公開後に CI が片付けるので、無いときは黙って通さず skip と分かるようにする
test(
  'corpus: 送り箱の公開済み記事で、関連記事の表示名と図の年の検査の誤検知が 0 件 (本物の旧題リンクを除く)',
  { skip: publishedSlugs.length === 0 && '送り箱に公開済みの記事が無い' },
  () => {
    const falsePositives = [];
    for (const slug of publishedSlugs) {
      const dir = path.join(OUTBOX, slug);
      const md = fs.readFileSync(path.join(dir, 'article.md'), 'utf8');
      const relatedLinks = lintRelatedLinkNames(md);
      for (const hit of relatedLinks.hits) {
        if (!KNOWN_STALE_LINKS.has(`${slug}->${hit.slug}:${hit.kind}`)) {
          falsePositives.push(`${slug}: ${hit.kind} ${hit.slug} 「${hit.label}」`);
        }
      }
      const bases = [...new Set([...md.matchAll(/\]\(data\/([^)]+)\.svg\)/g)].map((m) => m[1]))];
      const charts = bases
        .map((base) => ({
          base,
          json: readJson(path.join(dir, 'data', `${base}.json`)),
          source: readJson(path.join(dir, 'data', `${base}.source.json`)),
        }))
        .filter((c) => c.json !== undefined);
      falsePositives.push(...lintFigureYearMention(md, charts).blockers.map((b) => `${slug}: ${b}`));
    }
    assert.deepEqual(falsePositives, [], `${publishedSlugs.length} 本のうち誤検知: ${falsePositives.length} 件`);
  }
);
