import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SignupRequest = {
  signup_interest_id?: number;
  name?: string;
  email?: string;
  role?: "student" | "parent" | "teacher" | "admin";
  instrument?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-approval-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function displayNameFromEmail(email: string) {
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find(item => item.email?.toLowerCase() === target);
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
}

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const approvalSecret = requiredEnv("APPROVAL_SECRET");
  if (request.headers.get("x-approval-secret") !== approvalSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const siteUrl = Deno.env.get("SITE_URL") || "https://theschoolofjazz.com/portal.html";
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  let payload: SignupRequest;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email) return jsonResponse({ error: "Email is required" }, 400);

  const fullName = payload.name?.trim() || displayNameFromEmail(email);
  const role = payload.role || "student";
  const username = fullName;
  const instrument = payload.instrument || null;

  try {
    let user = await findAuthUserByEmail(adminClient, email);

    if (!user) {
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
          username,
          role,
          instrument
        },
        redirectTo: siteUrl
      });
      if (error) throw error;
      user = data.user;
    }

    if (!user) throw new Error("Auth user could not be created or found.");

    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: user.id,
        email,
        full_name: fullName,
        username,
        role,
        instrument
      }, { onConflict: "id" });
    if (profileError) throw profileError;

    if (payload.signup_interest_id) {
      const { error: signupError } = await adminClient
        .from("signup_interests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString()
        })
        .eq("id", payload.signup_interest_id);
      if (signupError) throw signupError;
    }

    return jsonResponse({
      ok: true,
      auth_user_id: user.id,
      email,
      profile_role: role
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      error: "Approval failed",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
