import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { db, type ProfileRow } from '@/lib/db';

export const runtime = 'nodejs';

const UpdateSchema = z.object({
  nickname: z.string().min(2).max(20),
  default_servings: z.number().int().min(1).max(6),
  diet: z
    .array(z.enum(['vegetarian', 'vegan', 'gluten_free', 'pescatarian', 'low_sodium']))
    .max(10),
  exclusions: z.array(z.string().min(1).max(30)).max(30),
  preferred_cuisine: z.enum(['한식', '일식', '중식', '양식', '무관'])
});

const getProfileStmt = db.prepare<[string], ProfileRow>(
  `SELECT * FROM profiles WHERE user_id = ?`
);
const updateProfileStmt = db.prepare(
  `UPDATE profiles
   SET nickname = ?, default_servings = ?, diet = ?, exclusions = ?, preferred_cuisine = ?, updated_at = ?
   WHERE user_id = ?`
);

function rowToDto(row: ProfileRow) {
  return {
    nickname: row.nickname,
    default_servings: row.default_servings,
    diet: JSON.parse(row.diet) as string[],
    exclusions: JSON.parse(row.exclusions) as string[],
    preferred_cuisine: row.preferred_cuisine,
    updated_at: row.updated_at
  };
}

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const row = getProfileStmt.get(user.id);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(rowToDto(row));
}

export async function PUT(req: Request) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const v = parsed.data;
  updateProfileStmt.run(
    v.nickname.trim(),
    v.default_servings,
    JSON.stringify(v.diet),
    JSON.stringify(v.exclusions),
    v.preferred_cuisine,
    Date.now(),
    user.id
  );

  const row = getProfileStmt.get(user.id);
  return NextResponse.json(row ? rowToDto(row) : null);
}
