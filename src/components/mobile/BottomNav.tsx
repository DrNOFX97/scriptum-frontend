import { Search, Settings, FileVideo, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const scrollDirection = useScrollDirection({ threshold: 20, debounce: 50 });

  const tabs = [
    { id: "sync", icon: FileVideo, label: "Sync" },
    { id: "search", icon: Search, label: "Pesquisar" },
    { id: "translate", icon: Languages, label: "Traduzir" },
    { id: "settings", icon: Settings, label: "Config" },
  ];

  // Hide when scrolling down, show when scrolling up or at top
  const isVisible = scrollDirection !== "down";

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom md:hidden transition-transform duration-300",
        isVisible ? "translate-y-0" : "translate-y-full"
      )}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 min-w-[4rem] touch-manipulation",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
