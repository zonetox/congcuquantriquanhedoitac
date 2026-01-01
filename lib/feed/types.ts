// Types cho profile_posts table
export interface FeedPost {
  id: string;
  profile_id: string;
  user_id: string;
  content: string | null;
  post_url: string | null;
  image_url: string | null;
  published_at: string | null;
  ai_analysis: any | null;
  ai_suggestions: any | null;
  created_at: string;
  profile_title?: string;
  profile_url?: string;
}
