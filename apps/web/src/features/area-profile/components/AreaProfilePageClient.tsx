import { ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import type { AreaProfileData } from "../types";

interface Props {
    profile: AreaProfileData;
}

export function AreaProfilePageClient({ profile }: Props) {
    return (
        <div className="container mx-auto px-4 pt-6">
            <div className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h1 className="text-lg font-bold">
                        {profile.areaName}の特徴
                    </h1>
                    <Link
                        href={`/compare/population?areas=${profile.areaCode}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm transition-all hover:bg-primary/90 hover:scale-105 active:scale-95 self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeftRight size={16} />
                        他県と比較する
                    </Link>
                </div>
            </div>
        </div>
    );
}
