import { useMemo } from "react";

import { getIcon } from "@/lib/icons";

interface CategoryIconProps {
  categoryKey: string;
  lucideIconName: string;
  className?: string;
}

export function CategoryIcon({ lucideIconName, className }: CategoryIconProps) {
  const Icon = useMemo(() => getIcon(lucideIconName), [lucideIconName]);
  // eslint-disable-next-line react-hooks/static-components -- Icon is memoized via useMemo above
  return <Icon className={className} />;
}
