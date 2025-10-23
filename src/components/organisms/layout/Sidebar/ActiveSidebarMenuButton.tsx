"use client";

import { SidebarMenuButton } from "@/components/atoms/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface ActiveSidebarMenuButtonProps {
  href: string;
  children: ReactNode;
}

export function ActiveSidebarMenuButton({ href, children }: ActiveSidebarMenuButtonProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <SidebarMenuButton asChild isActive={isActive}>
      <Link href={href}>
        {children}
      </Link>
    </SidebarMenuButton>
  );
}
