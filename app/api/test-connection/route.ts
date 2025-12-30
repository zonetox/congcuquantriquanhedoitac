import { testConnection } from "@/lib/supabase/helpers";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await testConnection();
  
  if (result.success) {
    return NextResponse.json({
      ...result,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString(),
    });
  }
  
  return NextResponse.json(
    {
      ...result,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "Chưa cấu hình",
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}
