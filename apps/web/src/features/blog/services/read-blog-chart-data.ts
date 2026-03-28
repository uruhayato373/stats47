import type { BlogChartDataFile } from "@stats47/types";

const LOCAL_BLOG_DIR = "../../.local/r2/blog";

/**
 * dataPath からブログチャートデータを読み込む（Server Component 専用）
 *
 * @param dataPath - MDX で指定されるパス（例: "my-article/data/chart.json"）
 *                   開発: .local/r2/blog/my-article/data/chart.json
 *                   本番: R2 キー blog/my-article/data/chart.json
 */
export async function readBlogChartData(
  dataPath: string
): Promise<BlogChartDataFile | null> {
  if (process.env.NODE_ENV === "development") {
    const fs = await import("fs");
    const path = await import("path");
    const filePath = path.resolve(process.cwd(), LOCAL_BLOG_DIR, dataPath);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as BlogChartDataFile;
  }

  const { fetchFromR2AsJson } = await import("@stats47/r2-storage/server");
  const data = await fetchFromR2AsJson(`blog/${dataPath}`);
  return (data as BlogChartDataFile | null);
}
