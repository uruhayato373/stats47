import React from "react";
import {
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
} from "lucide-react";

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

const iconMap = {
  MapPin: MapPin,
  Users: Users,
  Briefcase: Briefcase,
  Wheat: Wheat,
  Factory: Factory,
  Store: Store,
  TrendingUp: TrendingUp,
  Home: Home,
  Zap: Zap,
  Plane: Plane,
  GraduationCap: GraduationCap,
  Building2: Building2,
  Shield: Shield,
  Heart: Heart,
  Globe: Globe,
  Construction: Construction,
  Sprout: Sprout,
  PieChart: PieChart,
  Droplets: Droplets,
  ShieldCheck: ShieldCheck,
  Hospital: Hospital,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  className = "w-5 h-5",
}) => {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];

  if (!IconComponent) {
    // フォールバック用のアイコン
    return <MapPin className={className} />;
  }

  return <IconComponent className={className} />;
};
