import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { addLineBreaksAfterPeriod } from "../utils";

const proseClasses = "prose prose-sm dark:prose-invert max-w-none text-muted-foreground prose-headings:text-foreground prose-h2:text-[15px] prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-1 prose-h3:text-sm prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-1 prose-p:my-2 prose-p:leading-relaxed";

/** AI 生成 Markdown をサーバーサイドで HTML に変換して表示する */
export function AiMarkdownContent({ content }: { content: string }) {
  return (
    <div className={proseClasses}>
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {addLineBreaksAfterPeriod(content)}
      </ReactMarkdown>
    </div>
  );
}
