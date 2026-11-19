import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginPage from './LoginPage';
import { Skeleton } from '../ui/Skeleton';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-10 h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 animate-spin" />
        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Verificando autenticação...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage returnUrl={`${location.pathname}${location.search}`} />;
  }

  return children;
}
