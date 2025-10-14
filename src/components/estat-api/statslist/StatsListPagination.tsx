"use client";

interface StatsListPaginationProps {
  fromNumber: number;
  toNumber: number;
  totalCount: number;
  nextKey?: number;
  onNext?: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
}

export function StatsListPagination({
  fromNumber,
  toNumber,
  totalCount,
  nextKey,
  onNext,
  onPrevious,
  isLoading = false,
}: StatsListPaginationProps) {
  const hasNext = nextKey !== undefined && nextKey > 0;
  const hasPrevious = fromNumber > 1;

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="bg-white px-6 py-4 border-t border-gray-200">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          {fromNumber} - {toNumber} / {totalCount.toLocaleString()}件
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious || isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            前へ
          </button>

          <button
            onClick={onNext}
            disabled={!hasNext || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>
      </div>
    </div>
  );
}
