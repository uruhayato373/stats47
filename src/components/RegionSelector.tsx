"use client";

interface Region {
  code: string;
  name: string;
}

interface RegionSelectorProps {
  regions: Region[];
  selectedRegion: string;
  onRegionChange: (regionCode: string) => void;
}

export function RegionSelector({
  regions,
  selectedRegion,
  onRegionChange,
}: RegionSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">地域選択</h2>
      <div className="flex items-center space-x-4">
        <label
          htmlFor="region-select"
          className="text-sm font-medium text-gray-700"
        >
          都道府県:
        </label>
        <select
          id="region-select"
          value={selectedRegion}
          onChange={(e) => onRegionChange(e.target.value)}
          className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          {regions.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-500">
          選択中: {regions.find((r) => r.code === selectedRegion)?.name}
        </div>
      </div>
    </div>
  );
}
