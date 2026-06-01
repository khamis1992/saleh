import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/providers/AuthContext';
import { LocaleProvider } from '@/providers/LocaleContext';
import { NotificationProvider } from '@/providers/NotificationContext';
import { RoleProvider } from '@/providers/RoleContext';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import './index.css';

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  const message = error instanceof Error ? error.message : 'يرجى تحديث الصفحة والمحاولة مرة أخرى';
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md mx-4 text-center">
        <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <button
          onClick={resetErrorBoundary}
          className="bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          تحديث الصفحة
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <BrowserRouter>
        <LocaleProvider>
          <RoleProvider>
            <NotificationProvider>
              <AuthProvider>
                <TooltipProvider delayDuration={300}>
                  <Toaster
                    position="top-center"
                    dir="rtl"
                    toastOptions={{
                      style: { fontFamily: "'Cairo', system-ui, sans-serif", fontSize: '14px' },
                    }}
                  />
                  <App />
                </TooltipProvider>
              </AuthProvider>
            </NotificationProvider>
          </RoleProvider>
        </LocaleProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
