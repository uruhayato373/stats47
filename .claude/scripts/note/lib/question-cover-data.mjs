/** Freeze the article's year and 47 values; never silently use the latest partition. */
import { PREF_AREA_CODES } from "../../lib/prefectures.cjs";

const PREFECTURE_CODES = new Set(PREF_AREA_CODES);

export function questionRankingIdentity(article) {
  const targets = article.stats47Targets?.filter(t => t.startsWith('/ranking/')) ?? [];
  const year = article.title.match(/20\d{2}/)?.[0];
  const namedWinners = article.title.match(/[？?]\s*1位は(.+?)(?:[｜|]|$)/)?.[1].trim().split('・');
  if (targets.length !== 1 || !year || !namedWinners?.length) throw Error(`question ranking identity: ${article.key}`);
  return { rankingKey: targets[0].slice('/ranking/'.length), year, namedWinners };
}

export function freezeQuestionRankingData(article, source, fixed = null) {
  const { rankingKey, year, namedWinners } = questionRankingIdentity(article);
  const partition = source.partitions?.find(p => String(p.yearCode) === year);
  const rows = partition?.values;
  if (source.rankingKey !== rankingKey || source.areaType !== 'prefecture' || partition?.count !== 47
      || !Array.isArray(rows) || rows.length !== 47 || new Set(rows.map(r => r.areaCode)).size !== 47
      || rows.some(r => !PREFECTURE_CODES.has(r.areaCode) || String(r.yearCode) !== year
        || !Number.isFinite(r.value) || !Number.isInteger(r.rank) || r.rank < 1 || r.rank > 47
        || typeof r.unit !== 'string' || !r.areaName)) throw Error(`47 prefecture/year/value contract: ${article.key}`);
  const units = new Set(rows.map(r => r.unit));
  const winners = rows.filter(r => r.rank === 1).sort((a,b) => a.areaCode.localeCompare(b.areaCode)).map(r => r.areaName);
  if (units.size !== 1 || !winners.length || namedWinners.some(name => !winners.includes(name)))
    throw Error(`question ranking unit/winner mismatch: ${article.key}`);
  const unit = rows[0].unit;
  if (fixed) {
    if (fixed._meta?.rankingKey !== rankingKey || String(fixed._meta?.year) !== year
        || !Array.isArray(fixed.data) || fixed.data.length !== 47
        || new Set(fixed.data.map(r => r.area_code)).size !== 47
        || fixed.data.some(r => !PREFECTURE_CODES.has(r.area_code) || String(r.year) !== year
          || !Number.isFinite(r.value) || rows.find(s => s.areaCode === r.area_code)?.value !== r.value)
        || (typeof fixed.unit === 'string' && fixed.unit !== unit))
      throw Error(`article's frozen data differs from ranking: ${article.key}`);
  }
  const values = rows.map(r => r.value);
  const mean = values.reduce((sum,v) => sum + v, 0) / 47;
  const chartData = fixed ? { ...fixed, unit } : {
    _meta: { rankingKey, year: Number(year), source: 'article-year-ranking-snapshot' },
    copy: { canonicalTitle: rankingKey, readerLabel: article.title.replace(/^【[^】]*】\s*/, '').split(/[？?]/)[0],
      hook: article.title.replace(/^【[^】]*】\s*/, '').split(/[？?]/)[0] + '？' },
    unit, summary: { mean, stddev: Math.sqrt(values.reduce((sum,v) => sum + (v - mean) ** 2, 0) / 47),
      topBottomRatio: Math.min(...values) === 0 ? null : Math.max(...values) / Math.min(...values) },
    data: rows.map(r => ({ rank: r.rank, area_code: r.areaCode, area_name: r.areaName, year, value: r.value })),
  };
  return { rankingKey, year, winners, chartData, fixedCopyCreated: !fixed,
    unitRepaired: Boolean(fixed && typeof fixed.unit !== 'string') };
}

export const coverTextUnits = text => [...text].reduce((sum,ch) => sum + (/^[\x00-\x7f]$/.test(ch) ? 0.65 : 1), 0);

/** Balance long subjects at word boundaries without losing qualifications or grammatical particles. */
function subjectLines(subject) {
  if (coverTextUnits(subject) <= 8) return [subject];
  const chunks = [...new Intl.Segmenter('ja', { granularity: 'word' }).segment(subject)].map(s => s.segment);
  let candidates = chunks.slice(0,-1).map((_,i) => chunks.slice(0,i+1).join(''));
  if (!candidates.length) candidates = [...subject].slice(0,-1).map((_,i) => [...subject].slice(0,i+1).join(''));
  const split = candidates.reduce((best,part) => Math.abs(coverTextUnits(subject) / 2 - coverTextUnits(part))
    < Math.abs(coverTextUnits(subject) / 2 - coverTextUnits(best)) ? part : best);
  return [split, subject.slice(split.length)];
}

export function questionRankingCopy(article, winners, year) {
  const hook = article.title.replace(/^【[^】]*】\s*/, '').split(/[？?]/)[0].trim();
  const action = hook.match(/^(.+?)を(した|読んだ)人が多い県は$/);
  const amount = hook.match(/^(?:最も)?(.+?)が(?:最も)?(多い|高い|長い)県は$/);
  if (!action && !amount) throw Error(`question cover copy needs an explicit pattern: ${article.key}`);
  const subject = action ? `${action[1]}を` : `${amount[1]}が`;
  return { subjectLines: subjectLines(subject), question: action ? `${action[2]}人が多い県は？` : `${amount[2]}県は？`,
    answer: `${winners.length > 1 ? '同率1位は' : '1位は'}${winners.join('・')}`, year,
    kicker: action ? '行動者率で見る、都道府県ランキング' : 'データで見る、都道府県ランキング' };
}
