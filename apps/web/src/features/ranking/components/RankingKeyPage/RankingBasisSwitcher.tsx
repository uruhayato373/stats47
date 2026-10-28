"use client";

import { useRouter } from "next/navigation";

import { cn } from "@stats47/components";
import { toggleVariants } from "@stats47/components/atoms/ui/toggle";
import { LazySelect } from "@stats47/components/molecules/lazy-select";
import { hrefFor } from "@stats47/data-configs/content/href";

import Link from "@/components/atoms/SiteLink";

export interface RankingBasisMember {
    rankingKey: string;
    title: string;
    subtitle: string | null;
    unit: string;
    normalizationBasis: string | null;
}

interface RankingBasisSwitcherProps {
    rankingKey: string;
    members: RankingBasisMember[];
}

/**
 * 表示基準の切替。別ページへの移動なので、sm 以上は各基準へのリンクを
 * テンプレートの Toggle (outline) の見た目で並べる (計算方法の ToggleGroup と同じ形)。
 * 現在地は aria-current と押下中の地 (bg-muted) で示す。隣り合う線は -ml-px で 1 本に重ねる。
 */
const BASIS_ITEM_CLASS_NAME = cn(
    toggleVariants({ variant: "outline" }),
    "-ml-px first:ml-0 focus-visible:z-10"
);

export function RankingBasisSwitcher({
    rankingKey,
    members,
}: RankingBasisSwitcherProps) {
    const router = useRouter();

    if (members.length <= 1) {
        return null;
    }

    const sortedMembers = [...members].sort(
        (a, b) => (a.normalizationBasis ? 1 : 0) - (b.normalizationBasis ? 1 : 0)
    );
    const items = sortedMembers.map((member) => ({
        value: member.rankingKey,
        label: member.normalizationBasis || "総数",
    }));

    return (
        <>
            <div className="sm:hidden">
                {/* Select の JS は初回操作で読む (配信サイズ策 D・LazySelect) */}
                <LazySelect
                    value={rankingKey}
                    items={items}
                    aria-label="表示基準"
                    triggerClassName="w-full"
                    onValueChange={(key) => {
                        if (key !== rankingKey) router.push(hrefFor("ranking", { rankingKey: key }));
                    }}
                />
            </div>
            <nav aria-label="表示基準" className="hidden w-fit items-center sm:flex">
                {items.map((item) =>
                    item.value === rankingKey ? (
                        <span
                            key={item.value}
                            aria-current="page"
                            className={cn(BASIS_ITEM_CLASS_NAME, "bg-muted text-foreground")}
                        >
                            {item.label}
                        </span>
                    ) : (
                        <Link
                            key={item.value}
                            href={hrefFor("ranking", { rankingKey: item.value })}
                            className={BASIS_ITEM_CLASS_NAME}
                        >
                            {item.label}
                        </Link>
                    )
                )}
            </nav>
        </>
    );
}
