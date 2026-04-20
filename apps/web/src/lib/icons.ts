import {
  Building2,
  Construction,
  Droplets,
  Factory,
  Globe,
  GraduationCap,
  Home,
  Hospital,
  MapPin,
  PieChart,
  Plane,
  ShieldCheck,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Construction,
  Droplets,
  Factory,
  Globe,
  GraduationCap,
  Home,
  Hospital,
  MapPin,
  PieChart,
  Plane,
  ShieldCheck,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Wifi,
};

export function getIcon(name: string): LucideIcon {
  return CATEGORY_ICON_MAP[name] ?? MapPin;
}
