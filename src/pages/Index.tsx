import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import Dashboard from "@/components/Dashboard";
import VideoAnalysis from "@/components/panels/VideoAnalysis";
import SubtitleSync from "@/components/panels/SubtitleSync";
import TranslationPanel from "@/components/panels/TranslationPanel";
import SubtitleSearch from "@/components/panels/SubtitleSearch";
import MovieRecognition from "@/components/panels/MovieRecognition";
import Settings from "@/components/panels/Settings";
import ErrorBoundary from "@/components/ErrorBoundary";
import { NavigationProvider } from "@/contexts/NavigationContext";

const panels: Record<string, React.ComponentType<any>> = {
  analyze: VideoAnalysis,
  sync: SubtitleSync,
  translate: TranslationPanel,
  search: SubtitleSearch,
  recognize: MovieRecognition,
  settings: Settings,
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const ActivePanel = panels[activeTab];

  return (
    <ErrorBoundary>
      <NavigationProvider onNavigate={setActiveTab}>
        <div className="min-h-screen bg-background film-grain">
          <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />

          <main className="ml-64 min-h-screen">
            <div className="max-w-4xl mx-auto px-8 py-8">
              {activeTab === "dashboard" ? (
                <Dashboard onNavigate={setActiveTab} />
              ) : ActivePanel ? (
                <ActivePanel />
              ) : null}
            </div>
          </main>
        </div>
      </NavigationProvider>
    </ErrorBoundary>
  );
};

export default Index;
