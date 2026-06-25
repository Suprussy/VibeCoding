import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const deleteUser = db.prepare(`DELETE FROM users WHERE id = ?`);

export async function DELETE() {
  const user = getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  deleteUser.run(user.id);
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
