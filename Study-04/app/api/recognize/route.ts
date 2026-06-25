import { NextResponse } from 'next/server';
import { RecognizeResponseSchema, type RecognizeResponseValidated } from '@/lib/validate';

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TIMEOUT_MS = 30_000;
const MODEL = 'google/gemma-4-31b-it:free';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `당신은 냉장고 사진을 분석하는 AI입니다. 사진 속 식재료를 인식해 JSON으로만 응답하세요.

스키마(이 형태만 허용):
{
  "ingredients": [
    { "name": "토마토", "quantity_estimate": "3개", "confidence": 0.9 }
  ],
  "notes": "부분적으로 가려진 항목 등 보조 설명"
}

규칙:
- name: 한국어 일반 명사 (예: "계란", "양파", "우유")
- quantity_estimate: 추정 가능하면 "3개", "500g", "1팩" 등; 불가능하면 "unknown"
- confidence: 0.0 ~ 1.0 사이 숫자
- 자연어 설명, 마크다운, 코드펜스 없이 오직 JSON 객체만 출력`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const file = formData.get('image');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'missing_image' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too_large' }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await callOnce(apiKey, dataUrl);
    if (result.kind === 'ok') {
      return NextResponse.json(result.data);
    }
    if (!result.retryable || attempt === 2) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  }

  return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
}

type CallOutcome =
  | { kind: 'ok'; data: RecognizeResponseValidated }
  | { kind: 'fail'; error: string; status: number; retryable: boolean };

async function callOnce(apiKey: string, dataUrl: string): Promise<CallOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER ?? 'http://localhost:3000',
        'X-Title': process.env.OPENROUTER_APP_TITLE ?? 'Fridge Recipe'
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: '이 냉장고 사진의 식재료를 위 스키마대로 JSON으로 알려주세요.' },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ]
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[recognize] upstream', res.status, body.slice(0, 500));
      if (res.status === 429) {
        return { kind: 'fail', error: 'rate_limited', status: 429, retryable: false };
      }
      return {
        kind: 'fail',
        error: 'upstream_error',
        status: 502,
        retryable: res.status >= 500
      };
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return { kind: 'fail', error: 'malformed_response', status: 502, retryable: true };
    }

    const cleaned = stripCodeFence(content);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return { kind: 'fail', error: 'json_parse_failed', status: 502, retryable: true };
    }

    const validated = RecognizeResponseSchema.safeParse(parsed);
    if (!validated.success) {
      return { kind: 'fail', error: 'schema_violation', status: 502, retryable: true };
    }

    return { kind: 'ok', data: validated.data };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      kind: 'fail',
      error: isAbort ? 'timeout' : 'network_error',
      status: 504,
      retryable: true
    };
  } finally {
    clearTimeout(timer);
  }
}

function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return trimmed;
}
