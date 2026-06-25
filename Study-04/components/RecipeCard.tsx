'use client';

import { useState } from 'react';
import type { Recipe } from '@/lib/types';

const DIFFICULTY_LABEL: Record<Recipe['difficulty'], string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움'
};

type Props = {
  recipe: Recipe;
  onSave?: (r: Recipe) => void;
  saveDisabled?: boolean;
  saved?: boolean;
  saving?: boolean;
  requireLogin?: boolean;
};

export default function RecipeCard({
  recipe,
  onSave,
  saveDisabled,
  saved,
  saving,
  requireLogin
}: Props) {
  const [open, setOpen] = useState(false);

  const copyShoppingList = async () => {
    if (recipe.missing_ingredients.length === 0) return;
    const text = recipe.missing_ingredients.map((m) => `- ${m.name} ${m.amount}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard may be denied; user can still see the list
    }
  };

  const saveLabel = saved
    ? '저장됨 ✓'
    : saving
      ? '저장 중…'
      : requireLogin
        ? '로그인 후 저장하기'
        : '이 레시피 저장';

  const showSave = !!onSave && !saveDisabled;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 sm:p-5 hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 truncate">{recipe.title}</h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
              <span>⏱ {recipe.estimated_minutes}분</span>
              <span>👥 {recipe.servings}인분</span>
              <span>· {DIFFICULTY_LABEL[recipe.difficulty]}</span>
              <span>· {recipe.cuisine}</span>
            </div>
            {recipe.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {recipe.tags.map((t) => (
                  <span
                    key={t}
                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <span className="shrink-0 text-slate-400 text-sm" aria-hidden>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-slate-100">
          <section>
            <h4 className="text-sm font-semibold text-slate-700 mt-4 mb-2">사용 재료</h4>
            <ul className="text-sm text-slate-700 space-y-1">
              {recipe.used_ingredients.map((ing, i) => (
                <li key={ing.name + i} className="flex justify-between">
                  <span>{ing.name}</span>
                  <span className="text-slate-500">{ing.amount}</span>
                </li>
              ))}
            </ul>
          </section>

          {recipe.missing_ingredients.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-amber-700">추가 구매 필요</h4>
                <button
                  type="button"
                  onClick={copyShoppingList}
                  className="text-xs px-2 py-1 rounded border border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  쇼핑리스트 복사
                </button>
              </div>
              <ul className="text-sm text-slate-700 space-y-1">
                {recipe.missing_ingredients.map((ing, i) => (
                  <li key={ing.name + i} className="flex justify-between">
                    <span>{ing.name}</span>
                    <span className="text-slate-500">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">조리 단계</h4>
            <ol className="text-sm text-slate-700 space-y-2">
              {recipe.steps.map((s) => (
                <li key={s.order} className="flex gap-2">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center">
                    {s.order}
                  </span>
                  <span className="leading-relaxed">{s.instruction}</span>
                </li>
              ))}
            </ol>
          </section>

          {recipe.tips.length > 0 && (
            <section className="rounded-lg bg-slate-50 px-3 py-2">
              <h4 className="text-xs font-semibold text-slate-700 mb-1">팁</h4>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                {recipe.tips.map((t, i) => (
                  <li key={t + i}>{t}</li>
                ))}
              </ul>
            </section>
          )}

          {showSave && (
            <div className="pt-1">
              <button
                type="button"
                disabled={saving || saved}
                onClick={() => onSave?.(recipe)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium ${
                  saved
                    ? 'bg-emerald-100 text-emerald-700 cursor-default'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {saveLabel}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
