import { ReactNode, useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { BottomNav } from "@/components/mobile/BottomNav";
import { cn } from "@/lib/utils";

interface ResponsiveLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ResponsiveLayout = ({
  children,
  sidebar,
  activeTab,
  onTabChange,
}: ResponsiveLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <h1 className="font-bold text-lg">Scriptum</h1>
          </div>

          {sidebar && (
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-2 rounded-lg hover:bg-muted active:scale-95 transition-all"
            >
              {isMobileSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {sidebar && (
          <aside className="hidden md:block w-64 border-r border-border sticky top-0 h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
                <div>
                  <h1 className="font-bold text-xl">Scriptum</h1>
                  <p className="text-xs text-muted-foreground">v2.5</p>
                </div>
              </div>
              {sidebar}
            </div>
          </aside>
        )}

        {/* Mobile Sidebar Overlay */}
        {sidebar && isMobile && (
          <>
            {/* Backdrop */}
            <div
              className={cn(
                "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden",
                isMobileSidebarOpen
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              )}
              onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside
              className={cn(
                "fixed top-14 left-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border z-50 overflow-y-auto transition-transform duration-300 md:hidden",
                isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <div className="p-6">{sidebar}</div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Content wrapper with bottom padding for mobile nav */}
          <div className="pb-20 md:pb-0">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
