import { motion } from "framer-motion";
import {
  FileVideo,
  RefreshCw,
  Languages,
  Search,
  Film,
  Subtitles,
  Clock,
  Zap,
} from "lucide-react";

const stats = [
  { label: "Legendas Processadas", value: "—", icon: Subtitles },
  { label: "Vídeos Analisados", value: "—", icon: FileVideo },
  { label: "Traduções", value: "—", icon: Languages },
  { label: "Tempo Médio", value: "—", icon: Clock },
];

const features = [
  {
    id: "analyze",
    title: "Análise de Vídeo",
    description: "Analise metadados, codec, duração, FPS e resolução com FFmpeg.",
    icon: FileVideo,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    id: "sync",
    title: "Sincronização",
    description: "Sincronize SRT com vídeo usando MLX Whisper e ajuste de offsets.",
    icon: RefreshCw,
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    id: "translate",
    title: "Tradução",
    description: "Traduza legendas em batches com Gemini e regras de formatação.",
    icon: Languages,
    gradient: "from-primary/20 to-primary/5",
  },
  {
    id: "search",
    title: "Pesquisa de Legendas",
    description: "Pesquise e descarregue legendas do OpenSubtitles.",
    icon: Search,
    gradient: "from-secondary/20 to-secondary/5",
  },
  {
    id: "recognize",
    title: "Reconhecimento de Filmes",
    description: "Identifique filmes via TMDB com título, poster e sinopse.",
    icon: Film,
    gradient: "from-primary/20 to-primary/5",
  },
];

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-xl border border-border gradient-card p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(38_92%_55%_/_0.06),_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xs font-mono uppercase tracking-widest text-primary">
              Suite Completa
            </span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Gestão de Legendas
          </h2>
          <p className="text-muted-foreground max-w-lg">
            Sincronize, traduza e gerencie legendas com suporte a MLX Whisper, Gemini,
            OpenSubtitles, TMDB e FFmpeg.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold font-mono text-foreground">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Cards */}
      <div>
        <h3 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Funcionalidades
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.4 }}
                onClick={() => onNavigate(feature.id)}
                className="group text-left rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:glow-gold"
              >
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} mb-4 transition-transform group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {feature.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
