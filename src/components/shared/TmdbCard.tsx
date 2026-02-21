import { motion } from 'framer-motion';
import { Film, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  movieInfo: any;
  isLoading: boolean;
}

export function TmdbCard({ movieInfo, isLoading }: Props) {
  if (!isLoading && !movieInfo) return null;

  if (isLoading && !movieInfo) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3 text-muted-foreground">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          <span className="text-sm">A procurar informações no TMDB...</span>
        </div>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Film className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Informações TMDB</h3>
          {movieInfo?.media_type && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
              movieInfo.media_type === 'tv'
                ? 'bg-secondary/30 text-secondary-foreground'
                : 'bg-primary/10 text-primary'
            }`}>
              {movieInfo.media_type === 'tv' ? 'Série' : 'Filme'}
            </span>
          )}
        </div>

        <div className="flex gap-6">
          {movieInfo?.poster && (
            <div className="flex-shrink-0">
              <img
                src={movieInfo.poster}
                alt={movieInfo.title || 'Poster'}
                className="w-32 h-48 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="text-xl font-bold text-foreground">
                {movieInfo?.title || 'Título desconhecido'}
              </h4>
              {movieInfo?.original_title && movieInfo.original_title !== movieInfo.title && (
                <p className="text-sm text-muted-foreground italic">{movieInfo.original_title}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              {movieInfo?.year && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  <Film className="h-3.5 w-3.5" />
                  {movieInfo.year}
                </span>
              )}
              {movieInfo?.rating && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 font-medium">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {movieInfo.rating}/10
                </span>
              )}
            </div>

            {movieInfo?.overview && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {movieInfo.overview}
              </p>
            )}

            {movieInfo?.imdb_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.imdb.com/title/${movieInfo.imdb_id}`, '_blank')}
              >
                Ver no IMDB
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
