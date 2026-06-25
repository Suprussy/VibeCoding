import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'app.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __sqliteDb: Database.Database | undefined;
}

function open() {
  const conn = new Database(DB_PATH);
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');
  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      deleted_at INTEGER,
      failed_login_count INTEGER NOT NULL DEFAULT 0,
      locked_until INTEGER
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      default_servings INTEGER NOT NULL DEFAULT 2,
      diet TEXT NOT NULL DEFAULT '[]',
      exclusions TEXT NOT NULL DEFAULT '[]',
      preferred_cuisine TEXT NOT NULL DEFAULT '무관',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saved_recipes (
      saved_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      recipe_id TEXT NOT NULL,
      recipe_json TEXT NOT NULL,
      source_json TEXT NOT NULL,
      user_notes TEXT NOT NULL DEFAULT '',
      user_rating INTEGER,
      user_tags_json TEXT NOT NULL DEFAULT '[]',
      saved_at INTEGER NOT NULL,
      UNIQUE (user_id, recipe_id)
    );
    CREATE INDEX IF NOT EXISTS user_saved_at_idx ON saved_recipes(user_id, saved_at DESC);

    CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      ip TEXT,
      user_agent TEXT
    );
    CREATE INDEX IF NOT EXISTS session_user_idx ON auth_sessions(user_id);
  `);
  return conn;
}

export const db: Database.Database = global.__sqliteDb ?? open();
if (!global.__sqliteDb) global.__sqliteDb = db;

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: number;
  deleted_at: number | null;
  failed_login_count: number;
  locked_until: number | null;
};

export type ProfileRow = {
  user_id: string;
  nickname: string;
  default_servings: number;
  diet: string;
  exclusions: string;
  preferred_cuisine: string;
  updated_at: number;
};

export type SavedRecipeRow = {
  saved_id: string;
  user_id: string;
  recipe_id: string;
  recipe_json: string;
  source_json: string;
  user_notes: string;
  user_rating: number | null;
  user_tags_json: string;
  saved_at: number;
};

export type SessionRow = {
  token_hash: string;
  user_id: string;
  expires_at: number;
  created_at: number;
  ip: string | null;
  user_agent: string | null;
};
