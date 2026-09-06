/** Derived read-only joins. Generation, publication and sale readiness are separate facts. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { BUSINESS_PLAN_M1_NOTE_PRODUCTS } from "@stats47/data-configs/business-plan";
import { ALL_PRODUCTS } from "../catalog/products";
import { KINDLE_BOOKS } from "../channels/kindle/book-catalog";
import { CANONICAL_ARTICLES } from "../channels/note/article-plan";
import { GEO_SERVICE_OFFER } from "../channels/geo/service-offer";
import { authoredBookSha256, semanticReviewErrors, revisionEditorIds, type ReviewedChapter } from "../channels/kindle/revision-evidence";
import { FREE_SAMPLE_STATE, readFreeSampleDelivery } from "./free-sample-delivery";

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Obj : {};
const str = (v: unknown): string => typeof v === "string" ? v : "";
const num = (v: unknown): number | null => typeof v === "number" && Number.isFinite(v) ? v : null;
const list = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const hash = (b: Buffer): string => createHash("sha256").update(b).digest("hex");
export interface SalesChannel {
  channel: string; publicationStatus: string; checkedAt: string | null;
  url: string | null; priceYen: number | null; priceStatus: "recorded" | "proposal"; blockers: string[];
}
export interface SalesOffer {
  id: string; title: string; kind: string; catalogStatus: string; scope: string; free: boolean; candidate: boolean;
  buildStatus: "missing" | "generated" | "hash-verified" | "invalid";
  artifactDirectory: string | null; artifactSha256: string | null;
  blockers: string[]; ownerGates: string[]; evidencePaths: string[]; channels: SalesChannel[]; nextAction: string;
  artifactLinks?: Array<{ label: string; href: string }>;
  /** EPUB, current authored input and independent review only; archive/owner gates stay separate. */
  contentBlockers?: string[];
}
export function localPath(root: string, path: string): string {
  if (!path || isAbsolute(path)) throw new Error("relative evidence path required");
  const full = resolve(root, path), rel = relative(resolve(root), full);
  if (!rel || rel === ".." || rel.startsWith("../") || rel.startsWith("..\\") || isAbsolute(rel)) throw new Error("unsafe evidence path");
  if (existsSync(full)) {
    const real = relative(realpathSync(root), realpathSync(full));
    if (!real || real === ".." || real.startsWith("../") || isAbsolute(real)) throw new Error("unsafe symlink evidence path");
  }
  return full;
}
export function verifyManifest(root: string, directory: string, filename: string, expected?: string) {
  const dir = localPath(root, directory), bytes = readFileSync(localPath(dir, filename)), sha256 = hash(bytes);
  if (expected && expected !== sha256) throw new Error("pinned manifest SHA mismatch");
  const files = list(obj(JSON.parse(bytes.toString("utf8"))).files), seen = new Set<string>();
  if (!files.length) throw new Error("manifest has no files");
  for (const entry of files) {
    const f = obj(entry), name = str(f.path) || str(f.name);
    if (seen.has(name)) throw new Error("duplicate manifest file");
    seen.add(name);
    const body = readFileSync(localPath(dir, name));
    if (num(f.bytes) !== body.length || str(f.sha256) !== hash(body)) throw new Error(`artifact SHA/size mismatch: ${name}`);
  }
  return { sha256, files: files.length };
}

/** Preparation candidates, not publication records. New local experiments do not advance these pins. */
export const CURRENT_SALES_REVISIONS = { kindle: "v3-20260906-r4", note: "v3-20260906-r1" } as const;

