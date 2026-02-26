import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePollingOptions<T> {
  interval: number;
  isComplete: (data: T) => boolean;
  onComplete?: (data: T) => void;
  onError?: (err: unknown) => void;
}

interface UsePollingResult<T> {
  data: T | null;
  isRunning: boolean;
  stop: () => void;
}

export function usePolling<T>(
  fetcher: () => Promise<T>,
  options: UsePollingOptions<T>
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  useEffect(() => {
    setIsRunning(true);

    intervalRef.current = setInterval(async () => {
      try {
        const result = await fetcher();
        setData(result);

        if (optionsRef.current.isComplete(result)) {
          stop();
          optionsRef.current.onComplete?.(result);
        }
      } catch (err) {
        optionsRef.current.onError?.(err);
      }
    }, options.interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.interval, stop]);

  return { data, isRunning, stop };
}
