// Types cho interaction_logs table
export interface InteractionLog {
  id: string;
  profile_id: string;
  user_id: string;
  content: string;
  interaction_type: "note" | "call" | "message" | "comment";
  created_at: string;
}

