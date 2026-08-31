/**
 * note-catalog 検証 (決定的 lint)
 *
 * 参照整合性を検査し、error があれば exit 1 (将来 pre-commit / CI に配線)。
 *
 * Usage:
 *   npx tsx .claude/scripts/note/catalog/validate-note-catalog.ts [--strict]
 *   (--strict は warn も exit 1)
 */
import { existsSync, readFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { NOTE_ARTICLES, NOTE_MAGAZINE_KEYS, getMagazine } from "./index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../..");
const STRICT = process.argv.includes("--strict");

const errors: string[] = [];
const warns: string[] = [];
const HARD_READER_TITLE_PATTERN = /行動者率/;

function parseFrontmatterTitle(markdown: string): string | null {
  const raw = markdown.match(/^title:\s*(.+?)\s*$/m)?.[1]?.trim();
  if (!raw) return null;
  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }
  return raw;
}

// KNOWN_RANKING_KEYS を正規表現で読む (react-server import を避ける)
let knownKeys = new Set<string>();
try {
  const src = readFileSync(
    join(ROOT, "packages/ranking/src/config/known-ranking-keys.ts"),
    "utf8",
  );
  const body = src.slice(src.indexOf("new Set(["));
  for (const m of body.matchAll(/"([a-z0-9-]{3,})"/g)) knownKeys.add(m[1]);
} catch {
  warns.push("KNOWN_RANKING_KEYS を読めず stats47Targets の実在検証をスキップ");
}

// 1. key 重複 (vertical 横断で一意であること)
const seen = new Map<string, number>();
for (const a of NOTE_ARTICLES) seen.set(a.key, (seen.get(a.key) || 0) + 1);
for (const [key, n] of seen) if (n > 1) errors.push(`key 重複: "${key}" が ${n} 回`);

// 2. title 重複 (recovered-* 等の実質重複を surface)
const titleSeen = new Map<string, string[]>();
for (const a of NOTE_ARTICLES) {
  const t = a.title.trim();
  if (!titleSeen.has(t)) titleSeen.set(t, []);
  titleSeen.get(t)!.push(a.key);
}
for (const [title, keys] of titleSeen)
  if (keys.length > 1)
    warns.push(`title 重複の疑い: "${title.slice(0, 30)}…" → ${keys.join(", ")}`);

for (const a of NOTE_ARTICLES) {
  // 読者が最初に見る表題には、統計上の専門語ではなく平易なコピーを使う。
  // 本文中で正式名称として「行動者率」を説明することは許可する。
  if (HARD_READER_TITLE_PATTERN.test(a.title)) {
    errors.push(`${a.key}: catalog title に専門語「行動者率」が残存`);
  }

  // ローカル R2 mirror がある環境では、記事表題・H1・catalog のドリフトも検査する。
  const draftPath = join(ROOT, ".local/r2", a.r2Path, "draft.md");
  if (existsSync(draftPath)) {
    const markdown = readFileSync(draftPath, "utf8");
    const draftTitle = parseFrontmatterTitle(markdown);
    if (!draftTitle) {
      errors.push(`${a.key}: draft.md frontmatter に title なし`);
    } else {
      if (draftTitle !== a.title) {
        errors.push(`${a.key}: catalog title と draft.md title が不一致`);
      }
      if (HARD_READER_TITLE_PATTERN.test(draftTitle)) {
        errors.push(`${a.key}: draft.md title に専門語「行動者率」が残存`);
      }
    }

    const h1 = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
    if (h1 && HARD_READER_TITLE_PATTERN.test(h1)) {
      errors.push(`${a.key}: 記事H1に専門語「行動者率」が残存`);
    }
    if (
      draftTitle?.includes("都道府県ランキング") &&
      markdown.includes("行動者率") &&
      !a.stats47Targets?.length
    ) {
      errors.push(`${a.key}: 平易化したランキング記事だが stats47Targets なし`);
    }

    const coverManifestPath = join(
      ROOT,
      ".local/r2",
      a.r2Path,
      "images/cover-generation.json",
    );
    if (existsSync(coverManifestPath)) {
      try {
        const coverManifest = JSON.parse(
          readFileSync(coverManifestPath, "utf8"),
        ) as { metadata?: { title?: string } };
        const coverTitle = coverManifest.metadata?.title;
        if (!coverTitle) {
          errors.push(`${a.key}: cover-generation.json に metadata.title なし`);
        } else {
          if (draftTitle && coverTitle !== draftTitle) {
            errors.push(`${a.key}: cover title と draft.md title が不一致`);
          }
          if (HARD_READER_TITLE_PATTERN.test(coverTitle)) {
            errors.push(`${a.key}: cover title に専門語「行動者率」が残存`);
          }
        }
      } catch {
        errors.push(`${a.key}: cover-generation.json が不正なJSON`);
      }
    }
  }

  // 3. magazine キー実在 + vertical 整合
  if (a.magazine !== null) {
    if (!NOTE_MAGAZINE_KEYS.has(a.magazine)) {
      errors.push(`${a.key}: 未登録マガジンキー "${a.magazine}"`);
    } else {
      const mag = getMagazine(a.magazine)!;
      if (!mag.verticals.includes(a.vertical))
        errors.push(
          `${a.key}: マガジン "${a.magazine}" は vertical ${JSON.stringify(mag.verticals)} 用だが記事は ${a.vertical}`,
        );
      // 4. 有料マガジンに無料記事 (warn)
      if (mag.isPaid && !a.isPaid)
        warns.push(`${a.key}: 有料マガジン "${a.magazine}" に無料記事`);
    }
  }

  // 5. published は noteUrl 必須
  if (a.status === "published" && !a.noteUrl)
    errors.push(`${a.key}: status=published だが noteUrl なし`);

  // 6. isPaid=true は priceJpy>0 が望ましい (warn)
  if (a.isPaid && (!a.priceJpy || a.priceJpy <= 0))
    warns.push(`${a.key}: isPaid=true だが priceJpy 未設定`);

  // 7. ranking target のキー実在 (warn)。Geo/テーマ/area等の公開面はこの検査の責務外。
  if (a.stats47Targets && knownKeys.size) {
    for (const t of a.stats47Targets) {
      if (!t.startsWith("/ranking/")) continue;
      const key = t.replace(/^\/ranking\//, "").split(/[/?#]/)[0];
      if (!knownKeys.has(key))
        warns.push(`${a.key}: stats47Targets "${t}" は KNOWN_RANKING_KEYS に不在`);
    }
  }
}

console.log(`=== note-catalog validate === (${NOTE_ARTICLES.length} 記事)`);
console.log(`error: ${errors.length} / warn: ${warns.length}`);
if (errors.length) {
  console.log("\n[ERROR]");
  for (const e of errors) console.log("  ✗ " + e);
}
if (warns.length) {
  console.log("\n[WARN]");
  for (const w of warns) console.log("  ! " + w);
}
if (errors.length || (STRICT && warns.length)) process.exit(1);
console.log("\n✓ 検証 pass");
