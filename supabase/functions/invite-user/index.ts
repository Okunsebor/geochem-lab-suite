// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapUiRoleToDb(role: string): string {
  switch (role) {
    case "Admin":
      return "admin";
    case "Lab Coordinator":
      return "manager";
    case "Customer":
    default:
      return "customer";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { name, email, role } = await req.json();

    if (!name || !email || !role) {
      throw new Error("Missing required fields");
    }

    // 1. Verify caller is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || String(profile.role).toLowerCase() !== "admin") {
      throw new Error("Only an Admin can invite new users.");
    }

    // 2. Extract first name & generate default password
    const firstName = name.split(" ")[0].toLowerCase();
    const generatedPassword = `${firstName}@unipod`;
    const dbRole = mapUiRoleToDb(role);

    // 3. Create auth user using admin client
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: dbRole,
      }
    });

    if (createError) throw createError;

    const newUserId = authData.user.id;

    try {
      // 4. Insert into public.users table (UPSERT in case trigger already inserted it)
      const { error: insertError } = await supabaseAdmin.from("users").upsert({
        id: newUserId,
        full_name: name,
        role: dbRole,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (insertError) throw insertError;

      // 5. Send custom onboarding email via notification_emails table
      const emailBody = `Welcome to GeoChem Suite, ${name}.

Your institutional account has been created by your administrator. You now have access to the GeoChem Suite laboratory management platform at UniPod Innovation Hub, Nasarawa State University.

Login Email: ${email.trim()}
Temporary Password: ${generatedPassword}
Access URL: https://geochem-lab-suite.vercel.app

For your security, we strongly recommend changing your password after your first login. You can do this by going to your profile settings after signing in. Your account will remain fully active with this temporary password until you choose to update it.

Your account has been assigned the ${role} role. If you believe this is incorrect, please contact your administrator.

If you have any questions about accessing the platform, please reach out to your laboratory administrator directly.

The GeoChem Suite Team, UniPod Innovation Hub.`;

      const { error: emailErr } = await supabaseAdmin.from("notification_emails").insert({
        recipient_user_id: newUserId,
        recipient_email: email.trim(),
        subject: "Your GeoChem Suite Access is Ready",
        body: emailBody,
        status: "queued",
      });

      if (emailErr) throw emailErr;

    } catch (err: any) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`Failed during user setup: ${err.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
