/**
 * レール UI 契約 (左右レール・レール内カード・カテゴリ導線) の静的監査。
 *
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」。
 * check-design-system.mjs から呼ばれる純関数。ファイル内容と POSIX 相対パスを受け取り、
 * 違反 (ruleId / lineNumber / line / message) を返す。副作用なし = fixture テストで固定する。
 *
 * それぞれの rule が捕まえる回帰:
 * - rail-no-raw-aside-in-page: page.tsx が `<aside>` を自前で描く (Shell / LeftRailLayout が landmark を持つので二重になる)
 * - rail-card-no-muted-root: RailCard / SectionCard の外枠に bg-muted を足す (Surface 3 段階の崩れ: 通常カードは bg-card)
 * - rail-links-no-grid-layout: RailLinksCard に layout="grid" (2 列 bg-muted セル) が復活する
 * - rail-category-must-use-shared-list: カテゴリ導線を RailLinksCard や旧 PortalCategoryGrid で独自実装する
 * - rail-no-page-name-variant: variant="home" のようなページ名依存 variant が生まれる
 * - rail-no-colored-inset-bar: active 行をカラーバー (inset shadow) で示す
 * - rail-nav-needs-accessible-name: レール内の <nav> に accessible name が無い
 * - rail-row-needs-44px-tap-target: レール内の <Link>/<button> がモバイル 44px (min-h-11) を満たさない
 */

const PAGE_NAME_VARIANT =
  /\bvariant=["'](home|blog|ranking|category|areas?|themes?|survey|geo)["']/;

/** 理由付き allowlist。ここに無いものは違反として扱う */
const ALLOW = {
  'rail-no-raw-aside-in-page': new Set([
    // 本文末の出典注記 (<aside> の意味論としては正しく、レールではない)
    'src/app/municipalities/themes/[themeSlug]/page.tsx',
  ]),
  'rail-row-needs-44px-tap-target': new Set([]),
};

function isPageFile(relativePath) {
  return /^src\/app\/.*\/(page|loading)\.tsx$/.test(relativePath) ||
    /^src\/app\/(page|loading)\.tsx$/.test(relativePath);
}

function isRailComponent(relativePath) {
  return (
    relativePath.startsWith('src/components/rail/') ||
    relativePath === 'src/components/surface/SurfaceCard.tsx'
  );
}

/**
 * JSX 開始タグを「タグ名 + 属性文字列」で列挙する (複数行対応)。
 * テンプレート文字列や式の中の `>` を厳密には解釈しないが、レール部品の JSX には十分。
 */
function* jsxOpenTags(source, tagNames) {
  const re = new RegExp(`<(${tagNames.join('|')})\\b`, 'g');
  let match;
  while ((match = re.exec(source))) {
    const start = match.index;
    let depth = 0;
    let i = start;
    for (; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (ch === '>' && depth === 0) break;
    }
    const attrs = source.slice(start + match[0].length, i);
    const lineNumber = source.slice(0, start).split('\n').length;
    yield { tag: match[1], attrs, lineNumber, line: source.split('\n')[lineNumber - 1]?.trim() ?? '' };
  }
}

export function findRailContractViolations(source, relativePath) {
  const violations = [];
  const lines = source.split('\n');
  const push = (ruleId, lineNumber, message) => {
    if (ALLOW[ruleId]?.has(relativePath)) return;
    violations.push({
      ruleId,
      lineNumber,
      line: lines[lineNumber - 1]?.trim() ?? '',
      message,
    });
  };

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    if (isPageFile(relativePath) && /<aside\b/.test(line)) {
      push(
        'rail-no-raw-aside-in-page',
        lineNumber,
        'page.tsx で <aside> を描かない。landmark は PageShell / ArticleShell / LeftRailLayout が持つ。レールの中身は RailStack + RailCard で組む。'
      );
    }

    if (/\blayout=["']grid["']/.test(line) && /RailLinksCard|layout=/.test(line)) {
      push(
        'rail-links-no-grid-layout',
        lineNumber,
        'RailLinksCard の layout="grid" (2 列 bg-muted セル) は廃止。リンク行は layout="list"、カテゴリ導線は RailCategoryList を使う。'
      );
    }

    if (/\bPortalCategoryGrid\b|\bTrackedPortalCategoryLink\b/.test(line)) {
      push(
        'rail-category-must-use-shared-list',
        lineNumber,
        'カテゴリ導線は components/rail の RailCategoryList を使う (PortalCategoryGrid は廃止)。'
      );
    }

    if (PAGE_NAME_VARIANT.test(line)) {
      push(
        'rail-no-page-name-variant',
        lineNumber,
        'ページ名に依存した variant を作らない。差分は density / showCount / activeCategoryKey / trackingSurface / items など意味ベースの props で表す。'
      );
    }

    if (/shadow-\[inset_/.test(line)) {
      push(
        'rail-no-colored-inset-bar',
        lineNumber,
        'active 行をカラーバー (inset shadow) で示さない。aria-current + bg-accent font-semibold text-primary に統一する。'
      );
    }
  });

  for (const tag of jsxOpenTags(source, ['RailCard', 'SectionCard'])) {
    const classLiteral = /className=["']([^"']*)["']/.exec(tag.attrs)?.[1] ?? '';
    if (/\bbg-muted\b/.test(classLiteral)) {
      push(
        'rail-card-no-muted-root',
        tag.lineNumber,
        `${tag.tag} の外枠に bg-muted を使わない。通常カードは bg-card、bg-muted は hover・選択中・補助要素だけ。`
      );
    }
  }

  for (const tag of jsxOpenTags(source, ['RailLinksCard'])) {
    if (/title=["'][^"']*カテゴリ/.test(tag.attrs)) {
      push(
        'rail-category-must-use-shared-list',
        tag.lineNumber,
        'カテゴリ導線を RailLinksCard で組まない。RailCard の中に RailCategoryList を置く。'
      );
    }
  }

  if (isRailComponent(relativePath)) {
    for (const tag of jsxOpenTags(source, ['nav'])) {
      if (!/aria-label(?:ledby)?=/.test(tag.attrs) && !/\{\.\.\.props\}/.test(tag.attrs)) {
        push(
          'rail-nav-needs-accessible-name',
          tag.lineNumber,
          'レール内の <nav> には aria-label か aria-labelledby を付ける (同じページに nav が複数あるため)。'
        );
      }
    }
    for (const tag of jsxOpenTags(source, ['Link', 'button'])) {
      const classLiteral = /className=["']([^"']*)["']/.exec(tag.attrs)?.[1];
      const usesSharedClass = /railNavRowClassName|RAIL_CHIP_CLASS/.test(tag.attrs);
      if (usesSharedClass) continue;
      if (classLiteral === undefined) continue; // 動的 className は実行時計測 (measure-page-a11y) に委ねる
      if (!/\bmin-h-(11|12|14|1[6-9]|[2-9]\d)\b/.test(classLiteral)) {
        push(
          'rail-row-needs-44px-tap-target',
          tag.lineNumber,
          `レール内の <${tag.tag}> はモバイルのタップ領域 44px (min-h-11) を確保する (sm: 以上で密度を上げてよい)。`
        );
      }
    }
  }

  return violations;
}
