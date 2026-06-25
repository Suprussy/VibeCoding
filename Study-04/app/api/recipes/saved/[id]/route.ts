import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { db, type SavedRecipeRow } from '@/lib/db';

export const runtime = 'nodejs';

const PatchSchema = z.object({
  user_notes: z.string().max(2000).optional(),
  user_rating: z.number().int().min(1).max(5).nullable().optional(),
  user_tags: z.array(z.string().min(1).max(20)).max(20).optional()
});

const getOne = db.prepare<[string, string], SavedRecipeRow>(
  `SELECT * FROM saved_recipes WHERE saved_id = ? AND user_id = ?`
);
const deleteOne = db.prepare(
  `DELETE FROM saved_recipes WHERE saved_id = ? AND user_id = ?`
);
const updateOne = db.prepare(
  `UPDATE saved_recipes SET user_notes = ?, user_rating = ?, user_tags_json = ?
   WHERE saved_id = ? AND user_id = ?`
);

function rowToDto(r: SavedRecipeRow) {
  return {
    saved_id: r.saved_id,
    saved_at: r.saved_at,
    user_notes: r.user_notes,
    user_rating: r.user_rating,
    user_tags: JSON.parse(r.user_tags_json) as string[],
    recipe: JSON.parse(r.recipe_json),
    source: JSON.parse(r.source_json)
  };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const row = getOne.get(params.id, user.id);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(rowToDto(row));
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const row = getOne.get(params.id, user.id);
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const next = {
    user_notes: parsed.data.user_notes ?? row.user_notes,
    user_rating:
      parsed.data.user_rating === undefined ? row.user_rating : parsed.data.user_rating,
    user_tags_json: parsed.data.user_tags
      ? JSON.stringify(parsed.data.user_tags)
      : row.user_tags_json
  };

  updateOne.run(next.user_notes, next.user_rating, next.user_tags_json, params.id, user.id);

  const updated = getOne.get(params.id, user.id)!;
  return NextResponse.json(rowToDto(updated));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const result = deleteOne.run(params.id, user.id);
  if (result.changes === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
