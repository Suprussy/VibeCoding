import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  RecipesRequestSchema,
  RecipesResponseSchema,
  type RecipeValidated
} from '@/lib/validate';
import type { Recipe } from '@/lib/types';

const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const TIMEOUT_MS = 55_000;
const MAX_TOKENS = 4096;

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `당신은 한국어로 답하는 요리 도우미입니다. 사용자가 제공한 재료와 선호 옵션으로 1~3개의 레시피를 생성합니다.

규칙:
1. 사용자의 ingredients 를 최대한 활용하라. 사용한 재료는 used_ingredients 에, 추가로 필요한 재료는 missing_ingredients 에 분리하라.
2. preferences.exclude 목록에 있는 재료는 절대로 어떤 필드(title, ingredients, steps, tips, tags 등)에도 포함하지 말라.
3. preferences.diet 옵션을 엄격히 준수하라:
   - "vegetarian": 모든 육류, 가금류, 생선, 해산물 제외 (계란, 유제품 허용)
   - "vegan": 모든 동물성 재료 제외 (계란, 유제품, 꿀 포함 모두 금지)
   - "gluten_free": 밀, 보리, 호밀, 면, 빵, 간장(밀 함유) 등 글루텐 함유 재료 제외
   - "pescatarian": 육류·가금류 제외 (생선·해산물 허용)
   - "low_sodium": 간장·소금·된장·고추장 등 고나트륨 양념을 최소화
4. preferences.cuisine 이 "무관"이 아니면 해당 카테고리 스타일을 따르라.
5. preferences.max_minutes 안에 끝낼 수 있는 레시피만 제안하라. estimated_minutes <= max_minutes.
6. preferences.difficulty 와 일치하는 난이도로 작성하라.
7. avoid_titles 에 포함된 제목과 동일하거나 거의 같은 레시피는 만들지 말라.
8. 결과는 반드시 아래 JSON 스키마의 객체로만 출력하라. 자연어 설명, 마크다운, 코드펜스 절대 금지.

JSON 스키마:
{
  "recipes": [
    {
      "title": "토마토 계란 볶음",
      "cuisine": "한식",
      "difficulty": "easy",
      "estimated_minutes": 15,
      "servings": 2,
      "used_ingredients": [{"name": "토마토", "amount": "2개"}],
      "missing_ingredients": [{"name": "간장", "amount": "1큰술"}],
      "steps": [{"order": 1, "instruction": "토마토를 6등분으로 자른다."}],
      "tips": ["계란을 먼저 반숙으로 익혀두면 부드럽다."],
      "tags": ["빠른요리"]
    }
  ]
}

레시피 1~3개. 각 레시피는 최소 1단계 이상의 steps 포함.`;

export async function POST(req: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = RecipesRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { ingredients, preferences, regenerate, previous_titles } = parsed.data;
  if (ingredients.length === 0) {
    return NextResponse.json({ error: 'no_ingredients' }, { status: 400 });
  }

  const userPayload = JSON.stringify(
    { ingredients, preferences, avoid_titles: previous_titles },
    null,
    2
  );
  const temperature = regenerate ? 0.95 : 0.7;

  let extraGuard: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await callOnce(apiKey, userPayload, temperature, extraGuard);

    if (result.kind === 'ok') {
      const violated = findExclusionViolation(result.data.recipes, preferences.exclude);
      if (violated) {
        if (attempt === 2) {
          console.error('[recipes] safety violation persists:', violated);
          return NextResponse.json({ error: 'safety_violation' }, { status: 502 });
        }
        extraGuard = `이전 시도에서 금지 재료 "${violated}" 가 결과에 포함되어 폐기되었습니다. 절대 어떤 필드에도 포함하지 말고 다시 생성하세요.`;
        continue;
      }

      const recipes: Recipe[] = result.data.recipes.map((r) => ({ ...r, id: randomUUID() }));
      return NextResponse.json({ recipes, model: MODEL });
    }

    if (!result.retryable || attempt === 2) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
  }

  return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
}

type CallOutcome =
  | { kind: 'ok'; data: { recipes: RecipeValidated[] } }
  | { kind: 'fail'; error: string; status: number; retryable: boolean };

async function callOnce(
  apiKey: string,
  userPayload: string,
  temperature: number,
  extraGuard: string | null
): Promise<CallOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const systemContent = extraGuard ? `${SYSTEM_PROMPT}\n\n추가 지시: ${extraGuard}` : SYSTEM_PROMPT;

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
        temperature,
        max_tokens: MAX_TOKENS,
        reasoning: { exclude: true },
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: userPayload }
        ]
      }),
      signal: controller.signal
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[recipes] upstream', res.status, body.slice(0, 500));
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

    const validated = RecipesResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('[recipes] schema violation:', validated.error.issues.slice(0, 3));
      return { kind: 'fail', error: 'schema_violation', status: 502, retryable: true };
    }

    return { kind: 'ok', data: validated.data };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      kind: 'fail',
      error: isAbort ? 'timeout' : 'network_error',
      status: 504,
      retryable: !isAbort
    };
  } finally {
    clearTimeout(timer);
  }
}

function findExclusionViolation(recipes: RecipeValidated[], excluded: string[]): string | null {
  if (excluded.length === 0) return null;
  const needles = excluded.map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (needles.length === 0) return null;

  for (const r of recipes) {
    const haystack = [
      r.title,
      r.cuisine,
      ...r.used_ingredients.flatMap((x) => [x.name, x.amount]),
      ...r.missing_ingredients.flatMap((x) => [x.name, x.amount]),
      ...r.steps.map((s) => s.instruction),
      ...r.tips,
      ...r.tags
    ]
      .join('\n')
      .toLowerCase();
    for (const n of needles) {
      if (haystack.includes(n)) return n;
    }
  }
  return null;
}

function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  }
  return trimmed;
}
