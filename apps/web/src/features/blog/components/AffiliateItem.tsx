"use client";

import Image from "next/image";

import { SurfaceCard } from "@/components/surface";

import { type AffiliateProduct } from "../types";

export function AffiliateItem(props: AffiliateProduct) {
    return (
        <SurfaceCard className="my-8 flex flex-col items-center p-6 md:flex-row md:gap-6">
            {props.imageUrl && (
                <div className="flex-shrink-0">
                    <Image
                        src={props.imageUrl}
                        alt={props.name}
                        width={160}
                        height={160}
                        className="h-40 w-40 object-contain"
                    />
                </div>
            )}
            <div className="flex flex-1 flex-col justify-center text-center md:text-left">
                <h3 className="text-lg font-bold text-foreground">{props.name}</h3>
                {props.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{props.description}</p>
                )}
                {props.price && (
                    <p className="mt-2 font-semibold text-negative">{props.price}</p>
                )}
                <div className="mt-4">
                    <a
                        href={props.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        {props.buttonText || "Amazonで見る"}
                    </a>
                </div>
            </div>
        </SurfaceCard>
    );
}
