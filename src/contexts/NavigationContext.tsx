import React, { createContext, useContext, ReactNode } from 'react';

interface NavigationContextType {
  navigateToTab: (tab: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({
  children,
  onNavigate
}: {
  children: ReactNode;
  onNavigate: (tab: string) => void;
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
