'use client';

import { useState } from 'react';
import type { Ingredient } from '@/lib/types';

type Props = {
  ingredients: Ingredient[];
  onChange: (next: Ingredient[]) => void;
};

export default function IngredientList({ ingredients, onChange }: Props) {
  const [newName, setNewName] = useState('');

  const updateAt = (i: number, patch: Partial<Ingredient>) => {
    const next = ingredients.map((ing, idx) => (idx === i ? { ...ing, ...patch } : ing));
    onChange(next);
  };

  const removeAt = (i: number) => {
    onChange(ingredients.filter((_, idx) => idx !== i));
  };

  const addNew = () => {
    const name = newName.trim();
    if (!name) return;
    onChange([...ingredients, { name, quantity_estimate: 'unknown', confidence: 1 }]);
    setNewName('');
  };

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {ingredients.map((ing, i) => (
          <li
            key={ing.name + i}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2"
          >
            <ConfidenceBadge value={ing.confidence} />
            <input
              type="text"
              value={ing.name}
              onChange={(e) => updateAt(i, { name: e.target.value })}
              className="flex-1 min-w-0 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none"
              aria-label={`재료 ${i + 1} 이름`}
            />
            <input
              type="text"
              value={ing.quantity_estimate}
              onChange={(e) => updateAt(i, { quantity_estimate: e.target.value })}
              className="w-24 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-sm text-slate-600"
              aria-label={`재료 ${i + 1} 수량`}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="px-2 py-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              aria-label={`재료 ${i + 1} 삭제`}
            >
              ✕
            </button>
          </li>
        ))}
        {ingredients.length === 0 && (
          <li className="text-sm text-slate-500 px-3 py-2">
            재료가 없습니다. 아래에서 직접 추가하세요.
          </li>
        )}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNew();
            }
          }}
          placeholder="재료 직접 추가"
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none"
          aria-label="재료 직접 추가"
        />
        <button
          type="button"
          onClick={addNew}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900"
        >
          추가
        </button>
      </div>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const tier = value >= 0.75 ? 'high' : value >= 0.5 ? 'mid' : 'low';
  const map = {
    high: { label: '높음', cls: 'bg-emerald-100 text-emerald-700' },
    mid: { label: '중간', cls: 'bg-amber-100 text-amber-700' },
    low: { label: '낮음', cls: 'bg-rose-100 text-rose-700' }
  } as const;
  const { label, cls } = map[tier];
  return (
    <span
      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded ${cls}`}
      title={`신뢰도 ${(value * 100).toFixed(0)}%`}
    >
      {label}
    </span>
  );
}
