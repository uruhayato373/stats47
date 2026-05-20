const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const KEY_CANDIDATES = ['stats47-f6b5dae19196.json', 'stats47-31b18ee67144.json'];
const KEY_FILE = KEY_CANDIDATES.map(f => path.join(ROOT, f)).find(f => fs.existsSync(f));
if (!KEY_FILE) {
  console.error('NO_KEY');
  process.exit(2);
}

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const searchconsole = google.searchconsole({ version: 'v1', auth });
const SITE_URL = 'https://stats47.jp/';

const fmt = (d) => d.toISOString().slice(0, 10);
const today = new Date('2026-05-19T00:00:00Z');
const endDate = new Date(today); endDate.setDate(endDate.getDate() - 3);
const currentStart = new Date(endDate); currentStart.setDate(currentStart.getDate() - 6);
const prevEnd = new Date(currentStart); prevEnd.setDate(prevEnd.getDate() - 1);
const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 6);

async function fetchQueries(startDate, endDate) {
  const res = await searchconsole.searchanalytics.query({
    siteUrl: SITE_URL,
    requestBody: { startDate, endDate, dimensions: ['query'], rowLimit: 500 },
  });
  return res.data.rows || [];
}

(async () => {
  try {
    const [cur, prev] = await Promise.all([
      fetchQueries(fmt(currentStart), fmt(endDate)),
      fetchQueries(fmt(prevStart), fmt(prevEnd)),
    ]);
    const prevMap = new Map(prev.map(r => [r.keys[0], r]));
    const growth = cur.map(c => {
      const q = c.keys[0];
      const p = prevMap.get(q);
      const prevClicks = p?.clicks || 0;
      const prevImpr = p?.impressions || 0;
      return {
        query: q,
        currentClicks: c.clicks,
        prevClicks,
        currentImpressions: c.impressions,
        prevImpressions: prevImpr,
        clickGrowth: prevClicks ? (c.clicks - prevClicks) / prevClicks : Infinity,
        impressionGrowth: prevImpr ? (c.impressions - prevImpr) / prevImpr : Infinity,
        isNew: !p,
      };
    });
    const isBrand = (q) => /stats47/i.test(q);
    const isSinglePref = (q) => /^(東京|大阪|京都|神奈川|愛知|福岡|北海道|沖縄|宮城|広島|静岡|兵庫|千葉|埼玉|奈良|滋賀|岐阜|三重|長野|新潟|富山|石川|福井|山梨|岡山|山口|徳島|香川|愛媛|高知|佐賀|長崎|熊本|大分|宮崎|鹿児島|青森|秋田|岩手|山形|福島|茨城|栃木|群馬|和歌山|島根|鳥取|東京都|大阪府|京都府)$/.test(q);
    const newQ = growth.filter(g => g.isNew && g.currentClicks >= 3 && !isBrand(g.query) && !isSinglePref(g.query));
    const upQ = growth.filter(g => !g.isNew && g.clickGrowth >= 1 && g.currentClicks >= 5 && !isBrand(g.query) && !isSinglePref(g.query));
    const imprUp = growth.filter(g => !g.isNew && g.impressionGrowth >= 2 && g.currentImpressions >= 50 && !isBrand(g.query) && !isSinglePref(g.query));
    const topQueries = [
      ...newQ.map(g => ({ ...g, gscType: '新規' })),
      ...upQ.map(g => ({ ...g, gscType: '急上昇' })),
      ...imprUp.map(g => ({ ...g, gscType: '表示急増' })),
    ];
    const dedup = new Map();
    for (const t of topQueries) {
      if (!dedup.has(t.query)) dedup.set(t.query, t);
    }
    const out = Array.from(dedup.values()).sort((a, b) => b.currentClicks - a.currentClicks).slice(0, 40);
    console.log(JSON.stringify({
      period: { current: [fmt(currentStart), fmt(endDate)], prev: [fmt(prevStart), fmt(prevEnd)] },
      total: out.length,
      queries: out,
    }, null, 2));
  } catch (e) {
    console.error('ERR', e.message);
    process.exit(3);
  }
})();
