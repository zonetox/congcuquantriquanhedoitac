// Types cho profiles_tracked table
export interface Profile {
  id: string;
  user_id: string;
  title: string;
  url: string;
  rss_url?: string | null;
  category?: string | null;
  notes?: string | null;
  has_new_update?: boolean | null;
  is_in_feed?: boolean | null; // User có muốn đưa profile này vào Newsfeed không
  created_at: string;
}

