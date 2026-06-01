
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry auth errors — the session just isn't ready yet
        const message = error instanceof Error ? error.message : String(error);
        if (
          message.includes('não autenticado') ||
          message.includes('not authenticated') ||
          message.includes('401')
        ) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});
