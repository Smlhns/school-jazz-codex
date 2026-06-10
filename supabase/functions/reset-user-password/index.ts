import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ResetPasswordRequest = {
  approval_secret?: string;
  email?: string;
  password?: string;
};

const starterPassword = "SchoolOfJazz2026";

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

  let payload: ResetPasswordRequest;
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

  const email = payload.email?.trim().toLowerCase();
  if (!email) return jsonResponse({ error: "Email is required" }, 400);

  const nextPassword = payload.password?.trim() || starterPassword;
  if (nextPassword.length < 6) {
    return jsonResponse({ error: "Password must be at least six characters" }, 400);
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const user = await findAuthUserByEmail(adminClient, email);
    if (!user) return jsonResponse({ error: "User not found" }, 404);

    const { error } = await adminClient.auth.admin.updateUserById(user.id, {
      password: nextPassword
    });
    if (error) throw error;

    return jsonResponse({
      ok: true,
      auth_user_id: user.id,
      email
    });
  } catch (error) {
    console.error(error);
    return jsonResponse({
      error: "Password reset failed",
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
