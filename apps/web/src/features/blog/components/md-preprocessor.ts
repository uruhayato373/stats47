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

const CALLOUT_PRIORITY: Record<string, number> = {
    TIP: 1,
    NOTE: 2,
    IMPORTANT: 3,
    WARNING: 4,
    CAUTION: 5,
};

const CALLOUT_INLINE_LABELS: Record<string, string> = {
    NOTE: "補足",
    TIP: "読み解きのポイント",
    WARNING: "注意",
    IMPORTANT: "重要",
    CAUTION: "要注意",
};

type CalloutMarker = { index: number; type: string };

/**
 * 旧記事に残る連続 callout では、最も重要な注意だけをカード表示し、他を通常本文へ戻す。
 * raw source は quality-gate で別途ブロックするため、これは公開済み記事の表示互換レイヤー。
 */
function findDemotedCalloutLines(lines: string[]): Set<number> {
    const markers: CalloutMarker[] = [];
    for (let index = 0; index < lines.length; index++) {
        const match = lines[index].match(/^\s*>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*$/i);
        if (match) markers.push({ index, type: match[1].toUpperCase() });
    }

    const demoted = new Set<number>();
    let cluster: CalloutMarker[] = markers.length > 0 ? [markers[0]] : [];
    const flush = () => {
        if (cluster.length < 2) return;
        const keeper = cluster.reduce((best, marker) =>
            CALLOUT_PRIORITY[marker.type] > CALLOUT_PRIORITY[best.type] ? marker : best,
        );
        for (const marker of cluster) {
            if (marker !== keeper) demoted.add(marker.index);
        }
    };

    for (let i = 1; i < markers.length; i++) {
        const previous = markers[i - 1];
        const current = markers[i];
        const hasSeparatingContent = lines
            .slice(previous.index + 1, current.index)
            .some((line) => line.trim() !== "" && !/^\s*>/.test(line));
        if (hasSeparatingContent) {
            flush();
            cluster = [current];
        } else {
            cluster.push(current);
        }
    }
    flush();
    return demoted;
}

/**
 * Markdown ソースの callout 記法（> [!NOTE] ...）を HTML div に変換する。
 * remark が [!NOTE] をリンク参照としてパースしてしまう問題を回避する。
 */
export function preprocessCallouts(source: string, relatedArticleTitles?: Record<string, string>): string {
    const lines = source.split("\n");
    const result: string[] = [];
    const demotedCalloutLines = findDemotedCalloutLines(lines);
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

                if (demotedCalloutLines.has(i - bodyLines.length - 1)) {
                    const label = CALLOUT_INLINE_LABELS[type] ?? "補足";
                    result.push(`**${label}:** ${body}`, "");
                    continue;
                }

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
