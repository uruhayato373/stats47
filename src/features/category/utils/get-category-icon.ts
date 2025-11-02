/**
 * Category Icon Utilities
 *
 * カテゴリアイコンの取得を担当するユーティリティ関数群。
 * Lucide React のアイコンコンポーネントを文字列名から取得する機能を提供する。
 *
 * ## サポートされているアイコン
 * - MapPin, Users, Briefcase, Wheat, Factory, Store, TrendingUp
 * - Home, Zap, Plane, GraduationCap, Building2, Shield, Heart
 * - Globe, Construction, Sprout, PieChart, Droplets, ShieldCheck
 * - Hospital, Computer
 *
 * ## フォールバック
 * - 存在しないアイコン名が指定された場合、`MapPin` をデフォルトアイコンとして返す
 * - コンソールに警告メッセージを出力する
 *
 * @module CategoryIconUtils
 */

import {
  Briefcase,
  Building2,
  Computer,
  Construction,
  Droplets,
  Factory,
  Globe,
  GraduationCap,
  Heart,
  Home,
  Hospital,
  MapPin,
  PieChart,
  Plane,
  Shield,
  ShieldCheck,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Wheat,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * アイコン名からアイコンコンポーネントへのマッピング
 *
 * カテゴリで使用可能なLucide Reactアイコンのマップ。
 * キーはアイコン名（文字列）、値はアイコンコンポーネント（LucideIcon）。
 */
const iconMap: Record<string, LucideIcon> = {
  MapPin,
  Users,
  Briefcase,
  Wheat,
  Factory,
  Store,
  TrendingUp,
  Home,
  Zap,
  Plane,
  GraduationCap,
  Building2,
  Shield,
  Heart,
  Globe,
  Construction,
  Sprout,
  PieChart,
  Droplets,
  ShieldCheck,
  Hospital,
  Computer,
};

/**
 * カテゴリアイコンを取得
 *
 * 指定されたアイコン名に対応するLucide Reactアイコンコンポーネントを返す。
 * 存在しないアイコン名が指定された場合は、`MapPin` をデフォルトアイコンとして返す。
 *
 * @param {string} iconName - アイコン名（例: "Users", "Briefcase", "MapPin"）
 * @returns {LucideIcon} アイコンコンポーネント。見つからない場合は `MapPin`
 *
 * @example
 * ```tsx
 * // アイコンを取得してコンポーネントで使用
 * const Icon = getCategoryIcon("Users");
 * <Icon className="h-4 w-4" />
 *
 * // 存在しないアイコン名の場合は MapPin が返される
 * const FallbackIcon = getCategoryIcon("NonExistentIcon");
 * // コンソールに警告が表示される: Icon "NonExistentIcon" not found, using MapPin as fallback
 * ```
 */
export function getCategoryIcon(iconName: string): LucideIcon {
  const Icon = iconMap[iconName];
  if (!Icon) {
    console.warn(`Icon "${iconName}" not found, using MapPin as fallback`);
    return MapPin;
  }
  return Icon;
}
