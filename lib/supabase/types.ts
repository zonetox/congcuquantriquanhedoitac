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
          is_in_feed: boolean | null;
          last_interacted_at: string | null;
          relationship_score: number | null;
          last_contacted_at: string | null; // Interaction Clock - khi user click Ice Breaker hoặc Copy
          notify_telegram_chat_id: string | null;
          notify_on_sales_opportunity: boolean | null;
          last_synced_at: string | null; // Module 4.1: Thời gian sync cuối cùng (Shared Scraping)
          created_at: string;
          updated_at: string | null;
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
          is_in_feed?: boolean;
          last_interacted_at?: string | null;
          relationship_score?: number;
          last_contacted_at?: string | null;
          notify_telegram_chat_id?: string | null;
          notify_on_sales_opportunity?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
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
          is_in_feed?: boolean;
          last_interacted_at?: string | null;
          relationship_score?: number;
          last_contacted_at?: string | null;
          notify_telegram_chat_id?: string | null;
          notify_on_sales_opportunity?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
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

