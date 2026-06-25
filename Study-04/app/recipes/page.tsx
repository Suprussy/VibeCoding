'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PreferencesPanel from '@/components/PreferencesPanel';
import RecipeCard from '@/components/RecipeCard';
import type { Cuisine, DietOption, Ingredient, Preferences, Recipe } from '@/lib/types';

const ING_KEY = 'fridge.step1.ingredients';
const PREF_KEY = 'fridge.step2.preferences';

const DEFAULT_PREFS: Preferences = {
  servings: 2,
  max_minutes: 30,
  difficulty: 'easy',
  exclude: [],
  diet: [],
  cuisine: '무관'
};

type Status = 'editing' | 'generating' | 'ready' | 'error';
type Me = { id: string; email: string; nickname: string } | null;
type ProfileDto = {
  default_servings: number;
  diet: DietOption[];
  exclusions: string[];
  preferred_cuisine: Cuisine;
};

export default function RecipesPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFS);
  const [status, setStatus] = useState<Status>('editing');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [model, setModel] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSourcePrefs, setSavedSourcePrefs] = useState<Preferences | null>(null);
  const [savedSourceIngs, setSavedSourceIngs] = useState<Ingredient[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = sessionStorage.getItem(ING_KEY);
        if (raw) {
          const arr = JSON.parse(raw) as Ingredient[];
          if (Array.isArray(arr)) setIngredients(arr);
        }
        const prefRaw = sessionStorage.getItem(PREF_KEY);
        const hadStoredPrefs = !!prefRaw;
        if (hadStoredPrefs) {
          const obj = JSON.parse(prefRaw) as Partial<Preferences>;
          setPreferences({ ...DEFAULT_PREFS, ...obj });
        }

        const meRes = await fetch('/api/auth/me');
        const meData = (await meRes.json()) as { user: Me };
        if (cancelled) return;
        setMe(meData.user);

        if (meData.user && !hadStoredPrefs) {
          const profRes = await fetch('/api/profile');
          if (profRes.ok) {
            const p = (await profRes.json()) as ProfileDto;
            if (cancelled) return;
            setPreferences((prev) => ({
              ...prev,
              servings: p.default_servings,
              diet: p.diet,
              exclude: p.exclusions,
              cuisine: p.preferred_cuisine
            }));
          }
        }
      } catch {
        // ignore
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(PREF_KEY, JSON.stringify(preferences));
    } catch {
      // ignore quota
    }
  }, [preferences, hydrated]);

  const generate = async (regenerate: boolean) => {
    setStatus('generating');
    setErrorMsg('');
    setSavedIds(new Set());
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients.map((i) => ({
            name: i.name,
            quantity_estimate: i.quantity_estimate
          })),
          preferences,
          regenerate,
          previous_titles: regenerate ? recipes.map((r) => r.title) : []
        })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(errorLabel(body?.error, res.status));
        setStatus('error');
        return;
      }
      const data = (await res.json()) as { recipes: Recipe[]; model?: string };
      setRecipes(data.recipes);
      setModel(data.model ?? '');
      setSavedSourcePrefs(preferences);
      setSavedSourceIngs(ingredients);
      setStatus('ready');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  const saveRecipe = async (recipe: Recipe) => {
    if (!me) {
      router.push('/login');
      return;
    }
    if (savedIds.has(recipe.id) || !savedSourcePrefs) return;
    setSavingId(recipe.id);
    try {
      const res = await fetch('/api/recipes/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          source: {
            ingredients_snapshot: savedSourceIngs.map((i) => ({
              name: i.name,
              quantity_estimate: i.quantity_estimate
            })),
            preferences_snapshot: savedSourcePrefs,
            model: model || 'unknown'
          }
        })
      });
      if (res.ok || res.status === 409) {
        setSavedIds((s) => new Set(s).add(recipe.id));
      } else {
        setErrorMsg('레시피 저장에 실패했습니다.');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
    }
    setSavingId(null);
  };

  if (!hydrated) {
    return (
      <main className="min-h-screen px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
      </main>
    );
  }

  if (ingredients.length === 0) {
    return (
      <main className="min-h-screen px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">재료가 없습니다</h1>
          <p className="text-sm text-slate-600 mb-6">먼저 냉장고 사진을 업로드해 재료를 인식해 주세요.</p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
          >
            사진 업로드하러 가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">레시피 추천</h1>
            <p className="mt-1 text-sm text-slate-600">
              {ingredients.length}개의 재료로 레시피를 만들어 드립니다.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 text-sm text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline"
          >
            재료 다시 인식
          </Link>
        </header>

        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">선택된 재료</h2>
          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((i, idx) => (
              <span
                key={idx}
                className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs"
              >
                {i.name}
                {i.quantity_estimate && i.quantity_estimate !== 'unknown' && (
                  <span className="text-emerald-500 ml-1">· {i.quantity_estimate}</span>
                )}
              </span>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">옵션</h2>
          <PreferencesPanel value={preferences} onChange={setPreferences} />
        </section>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 mb-4"
          >
            {errorMsg}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {status !== 'ready' && (
            <button
              type="button"
              onClick={() => generate(false)}
              disabled={status === 'generating'}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {status === 'generating' ? '생성 중…' : '레시피 생성'}
            </button>
          )}
          {status === 'ready' && (
            <>
              <button
                type="button"
                onClick={() => generate(true)}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                다시 추천
              </button>
              <button
                type="button"
                onClick={() => setStatus('editing')}
                className="px-4 py-2.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                옵션 수정
              </button>
            </>
          )}
        </div>

        {status === 'generating' && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse"
              >
                <div className="h-5 w-2/3 bg-slate-200 rounded mb-3" />
                <div className="h-3 w-1/2 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-1/3 bg-slate-200 rounded" />
              </div>
            ))}
            <p className="text-sm text-slate-500 text-center pt-2">
              레시피를 생성하는 중… (최대 55초, 무료 모델은 콜드 스타트가 있을 수 있습니다)
            </p>
          </div>
        )}

        {status === 'ready' && recipes.length > 0 && (
          <div className="space-y-3">
            {recipes.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onSave={saveRecipe}
                saved={savedIds.has(r.id)}
                saving={savingId === r.id}
                requireLogin={!me}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function errorLabel(code: unknown, status: number): string {
  switch (code) {
    case 'no_ingredients':
      return '재료를 1개 이상 입력하세요.';
    case 'invalid_request':
      return '입력 값이 올바르지 않습니다.';
    case 'rate_limited':
      return '무료 모델 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    case 'server_misconfigured':
      return '서버 설정이 누락되었습니다. 관리자에게 문의하세요.';
    case 'timeout':
      return '응답 시간이 초과되었습니다. 다시 시도해주세요.';
    case 'safety_violation':
      return '제외하신 재료가 결과에 포함되어 폐기했습니다. 다시 시도해주세요.';
    case 'schema_violation':
    case 'json_parse_failed':
    case 'malformed_response':
      return '결과를 해석하지 못했습니다. 다시 시도해주세요.';
    default:
      return `레시피 생성에 실패했습니다. (${status})`;
  }
}
