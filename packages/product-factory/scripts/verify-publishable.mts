#!/usr/bin/env -S npx tsx
/** Read-only compatibility entrypoint. Never rebuild EPUBs or overwrite publication state during an audit. */
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSalesCatalog } from "../src/build/sales-catalog";

const args = process.argv.slice(2);
if (args.includes("--apply")) {
  console.error("--apply is retired: build results must not overwrite KDP publication state. Use products:report.");
  process.exit(2);
}
const index = args.indexOf("--version"), version = index >= 0 ? args[index + 1] : undefined;
const bookIndex = args.indexOf("--book"), id = bookIndex >= 0 ? args[bookIndex + 1] : undefined;
const contentOnly = args.includes("--content-only");
if (!version || version.startsWith("--") || (bookIndex >= 0 && !/^K-S[1-4]-\d{2}$/.test(id ?? "")) ||
  args.some(a => a.startsWith("--") && !["--version", "--json", "--book", "--content-only"].includes(a))) {
  console.error("usage: verify-publishable.mts --version <existing-version> [--book <ID>] [--content-only] [--json] (read only; content-only does not grant publication permission)");
  process.exit(2);
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const catalog = buildSalesCatalog(root, new Date().toISOString(), version);
const books = catalog.offers.filter(o => o.kind === "book" && (!id || o.id === id));
if (!books.length) { console.error("requested book not in catalog"); process.exit(2); }
const blockers = (book: typeof books[number]) => contentOnly ? book.contentBlockers ?? ["content evidence missing"] : [...book.blockers, ...book.ownerGates];
if (args.includes("--json")) console.log(JSON.stringify({ checkedAt: catalog.checkedAt, version, warnings: catalog.warnings, books }, null, 2));
else for (const book of books) console.log(`${book.id}: ${book.buildStatus}; ${blockers(book).join(" / ")}`);
process.exit(books.some(b => blockers(b).length) ? 1 : 0);
