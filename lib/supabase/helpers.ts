import { createClient } from "./server";

/**
 * Test Supabase connection
 */
export async function testConnection() {
  try {
    const supabase = await createClient();
    
    // Simple connection test
    const { error } = await supabase.from("_realtime").select("id").limit(1);
    
    if (error && error.code !== "PGRST116") {
      // PGRST116 means table doesn't exist, which is fine for connection test
      throw error;
    }
    
    return {
      success: true,
      message: "Kết nối Supabase thành công!",
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Lỗi kết nối Supabase",
      error: error.message,
    };
  }
}

/**
 * Get current user session
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user
 */
export async function getUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    
    // If there's an error, return null instead of throwing
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[getUser] Auth error:", error);
      }
      return null;
    }
    
    return user;
  } catch (error) {
    // Catch any unexpected errors and return null
    if (process.env.NODE_ENV === "development") {
      console.error("[getUser] Unexpected error:", error);
    }
    return null;
  }
}

