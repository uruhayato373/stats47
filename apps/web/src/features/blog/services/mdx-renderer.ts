import { compileMDX } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";

import { mdxComponents } from "../components";

// Initialize charts map if needed, or just pass components
// For RSC, we use compileMDX and pass components in the options.

export class MdxRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MDX component types are inherently dynamic
  async render(content: string, components: Record<string, React.ComponentType<any>> = mdxComponents) {
    const { content: mdxContent, frontmatter } = await compileMDX<{ title: string }>({
      source: content,
      options: {
        parseFrontmatter: true,
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkDirective],
          rehypePlugins: [rehypeKatex],
        },
      },
      components,
    });

    return { mdxContent, frontmatter };
  }
}

export const mdxRenderer = new MdxRenderer();
