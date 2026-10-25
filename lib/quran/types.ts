export interface Chapter {
  id: number;
  name_simple: string;
  name_arabic: string;
  revelation_place: string;
  verses_count: number;
  bismillah_pre: boolean;
  translated_name: { name: string };
}

export interface VerseTranslation {
  resource_id: number;
  text: string;
}

export interface Verse {
  id: number;
  verse_key: string;
  verse_number: number;
  juz_number: number;
  page_number: number;
  text_uthmani: string;
  translations?: VerseTranslation[];
  words?: Word[];
  audio?: { url: string | null } | null;
}

export interface TranslationResource {
  id: number;
  name: string;
  author_name: string;
  language_name: string;
}

export interface Word {
  id: number;
  position: number;
  char_type_name: string;
  text_uthmani?: string;
  audio_url?: string | null;
  translation?: { text: string | null } | null;
  transliteration?: { text: string | null } | null;
}

export interface Recitation {
  id: number;
  reciter_name: string;
  style?: string | null;
}

export interface Juz {
  id: number;
  juz_number: number;
  verses_count: number;
  verse_mapping: Record<string, string>;
}

export interface SearchResult {
  verse_key: string;
  text?: string | null;
  highlighted?: string | null;
  translations?: { text: string; name?: string; language_name?: string }[];
}

export interface SearchResponse {
  query: string;
  total_results: number;
  current_page: number;
  total_pages: number;
  results: SearchResult[];
}
