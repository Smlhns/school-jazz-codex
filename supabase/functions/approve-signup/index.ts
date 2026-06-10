import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SignupRequest = {
  approval_secret?: string;
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

function isExistingUserError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String(error.message).toLowerCase() : "";
  const code = "code" in error ? String(error.code).toLowerCase() : "";
  return code.includes("user_already_exists")
    || message.includes("already")
    || message.includes("registered")
    || message.includes("exists");
}

const starterPassword = "SchoolOfJazz2026";

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

  let payload: SignupRequest;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const approvalSecret = requiredEnv("APPROVAL_SECRET");
  const requestSecret = request.headers.get("x-approval-secret") || payload.approval_secret;
  if (requestSecret !== approvalSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = payload.email?.trim().toLowerCase();
  if (!email) return jsonResponse({ error: "Email is required" }, 400);

  const fullName = payload.name?.trim() || displayNameFromEmail(email);
  const role = payload.role || "student";
  const username = fullName;
  const instrument = payload.instrument || null;

  try {
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: starterPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username,
        role,
        instrument
      }
    });

    let user = created.user;

    if (createError) {
      if (!isExistingUserError(createError)) throw createError;
      user = await findAuthUserByEmail(adminClient, email);
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
