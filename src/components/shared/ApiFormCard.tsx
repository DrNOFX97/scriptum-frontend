/**
 * Reusable API form card component.
 * Provides consistent layout and loading states for API operations.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ANIMATION_DURATION_NORMAL } from '@/lib/constants';

interface ApiFormCardProps {
  title: string;
  description: string;
  isLoading?: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Animated card wrapper for API forms with consistent styling.
 *
 * @example
 * ```tsx
 * <ApiFormCard
 *   title="Analisar Vídeo"
 *   description="Extrair informações do vídeo"
 *   isLoading={isLoading}
 *   loadingMessage="Analisando..."
 * >
 *   <form>...</form>
 * </ApiFormCard>
 * ```
 */
export function ApiFormCard({
  title,
  description,
  isLoading = false,
  loadingMessage,
  children,
  className = '',
}: ApiFormCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATION_NORMAL }}
      className={`space-y-6 ${className}`}
    >
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">
              {loadingMessage || 'Processando...'}
            </span>
          </div>
        </Card>
      )}

      {/* Content */}
      {children}
    </motion.div>
  );
}
