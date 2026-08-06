import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/auth/AuthProvider';
import { ApiTokenBridge } from '@/auth/ApiTokenBridge';
import { router } from '@/routes/router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ApiTokenBridge />
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
