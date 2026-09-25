import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './shared/hooks/useApp';
import { Layout } from './shared/components/Layout';
import { AuthPage } from './features/auth/components/AuthPage';
import { Dashboard } from './features/calendar/components/Dashboard';
import { AccountsPage } from './features/accounts/components/AccountsPage';
import { UploadPage } from './features/posts/components/UploadPage';
import { HistoryPage } from './features/history/components/HistoryPage';
import { NotFound } from './shared/components/NotFound';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { 
            background: 'var(--card)', 
            color: 'var(--foreground)', 
            border: '3px solid var(--border)',
            boxShadow: '4px 4px 0px 0px var(--border)',
            borderRadius: '12px',
            fontWeight: '900',
            padding: '16px 24px',
            fontSize: '15px'
          },
          success: {
            iconTheme: {
              primary: '#34d399',
              secondary: '#000',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#000',
            },
          }
        }}/>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
