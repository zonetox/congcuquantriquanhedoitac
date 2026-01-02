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
  last_interacted_at?: string | null; // Ngày tương tác cuối cùng (CRM Module)
  relationship_score?: number | null; // Điểm sức khỏe mối quan hệ (0-100) (CRM Module)
  last_contacted_at?: string | null; // Thời gian liên hệ cuối cùng (khi user click Ice Breaker hoặc Copy) - Interaction Clock
  notify_telegram_chat_id?: string | null; // Telegram Chat ID để nhận thông báo (Module 3)
  notify_on_sales_opportunity?: boolean | null; // Có nhận cảnh báo Sales Opportunity không (Module 3)
  created_at: string;
  updated_at?: string | null;
}

