"use client";

import { useState } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Settings, 
  Filter, 
  Database, 
  RotateCcw,
  Info
} from "lucide-react";
import { GetStatsDataParams } from "@/types/estat";

interface EstatDataFetcherProps {
  onSubmit: (params: any) => void;
  loading: boolean;
}

type FormData = Omit<GetStatsDataParams, 'appId'> & {
  statsDataId: string;
};

export default function EstatDataFetcher({
  onSubmit,
  loading,
}: EstatDataFetcherProps) {
  const [formData, setFormData] = useState<Partial<FormData>>({
    statsDataId: "0003412312",
    limit: 100,
    lang: 'J',
    metaGetFlg: 'Y',
    cntGetFlg: 'N',
    explanationGetFlg: 'N',
    annotationGetFlg: 'N',
    replaceSpChars: '0',
    sectionHeaderFlg: '1',
  });

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params: any = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    onSubmit(params);
  };

  const handleReset = () => {
    setFormData({
      statsDataId: "0003412312",
      limit: 100,
      lang: 'J',
      metaGetFlg: 'Y',
      cntGetFlg: 'N',
      explanationGetFlg: 'N',
      annotationGetFlg: 'N',
      replaceSpChars: '0',
      sectionHeaderFlg: '1',
    });
  };

  const renderSection = (
    id: string, 
    title: string, 
    icon: React.ReactNode, 
    content: React.ReactNode,
    description?: string
  ) => (
    <div className="bg-white border border-gray-200 rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700 rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="font-medium text-gray-800 dark:text-neutral-200">{title}</h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{description}</p>
            )}
          </div>
        </div>
        {expandedSections.has(id) ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      
      {expandedSections.has(id) && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-neutral-700">
          <div className="mt-4">
            {content}
          </div>
        </div>
      )}
    </div>
  );

  const renderInputField = (
    name: keyof FormData, 
    label: string, 
    placeholder?: string, 
    type: 'text' | 'number' = 'text',
    description?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
        {label}
        {description && (
          <span className="ml-1 text-xs text-gray-500">({description})</span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
        placeholder={placeholder}
        min={type === 'number' ? 1 : undefined}
      />
    </div>
  );

  const renderSelectField = (
    name: keyof FormData, 
    label: string, 
    options: Array<{value: string, label: string}>,
    description?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
        {label}
        {description && (
          <span className="ml-1 text-xs text-gray-500">({description})</span>
        )}
      </label>
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:focus:ring-neutral-600"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const basicContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderInputField('statsDataId', '統計表ID *', '例: 0003412312', 'text', 'statsDataId')}
      {renderInputField('limit', '取得件数上限', '100', 'number', 'limit')}
      {renderInputField('startPosition', '開始位置', '1', 'number', 'startPosition')}
      {renderSelectField('lang', '言語', [
        { value: 'J', label: '日本語' },
        { value: 'E', label: '英語' }
      ], 'lang')}
    </div>
  );

  const filteringContent = (
    <div className="space-y-6">
      {/* コード指定 */}
      <div>
        <h4 className="font-medium text-sm text-gray-700 dark:text-neutral-300 mb-3">分類コード指定</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderInputField('cdTab', '表章項目', 'カンマ区切り', 'text', 'cdTab')}
          {renderInputField('cdCat01', '分類01', 'カンマ区切り', 'text', 'cdCat01')}
          {renderInputField('cdCat02', '分類02', 'カンマ区切り', 'text', 'cdCat02')}
          {renderInputField('cdCat03', '分類03', 'カンマ区切り', 'text', 'cdCat03')}
          {renderInputField('cdCat04', '分類04', 'カンマ区切り', 'text', 'cdCat04')}
          {renderInputField('cdCat05', '分類05', 'カンマ区切り', 'text', 'cdCat05')}
          {renderInputField('cdArea', '地域', 'カンマ区切り', 'text', 'cdArea')}
          {renderInputField('cdTime', '時間軸', 'カンマ区切り', 'text', 'cdTime')}
        </div>
      </div>

      {/* 階層レベル指定 */}
      <div>
        <h4 className="font-medium text-sm text-gray-700 dark:text-neutral-300 mb-3">階層レベル指定</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderInputField('lvTab', '表章項目レベル', '', 'text', 'lvTab')}
          {renderInputField('lvCat01', '分類01レベル', '', 'text', 'lvCat01')}
          {renderInputField('lvCat02', '分類02レベル', '', 'text', 'lvCat02')}
          {renderInputField('lvCat03', '分類03レベル', '', 'text', 'lvCat03')}
          {renderInputField('lvArea', '地域レベル', '', 'text', 'lvArea')}
          {renderInputField('lvTime', '時間軸レベル', '', 'text', 'lvTime')}
        </div>
      </div>

      {/* 時間軸範囲指定 */}
      <div>
        <h4 className="font-medium text-sm text-gray-700 dark:text-neutral-300 mb-3">時間軸範囲指定</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderInputField('cdTimeFrom', '開始時間', '', 'text', 'cdTimeFrom')}
          {renderInputField('cdTimeTo', '終了時間', '', 'text', 'cdTimeTo')}
        </div>
      </div>
    </div>
  );

  const optionsContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderSelectField('metaGetFlg', 'メタ情報取得', [
        { value: 'Y', label: '取得する' },
        { value: 'N', label: '取得しない' }
      ], 'metaGetFlg')}
      
      {renderSelectField('cntGetFlg', '件数取得', [
        { value: 'Y', label: '取得する' },
        { value: 'N', label: '取得しない' }
      ], 'cntGetFlg')}
      
      {renderSelectField('explanationGetFlg', '解説情報取得', [
        { value: 'Y', label: '取得する' },
        { value: 'N', label: '取得しない' }
      ], 'explanationGetFlg')}
      
      {renderSelectField('annotationGetFlg', '注釈情報取得', [
        { value: 'Y', label: '取得する' },
        { value: 'N', label: '取得しない' }
      ], 'annotationGetFlg')}
      
      {renderSelectField('replaceSpChars', '特殊文字置換', [
        { value: '0', label: '置換しない' },
        { value: '1', label: 'NULL' },
        { value: '2', label: '0' }
      ], 'replaceSpChars')}
      
      {renderSelectField('sectionHeaderFlg', 'セクションヘッダ', [
        { value: '1', label: '有り' },
        { value: '2', label: '無し' }
      ], 'sectionHeaderFlg')}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
          <h2 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            データ取得パラメータ
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            e-Stat APIから統計データを取得するためのパラメータを設定してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            {/* 基本設定 */}
            {renderSection(
              'basic',
              '基本設定',
              <Database className="w-4 h-4 text-indigo-500" />,
              basicContent,
              '統計表IDと基本的な取得オプション'
            )}

            {/* データフィルタリング */}
            {renderSection(
              'filtering',
              'データフィルタリング',
              <Filter className="w-4 h-4 text-green-500" />,
              filteringContent,
              '分類コードや階層レベルによるデータ絞り込み'
            )}

            {/* 出力オプション */}
            {renderSection(
              'options',
              '出力オプション',
              <Settings className="w-4 h-4 text-orange-500" />,
              optionsContent,
              'メタ情報取得や出力形式の設定'
            )}

            {/* ボタン */}
            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.statsDataId}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4" />
                {loading ? "取得中..." : "データを取得"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
              >
                <RotateCcw className="w-4 h-4" />
                リセット
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ヘルプ情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/10 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
              パラメータについて
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <p>• <strong>統計表ID</strong>: 取得したい統計表の識別子（必須）</p>
              <p>• <strong>分類コード</strong>: 特定の分類項目のみを取得したい場合に指定</p>
              <p>• <strong>階層レベル</strong>: 分類の階層構造において特定レベルのみを取得</p>
              <p>• <strong>時間軸範囲</strong>: 特定の期間のデータのみを取得</p>
              <p>詳細は <a href="https://www.e-stat.go.jp/api/" target="_blank" rel="noopener noreferrer" className="underline">e-STAT API マニュアル</a> を参照してください。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}