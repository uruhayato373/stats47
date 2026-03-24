/**
 * Markdown ソースの前処理ユーティリティ
 * callout 記法と関連記事セクションを HTML カスタム要素に変換する。
 */

const CALLOUT_TYPES: Record<string, { className: string; titleClassName: string }> = {
    NOTE:      { className: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",   titleClassName: "text-blue-700 dark:text-blue-300"   },
    TIP:       { className: "border-green-400 bg-green-50 dark:bg-green-950/30", titleClassName: "text-green-700 dark:text-green-300"  },
    WARNING:   { className: "border-amber-400 bg-amber-50 dark:bg-amber-950/30", titleClassName: "text-amber-700 dark:text-amber-300"  },
    IMPORTANT: { className: "border-purple-400 bg-purple-50 dark:bg-purple-950/30", titleClassName: "text-purple-700 dark:text-purple-300" },
    CAUTION:   { className: "border-red-400 bg-red-50 dark:bg-red-950/30",     titleClassName: "text-red-700 dark:text-red-300"     },
};

/**
 * Markdown ソースの callout 記法（> [!NOTE] ...）を HTML div に変換する。
 * remark が [!NOTE] をリンク参照としてパースしてしまう問題を回避する。
 */
export function preprocessCallouts(source: string, relatedArticleTitles?: Record<string, string>): string {
    const lines = source.split("\n");
    const result: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const match = line.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*$/i);

        if (match) {
            const type = match[1].toUpperCase();
            const config = CALLOUT_TYPES[type];
            if (config) {
                const bodyLines: string[] = [];
                i++;
                while (i < lines.length && lines[i].startsWith(">")) {
                    bodyLines.push(lines[i].replace(/^>\s?/, ""));
                    i++;
                }
                const body = bodyLines.join("\n");

                result.push(
                    `<div class="-mt-1 mb-4 border-l-4 px-4 py-2 ${config.className}">`,
                    `<p class="mb-1 text-xs font-bold uppercase tracking-widest ${config.titleClassName}">${type}</p>`,
                    "",
                    body,
                    "",
                    "</div>",
                );
                continue;
            }
        }

        // ### 関連記事 → bordered box
        if (/^###\s*関連記事\s*$/.test(line)) {
            const links: { text: string; url: string }[] = [];
            i++;
            while (i < lines.length && lines[i].trim() === "") i++;
            while (i < lines.length && /^-\s+\[.+\]\(.+\)/.test(lines[i])) {
                const linkMatch = lines[i].match(/^-\s+\[(.+)\]\((.+)\)/);
                if (linkMatch) links.push({ text: linkMatch[1], url: linkMatch[2] });
                i++;
            }
            if (links.length > 0) {
                const linkHtml = links
                    .map((l) => {
                        const slugMatch = l.url.match(/^\/blog\/([a-z0-9-]+)$/);
                        const title = slugMatch?.[1] && relatedArticleTitles?.[slugMatch[1]]
                            ? relatedArticleTitles[slugMatch[1]]
                            : l.text;
                        return `<related-article-link href="${l.url}">${title}</related-article-link>`;
                    })
                    .join("\n");
                result.push(`<related-articles>`, linkHtml, `</related-articles>`);
                continue;
            }
            result.push(line);
            continue;
        }

        result.push(line);
        i++;
    }

    return result.join("\n");
}
