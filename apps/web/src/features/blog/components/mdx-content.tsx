import { mdxRenderer } from "../services";

interface MDXContentProps {
    source: string;
}

export async function MDXContent({ source }: MDXContentProps) {
    const { mdxContent } = await mdxRenderer.render(source);

    return (
        <article className="blog-article max-w-none">
            {mdxContent}
        </article>
    );
}
