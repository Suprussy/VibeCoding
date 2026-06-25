import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, newId } from '@/lib/auth';
import { db, type SavedRecipeRow } from '@/lib/db';
import { PreferencesSchema, RecipeSchema } from '@/lib/validate';

export const runtime = 'nodejs';

const SaveSchema = z.object({
  recipe: RecipeSchema.extend({ id: z.string().min(1).max(50) }),
  source: z.object({
    ingredients_snapshot: z
      .array(
        z.object({
          name: z.string(),
          quantity_estimate: z.string().optional()
        })
      )
      .max(50),
    preferences_snapshot: PreferencesSchema,
    model: z.string().max(100)
  })
});

const insertSaved = db.prepare(
  `INSERT INTO saved_recipes
     (saved_id, user_id, recipe_id, recipe_json, source_json, user_notes, user_rating, user_tags_json, saved_at)
   VALUES (?, ?, ?, ?, ?, '', NULL, '[]', ?)`
);

const listForUser = db.prepare<[string], SavedRecipeRow>(
  `SELECT * FROM saved_recipes WHERE user_id = ? ORDER BY saved_at DESC LIMIT 200`
);

export async function GET() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = listForUser.all(user.id);
  return NextResponse.json({
    items: rows.map((r) => ({
      saved_id: r.saved_id,
      saved_at: r.saved_at,
      user_notes: r.user_notes,
      user_rating: r.user_rating,
      user_tags: JSON.parse(r.user_tags_json) as string[],
      recipe: JSON.parse(r.recipe_json),
      source: JSON.parse(r.source_json)
    }))
  });
}

export async function POST(req: Request) {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { recipe, source } = parsed.data;
  const savedId = newId();

  try {
    insertSaved.run(
      savedId,
      user.id,
      recipe.id,
      JSON.stringify(recipe),
      JSON.stringify(source),
      Date.now()
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'already_saved' }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, saved_id: savedId });
}
