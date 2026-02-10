import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle, Key, Database, Globe, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface EnvConfig {
  OPENSUBTITLES_API_KEY: string;
  OPENSUBTITLES_USER_AGENT: string;
  GEMINI_API_KEY: string;
  TMDB_API_KEY: string;
  LEGENDASDIVX_USER: string;
  LEGENDASDIVX_PASS: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<EnvConfig>({
    OPENSUBTITLES_API_KEY: '',
    OPENSUBTITLES_USER_AGENT: '',
    GEMINI_API_KEY: '',
    TMDB_API_KEY: '',
    LEGENDASDIVX_USER: '',
    LEGENDASDIVX_PASS: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/config`);
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      } else {
        throw new Error('Failed to load config');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: err instanceof Error ? err.message : "Falha ao carregar",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: keyof EnvConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });

      if (!response.ok) {
        throw new Error('Failed to save config');
      }

      toast({
        title: "✅ Configurações salvas",
        description: "As alterações foram aplicadas com sucesso",
      });
      setHasChanges(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err instanceof Error ? err.message : "Falha ao salvar configurações",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">A carregar configurações...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Configure as suas chaves API e credenciais.
        </p>
      </div>

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Tem alterações não guardadas. Clique em "Guardar Alterações" para aplicar.
          </AlertDescription>
        </Alert>
      )}

      {/* OpenSubtitles Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logos/opensubtitles.svg" alt="OpenSubtitles" className="w-10 h-10 rounded-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">OpenSubtitles API</h3>
            <p className="text-xs text-muted-foreground">Configuração para pesquisa de legendas</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              API Key
            </label>
            <div className="relative">
              <Input
                type={showPasswords['opensubtitles_key'] ? 'text' : 'password'}
                placeholder="qPYFmhhwzETJQkFSz8f6wHxYMRCqOIeq"
                value={config.OPENSUBTITLES_API_KEY}
                onChange={(e) => handleChange('OPENSUBTITLES_API_KEY', e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('opensubtitles_key')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md transition-colors"
              >
                {showPasswords['opensubtitles_key'] ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Obtenha em <a href="https://www.opensubtitles.com/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">opensubtitles.com/api</a>
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              User Agent
            </label>
            <Input
              placeholder="Scriptum v2.1"
              value={config.OPENSUBTITLES_USER_AGENT}
              onChange={(e) => handleChange('OPENSUBTITLES_USER_AGENT', e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nome da aplicação para identificação na API
            </p>
          </div>
        </div>
      </Card>

      {/* Gemini API Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logos/gemini.svg" alt="Google Gemini" className="w-10 h-10 rounded-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Google Gemini API</h3>
            <p className="text-xs text-muted-foreground">Para tradução de legendas</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              API Key
            </label>
            <div className="relative">
              <Input
                type={showPasswords['gemini_key'] ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={config.GEMINI_API_KEY}
                onChange={(e) => handleChange('GEMINI_API_KEY', e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('gemini_key')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md transition-colors"
              >
                {showPasswords['gemini_key'] ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Obtenha em <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
            </p>
          </div>
        </div>
      </Card>

      {/* TMDB Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logos/tmdb.svg" alt="TMDB" className="w-10 h-10 rounded-lg" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">TMDB API</h3>
            <p className="text-xs text-muted-foreground">Para reconhecimento de filmes</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              API Key
            </label>
            <div className="relative">
              <Input
                type={showPasswords['tmdb_key'] ? 'text' : 'password'}
                placeholder="eyJhbGciOiJIUzI1..."
                value={config.TMDB_API_KEY}
                onChange={(e) => handleChange('TMDB_API_KEY', e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('tmdb_key')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md transition-colors"
              >
                {showPasswords['tmdb_key'] ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Obtenha em <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">TMDB Settings</a>
            </p>
          </div>
        </div>
      </Card>

      {/* LegendasDivx Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center text-4xl">
            🇵🇹
          </div>
          <div>
            <h3 className="font-semibold text-foreground">LegendasDivx</h3>
            <p className="text-xs text-muted-foreground">Credenciais para legendas PT-PT</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Username
            </label>
            <Input
              placeholder="username"
              value={config.LEGENDASDIVX_USER}
              onChange={(e) => handleChange('LEGENDASDIVX_USER', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Password
            </label>
            <div className="relative">
              <Input
                type={showPasswords['legendasdivx_pass'] ? 'text' : 'password'}
                placeholder="password"
                value={config.LEGENDASDIVX_PASS}
                onChange={(e) => handleChange('LEGENDASDIVX_PASS', e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('legendasdivx_pass')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md transition-colors"
              >
                {showPasswords['legendasdivx_pass'] ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Crie conta em <a href="https://www.legendasdivx.pt/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">legendasdivx.pt</a>
            </p>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex-1"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              A guardar...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Alterações
            </>
          )}
        </Button>
        {hasChanges && (
          <Button
            variant="outline"
            onClick={loadConfig}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        )}
      </div>

      {/* Info */}
      <Card className="p-6 bg-primary/5">
        <div className="flex gap-3">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Nota:</strong> As configurações são guardadas no ficheiro <code className="bg-muted px-1 py-0.5 rounded">.env</code> do backend.</p>
            <p>É necessário reiniciar o servidor após guardar as alterações para que sejam aplicadas.</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default Settings;
