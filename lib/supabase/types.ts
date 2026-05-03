/**
 * Hand-written DB row types for the Supabase client. Keep in sync with
 * supabase/schema.sql. (Optionally regenerate via `supabase gen types
 * typescript` once the project is linked.)
 */

export type Database = {
  public: {
    Tables: {
      items: {
        Row: ItemRow;
        Insert: ItemInsert;
        Update: Partial<ItemInsert>;
        Relationships: [];
      };
      articles: {
        Row: ArticleRow;
        Insert: ArticleRow;
        Update: Partial<ArticleRow>;
        Relationships: [];
      };
      highlights: {
        Row: HighlightRow;
        Insert: HighlightRow;
        Update: Partial<HighlightRow>;
        Relationships: [];
      };
      pdfs: {
        Row: PdfRow;
        Insert: PdfRow;
        Update: Partial<PdfRow>;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: UserSettingsRow;
        Update: Partial<UserSettingsRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type ItemRow = {
  id: string;
  user_id: string;
  kind: "article" | "pdf";
  title: string;
  byline: string | null;
  site_name: string | null;
  url: string | null;
  excerpt: string | null;
  thumb: string | null;
  word_count: number | null;
  read_minutes: number | null;
  archived: boolean;
  bookmarked: boolean;
  progress: number;
  created_at: number;
  updated_at: number;
};

export type ItemInsert = ItemRow;

export type ArticleRow = {
  item_id: string;
  user_id: string;
  html: string;
  text_length: number;
};

export type HighlightRow = {
  id: string;
  item_id: string;
  user_id: string;
  color: "key" | "insight" | "important" | "question";
  text: string;
  prefix: string;
  suffix: string;
  page: number | null;
  note: string | null;
  created_at: number;
};

export type PdfRow = {
  item_id: string;
  user_id: string;
  storage_path: string;
  byte_size: number | null;
};

export type UserSettingsRow = {
  user_id: string;
  theme: string;
  font_mode: string;
  font_size: number;
  line_height: number;
  column_width: number;
  updated_at: number;
};
