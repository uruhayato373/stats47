"use client";

import { memo } from "react";
import { cn } from "../lib/cn";

interface StatCardProps {
    /** The label displayed at the top */
    label: string;
    /** The main value displayed in the center */
    value: React.ReactNode;
    /** Optional description displayed at the bottom */
    description?: string;
    /** Optional icon displayed next to the label */
    icon?: React.ReactNode;
    /** Color variant of the card */
    variant?: "default" | "success" | "warning" | "error" | "info";
    /** Additional CSS classes */
    className?: string;
}

const variantStyles = {
    default: {
        container: "border-border bg-card text-card-foreground",
        label: "text-muted-foreground",
        value: "text-foreground",
        description: "text-muted-foreground",
    },
    success: {
        container: "border-green-500/50 bg-green-500/10",
        label: "text-green-700 dark:text-green-400",
        value: "text-green-600 dark:text-green-500",
        description: "text-green-700 dark:text-green-400",
    },
    warning: {
        container: "border-yellow-500/50 bg-yellow-500/10",
        label: "text-yellow-700 dark:text-yellow-400",
        value: "text-yellow-600 dark:text-yellow-500",
        description: "text-yellow-700 dark:text-yellow-400",
    },
    error: {
        container: "border-red-500/50 bg-red-500/10",
        label: "text-red-700 dark:text-red-400",
        value: "text-red-600 dark:text-red-500",
        description: "text-red-700 dark:text-red-500",
    },
    info: {
        container: "border-blue-500/50 bg-blue-500/10",
        label: "text-blue-700 dark:text-blue-400",
        value: "text-blue-600 dark:text-blue-500",
        description: "text-blue-700 dark:text-blue-400",
    },
};

export const StatCard = memo(function StatCard({
    label,
    value,
    description,
    icon,
    variant = "default",
    className,
}: StatCardProps) {
    const styles = variantStyles[variant];

    return (
        <div
            className={cn(
                "rounded-lg border p-4",
                styles.container,
                className
            )}
        >
            <div className={cn("text-xs mb-1 flex items-center gap-2", styles.label)}>
                {icon && <span className="size-4 shrink-0">{icon}</span>}
                {label}
            </div>
            <div className={cn("text-2xl font-bold", styles.value)}>{value}</div>
            {description && (
                <div className={cn("text-xs mt-1", styles.description)}>
                    {description}
                </div>
            )}
        </div>
    );
});
