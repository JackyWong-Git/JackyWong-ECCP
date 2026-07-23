'use client';

import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type AuthenticatedUser } from '@/lib/server-auth';

interface AuthGuardProps {
  children: ReactNode;
}

type AuthState = 'checking' | 'authenticated' | 'unavailable';

interface AuthContextValue {
  user: AuthenticatedUser;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const djangoPublicUrl = (process.env.NEXT_PUBLIC_DJANGO_URL || 'http://localhost:8000').replace(/\/$/, '');

function redirectToLogin() {
  const returnTo = window.location.href;
  window.location.replace(`${djangoPublicUrl}/accounts/login/?next=${encodeURIComponent(returnTo)}`);
}

function redirectToPasswordChange() {
  const returnTo = window.location.href;
  window.location.replace(`${djangoPublicUrl}/accounts/password-change/?next=${encodeURIComponent(returnTo)}`);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthGuard.');
  return context;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const [state, setState] = useState<AuthState>('checking');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function verifySession() {
      setState('checking');
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });

        if (response.ok) {
          const payload = await response.json() as { user: AuthenticatedUser };
          if (payload.user.mustChangePassword) {
            redirectToPasswordChange();
            return;
          }
          setUser(payload.user);
          setState('authenticated');
          return;
        }
        if (response.status === 401) {
          redirectToLogin();
          return;
        }
        setState('unavailable');
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setState('unavailable');
      }
    }

    void verifySession();
    return () => controller.abort();
  }, [attempt]);

  if (state === 'authenticated' && user) {
    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_20%_15%,rgba(79,199,232,0.16),transparent_30rem),radial-gradient(circle_at_80%_85%,rgba(82,103,232,0.14),transparent_32rem),#F2F6F8] px-5">
      <section className="w-full max-w-[390px] rounded-[24px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(31,50,68,0.12)] backdrop-blur-xl">
        {state === 'checking' ? (
          <>
            <span className="ai-gradient mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_rgba(82,103,232,0.22)]">
              <LoaderCircle className="h-5 w-5 animate-spin" />
            </span>
            <h1 className="mt-5 text-[17px] font-semibold text-[#263640]">正在验证企业身份</h1>
            <p className="mt-2 text-[12px] leading-6 text-[#72838E]">正在安全连接 ECCP 认证服务，请稍候。</p>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF5EB] text-[#C6772A]">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h1 className="mt-5 text-[17px] font-semibold text-[#263640]">认证服务暂时不可用</h1>
            <p className="mt-2 text-[12px] leading-6 text-[#72838E]">请确认 Django 服务已启动，然后重新连接。</p>
            <button
              type="button"
              onClick={() => setAttempt(value => value + 1)}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#5267E8] px-4 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(82,103,232,0.2)] transition-colors hover:bg-[#465BD8]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重新连接
            </button>
          </>
        )}
      </section>
    </main>
  );
}
