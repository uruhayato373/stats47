'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';

interface AreaDirectoryRegionContextValue {
  activeRegionCode: string;
  setActiveRegionCode: (regionCode: string) => void;
}

const DEFAULT_VALUE: AreaDirectoryRegionContextValue = {
  activeRegionCode: 'all',
  setActiveRegionCode: () => {},
};

const AreaDirectoryRegionContext =
  createContext<AreaDirectoryRegionContextValue>(DEFAULT_VALUE);

interface ProviderProps {
  children: ReactNode;
}

/** `/areas` の左レールと地方別一覧で共有する絞り込み状態。 */
export function AreaDirectoryRegionProvider({ children }: ProviderProps) {
  const [activeRegionCode, setActiveRegionCode] = useState('all');
  const value = useMemo(
    () => ({ activeRegionCode, setActiveRegionCode }),
    [activeRegionCode]
  );

  return (
    <AreaDirectoryRegionContext.Provider value={value}>
      {children}
    </AreaDirectoryRegionContext.Provider>
  );
}

export function useAreaDirectoryRegion() {
  return useContext(AreaDirectoryRegionContext);
}
