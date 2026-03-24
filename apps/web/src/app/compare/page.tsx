import { listCategories } from "@/features/category/server";
import { unwrap } from "@stats47/types";
import { redirect } from "next/navigation";

export const revalidate = 86400;

interface PageProps {
    searchParams: Promise<{
        areas?: string;
    }>;
}

/**
 * /compare → /compare/{defaultCategory} へリダイレクト
 */
export default async function CompareRedirectPage({ searchParams }: PageProps) {
    const { areas } = await searchParams;
    const categories = unwrap(await listCategories());
    const defaultKey = categories[0]?.categoryKey || "population";

    const query = areas ? `?areas=${areas}` : "";
    redirect(`/compare/${defaultKey}${query}`);
}
