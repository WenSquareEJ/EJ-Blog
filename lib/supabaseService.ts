import { createClient } from "@supabase/supabase-js";

export function getServiceClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables");
  }
  
  return createClient(url, key, { 
    auth: { persistSession: false }
  });
}
