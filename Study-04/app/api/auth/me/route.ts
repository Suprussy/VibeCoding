import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db, type ProfileRow } from '@/lib/db';

export const runtime = 'nodejs';

const getProfile = db.prepare<[string], ProfileRow>(
  `SELECT * FROM profiles WHERE user_id = ?`
);

export async function GET() {
  const user = getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  const profile = getProfile.get(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      nickname: profile?.nickname ?? user.email
    }
  });
}
