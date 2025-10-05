"use client";

import { createContext, useContext, useMemo } from "react";
import { createClientComponentClient, SupabaseClient } from "@supabase/auth-helpers-nextjs";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function useSupabase() {
  const client = useContext(SupabaseContext);
  if (!client) throw new Error("Supabase client not found in context");
  return client;
}

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}
