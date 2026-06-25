import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createSession,
  hashPassword,
  isValidEmail,
  newId,
  PASSWORD_MIN_LEN,
  setSessionCookie
} from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const RegisterSchema = z.object({
  email: z.string().min(3).max(254),
  password: z.string().min(PASSWORD_MIN_LEN).max(200),
  nickname: z.string().min(2).max(20)
});

const insertUser = db.prepare(
  `INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)`
);
const insertProfile = db.prepare(
  `INSERT INTO profiles (user_id, nickname, default_servings, diet, exclusions, preferred_cuisine, updated_at)
   VALUES (?, ?, 2, '[]', '[]', '무관', ?)`
);
const findByEmail = db.prepare<[string], { id: string }>(
  `SELECT id FROM users WHERE email = ? AND deleted_at IS NULL`
);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const { email, password, nickname } = parsed.data;
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  if (findByEmail.get(email.toLowerCase())) {
    return NextResponse.json({ error: 'email_taken' }, { status: 409 });
  }

  const id = newId();
  const passwordHash = await hashPassword(password);
  const now = Date.now();

  const tx = db.transaction(() => {
    insertUser.run(id, email.toLowerCase(), passwordHash, now);
    insertProfile.run(id, nickname.trim(), now);
  });
  tx();

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const userAgent = req.headers.get('user-agent') ?? null;
  const token = createSession(id, ip, userAgent);
  setSessionCookie(token);

  return NextResponse.json({ ok: true, user: { id, email: email.toLowerCase(), nickname } });
}
