'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async () => {
    setSubmitting(true);
    setErrorMsg('');
    try {
      const url = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { email, password, nickname };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(errorLabel(data?.error, res.status));
        setSubmitting(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          {mode === 'login' ? '로그인' : '회원가입'}
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          {mode === 'login'
            ? '저장한 레시피를 다시 보려면 로그인하세요.'
            : '레시피를 저장하려면 계정이 필요해요.'}
        </p>

        <div className="flex gap-1 mb-5 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            회원가입
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!submitting) submit();
          }}
          className="space-y-3"
        >
          {mode === 'register' && (
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 mb-1">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
                maxLength={20}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              비밀번호 {mode === 'register' && <span className="text-slate-400">(최소 10자)</span>}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 10 : 1}
              maxLength={200}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            >
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? '처리 중…' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </main>
  );
}

function errorLabel(code: unknown, status: number): string {
  switch (code) {
    case 'invalid_credentials':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'invalid_email':
      return '올바른 이메일 형식이 아닙니다.';
    case 'email_taken':
      return '이미 가입된 이메일입니다.';
    case 'account_locked':
      return '로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.';
    case 'invalid_request':
      return '입력 값이 올바르지 않습니다.';
    default:
      return `요청을 처리하지 못했습니다. (${status})`;
  }
}