export function buildSalesCatalog(root: string, checkedAt: string, kindleVersion: string = CURRENT_SALES_REVISIONS.kindle, noteRevision: string = CURRENT_SALES_REVISIONS.note) {
  if (kindleVersion && !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(kindleVersion)) throw new Error("invalid Kindle version");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(noteRevision)) throw new Error("invalid note revision");
  const warnings: string[] = [];
  const read = (path: string): Obj => {
    try { return obj(JSON.parse(readFileSync(localPath(root, path), "utf8"))); }
    catch { warnings.push(`Missing or invalid evidence: ${path}`); return {}; }
  };
  const cp = ".claude/config/coconala-listings.json", kp = ".claude/config/kdp-listings.json";
  const ap = ".claude/state/products/kindle-archives.json", np = ".claude/state/note-published-urls.json";
  const pp = ".claude/state/products/coconala-packs-2026-09-06.json", gp = ".claude/state/products/geo-service-readiness-2026-09-06.json";
  const coco = obj(read(cp).listings), kdp = obj(read(kp).listings), archives = obj(read(ap).books);
  const ni = read(np), notes = obj(ni.articles), packs = read(pp), geo = read(gp);
  const nrp = `.local/note-products-revisions/${noteRevision}/report.json`;
  const nr = existsSync(join(root, nrp)) ? read(nrp) : {};
  const inspect = (o: SalesOffer, filename: string, expected?: string): void => {
    if (!o.artifactDirectory) return;
    try { o.artifactSha256 = verifyManifest(root, o.artifactDirectory, filename, expected).sha256; o.buildStatus = "hash-verified"; }
    catch (e) { o.buildStatus = "invalid"; o.blockers.push(e instanceof Error ? e.message : "invalid artifact"); }
  };
  const offers: SalesOffer[] = ALL_PRODUCTS.map(p => {
    let free = null;
    if (p.id === "P-13") { try { free = readFreeSampleDelivery(root); } catch { warnings.push("invalid free sample pin"); } }
    const l = obj(coco[p.id]), d = obj(free?._delivery ?? l._delivery), receipt = list(packs.items).map(obj).find(i => i.id === p.id);
    const o: SalesOffer = {
      id: p.id, title: p.name, kind: "pack", catalogStatus: p.status, scope: p.jobToBeDone,
      free: p.price.initialYen === 0, candidate: false, buildStatus: "missing", artifactDirectory: str(d.artifactDirectory) || null,
      artifactSha256: null, blockers: [], ownerGates: [], evidencePaths: [cp, pp],
      channels: [{ channel: "coconala", publicationStatus: str(l.status) || "not-listed", checkedAt: str(receipt?.verifiedAt) || null,
        url: str(l.serviceUrl) || null, priceYen: num(l.priceYen) ?? p.price.initialYen, priceStatus: l.priceYen ? "recorded" : "proposal", blockers: [] }],
      nextAction: "Office実機で改訂版の表示・編集を確認し、対象版に紐付けて記録する",
    };
    if (o.artifactDirectory) {
      if (!str(d.manifestSha256)) o.blockers.push("納品版の固定SHAがない");
      inspect(o, "manifest.json", str(d.manifestSha256));
    } else o.blockers.push("現行納品版が未固定。旧版への自動フォールバックは禁止");
    if (p.formats.some(f => f === "pptx" || f === "xlsx") && d.officeValidation !== "verified") o.ownerGates.push(l.status === "listed" ? "Office実機の表示・編集確認（未確認と明示して出品中）" : "配布前にOffice実機の表示・編集を確認する");
    if (free) { o.evidencePaths.push(FREE_SAMPLE_STATE); o.nextAction = "無料見本の内容・配布方法をレビューし、承認後に公開する。Office編集機能の見本ではない"; o.ownerGates.push("無料サンプルの配布承認"); }
    if (["P-06", "P-12"].includes(p.id)) o.blockers.push("歴史的な幼稚園・保育所2指標の原典再確認待ち。最新値として扱わない");
    const a = CANONICAL_ARTICLES.find(a => a.memberProductIds.includes(p.id));
    if (a) {
      const r = list(nr.items).map(obj).find(i => i.productId === p.id && i.slug === a.slug);
      const problems = r ? list(r.blockers).map(String) : ["改訂納品物への添付接続・本文独立レビュー・価格承認・公開前照合が必要"];
      if (r && str(r.sourceManifestSha256) !== str(d.manifestSha256)) problems.push("note参照版と現行納品版のSHA不一致");
      if (r) o.evidencePaths.push(nrp, `${str(r.outDir)}/readiness.json`);
      o.channels.push({ channel: "note", publicationStatus: r ? "draft-blocked" : "draft", checkedAt: null, url: null, priceYen: a.priceJpy,
        priceStatus: "proposal", blockers: problems });
    }
    return o;
  });
  const g = GEO_SERVICE_OFFER, pub = obj(geo.publication), sample = str(geo.sampleOutput);
  offers.push({ id: g.id, title: g.title, kind: "service", catalogStatus: g.status, scope: g.scope, free: false, candidate: false,
    buildStatus: sample && existsSync(join(root, sample)) ? "generated" : "missing", artifactDirectory: sample || null, artifactSha256: null,
    blockers: ["見本は神奈川県。受注県ごとに生成・保存則・出典・内容確認が必要"], ownerGates: [], evidencePaths: [gp, cp],
    channels: [{ channel: "coconala", publicationStatus: str(geo.status) || "unknown", checkedAt: str(pub.anonymousCheckedAt) || null,
      url: str(pub.serviceUrl) || null, priceYen: g.priceYen, priceStatus: "recorded", blockers: [] }],
    nextAction: "受注時に対象県・固定条件を照合し、専用納品CLIで生成・検証する" });
  for (const b of KINDLE_BOOKS) {
    const l = obj(kdp[b.id]), archive = obj(archives[b.id]);
    const revision = list(archive.revisions).map(obj).find(r => r.revision === archive.latestRevision);
    const version = kindleVersion, dir = `.local/kindle-books/${b.id}/${version}`;
    const m = dir && existsSync(join(root, dir, "metadata.json")) ? read(`${dir}/metadata.json`) : {};
    const present = !!dir && existsSync(join(root, dir, "book.epub"));
    const verificationPath = version ? `.claude/state/products/kindle-${version}-verification.json` : null;
    const verification = verificationPath && existsSync(join(root, verificationPath)) ? read(verificationPath) : {};
    const o: SalesOffer = { id: b.id, title: b.title, kind: "book", catalogStatus: b.status, scope: b.concept, free: false, candidate: false,
      buildStatus: present ? "generated" : "missing", artifactDirectory: dir,
      artifactSha256: present ? hash(readFileSync(join(root, dir!, "book.epub"))) : null, blockers: [],
      ownerGates: ["対象EPUBのSHAに紐付くKindle Previewer確認", "権利・AI生成申告・価格/印税条件・最終公開承認"],
      evidencePaths: [kp, ap, ...(dir ? [`${dir}/metadata.json`, `${dir}/READINESS.md`] : [])],
      channels: [{ channel: "kindle", publicationStatus: str(l.kdpStatus) || "unknown", checkedAt: str(l.kdpStatusCheckedAt) || null,
        url: str(l.asin) ? `https://www.amazon.co.jp/dp/${str(l.asin)}` : null, priceYen: num(l.priceYen) ?? b.priceYen,
        priceStatus: l.priceYen ? "recorded" : "proposal", blockers: [] }],
      nextAction: "改訂EPUBの欠落・定義・本文検査→独立レビュー→Previewer→版保全→公開承認" };
    if (!present) o.blockers.push("改訂EPUB未生成（公開版archiveとは別管理）");
    if (m.freshRatioOk !== true) o.blockers.push("書き下ろし比率の内部品質ゲート未達または未検証");
    if (m.volumeOk !== true) o.blockers.push("本文量の内部品質ゲート未達または未検証");
    if (m.machineQualityOk !== true) o.blockers.push("機械品質ゲート未達または未検証（表紙・欠落も含む）");
    const verified = list(verification.report).map(obj).find(v => v.id === b.id && v.version === version && v.epubSha256 === o.artifactSha256);
    if (!verified || verified.errors !== 0 || verification.epubcheckExecuted !== true) o.blockers.push("対象版のEPUB仕様・構造検査が未完了または不一致");
    if (verified && verificationPath) o.evidencePaths.push(verificationPath);
    for (const missing of list(m.missingSlugs)) o.blockers.push(`素材欠落: ${String(missing)}`);
    if ((num(m.schemaVersion) ?? 0) < 2) o.blockers.push("指標別出典・全予定キーの採否を記録した改訂metadataが必要");
    let authoredSha256 = "";
    try { authoredSha256 = authoredBookSha256(b, join(root, "packages/product-factory")); }
    catch { o.blockers.push("現行原稿の照合に失敗"); }
    if (!str(m.authoredSha256) || m.authoredSha256 !== authoredSha256) o.blockers.push("生成版と現行原稿・書誌が不一致または未照合。再生成が必要");
    const reviewPath = dir ? `${dir}/review.json` : null;
    const review = reviewPath && existsSync(join(root, reviewPath)) ? read(reviewPath) : null;
    const actualChapters = list(verified?.chapters).map(obj).map(c => ({ fileName: str(c.fileName), sha256: str(c.sha256) }));
    const declaredChapters = list(m.reviewChapters).map(obj);
    if (!actualChapters.length || actualChapters.length !== declaredChapters.length ||
      actualChapters.some(c => !declaredChapters.some(d => d.fileName === c.fileName && d.sha256 === c.sha256))) {
      o.blockers.push("実EPUB本文とmetadataの全章ハッシュ照合が未完了または不一致");
    }
    const reviewErrors = semanticReviewErrors(review, { bookId: b.id, version: version ?? "", epubSha256: o.artifactSha256 ?? "",
      authoredSha256, chapters: actualChapters satisfies ReviewedChapter[], authorIds: revisionEditorIds(b.id) });
    if (reviewErrors.length) o.blockers.push(`全本文の独立意味レビュー未完了: ${reviewErrors.join(" / ")}`);
    if (review && reviewPath) o.evidencePaths.push(reviewPath);
    o.contentBlockers = [...o.blockers];
    const archiveFiles = list(revision?.files).map(obj);
    const bundleMatches = !!dir && !!revision?.verifiedAt && ["book.epub", "cover.jpg", "cover.png", "metadata.json", "READINESS.md"].every(name => {
      const expected = archiveFiles.find(f => f.name === name), path = join(root, dir, name);
      return existsSync(path) && expected?.plainSha256 === hash(readFileSync(path));
    });
    if (!bundleMatches) o.blockers.push("改訂版の暗号化R2保全・出品台帳切替が未完了（旧版保持）");
    if (str(l.title) && l.title !== b.title) o.channels[0].blockers.push("改訂書誌と販売記録のタイトルが異なる。内容確定後に変更可否を確認し、承認を得て更新する");
    if (l.royaltyPlan === 70 && l.kuEnrolled === false) o.channels[0].blockers.push("70%設定は日本での70%収益を保証しない。Select未加入の条件で収益計画を再確認する");
    offers.push(o);
  }
  for (const p of BUSINESS_PLAN_M1_NOTE_PRODUCTS) {
    const n = obj(notes[p.articleKey]), url = str(n.url), dir = `.local/geo-products/${p.articleKey}`;
    const o: SalesOffer = { id: p.id, title: str(n.title) || p.title, kind: "article", catalogStatus: p.status, scope: p.readerOutcome,
      free: false, candidate: !url, buildStatus: "missing", artifactDirectory: existsSync(join(root, dir)) ? dir : null,
      artifactSha256: null, blockers: [], ownerGates: [], evidencePaths: [np, gp],
      channels: [{ channel: "note", publicationStatus: url ? "published-recorded" : "draft", checkedAt: null,
        url: url || null, priceYen: num(n.price_jpy) ?? p.priceYen, priceStatus: url ? "recorded" : "proposal", blockers: [] }],
      nextAction: url ? "公開済み本文・添付・購入導線をログイン済み画面で再照合する" : p.readinessGate };
    if (o.artifactDirectory) inspect(o, "MANIFEST.json");
    else o.blockers.push("本文・添付・再現テスト・出典利用条件・独立レビューが未完了");
    o.blockers.push(url ? "今回の公開面再確認は未実施。過去の公開記録を表示（HTTP403を非公開と解釈しない）" : p.readinessGate);
    offers.push(o);
  }
  if (new Set(offers.map(o => o.id)).size !== offers.length) throw new Error("duplicate offer IDs");
  for (const offer of offers) {
    if (!offer.artifactDirectory) continue;
    try {
      const dir = localPath(root, offer.artifactDirectory);
      offer.artifactLinks = ["READINESS.md", "book.epub", "metadata.json", "databook.pdf", "assets/choropleth-map.png", "data.csv", "analysis.csv", "README.md"].filter(name => existsSync(join(dir, name)))
        .map(name => ({ label: name, href: encodeURI(relative(join(root, ".local/product-portfolio"), localPath(dir, name))) }));
    } catch { offer.blockers.push("納品物リンクの安全なパスを確認できない"); }
  }
  return { schemaVersion: 2, checkedAt, selectedRevisions: { kindle: kindleVersion ?? "latest-local", note: noteRevision },
    scope: "既存14パック・32冊・Geo役務1・Geo note15企画。販売先違いは同一商品内のvariant。その他の未定義商品は含まない。",
    summary: { total: offers.length, existing: offers.filter(o => !o.candidate).length, candidates: offers.filter(o => o.candidate).length,
      free: offers.filter(o => o.free).length, hashVerified: offers.filter(o => o.buildStatus === "hash-verified").length }, warnings, offers };
}
export type SalesCatalog = ReturnType<typeof buildSalesCatalog>;
export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const csvCell = (s: string): string => `"${(/^[\s]*[=+@-]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
export function renderSalesCsv(c: SalesCatalog): string {
  const rows = [["商品ID", "商品", "区分", "販売先", "公開記録", "公開確認日", "価格円", "価格状態", "生成検証", "納品物", "未完了", "人間確認", "次の行動", "URL"]];
  for (const o of c.offers) for (const ch of o.channels) rows.push([o.id, o.title, o.candidate ? "未制作企画" : o.kind, ch.channel,
    ch.publicationStatus, ch.checkedAt || "未確認", String(ch.priceYen ?? ""), ch.priceStatus, o.buildStatus, o.artifactDirectory || "",
    [...o.blockers, ...ch.blockers].join(" / "), o.ownerGates.join(" / "), o.nextAction, ch.url || ""]);
  return `\uFEFF${rows.map(r => r.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
export function renderSalesHtml(c: SalesCatalog): string {
  const e = escapeHtml;
  const links = (o: SalesOffer): string => (o.artifactLinks ?? []).map(l => `<a href="${e(l.href)}">${e(l.label)}</a>`).join(" / ");
  const rows = c.offers.map(o => `<tr><td>${e(o.id)}<br><small>${o.candidate ? "未制作企画" : o.free ? "無料サンプル" : e(o.kind)}</small></td><td>${e(o.title)}<details><summary>範囲・根拠</summary><p>${e(o.scope)}</p><p>${e(o.evidencePaths.join(" / "))}</p></details></td><td>${o.channels.map(ch => `<p>${e(ch.channel)} / ${e(ch.publicationStatus)}<br><small>${e(ch.checkedAt || "確認日なし")} / ¥${ch.priceYen ?? "未定"} ${ch.priceStatus === "proposal" ? "提案" : "記録値"}</small>${ch.url && /^https:\/\//.test(ch.url) ? `<br><a href="${e(ch.url)}" rel="noreferrer">公開ページ</a>` : ""}<br>${e(ch.blockers.join(" / "))}</p>`).join("")}</td><td>${e(o.buildStatus)}<br><small>${e(o.artifactDirectory || "納品版なし")}</small><p>${links(o)}</p></td><td>${e([...o.blockers, ...o.ownerGates].join(" / "))}<p>次: ${e(o.nextAction)}</p></td></tr>`).join("\n");
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>stats47 商品カタログ</title><style>body{font:15px/1.65 system-ui,sans-serif;color:#172b36;background:#f5f7f8;margin:24px}table{border-collapse:collapse;background:white;width:100%}th,td{text-align:left;vertical-align:top;padding:14px;border-bottom:1px solid #d5dde0}th{background:#e9eef0}small{color:#52606d}td:first-child{white-space:nowrap}td:nth-child(2){min-width:200px}td:last-child{max-width:430px}summary{cursor:pointer}.scroll{overflow:auto}a{color:#00668c}input{padding:10px;width:min(420px,90%);margin:12px 0}</style><h1>stats47 商品カタログ</h1><p>既存 ${c.summary.existing} 件（無料 ${c.summary.free} 件含む）＋未制作 ${c.summary.candidates} 企画。納品物ハッシュ検証 ${c.summary.hashVerified} 件。</p><p>生成済み ≠ 販売準備完了。公開状態は記録日現在の証拠であり、今回の公開確認ではありません。改訂中と販売中の旧版は別管理です。</p><p>更新: ${e(c.checkedAt)} ／ <a href="catalog.csv">CSVを開く</a></p><input id="search" aria-label="商品絞り込み" placeholder="商品ID・Kindle・未完了事項で絞り込み"><div class="scroll"><table><thead><tr><th>ID</th><th>商品・範囲</th><th>販売先・公開記録</th><th>納品物</th><th>残工程</th></tr></thead><tbody>${rows}</tbody></table></div><script>document.querySelector('#search').addEventListener('input',event=>{const q=event.target.value.toLowerCase();document.querySelectorAll('tbody tr').forEach(row=>{row.hidden=!row.textContent.toLowerCase().includes(q)})})</script></html>`;
}
