import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { CrewPulseProvider } from './context/CrewPulseContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from 'sonner';
import CrewPulseApp from './pages/CrewPulseApp';
import Home from './pages/Home';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Chat from './pages/Chat';
import Customise from './pages/Customise';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

export default function App() {
  const [hasMapsQuotaExceeded, setHasMapsQuotaExceeded] = React.useState(false);

  React.useEffect(() => {
    const handleQuotaExceeded = () => setHasMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <CrewPulseProvider>
          {hasMapsQuotaExceeded && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
              <span>
                Google Maps Platform quota reached. If you are the app owner, visit{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-amber-950 hover:text-amber-800"
                >
                  maps developer site
                </a>{' '}
                for instructions to update your account.
              </span>
            </div>
          )}
          <HashRouter>
            <Routes>
              <Route path="/" element={<CrewPulseApp />} />
              <Route path="/crew" element={<CrewPulseApp />} />
              <Route path="/home" element={<Home />} />
              <Route path="/income" element={<Income />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/customise" element={<Customise />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
          <Toaster position="top-center" theme="dark" />
        </CrewPulseProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}