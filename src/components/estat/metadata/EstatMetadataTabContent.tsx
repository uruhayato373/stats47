"use client";

import { EstatMetaInfoResponse } from "@/types/estat";
import MetaInfoFetcher from "./MetaInfoFetcher";
import MetaInfoCard from "./MetaInfoCard";
import MetadataSaver from "./MetadataSaver";
import SavedMetadataDisplay from "./SavedMetadataDisplay";
import { TabId } from "./EstatMetadataTabNavigation";

interface EstatMetadataTabContentProps {
  activeTab: TabId;
  metaInfo: EstatMetaInfoResponse | null;
  loading: boolean;
  error: string | null;
  onFetchMetaInfo: (statsDataId: string) => void;
}

export default function EstatMetadataTabContent({
  activeTab,
  metaInfo,
  loading,
  error,
  onFetchMetaInfo,
}: EstatMetadataTabContentProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case "fetch":
        return (
          <>
            <MetaInfoFetcher onSubmit={onFetchMetaInfo} loading={loading} />
            <MetaInfoCard metaInfo={metaInfo} loading={loading} error={error} />
          </>
        );
      case "save":
        return <MetadataSaver />;
      case "saved":
        return <SavedMetadataDisplay />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto space-y-4">{renderTabContent()}</div>
    </div>
  );
}
