import React, { createContext, useContext, ReactNode } from 'react';
import type { TabId } from '@/lib/constants';

interface NavigationContextType {
  navigateToTab: (tab: TabId) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({
  children,
  onNavigate
}: {
  children: ReactNode;
  onNavigate: (tab: TabId) => void;
}) => {
  return (
    <NavigationContext.Provider value={{ navigateToTab: onNavigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};
