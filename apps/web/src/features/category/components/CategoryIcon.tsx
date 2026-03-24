import { getIcon } from "@/lib/icons";

interface CategoryIconProps {
  categoryKey: string;
  lucideIconName: string;
  className?: string;
}

export function CategoryIcon({ lucideIconName, className }: CategoryIconProps) {
  const Icon = getIcon(lucideIconName);
  return <Icon className={className} />;
}
