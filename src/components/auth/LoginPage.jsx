import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  KeyRound,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, IconButton } from '../ui/Button';
import { Input } from '../ui/Input';
import { PanelMark } from '../ui/PanelMark';
import { cn } from '../../lib/cn';

export default function LoginPage({ returnUrl }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, error: authError, clearError, isAuthenticated, user, signOut } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Determina URL de destino após login
  const targetUrl = returnUrl || location.state?.from || '/admin';

  // Se já estiver logado, oferece opções de continuar ou alternar conta
  if (isAuthenticated && user) {
    return (
      <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-surface border border-border/80 rounded-[28px] shadow-float p-6 sm:p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
            <ShieldCheck size={24} strokeWidth={2} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-text-primary">
              Sessão Autenticada
            </h2>
            <p className="text-xs text-text-secondary">
              Você já está autenticado no sistema como:
            </p>
            <div className="inline-block mt-1 px-3.5 py-1 bg-surface-soft dark:bg-surface-raised text-text-primary rounded-full text-xs font-mono border border-border/80">
              {user.email}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <Button
              variant="primary"
              size="md"
              iconRight={<ArrowRight size={16} />}
              className="w-full justify-center h-11 rounded-full font-semibold"
              onClick={() => navigate(targetUrl, { replace: true })}
            >
              Acessar Gestão CRUD
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center h-10 rounded-full"
              onClick={async () => {
                await signOut();
              }}
            >
              Trocar de Usuário / Sair
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessNotice(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setLocalError('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setLocalError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const result = await signIn({ email: cleanEmail, password });
        if (result.error) {
          setLocalError(result.error);
        } else {
          navigate(targetUrl, { replace: true });
        }
      } else {
        const result = await signUp({
          email: cleanEmail,
          password,
          name: name.trim(),
          role: 'gestor',
        });
        if (result.error) {
          setLocalError(result.error);
        } else if (result.confirmationRequired) {
          setSuccessNotice(
            'Cadastro realizado com sucesso! Um link de verificação foi enviado ao seu e-mail. Enquanto isso, você pode utilizar as credenciais de teste para acesso imediato.'
          );
        } else {
          navigate(targetUrl, { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredentials = (credEmail, credPassword) => {
    setEmail(credEmail);
    setPassword(credPassword);
    setLocalError(null);
    clearError();
    setMode('login');
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-surface border border-border/80 rounded-[28px] shadow-float p-6 sm:p-8 space-y-6">
        {/* CABEÇALHO DO CARD DE LOGIN */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <IconButton
              variant="secondary"
              size="sm"
              aria-label="Voltar à visualização pública"
              title="Voltar à visualização pública"
              onClick={() => navigate('/territorios')}
              className="rounded-full text-text-secondary hover:text-text-primary shrink-0"
            >
              <ArrowLeft size={15} strokeWidth={2} />
            </IconButton>
            <div className="flex items-center gap-2">
              <PanelMark className="w-7 h-7" />
              <span className="font-display text-subtitle font-bold tracking-tight text-text-primary">
                PTI Bahia
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-text-primary">
              {mode === 'login' ? 'Autenticação de Usuário' : 'Novo Cadastro de Operador'}
            </h1>
            <p className="text-xs text-text-secondary leading-relaxed">
              Área de controle para gerenciamento e cadastro de ativos de CT&I, cursos acadêmicos e cadeias produtivas.
            </p>
          </div>

          {/* TOGGLE MODO: ENTRAR / CADASTRAR */}
          <div className="grid grid-cols-2 p-1 bg-surface-soft dark:bg-surface-raised rounded-full border border-border/80">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
                clearError();
              }}
              className={cn(
                'py-2 text-xs font-medium rounded-full transition-all duration-150 cursor-pointer',
                mode === 'login'
                  ? 'bg-white dark:bg-zinc-800 text-text-primary font-semibold shadow-2xs border border-border/60'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
                clearError();
              }}
              className={cn(
                'py-2 text-xs font-medium rounded-full transition-all duration-150 cursor-pointer',
                mode === 'register'
                  ? 'bg-white dark:bg-zinc-800 text-text-primary font-semibold shadow-2xs border border-border/60'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Criar Conta
            </button>
          </div>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-subcard text-xs bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{displayError}</div>
            </div>
          )}

          {successNotice && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3.5 rounded-subcard text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{successNotice}</div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label
                htmlFor="user-name-input"
                className="text-xs font-medium text-text-secondary block pl-1"
              >
                Nome Completo
              </label>
              <div className="relative">
                <Input
                  id="user-name-input"
                  type="text"
                  placeholder="Ex.: Maria Souza"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="pl-9 h-10 rounded-full bg-surface-soft/50 dark:bg-surface-raised/40 focus:bg-surface"
                />
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="user-email-input"
              className="text-xs font-medium text-text-secondary block pl-1"
            >
              E-mail Institucional
            </label>
            <div className="relative">
              <Input
                id="user-email-input"
                type="email"
                placeholder="operador@secti.ba.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="pl-9 h-10 rounded-full bg-surface-soft/50 dark:bg-surface-raised/40 focus:bg-surface"
              />
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="user-password-input"
              className="text-xs font-medium text-text-secondary block pl-1"
            >
              Senha
            </label>
            <div className="relative">
              <Input
                id="user-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                className="pl-9 pr-10 h-10 rounded-full bg-surface-soft/50 dark:bg-surface-raised/40 focus:bg-surface"
              />
              <KeyRound
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1 rounded-full cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={isSubmitting}
            iconRight={<ArrowRight size={16} />}
            className="w-full justify-center h-11 rounded-full font-semibold mt-1"
          >
            {mode === 'login' ? 'Acessar Painel CRUD' : 'Finalizar Cadastro'}
          </Button>

          {/* AJUDANTE DE CREDENCIAIS PRÉ-CONFIGURADAS */}
          <div className="pt-2 space-y-2.5">
            <div className="text-center text-[11px] font-medium text-text-muted">
              Acesso rápido para avaliação
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials('admin@secti.ba.gov.br', 'admin-secti-bahia')}
                title="admin@secti.ba.gov.br"
                className="flex items-center justify-between px-3.5 py-2 rounded-full bg-surface-soft/80 dark:bg-surface-raised/60 hover:bg-surface-soft dark:hover:bg-surface-raised border border-border/70 transition-all duration-150 text-xs cursor-pointer active:scale-[0.99]"
              >
                <span className="font-medium text-text-primary truncate">Administrador</span>
                <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 shrink-0 ml-1.5">
                  SECTI
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillQuickCredentials('gestor@secti.ba.gov.br', 'gestor-secti-bahia')}
                title="gestor@secti.ba.gov.br"
                className="flex items-center justify-between px-3.5 py-2 rounded-full bg-surface-soft/80 dark:bg-surface-raised/60 hover:bg-surface-soft dark:hover:bg-surface-raised border border-border/70 transition-all duration-150 text-xs cursor-pointer active:scale-[0.99]"
              >
                <span className="font-medium text-text-primary truncate">Gestor Regional</span>
                <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 shrink-0 ml-1.5">
                  PTI
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
