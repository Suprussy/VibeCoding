import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSession,
  LOCKOUT_MS,
  LOCKOUT_THRESHOLD,
  setSessionCookie,
  verifyPassword
} from '@/lib/auth';
import { db, type UserRow } from '@/lib/db';

export const runtime = 'nodejs';

const LoginSchema = z.object({
  email: z.string().min(3).max(254),
  password: z.string().min(1).max(200)
});

const findByEmail = db.prepare<[string], UserRow>(
  `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL`
);
const incFailed = db.prepare(
  `UPDATE users SET failed_login_count = failed_login_count + 1,
     locked_until = CASE WHEN failed_login_count + 1 >= ? THEN ? ELSE locked_until END
   WHERE id = ?`
);
const resetFailed = db.prepare(
  `UPDATE users SET failed_login_count = 0, locked_until = NULL WHERE id = ?`
);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = findByEmail.get(email.toLowerCase());
  if (!user) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  if (user.locked_until && user.locked_until > Date.now()) {
    return NextResponse.json(
      { error: 'account_locked', retry_after_ms: user.locked_until - Date.now() },
      { status: 423 }
    );
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    incFailed.run(LOCKOUT_THRESHOLD, Date.now() + LOCKOUT_MS, user.id);
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  resetFailed.run(user.id);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;
  const token = createSession(user.id, ip, userAgent);
  setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
