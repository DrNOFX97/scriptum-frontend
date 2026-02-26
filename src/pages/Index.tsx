import React, { Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import SidebarNav from "@/components/SidebarNav";
import Dashboard from "@/components/Dashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { TAB, type TabId } from "@/lib/constants";

const VideoAnalysis = React.lazy(() => import('@/components/panels/VideoAnalysis'));
const SubtitleSync = React.lazy(() => import('@/components/panels/SubtitleSync'));
const TranslationPanel = React.lazy(() => import('@/components/panels/TranslationPanel'));
const SubtitleSearch = React.lazy(() => import('@/components/panels/SubtitleSearch'));
const MovieRecognition = React.lazy(() => import('@/components/panels/MovieRecognition'));
const Settings = React.lazy(() => import('@/components/panels/Settings'));
const VideoPlayer = React.lazy(() => import('@/components/panels/VideoPlayer'));

const panels: Partial<Record<TabId, React.LazyExoticComponent<React.ComponentType<unknown>>>> = {
  [TAB.ANALYZE]: VideoAnalysis,
  [TAB.SYNC]: SubtitleSync,
  [TAB.TRANSLATE]: TranslationPanel,
  [TAB.SEARCH]: SubtitleSearch,
  [TAB.RECOGNIZE]: MovieRecognition,
  [TAB.PLAYER]: VideoPlayer,
  [TAB.SETTINGS]: Settings,
};

const PanelFallback = () => (
  <div className="flex items-center justify-center py-24">
    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
  </div>
);

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') ?? TAB.DASHBOARD) as TabId;

  const setActiveTab = (tab: TabId) => {
    if (tab === TAB.DASHBOARD) {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  const ActivePanel = activeTab !== TAB.DASHBOARD ? panels[activeTab] : null;

  return (
    <ErrorBoundary>
      <NavigationProvider onNavigate={setActiveTab}>
        <div className="min-h-screen bg-background film-grain">
          <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="ml-64 min-h-screen">
            <div className="max-w-4xl mx-auto px-8 py-8">
              {activeTab === TAB.DASHBOARD ? (
                <Dashboard onNavigate={setActiveTab} />
              ) : ActivePanel ? (
                <Suspense fallback={<PanelFallback />}>
                  <ActivePanel />
                </Suspense>
              ) : null}
            </div>
          </main>
        </div>
      </NavigationProvider>
    </ErrorBoundary>
  );
};

export default Index;
