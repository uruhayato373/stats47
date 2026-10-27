import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { hrefFor } from "@stats47/data-configs/content/href";

import Link from "@/components/atoms/SiteLink";


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
          <BreadcrumbLink render={<Link href="/" />}>ホーム</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href="/areas" />}>都道府県一覧</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={hrefFor("area", { areaCode })} />}>{prefName}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {currentPage && cityBasePath ? (
            <BreadcrumbLink render={<Link href={cityBasePath} />}>{cityName}</BreadcrumbLink>
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

