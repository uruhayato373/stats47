import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

interface CityBreadcrumbsProps {
  areaCode: string;
  prefName: string;
  cityName: string;
  cityBasePath?: string;
  currentPage?: string;
}

export function CityBreadcrumbs({
  areaCode,
  prefName,
  cityName,
  cityBasePath,
  currentPage,
}: CityBreadcrumbsProps) {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">ホーム</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/areas">都道府県一覧</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/areas/${areaCode}`}>{prefName}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {currentPage && cityBasePath ? (
            <BreadcrumbLink asChild>
              <Link href={cityBasePath}>{cityName}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{cityName}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {currentPage ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

