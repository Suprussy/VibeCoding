'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Me = { id: string; email: string; nickname: string };

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data: { user: Me | null }) => {
        if (!cancelled) {
          setMe(data.user);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setMe(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-sm font-semibold text-slate-900">
          🍳 냉장고 레시피
        </Link>
        <span className="flex-1" />
        {loaded && me && (
          <>
            <Link
              href="/library"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              보관함
            </Link>
            <Link
              href="/profile"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              {me.nickname}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-900"
            >
              로그아웃
            </button>
          </>
        )}
        {loaded && !me && (
          <Link
            href="/login"
            className="text-sm text-emerald-700 hover:text-emerald-900 font-medium"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}
