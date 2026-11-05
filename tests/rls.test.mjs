// Runs the real migration in an in-process Postgres (PGlite) and checks Row Level Security.
// Supabase's auth schema is stubbed just enough for auth.uid() and the signup trigger.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

async function as(userId, fn) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  try { return await fn(); } finally { await db.exec("reset role"); }
}

before(async () => {
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
  `);
  await db.exec(readFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), "utf8"));
  await db.query("insert into auth.users (id, raw_user_meta_data) values ($1, $2), ($3, $4)", [A, '{"display_name":"Alice"}', B, "{}"]);
});

test("signup trigger creates a profile with the display name", async () => {
  const r = await db.query("select display_name from public.profiles where id = $1", [A]);
  assert.equal(r.rows[0].display_name, "Alice");
});

test("users only see their own rows", async () => {
  await as(A, () => db.query("insert into bookmarks (user_id, surah, ayah) values ($1, 2, 255)", [A]));
  await as(A, () => db.query("insert into personal_notes (user_id, surah, ayah, body) values ($1, 2, 255, 'private')", [A]));
  const b = await as(B, () => db.query("select * from bookmarks"));
  assert.equal(b.rows.length, 0);
  const n = await as(B, () => db.query("select * from personal_notes"));
  assert.equal(n.rows.length, 0);
  const p = await as(B, () => db.query("select * from profiles"));
  assert.equal(p.rows.length, 1);
  assert.equal(p.rows[0].id, B);
});

test("a user cannot insert rows owned by someone else", async () => {
  await assert.rejects(as(B, () => db.query("insert into bookmarks (user_id, surah, ayah) values ($1, 1, 1)", [A])), /row-level security/);
  await assert.rejects(as(B, () => db.query("insert into personal_notes (user_id, surah, ayah, body) values ($1, 1, 1, 'x')", [A])), /row-level security/);
});

test("a user cannot update or delete someone else's rows", async () => {
  const u = await as(B, () => db.query("update personal_notes set body = 'hacked' where user_id = $1", [A]));
  assert.equal(u.affectedRows, 0);
  const d = await as(B, () => db.query("delete from bookmarks where user_id = $1", [A]));
  assert.equal(d.affectedRows, 0);
  const still = await as(A, () => db.query("select body from personal_notes"));
  assert.equal(still.rows[0].body, "private");
});

test("a user cannot reassign ownership of their own row", async () => {
  await assert.rejects(as(A, () => db.query("update bookmarks set user_id = $1 where user_id = $2", [B, A])), /row-level security/);
});

test("a bookmark cannot point at another user's collection", async () => {
  const c = await as(A, () => db.query("insert into bookmark_collections (user_id, name) values ($1, 'Favourites') returning id", [A]));
  await assert.rejects(
    as(B, () => db.query("insert into bookmarks (user_id, surah, ayah, collection_id) values ($1, 3, 3, $2)", [B, c.rows[0].id])),
    /foreign key/,
  );
});

test("deleting a collection keeps its bookmarks", async () => {
  const c = await as(A, () => db.query("select id from bookmark_collections limit 1"));
  await as(A, () => db.query("insert into bookmarks (user_id, surah, ayah, collection_id) values ($1, 4, 4, $2)", [A, c.rows[0].id]));
  await as(A, () => db.query("delete from bookmark_collections where id = $1", [c.rows[0].id]));
  const r = await as(A, () => db.query("select collection_id from bookmarks where surah = 4"));
  assert.equal(r.rows.length, 1);
  assert.equal(r.rows[0].collection_id, null);
});

test("constraints reject invalid data", async () => {
  await assert.rejects(as(A, () => db.query("insert into bookmarks (user_id, surah, ayah) values ($1, 115, 1)", [A])), /check constraint/);
  await assert.rejects(as(A, () => db.query("insert into bookmarks (user_id, surah, ayah) values ($1, 2, 255)", [A])), /unique/);
  await assert.rejects(as(A, () => db.query("insert into personal_notes (user_id, surah, ayah, body) values ($1, 5, 5, '')", [A])), /check constraint/);
  await assert.rejects(as(A, () => db.query("insert into reading_goals (user_id, daily_ayahs) values ($1, 0)", [A])), /check constraint/);
  await assert.rejects(as(A, () => db.query("insert into memorization_progress (user_id, surah, ayah, status) values ($1, 1, 1, 'nope')", [A])), /check constraint/);
});

test("progress summaries only count the caller's data", async () => {
  await as(A, () => db.query("insert into reading_progress (user_id, surah, ayah) values ($1, 1, 1), ($1, 1, 2), ($1, 2, 1)", [A]));
  await as(B, () => db.query("insert into reading_progress (user_id, surah, ayah) values ($1, 1, 1)", [B]));
  const a = await as(A, () => db.query("select * from my_progress_by_surah() order by surah"));
  assert.deepEqual(a.rows.map((r) => [r.surah, r.ayahs]), [[1, 2], [2, 1]]);
  const b = await as(B, () => db.query("select * from my_progress_by_surah()"));
  assert.deepEqual(b.rows.map((r) => [r.surah, r.ayahs]), [[1, 1]]);
  const days = await as(A, () => db.query("select sum(ayahs)::int as n from my_daily_counts('2000-01-01')"));
  assert.equal(days.rows[0].n, 3);
});

test("anonymous visitors cannot read or write personal tables", async () => {
  await db.exec("set role anon");
  try {
    for (const t of ["bookmarks", "personal_notes", "profiles", "reading_progress", "user_preferences"]) {
      await assert.rejects(db.query(`select * from ${t}`), /permission denied/);
    }
    await assert.rejects(db.query("select * from my_progress_by_surah()"), /permission denied/);
  } finally { await db.exec("reset role"); }
});

test("deleting the auth user removes all of their personal data", async () => {
  await db.query("delete from auth.users where id = $1", [A]);
  for (const t of ["profiles", "bookmarks", "personal_notes", "reading_progress", "bookmark_collections"]) {
    const col = t === "profiles" ? "id" : "user_id";
    const r = await db.query(`select count(*)::int as n from ${t} where ${col} = $1`, [A]);
    assert.equal(r.rows[0].n, 0, t);
  }
  const other = await db.query("select count(*)::int as n from reading_progress where user_id = $1", [B]);
  assert.equal(other.rows[0].n, 1);
});
