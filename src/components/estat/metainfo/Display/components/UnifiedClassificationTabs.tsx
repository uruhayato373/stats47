import React from "react";
import PaginatedTable from "./PaginatedTable";

interface UnifiedClassificationTabsProps {
  classObjs: Array<{
    "@id": string;
    "@name": string;
    CLASS?:
      | Array<{
          "@code": string;
          "@name": string;
          "@unit"?: string;
          "@explanation"?: string;
        }>
      | {
          "@code": string;
          "@name": string;
          "@unit"?: string;
          "@explanation"?: string;
        };
  }>;
  metaInfoId?: string;
}

export default function UnifiedClassificationTabs({
  classObjs,
  metaInfoId,
}: UnifiedClassificationTabsProps) {
  if (!classObjs || classObjs.length === 0) return null;

  const categoryData = classObjs.find((obj) => obj["@id"] === "cat01");

  const getTableData = (classObj: typeof categoryData) => {
    if (!classObj || !classObj.CLASS) return [];
    return Array.isArray(classObj.CLASS) ? classObj.CLASS : [classObj.CLASS];
  };

  if (!categoryData) return null;

  return (
    <div className="border-t border-b border-gray-50 dark:border-neutral-800">
      <PaginatedTable
        data={getTableData(categoryData)}
        itemsPerPage={10}
        metaInfoId={metaInfoId}
        showUnit={true}
      />
    </div>
  );
}
