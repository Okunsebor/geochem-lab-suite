import { createServerFn } from "@tanstack/react-start";
import { getServerSupabase } from "./supabase-server";

export const getSessionFromServer = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    return { session: null, error: error.message };
  }
  
  return { session: data.session, error: null };
});

export const getUserProfileFromServer = createServerFn({ method: "GET" })
  .handler(async (): Promise<{ profile: { role: string } | null }> => {
    const supabase = getServerSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { profile: null };

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
      
    return { profile: profile as { role: string } | null };
  });
