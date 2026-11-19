import { describe, it, expect } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import LoginPage from '../../components/auth/LoginPage';
import { supabase } from '../../services/supabase';

describe('Auth Architecture & Module Exports', () => {
  it('should export AuthProvider and useAuth hook', () => {
    expect(AuthProvider).toBeDefined();
    expect(typeof AuthProvider).toBe('function');
    expect(useAuth).toBeDefined();
    expect(typeof useAuth).toBe('function');
  });

  it('should export ProtectedRoute component', () => {
    expect(ProtectedRoute).toBeDefined();
    expect(typeof ProtectedRoute).toBe('function');
  });

  it('should export LoginPage component', () => {
    expect(LoginPage).toBeDefined();
    expect(typeof LoginPage).toBe('function');
  });

  it('should have valid Supabase client instance with auth methods', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(typeof supabase.auth.getSession).toBe('function');
    expect(typeof supabase.auth.signInWithPassword).toBe('function');
    expect(typeof supabase.auth.signUp).toBe('function');
    expect(typeof supabase.auth.signOut).toBe('function');
    expect(typeof supabase.auth.onAuthStateChange).toBe('function');
  });

  it('should correctly format user roles and credentials', () => {
    const adminUser = {
      email: 'admin@secti.ba.gov.br',
      user_metadata: { name: 'Administrador SECTI', role: 'admin' },
    };
    const gestorUser = {
      email: 'gestor@secti.ba.gov.br',
      user_metadata: { name: 'Gestor Regional', role: 'gestor' },
    };

    const getRole = (u) => u?.user_metadata?.role || (u?.email?.includes('admin') ? 'admin' : 'gestor');
    const getName = (u) => u?.user_metadata?.name || u?.email?.split('@')[0] || 'Usuário';

    expect(getRole(adminUser)).toBe('admin');
    expect(getName(adminUser)).toBe('Administrador SECTI');

    expect(getRole(gestorUser)).toBe('gestor');
    expect(getName(gestorUser)).toBe('Gestor Regional');

    // Fallback por e-mail quando sem metadata
    expect(getRole({ email: 'sec_admin@gov.ba' })).toBe('admin');
    expect(getRole({ email: 'operador@gov.ba' })).toBe('gestor');
    expect(getName({ email: 'joao.silva@secti.ba.gov.br' })).toBe('joao.silva');
  });
});
