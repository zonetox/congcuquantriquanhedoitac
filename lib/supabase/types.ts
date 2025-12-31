export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles_tracked: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          url: string;
          rss_url: string | null;
          category: string | null;
          notes: string | null;
          has_new_update: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          url: string;
          rss_url?: string | null;
          category?: string;
          notes?: string | null;
          has_new_update?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          url?: string;
          rss_url?: string | null;
          category?: string;
          notes?: string | null;
          has_new_update?: boolean;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          role: string;
          is_premium: boolean;
          trial_started_at: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string;
          is_premium?: boolean;
          trial_started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string;
          is_premium?: boolean;
          trial_started_at?: string | null;
          updated_at?: string;
        };
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

