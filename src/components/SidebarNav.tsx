import { cn } from "@/lib/utils";
import {
  Film,
  Languages,
  Search,
  RefreshCw,
  FileVideo,
  LayoutDashboard,
  Subtitles,
  Settings,
} from "lucide-react";

interface SidebarNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analyze", label: "Análise de Vídeo", icon: FileVideo },
  { id: "sync", label: "Sincronização", icon: RefreshCw },
  { id: "translate", label: "Tradução", icon: Languages },
  { id: "search", label: "Pesquisa de Legendas", icon: Search },
  { id: "recognize", label: "Reconhecimento", icon: Film },
];

const SidebarNav = ({ activeTab, onTabChange }: SidebarNavProps) => {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-gold">
          <Subtitles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">Scriptum</h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Subtitle Suite
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent text-accent-foreground glow-gold"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Settings Button */}
      <div className="px-3 pb-3 border-t border-border pt-3">
        <button
          onClick={() => onTabChange('settings')}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            activeTab === 'settings'
              ? "bg-accent text-accent-foreground glow-gold"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className={cn("h-4 w-4", activeTab === 'settings' && "text-primary")} />
          Configurações
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground font-mono">v2.1 Refactored</span>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;
