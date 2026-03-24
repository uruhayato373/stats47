const fs = require('fs');
const path = require('path');

const dir = '.local/r2/blog';
const slugs = fs.readdirSync(dir).filter(f => {
  try { return fs.statSync(path.join(dir, f)).isDirectory(); } catch { return false; }
});

const results = [];
for (const slug of slugs.sort()) {
  const mdPath = path.join(dir, slug, 'article.md');
  if (!fs.existsSync(mdPath)) continue;
  const content = fs.readFileSync(mdPath, 'utf8');
  const titleMatch = content.match(/^title:\s*["'](.+?)["']/m);
  const subtitleMatch = content.match(/^subtitle:\s*["'](.+?)["']/m);
  const publishedMatch = content.match(/^published:\s*(true|false)/m);
  const publishedAtMatch = content.match(/^publishedAt:\s*(.+)/m);
  const title = titleMatch ? titleMatch[1] : '';
  const subtitle = subtitleMatch ? subtitleMatch[1] : '';
  const published = publishedMatch ? publishedMatch[1] === 'true' : false;
  const publishedAt = publishedAtMatch ? publishedAtMatch[1].trim() : '';

  // Check if title ends with ランキング or is "○○ランキング" pattern
  const titleHasRanking = title.includes('ランキング');
  const slugHasRanking = slug.endsWith('-ranking');

  if (titleHasRanking || slugHasRanking) {
    results.push({ slug, title, subtitle, published, publishedAt, titleHasRanking, slugHasRanking });
  }
}

// Output as JSON for processing
console.log(JSON.stringify(results, null, 2));
console.log('\n// Total: ' + results.length + ' articles need review');
