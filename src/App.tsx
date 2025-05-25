
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/config/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <AppRoutes />
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
