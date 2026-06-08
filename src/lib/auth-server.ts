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
  .handler(async ({ data: userId }: { data: string }) => {
    const supabase = getServerSupabase();
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
      
    return { profile };
  });
