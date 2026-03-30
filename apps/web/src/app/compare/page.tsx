import { redirect } from "next/navigation";

import { unwrap } from "@stats47/types";

import { listCategories } from "@/features/category/server";


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
