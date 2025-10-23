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

export function getCategoryIcon(iconName: string): LucideIcon {
  const Icon = iconMap[iconName];
  if (!Icon) {
    console.warn(`Icon "${iconName}" not found, using MapPin as fallback`);
    return MapPin;
  }
  return Icon;
}
