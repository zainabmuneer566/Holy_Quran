import "server-only";
import type { Chapter, Juz, Recitation, SearchResponse, TranslationResource, Verse } from "./types";

export type QuranErrorKind = "not_configured" | "auth" | "unavailable";

export class QuranApiError extends Error {
  constructor(public kind: QuranErrorKind, message: string) {
    super(message);
    this.name = "QuranApiError";
  }
}

const clientId = process.env.QURAN_CLIENT_ID;
const clientSecret = process.env.QURAN_CLIENT_SECRET;
const hasCredentials = Boolean(clientId && clientSecret);
const allowPublic = process.env.QURAN_ALLOW_PUBLIC_API === "true";

const API_BASE =
  process.env.QURAN_API_BASE ||
  (hasCredentials
    ? "https://apis.quran.foundation/content/api/v4"
    : "https://api.quran.com/api/v4");
const OAUTH_URL = process.env.QURAN_OAUTH_URL || "https://oauth2.quran.foundation";

export function isQuranConfigured(): boolean {
  return hasCredentials || allowPublic;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  let res: Response;
  try {
    res = await fetch(`${OAUTH_URL}/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=content",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new QuranApiError("unavailable", "Could not reach the Quran Foundation auth server.");
  }
  if (!res.ok) {
    throw new QuranApiError("auth", `Quran API credentials were rejected (HTTP ${res.status}).`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return cachedToken.value;
}

async function api<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  if (!isQuranConfigured()) {
    throw new QuranApiError("not_configured", "Quran API credentials are not configured.");
  }
  const url = new URL(`${API_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (hasCredentials) {
    headers["x-auth-token"] = await getToken();
    headers["x-client-id"] = clientId as string;
  }

  let res: Response;
  try {
    // Short revalidation window: content is re-fetched from the provider regularly.
    res = await fetch(url, { headers, next: { revalidate: 3600 }, signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new QuranApiError("unavailable", "The Quran content service did not respond.");
  }
  if (res.status === 401 || res.status === 403) {
    cachedToken = null;
    throw new QuranApiError("auth", "The Quran content service rejected our credentials.");
  }
  if (!res.ok) {
    throw new QuranApiError("unavailable", `The Quran content service returned HTTP ${res.status}.`);
  }
  return (await res.json()) as T;
}

export async function getChapters(): Promise<Chapter[]> {
  const data = await api<{ chapters: Chapter[] }>("/chapters", { language: "en" });
  return data.chapters;
}

export async function getChapter(id: number): Promise<Chapter> {
  const data = await api<{ chapter: Chapter }>(`/chapters/${id}`, { language: "en" });
  return data.chapter;
}

export async function getTranslationResources(): Promise<TranslationResource[]> {
  const data = await api<{ translations: TranslationResource[] }>("/resources/translations");
  return data.translations;
}

interface VersesPage {
  verses: Verse[];
  pagination: { next_page: number | null };
}

export interface VerseOptions {
  translationIds: number[];
  reciterId?: number;
  words?: boolean;
  wordLanguage?: string;
}

export async function getChapterVerses(chapterId: number, o: VerseOptions): Promise<Verse[]> {
  const all: Verse[] = [];
  let page: number | null = 1;
  while (page) {
    const params: Record<string, string | number> = {
      language: o.wordLanguage ?? "en",
      words: o.words ? "true" : "false",
      fields: "text_uthmani",
      translations: o.translationIds.join(","),
      per_page: 50,
      page,
    };
    if (o.words) params.word_fields = "text_uthmani";
    if (o.reciterId) params.audio = o.reciterId;
    const data: VersesPage = await api<VersesPage>(`/verses/by_chapter/${chapterId}`, params);
    all.push(...data.verses);
    page = data.pagination.next_page;
  }
  return all;
}

export async function getRecitations(): Promise<Recitation[]> {
  const data = await api<{ recitations: Recitation[] }>("/resources/recitations", { language: "en" });
  return data.recitations;
}

export async function getJuzs(): Promise<Juz[]> {
  const data = await api<{ juzs: Juz[] }>("/juzs");
  return data.juzs;
}

export async function searchQuran(q: string, page: number): Promise<SearchResponse> {
  const data = await api<{ search: SearchResponse }>("/search", { q, size: 10, page, language: "en" });
  return data.search;
}

/** Fetches the opening-formula text from the source (verse 1:1) rather than hard-coding it. */
export async function getBismillahText(): Promise<string> {
  const data = await api<{ verse: Verse }>("/verses/by_key/1:1", { fields: "text_uthmani" });
  return data.verse.text_uthmani;
}
