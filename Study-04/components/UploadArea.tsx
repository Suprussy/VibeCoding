'use client';

import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

type Props = {
  onFile: (file: File) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
};

export default function UploadArea({ onFile, onError, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validate = (f: File): string | null => {
    if (!ALLOWED.has(f.type)) return 'JPEG, PNG, WebP 형식만 지원합니다.';
    if (f.size > MAX_BYTES) return '이미지 크기는 8MB를 초과할 수 없습니다.';
    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validate(f);
    if (err) {
      onError(err);
      return;
    }
    onFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={[
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition',
        dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white',
        disabled ? 'opacity-50 pointer-events-none' : 'hover:border-emerald-400'
      ].join(' ')}
    >
      <div className="text-4xl mb-3" aria-hidden>📷</div>
      <p className="text-slate-700 font-medium mb-1">냉장고 사진을 업로드하세요</p>
      <p className="text-sm text-slate-500 mb-5">JPEG / PNG / WebP · 최대 8MB</p>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          파일 선택
        </button>
        <button
          type="button"
          onClick={() => {
            const el = inputRef.current;
            if (!el) return;
            el.setAttribute('capture', 'environment');
            el.click();
            setTimeout(() => el.removeAttribute('capture'), 0);
          }}
          className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          사진 촬영
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onChange}
        aria-label="냉장고 사진 업로드"
      />
    </div>
  );
}
