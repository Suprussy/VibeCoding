'use client';

import { useState } from 'react';
import type { Cuisine, DietOption, Difficulty, Preferences } from '@/lib/types';

type Props = {
  value: Preferences;
  onChange: (next: Preferences) => void;
};

const DIET_LABELS: Record<DietOption, string> = {
  vegetarian: '채식',
  vegan: '비건',
  gluten_free: '글루텐프리',
  pescatarian: '페스코',
  low_sodium: '저염'
};

const CUISINES: Cuisine[] = ['무관', '한식', '일식', '중식', '양식'];
const DIFFICULTIES: Array<{ value: Difficulty; label: string }> = [
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' }
];

export default function PreferencesPanel({ value, onChange }: Props) {
  const [excludeInput, setExcludeInput] = useState('');

  const set = <K extends keyof Preferences>(key: K, v: Preferences[K]) => {
    onChange({ ...value, [key]: v });
  };

  const toggleDiet = (opt: DietOption) => {
    const has = value.diet.includes(opt);
    set('diet', has ? value.diet.filter((d) => d !== opt) : [...value.diet, opt]);
  };

  const addExclude = () => {
    const v = excludeInput.trim();
    if (!v) return;
    if (value.exclude.includes(v)) {
      setExcludeInput('');
      return;
    }
    set('exclude', [...value.exclude, v]);
    setExcludeInput('');
  };

  const removeExclude = (v: string) => {
    set(
      'exclude',
      value.exclude.filter((e) => e !== v)
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            인분 <span className="text-slate-500">({value.servings}인분)</span>
          </label>
          <input
            type="range"
            min={1}
            max={6}
            value={value.servings}
            onChange={(e) => set('servings', Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            최대 조리시간 <span className="text-slate-500">({value.max_minutes}분)</span>
          </label>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={value.max_minutes}
            onChange={(e) => set('max_minutes', Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700 mb-1">난이도</span>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => set('difficulty', d.value)}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium border',
                value.difficulty === d.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
              ].join(' ')}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-slate-700 mb-1">카테고리</span>
        <div className="flex flex-wrap gap-2">
          {CUISINES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set('cuisine', c)}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium border',
                value.cuisine === c
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
              ].join(' ')}
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
            const active = value.diet.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleDiet(opt)}
                className={[
                  'px-3 py-1.5 rounded-lg text-sm font-medium border',
                  active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-400'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400'
                ].join(' ')}
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
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addExclude();
              }
            }}
            placeholder="예: 땅콩, 새우"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none text-sm"
          />
          <button
            type="button"
            onClick={addExclude}
            className="px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
          >
            추가
          </button>
        </div>
        {value.exclude.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {value.exclude.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs"
              >
                {v}
                <button
                  type="button"
                  onClick={() => removeExclude(v)}
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
    </div>
  );
}
