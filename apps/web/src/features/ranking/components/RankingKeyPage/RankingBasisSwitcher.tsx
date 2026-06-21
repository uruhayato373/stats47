"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@stats47/components/atoms/ui/select";

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

    return (
        <>
            <div className="mt-3 sm:hidden">
                <Select
                    value={rankingKey}
                    onValueChange={(key) => {
                        if (key !== rankingKey) router.push(`/ranking/${key}`);
                    }}
                >
                    <SelectTrigger aria-label="表示基準" className="h-9 w-full text-sm">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {sortedMembers.map((member) => (
                            <SelectItem key={member.rankingKey} value={member.rankingKey}>
                                {member.normalizationBasis || "総数"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="hidden sm:flex items-center gap-0.5 mt-3 w-fit">
                {sortedMembers.map((member) => {
                    const isCurrent = member.rankingKey === rankingKey;
                    const label = member.normalizationBasis || "総数";
                    return isCurrent ? (
                        <span
                            key={member.rankingKey}
                            className="text-xs px-2.5 pb-1 border-b-2 border-primary text-foreground font-medium"
                        >
                            {label}
                        </span>
                    ) : (
                        <Link
                            key={member.rankingKey}
                            href={`/ranking/${member.rankingKey}`}
                            className="text-xs px-2.5 pb-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-colors"
                        >
                            {label}
                        </Link>
                    );
                })}
            </div>
        </>
    );
}
