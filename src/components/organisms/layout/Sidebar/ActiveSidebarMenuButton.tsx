"use client";

import { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";


interface ActiveSidebarMenuButtonProps {
  href: string;
  children: ReactNode;
}

export function ActiveSidebarMenuButton({
  href,
  children,
}: ActiveSidebarMenuButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      {children}
    </Link>
  );
}
