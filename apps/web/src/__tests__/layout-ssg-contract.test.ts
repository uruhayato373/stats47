import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ルートレイアウトの骨組み (SidebarProvider + AppSidebar + SidebarInset) の SSG 契約。
 *
 * layout とそこから描画される部品が cookies() / headers() を呼ぶと、全 route が動的描画になり
 * Cloudflare Workers で 500 を返した事例がある (.claude/rules/nextjs-ssg-preservation.md の EXP-004)。
 * テンプレートの sidebar.tsx は開閉状態を cookie に書き、レイアウトがそれを cookies() で読む作りなので、
 * 写しから cookie の処理を外し、defaultOpen を固定にしたことをここで固定する。
 */
const WEB = process.cwd();
const REPO = path.resolve(WEB, "../..");

const read = (file: string) => readFileSync(file, "utf8");

const SHELL_FILES = [
  "src/app/layout.tsx",
  "src/components/organisms/AppSidebar/index.tsx",
  "src/components/organisms/AppSidebar/AppSidebarClient.tsx",
  "src/components/organisms/SiteHeader/SiteHeader.tsx",
  "src/components/organisms/Footer/Footer.tsx",
];

describe("ルートレイアウトの SSG 契約", () => {
  it.each(SHELL_FILES)("%s は next/headers を import しない", (file) => {
    const source = read(path.join(WEB, file));
    expect(source).not.toMatch(/from\s+["']next\/headers["']/);
    // 説明のコメントには関数名が出てくるので、コードだけを見る
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toMatch(/\bcookies\s*\(|\bheaders\s*\(|\bdraftMode\s*\(/);
  });

  it("テンプレートの sidebar.tsx の写しは cookie に書き込まない", () => {
    const source = read(path.join(REPO, "packages/components/src/atoms/ui/sidebar.tsx"));
    expect(source).not.toMatch(/document\.cookie/);
    expect(source).not.toMatch(/SIDEBAR_COOKIE/);
  });

  it("layout は SidebarProvider の中に AppSidebar と SidebarInset を兄弟で置き、main はその中の 1 つだけ", () => {
    const source = read(path.join(WEB, "src/app/layout.tsx"));
    const provider = source.slice(source.indexOf("<SidebarProvider"), source.indexOf("</SidebarProvider>"));
    expect(provider).toMatch(/<SidebarProvider defaultOpen>/);
    expect(provider.indexOf("<AppSidebar />")).toBeGreaterThan(-1);
    expect(provider.indexOf("<SidebarInset")).toBeGreaterThan(provider.indexOf("<AppSidebar />"));

    const inset = provider.slice(provider.indexOf("<SidebarInset"), provider.indexOf("</SidebarInset>"));
    const header = inset.indexOf("<SiteHeader />");
    const main = inset.indexOf('<main id="main-content"');
    const footer = inset.indexOf("<Footer />");
    expect(header).toBeGreaterThan(-1);
    expect(main).toBeGreaterThan(header);
    expect(footer).toBeGreaterThan(main);
    expect(source.match(/<main\b/g)).toHaveLength(1);
    // sticky ヘッダーと右レールの追従を壊さない
    expect(inset).not.toMatch(/overflow-hidden/);
  });

  it("sidebar.tsx の SidebarInset は main ではなく div で描く (main を入れ子にしない)", () => {
    const source = read(path.join(REPO, "packages/components/src/atoms/ui/sidebar.tsx"));
    const inset = source.slice(source.indexOf("function SidebarInset"), source.indexOf("function SidebarInput"));
    expect(inset).toMatch(/<div\s/);
    expect(inset).not.toMatch(/<main\b/);
  });
});
