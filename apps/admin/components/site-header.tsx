"use client";

import { Fragment } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navTrail } from "@/lib/nav-registry";

import { ThemeToggle } from "./theme-toggle";

/** 上部バー (見本 shadcndashboard.dev と同じく sticky の白地 + 下線)。サイドバーの開閉と、メニューから求めた現在地を出す。 */
export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const trail = navTrail(pathname, searchParams);

  return (
    <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center border-b bg-background">
      <div className="flex w-full min-w-0 items-center gap-1 px-2 lg:gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-2 h-4 data-vertical:self-auto" />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {trail.length === 0 ? (
              <BreadcrumbItem>
                <BreadcrumbPage>stats47 管理コンソール</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              trail.map((crumb, i) => {
                const last = i === trail.length - 1;
                return (
                  <Fragment key={`${crumb.label}-${i}`}>
                    {i > 0 ? <BreadcrumbSeparator className="hidden md:block" /> : null}
                    <BreadcrumbItem className={last ? undefined : "hidden md:inline-flex"}>
                      {last || !crumb.href ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<a href={crumb.href} />}>{crumb.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
