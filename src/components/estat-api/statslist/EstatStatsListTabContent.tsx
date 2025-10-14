import { TabId } from "./EstatStatsListTabNavigation";
import { StatsListSearchResult } from "@/lib/estat-stats-list-manager";
import StatsListSearchTab from "./tabs/StatsListSearchTab";
import StatsListSummaryTab from "./tabs/StatsListSummaryTab";
import StatsListFetchTab from "./tabs/StatsListFetchTab";
import StatsListBulkTab from "./tabs/StatsListBulkTab";

interface EstatStatsListTabContentProps {
  activeTab: TabId;
  statsListData: StatsListSearchResult | null;
  loading: boolean;
  error: string | null;
  onSearchStatsList: (query: string, filters?: any) => Promise<void>;
}

export default function EstatStatsListTabContent({
  activeTab,
  statsListData,
  loading,
  error,
  onSearchStatsList,
}: EstatStatsListTabContentProps) {
  const renderTabContent = () => {
    switch (activeTab) {
      case "search":
        return (
          <StatsListSearchTab
            data={statsListData}
            loading={loading}
            error={error}
            onSearch={onSearchStatsList}
          />
        );
      case "summary":
        return <StatsListSummaryTab />;
      case "fetch":
        return <StatsListFetchTab />;
      case "bulk":
        return <StatsListBulkTab />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
    </div>
  );
}
