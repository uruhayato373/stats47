import yaml from 'js-yaml';

export interface BlogSnapshotFrontmatter {
  title?: string;
  seoTitle?: string;
  description?: string;
  tags?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  published?: boolean;
  ogImage?: string;
  [key: string]: unknown;
}

/** A broken source must never replace live article metadata with empty defaults. */
export function parseBlogSnapshotFrontmatter(content: string, slug: string): BlogSnapshotFrontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Invalid blog frontmatter (${slug}): YAML header is missing`);
  try {
    const value: unknown = yaml.load(match[1]);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('YAML header must be a mapping');
    }
    return value as BlogSnapshotFrontmatter;
  } catch (error) {
    throw new Error(`Invalid blog frontmatter (${slug}): ${error instanceof Error ? error.message : String(error)}`);
  }
}
