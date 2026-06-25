import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { db, type UserRow, type SessionRow } from './db';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const BCRYPT_COST = 12;
export const LOCKOUT_THRESHOLD = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;
export const PASSWORD_MIN_LEN = 10;

const insertSession = db.prepare(
  `INSERT INTO auth_sessions (token_hash, user_id, expires_at, created_at, ip, user_agent)
   VALUES (?, ?, ?, ?, ?, ?)`
);
const getSession = db.prepare<[string], SessionRow>(
  `SELECT * FROM auth_sessions WHERE token_hash = ?`
);
const deleteSession = db.prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`);
const getUserById = db.prepare<[string], UserRow>(`SELECT * FROM users WHERE id = ?`);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newId(): string {
  return randomUUID();
}

export function createSession(userId: string, ip: string | null, userAgent: string | null): string {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  insertSession.run(tokenHash, userId, now + SESSION_TTL_MS, now, ip, userAgent);
  return token;
}

export function destroySession(token: string): void {
  deleteSession.run(hashSessionToken(token));
}

export function getCurrentUser(): UserRow | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const session = getSession.get(tokenHash);
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    deleteSession.run(tokenHash);
    return null;
  }
  const user = getUserById.get(session.user_id);
  if (!user || user.deleted_at) return null;
  return user;
}

export function setSessionCookie(token: string): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000)
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}
