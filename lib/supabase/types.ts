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
          locale: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string;
          is_premium?: boolean;
          trial_started_at?: string | null;
          locale?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string;
          is_premium?: boolean;
          trial_started_at?: string | null;
          locale?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_user_id?: string | null;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_user_id?: string | null;
          details?: Json | null;
          created_at?: string;
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

