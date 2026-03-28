"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@stats47/components";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import { Loader2 } from "lucide-react";

import type { Category } from "@stats47/category";



interface Props {
    categories: Category[];
    currentCategoryKey: string;
    areaCode: string;
    basePath?: string;
}

export function CategorySelect({ categories, currentCategoryKey, areaCode, basePath }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const currentCategory = categories.find((c) => c.categoryKey === currentCategoryKey);

    const handleChange = (key: string) => {
        startTransition(() => {
            router.push(`${basePath ?? `/areas/${areaCode}`}/${key}`, { scroll: false });
        });
    };

    return (
        <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="py-3 px-3">
                <CardTitle className="text-base">カテゴリ</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 pt-0">
                <Select value={currentCategoryKey} onValueChange={handleChange}>
                    <SelectTrigger className="w-full h-9 text-sm font-medium">
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <SelectValue>
                                {currentCategory?.categoryName ?? "カテゴリ"}
                            </SelectValue>
                        )}
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                        {categories.map((cat) => (
                            <SelectItem key={cat.categoryKey} value={cat.categoryKey}>
                                {cat.categoryName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
}
