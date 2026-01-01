"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { hasValidPremiumAccess } from "@/lib/membership";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

/**
 * Lấy tất cả categories của user hiện tại
 */
export async function getCategories(): Promise<{
  data: Category[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: "You need to sign in to view categories.",
    };
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data as Category[],
    error: null,
  };
}

/**
 * Tạo category mới
 */
export async function createCategory(
  name: string,
  color: string = "#3b82f6"
): Promise<{
  data: Category | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: "You need to sign in to create categories.",
    };
  }

  // Logic mới: Tất cả users đều có thể tạo unlimited categories (full features)

  // Kiểm tra duplicate name
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", name.trim())
    .single();

  if (existing) {
    return {
      data: null,
      error: "A category with this name already exists.",
    };
  }

  // Tạo category mới
  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: name.trim(),
      color: color,
    })
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/");

  return {
    data: data as Category,
    error: null,
  };
}

/**
 * Cập nhật category
 */
export async function updateCategory(
  categoryId: string,
  name?: string,
  color?: string
): Promise<{
  data: Category | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: "You need to sign in to update categories.",
    };
  }

  const updateData: { name?: string; color?: string } = {};
  if (name !== undefined) updateData.name = name.trim();
  if (color !== undefined) updateData.color = color;

  // Kiểm tra duplicate name nếu đang update name
  if (name) {
    const { data: existing } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", name.trim())
      .neq("id", categoryId)
      .single();

    if (existing) {
      return {
        data: null,
        error: "A category with this name already exists.",
      };
    }
  }

  const { data, error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", categoryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/");

  return {
    data: data as Category,
    error: null,
  };
}

/**
 * Xóa category
 */
export async function deleteCategory(categoryId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "You need to sign in to delete categories.",
    };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/");

  return {
    success: true,
    error: null,
  };
}

