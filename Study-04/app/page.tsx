'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UploadArea from '@/components/UploadArea';
import IngredientList from '@/components/IngredientList';
import type { Ingredient, RecognizeResponse } from '@/lib/types';

type Status = 'idle' | 'analyzing' | 'success' | 'error';

const STORAGE_KEY = 'fridge.step1.ingredients';

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (f: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus('idle');
    setIngredients([]);
    setNotes('');
    setErrorMsg('');
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setStatus('idle');
    setIngredients([]);
    setNotes('');
    setErrorMsg('');
  };

  const analyze = async () => {
    if (!file) return;
    setStatus('analyzing');
    setErrorMsg('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/recognize', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(errorLabel(body?.error, res.status));
        setStatus('error');
        return;
      }
      const data = (await res.json()) as RecognizeResponse;
      setIngredients(data.ingredients);
      setNotes(data.notes ?? '');
      setStatus('success');
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  const proceedToStep2 = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ingredients));
    } catch {
      // ignore quota errors
    }
    router.push('/recipes');
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">냉장고 레시피</h1>
          <p className="mt-1 text-sm text-slate-600">
            사진을 올리면 식재료를 자동으로 인식합니다.
          </p>
        </header>

        {!file && (
          <UploadArea onFile={handleFile} onError={(m) => setErrorMsg(m)} />
        )}

        {file && previewUrl && (
          <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="relative bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="업로드된 냉장고 사진"
                className="w-full max-h-80 object-contain"
              />
              {status === 'analyzing' && (
                <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
                  <Spinner />
                  <p className="text-sm text-slate-700">재료를 인식하는 중…</p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {status === 'idle' && (
                  <button
                    onClick={analyze}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                  >
                    분석하기
                  </button>
                )}
                {status === 'error' && (
                  <button
                    onClick={analyze}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                  >
                    다시 시도
                  </button>
                )}
                <button
                  onClick={reset}
                  disabled={status === 'analyzing'}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  사진 변경
                </button>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  {errorMsg}
                </div>
              )}

              {status === 'success' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">
                      인식된 재료
                    </h2>
                    <IngredientList ingredients={ingredients} onChange={setIngredients} />
                  </div>

                  {notes && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      <span className="font-medium text-slate-700">참고:</span> {notes}
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={proceedToStep2}
                      disabled={ingredients.length === 0}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      레시피 추천 받기 →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <div
      className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin"
      role="status"
      aria-label="로딩 중"
    />
  );
}

function errorLabel(code: unknown, status: number): string {
  switch (code) {
    case 'invalid_type':
      return 'JPEG, PNG, WebP 형식만 지원합니다.';
    case 'too_large':
      return '이미지 크기는 8MB를 초과할 수 없습니다.';
    case 'missing_image':
      return '이미지를 선택해주세요.';
    case 'timeout':
      return '응답 시간이 초과되었습니다. 다시 시도해주세요.';
    case 'server_misconfigured':
      return '서버 설정이 누락되었습니다. 관리자에게 문의하세요.';
    case 'rate_limited':
      return '무료 모델 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
    case 'schema_violation':
    case 'json_parse_failed':
    case 'malformed_response':
      return '결과를 해석하지 못했습니다. 다시 시도해주세요.';
    default:
      return `이미지를 인식하지 못했습니다. (${status})`;
  }
}
