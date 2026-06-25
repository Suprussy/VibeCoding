'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Cuisine, DietOption } from '@/lib/types';

const DIET_LABELS: Record<DietOption, string> = {
  vegetarian: '채식',
  vegan: '비건',
  gluten_free: '글루텐프리',
  pescatarian: '페스코',
  low_sodium: '저염'
};
const CUISINES: Cuisine[] = ['무관', '한식', '일식', '중식', '양식'];

type ProfileDto = {
  nickname: string;
  default_servings: number;
  diet: DietOption[];
  exclusions: string[];
  preferred_cuisine: Cuisine;
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [exclusionInput, setExclusionInput] = useState('');

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/profile');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      if (res.ok) {
        const dto = (await res.json()) as ProfileDto;
        setProfile(dto);
      } else {
        setErrorMsg('프로필을 불러오지 못했습니다.');
      }
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-md mx-auto text-sm text-slate-500">불러오는 중…</div>
      </main>
    );
  }
  if (!profile) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-md mx-auto text-sm text-rose-700">{errorMsg || '오류'}</div>
      </main>
    );
  }

  const set = <K extends keyof ProfileDto>(k: K, v: ProfileDto[K]) =>
    setProfile({ ...profile, [k]: v });

  const toggleDiet = (opt: DietOption) => {
    const has = profile.diet.includes(opt);
    set('diet', has ? profile.diet.filter((d) => d !== opt) : [...profile.diet, opt]);
  };

  const addExclusion = () => {
    const v = exclusionInput.trim();
    if (!v || profile.exclusions.includes(v)) {
      setExclusionInput('');
      return;
    }
    set('exclusions', [...profile.exclusions, v]);
    setExclusionInput('');
  };

  const save = async () => {
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (!res.ok) {
        setErrorMsg('저장에 실패했습니다.');
      } else {
        setSavedAt(Date.now());
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
    }
    setSaving(false);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const deleteAccount = async () => {
    if (!confirm('계정과 모든 저장된 레시피가 영구 삭제됩니다. 계속할까요?')) return;
    const res = await fetch('/api/account', { method: 'DELETE' });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setErrorMsg('계정 삭제에 실패했습니다.');
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">프로필</h1>
        <p className="text-sm text-slate-600 mb-6">
          여기서 설정한 식이 옵션은 레시피 추천 시 자동으로 적용됩니다.
        </p>

        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">닉네임</label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => set('nickname', e.target.value)}
              minLength={2}
              maxLength={20}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              기본 인분 ({profile.default_servings}인분)
            </label>
            <input
              type="range"
              min={1}
              max={6}
              value={profile.default_servings}
              onChange={(e) => set('default_servings', Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">선호 카테고리</span>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('preferred_cuisine', c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                    profile.preferred_cuisine === c
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">식이 옵션</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DIET_LABELS) as DietOption[]).map((opt) => {
                const active = profile.diet.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleDiet(opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                      active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                        : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {DIET_LABELS[opt]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              알레르기 / 제외 재료
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={exclusionInput}
                onChange={(e) => setExclusionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addExclusion();
                  }
                }}
                placeholder="예: 땅콩, 새우"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none text-sm"
              />
              <button
                type="button"
                onClick={addExclusion}
                className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
              >
                추가
              </button>
            </div>
            {profile.exclusions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {profile.exclusions.map((v) => (
                  <span
                    key={v}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs"
                  >
                    {v}
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          'exclusions',
                          profile.exclusions.filter((e) => e !== v)
                        )
                      }
                      className="text-rose-400 hover:text-rose-700"
                      aria-label={`${v} 제외 해제`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? '저장 중…' : '저장'}
            </button>
            {savedAt && <span className="text-xs text-emerald-700">저장됨</span>}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">계정</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={deleteAccount}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-700 text-sm font-medium hover:bg-rose-50"
            >
              계정 삭제
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
