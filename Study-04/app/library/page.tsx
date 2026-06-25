'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import RecipeCard from '@/components/RecipeCard';
import type { Recipe } from '@/lib/types';

type SavedItem = {
  saved_id: string;
  saved_at: number;
  user_notes: string;
  user_rating: number | null;
  user_tags: string[];
  recipe: Recipe;
  source: { model: string; ingredients_snapshot: unknown; preferences_snapshot: unknown };
};

type SortKey = 'recent' | 'rating' | 'title';

export default function LibraryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SavedItem[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ user_notes: string; user_rating: number | null; user_tags: string[] }>({
    user_notes: '',
    user_rating: null,
    user_tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/recipes/saved');
      if (res.status === 401) {
        router.replace('/login');
        return;
      }
      if (res.ok) {
        const data = (await res.json()) as { items: SavedItem[] };
        setItems(data.items);
      }
      setLoading(false);
    })();
  }, [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let xs = items;
    if (q) {
      xs = xs.filter((it) => {
        const hay = [
          it.recipe.title,
          ...it.recipe.tags,
          ...it.user_tags,
          ...it.recipe.used_ingredients.map((i) => i.name),
          ...it.recipe.missing_ingredients.map((i) => i.name)
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...xs];
    if (sort === 'recent') sorted.sort((a, b) => b.saved_at - a.saved_at);
    else if (sort === 'rating')
      sorted.sort((a, b) => (b.user_rating ?? -1) - (a.user_rating ?? -1));
    else sorted.sort((a, b) => a.recipe.title.localeCompare(b.recipe.title, 'ko'));
    return sorted;
  }, [items, query, sort]);

  const startEdit = (it: SavedItem) => {
    setEditing(it.saved_id);
    setDraft({
      user_notes: it.user_notes,
      user_rating: it.user_rating,
      user_tags: it.user_tags
    });
    setTagInput('');
  };

  const saveEdit = async (savedId: string) => {
    const res = await fetch(`/api/recipes/saved/${savedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    if (res.ok) {
      const updated = (await res.json()) as SavedItem;
      setItems(items.map((it) => (it.saved_id === savedId ? updated : it)));
      setEditing(null);
    }
  };

  const remove = async (savedId: string) => {
    const res = await fetch(`/api/recipes/saved/${savedId}`, { method: 'DELETE' });
    if (res.ok) {
      setItems(items.filter((it) => it.saved_id !== savedId));
      setDeletingId(null);
    }
  };

  const exportJson = (it: SavedItem) => {
    const blob = new Blob([JSON.stringify(it, null, 2)], { type: 'application/json' });
    triggerDownload(blob, `${it.recipe.title}.json`);
  };

  const exportMarkdown = (it: SavedItem) => {
    const r = it.recipe;
    const lines = [
      `# ${r.title}`,
      ``,
      `- 카테고리: ${r.cuisine}`,
      `- 난이도: ${r.difficulty}`,
      `- 조리시간: 약 ${r.estimated_minutes}분`,
      `- 인분: ${r.servings}인분`,
      ``,
      `## 사용 재료`,
      ...r.used_ingredients.map((i) => `- ${i.name} ${i.amount}`),
      ``,
      ...(r.missing_ingredients.length
        ? [`## 추가 구매 필요`, ...r.missing_ingredients.map((i) => `- ${i.name} ${i.amount}`), ``]
        : []),
      `## 조리 단계`,
      ...r.steps.map((s) => `${s.order}. ${s.instruction}`),
      ``,
      ...(r.tips.length ? [`## 팁`, ...r.tips.map((t) => `- ${t}`), ``] : []),
      ...(it.user_notes ? [`## 메모`, it.user_notes, ``] : [])
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    triggerDownload(blob, `${it.recipe.title}.md`);
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-32 bg-slate-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse mb-5" />
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                <div className="h-5 w-2/3 bg-slate-200 rounded mb-3" />
                <div className="h-3 w-1/2 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-1/3 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">보관함</h1>
        <p className="text-sm text-slate-600 mb-5">저장한 레시피 {items.length}개</p>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-700 mb-4">저장된 레시피가 없습니다.</p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
            >
              첫 사진 올리러 가기
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="제목/태그/재료 검색"
                aria-label="레시피 검색"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:outline-none text-sm"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
              >
                <option value="recent">최신순</option>
                <option value="rating">별점순</option>
                <option value="title">제목순</option>
              </select>
            </div>

            <div className="space-y-3">
              {filtered.map((it) => (
                <div key={it.saved_id} className="space-y-2">
                  <RecipeCard recipe={it.recipe} saveDisabled />
                  <div className="px-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500">
                      저장: {new Date(it.saved_at).toLocaleDateString('ko-KR')}
                    </span>
                    {it.user_rating != null && (
                      <span className="text-amber-600">{'★'.repeat(it.user_rating)}</span>
                    )}
                    {it.user_tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        #{t}
                      </span>
                    ))}
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={() => startEdit(it)}
                      className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600"
                    >
                      편집
                    </button>
                    <button
                      type="button"
                      onClick={() => exportMarkdown(it)}
                      className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600"
                    >
                      MD
                    </button>
                    <button
                      type="button"
                      onClick={() => exportJson(it)}
                      className="px-2 py-1 rounded hover:bg-slate-100 text-slate-600"
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(it.saved_id)}
                      className="px-2 py-1 rounded hover:bg-rose-50 text-rose-600"
                    >
                      삭제
                    </button>
                  </div>

                  {deletingId === it.saved_id && (
                    <div className="px-1 flex items-center gap-2 text-sm">
                      <span className="text-rose-600 text-xs">삭제할까요?</span>
                      <button
                        type="button"
                        onClick={() => remove(it.saved_id)}
                        className="px-2 py-1 rounded bg-rose-600 text-white text-xs hover:bg-rose-700"
                      >
                        삭제
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="px-2 py-1 rounded border border-slate-300 text-slate-600 text-xs hover:bg-slate-50"
                      >
                        취소
                      </button>
                    </div>
                  )}

                  {editing === it.saved_id && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-3 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">메모</label>
                        <textarea
                          value={draft.user_notes}
                          onChange={(e) => setDraft({ ...draft, user_notes: e.target.value })}
                          maxLength={2000}
                          rows={3}
                          className="w-full px-2 py-1.5 rounded border border-slate-300 focus:border-emerald-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-700 mb-1">별점</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                setDraft({
                                  ...draft,
                                  user_rating: draft.user_rating === n ? null : n
                                })
                              }
                              className={`w-7 h-7 rounded ${
                                draft.user_rating != null && n <= draft.user_rating
                                  ? 'text-amber-500'
                                  : 'text-slate-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                          {draft.user_rating != null && (
                            <button
                              type="button"
                              onClick={() => setDraft({ ...draft, user_rating: null })}
                              className="ml-1 text-xs text-slate-500 hover:text-slate-700"
                            >
                              초기화
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-700 mb-1">태그</span>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const v = tagInput.trim();
                                if (v && !draft.user_tags.includes(v)) {
                                  setDraft({ ...draft, user_tags: [...draft.user_tags, v] });
                                }
                                setTagInput('');
                              }
                            }}
                            placeholder="엔터로 추가"
                            className="flex-1 px-2 py-1.5 rounded border border-slate-300 focus:border-emerald-500 focus:outline-none text-sm"
                          />
                        </div>
                        {draft.user_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {draft.user_tags.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 text-xs"
                              >
                                #{t}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraft({
                                      ...draft,
                                      user_tags: draft.user_tags.filter((x) => x !== t)
                                    })
                                  }
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(it.saved_id)}
                          className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
