/**
 * 司法・安全・環境 > 警察・犯罪 > 全国ダッシュボード
 * 全国レベルの警察・犯罪統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  PoliceOfficerCountCard,
  CriminalRecognitionCountCard,
  CriminalArrestCountCard,
  CriminalRecognitionTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 警察・犯罪全国ダッシュボード
 */
export async function PoliceCrimeNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 警察官数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PoliceOfficerCountCard areaCode={areaCode} title="警察官数" />
      </div>

      {/* 刑法犯認知件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <CriminalRecognitionCountCard
          areaCode={areaCode}
          title="刑法犯認知件数"
        />
      </div>

      {/* 刑法犯検挙件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <CriminalArrestCountCard
          areaCode={areaCode}
          title="刑法犯検挙件数"
        />
      </div>

      {/* 刑法犯認知件数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <CriminalRecognitionTrendChart
          areaCode={areaCode}
          title="刑法犯認知件数推移"
          description="年度別の刑法犯認知件数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}