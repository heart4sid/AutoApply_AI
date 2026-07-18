// ============================================================
// AutoApply AI — useApi Hook
// Replaces duplicated useState+useEffect+fetch pattern.
// ============================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useApi<T = any>(
  path: string | null,
  options?: {
    params?: Record<string, string | number | undefined>;
    pollIntervalMs?: number;
    initialData?: T;
  },
): UseApiState<T> {
  const [data, setData] = useState<T | null>(options?.initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!path) return;

    try {
      setLoading(prev => !prev ? true : prev); // Only set if not already loading
      setError(null);
      const result = await apiClient.get(path, options?.params);
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [path, JSON.stringify(options?.params)]);

  useEffect(() => {
    fetchData();

    // Polling
    if (options?.pollIntervalMs && options.pollIntervalMs > 0) {
      intervalRef.current = setInterval(fetchData, options.pollIntervalMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData, options?.pollIntervalMs]);

  return { data, error, loading, refetch: fetchData };
}

export function useMutation<TBody = any, TResponse = any>(
  method: 'post' | 'patch' | 'put' | 'delete',
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (path: string, body?: TBody): Promise<TResponse> => {
    setLoading(true);
    setError(null);

    try {
      const result = await (apiClient as any)[method](path, body);
      return result as TResponse;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'An unexpected error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [method]);

  return { mutate, loading, error };
}
