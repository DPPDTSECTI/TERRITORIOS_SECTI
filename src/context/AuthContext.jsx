import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicialização e sincronização da sessão Supabase
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn('[AuthContext] Falha ao recuperar sessão inicial:', sessionError.message);
        }
        if (mounted) {
          setSession(data?.session || null);
          setUser(data?.session?.user || null);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[AuthContext] Erro inesperado na inicialização de autenticação:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listener para mudanças de estado (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    setError(null);
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: String(password || '')
      });

      if (signInError) {
        let msg = signInError.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'E-mail ou senha incorretos. Verifique suas credenciais.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'E-mail cadastrado, porém confirmação pendente. Verifique sua caixa de entrada.';
        }
        setError(msg);
        return { user: null, session: null, error: msg };
      }

      setUser(data.user);
      setSession(data.session);
      return { user: data.user, session: data.session, error: null };
    } catch (err) {
      const msg = err?.message || 'Falha de conexão com o serviço de autenticação.';
      setError(msg);
      return { user: null, session: null, error: msg };
    }
  }, []);

  const signUp = useCallback(async ({ email, password, name = '', role = 'gestor' }) => {
    setError(null);
    try {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: String(password || ''),
        options: {
          data: {
            name: name.trim() || cleanEmail.split('@')[0],
            role: role || 'gestor'
          }
        }
      });

      if (signUpError) {
        let msg = signUpError.message;
        if (msg.includes('User already registered')) {
          msg = 'Este e-mail já está cadastrado no sistema. Tente fazer login.';
        } else if (msg.includes('Password should be at least')) {
          msg = 'A senha deve conter no mínimo 6 caracteres.';
        }
        setError(msg);
        return { user: null, session: null, error: msg, confirmationRequired: false };
      }

      const confirmationRequired = !data.session;
      if (data.session) {
        setUser(data.user);
        setSession(data.session);
      }

      return {
        user: data.user,
        session: data.session,
        error: null,
        confirmationRequired
      };
    } catch (err) {
      const msg = err?.message || 'Falha ao processar cadastro de usuário.';
      setError(msg);
      return { user: null, session: null, error: msg, confirmationRequired: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Erro ao encerrar sessão no Supabase:', err);
    } finally {
      setUser(null);
      setSession(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const isAuthenticated = Boolean(user);
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Operador';
  const userRole = user?.user_metadata?.role || (user?.email?.includes('admin') ? 'admin' : 'gestor');

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      isAuthenticated,
      userName,
      userRole,
      signIn,
      signUp,
      signOut,
      clearError
    }),
    [user, session, loading, error, isAuthenticated, userName, userRole, signIn, signUp, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um <AuthProvider>');
  }
  return context;
}

export default AuthContext;
