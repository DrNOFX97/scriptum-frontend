/**
 * Custom hook for API calls with loading states and error handling.
 * Consolidates duplicate patterns across components.
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseApiCallReturn<T> {
  execute: (...args: any[]) => Promise<T | null>;
  isLoading: boolean;
  error: Error | null;
  data: T | null;
  reset: () => void;
}

/**
 * Hook for handling async API calls with automatic loading states and toasts.
 *
 * @param apiFunction - Async function that performs the API call
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const { execute: searchSubtitles, isLoading, data } = useApiCall(
 *   (query: string, lang: string) => api.searchSubtitles(query, lang),
 *   {
 *     successMessage: "Legendas encontradas",
 *     onSuccess: (data) => console.log(data)
 *   }
 * );
 *
 * // Later in component
 * await searchSubtitles("Inception", "pt");
 * ```
 */
export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<any>,
  options: UseApiCallOptions<T> = {}
): UseApiCallReturn<T> {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const { toast } = useToast();

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);

        // Handle API response format (with success field)
        if (result && typeof result === 'object' && 'success' in result) {
          if (result.success) {
            const responseData = result.data || result;
            setData(responseData);

            if (showSuccessToast && successMessage) {
              toast({
                title: successMessage,
                variant: 'default',
              });
            }

            onSuccess?.(responseData);
            return responseData;
          } else {
            // API returned success: false
            const errorMsg = result.error || errorMessage || 'Operação falhou';
            const err = new Error(errorMsg);
            setError(err);

            if (showErrorToast) {
              toast({
                variant: 'destructive',
                title: 'Erro',
                description: errorMsg,
              });
            }

            onError?.(err);
            return null;
          }
        }

        // Direct result (no success wrapper)
        setData(result);

        if (showSuccessToast && successMessage) {
          toast({
            title: successMessage,
          });
        }

        onSuccess?.(result);
        return result;

      } catch (err) {
        const error = err instanceof Error ? err : new Error('Erro desconhecido');
        setError(error);

        if (showErrorToast) {
          toast({
            variant: 'destructive',
            title: 'Erro',
            description: errorMessage || error.message,
          });
        }

        onError?.(error);
        return null;

      } finally {
        setIsLoading(false);
      }
    },
    [apiFunction, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast, toast]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
  };
}

/**
 * Simplified hook for API calls that don't need result tracking.
 * Useful for fire-and-forget operations.
 *
 * @example
 * ```tsx
 * const { execute: deleteFile, isLoading } = useApiAction(
 *   () => api.deleteFile(filename),
 *   { successMessage: "Arquivo excluído" }
 * );
 * ```
 */
export function useApiAction(
  apiFunction: (...args: any[]) => Promise<any>,
  options: UseApiCallOptions<any> = {}
): Pick<UseApiCallReturn<any>, 'execute' | 'isLoading' | 'error'> {
  const { execute, isLoading, error } = useApiCall(apiFunction, options);
  return { execute, isLoading, error };
}
