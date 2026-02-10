import { useState } from "react";
import { motion } from "framer-motion";
import { Film, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

interface Movie {
  id: number;
  title: string;
  original_title: string;
  year: string;
  rating: number;
  overview: string;
  poster: string;
  imdb_id: string | null;
}

const MovieRecognition = () => {
  const [filename, setFilename] = useState("");
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const recognizeMovie = async () => {
    if (!filename.trim()) {
      toast({
        variant: "destructive",
        title: "Nome inválido",
        description: "Introduza um nome de ficheiro",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/recognize-movie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      const data = await response.json();

      if (data.success && data.movie) {
        setMovie(data.movie);
        toast({
          title: "Filme encontrado!",
          description: `${data.movie.title} (${data.movie.year})`,
        });
      } else {
        throw new Error('Filme não encontrado');
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Falha ao reconhecer filme",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Reconhecimento de Filmes</h2>
        <p className="text-sm text-muted-foreground">
          Identifique filmes via TMDB com título, poster e sinopse.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Nome do Ficheiro
            </label>
            <Input
              placeholder="Ex: Dune.2021.1080p.BluRay.mkv"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && recognizeMovie()}
            />
            <p className="text-xs text-muted-foreground mt-1">
              O sistema irá extrair o título e ano automaticamente
            </p>
          </div>
          <Button onClick={recognizeMovie} disabled={isLoading} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {isLoading ? 'A pesquisar...' : 'Reconhecer Filme'}
          </Button>
        </div>
      </Card>

      {movie && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-6">
            <div className="flex gap-6">
              {movie.poster && (
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-32 h-48 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{movie.title}</h3>
                  {movie.original_title !== movie.title && (
                    <p className="text-sm text-muted-foreground">{movie.original_title}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    {movie.year}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {movie.rating}/10
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {movie.overview}
                </p>
                {movie.imdb_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://www.imdb.com/title/${movie.imdb_id}`, '_blank')}
                  >
                    Ver no IMDB
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default MovieRecognition;
