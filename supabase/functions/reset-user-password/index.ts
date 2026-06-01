import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase secrets for reset-user-password");
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function extractBearerToken(authHeader: string) {
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

async function assertCanResetPassword(req: Request, targetUserId: string) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return { ok: false, status: 401, message: "Missing authorization header" };
  }

  const token = extractBearerToken(authHeader);

  if (!token) {
    return { ok: false, status: 401, message: "Invalid authorization header" };
  }

  const { data: userData, error: userError } = await adminClient.auth.getUser(token);

  if (userError || !userData.user) {
    return { ok: false, status: 401, message: "Invalid or expired session" };
  }

  const { data: role } = await adminClient.rpc("get_user_role", { user_id: userData.user.id });

  if (role === "system_admin") {
    return { ok: true, status: 200, message: "" };
  }

  const [{ data: actorClients, error: actorError }, { data: targetClients, error: targetError }] = await Promise.all([
    adminClient
      .from("client_users")
      .select("client_id, role")
      .eq("user_id", userData.user.id),
    adminClient
      .from("client_users")
      .select("client_id")
      .eq("user_id", targetUserId),
  ]);

  if (actorError || targetError) {
    return { ok: false, status: 500, message: "Unable to verify authorization" };
  }

  const targetClientIds = new Set((targetClients ?? []).map((row) => row.client_id));
  const canManage = (actorClients ?? []).some((row) =>
    row.role === "admin" && row.client_id && targetClientIds.has(row.client_id)
  );

  if (!canManage) {
    return { ok: false, status: 403, message: "Organization administrator permission required" };
  }

  return { ok: true, status: 200, message: "" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { user_id, password } = await req.json();

    if (!user_id || !password) {
      return jsonResponse({ error: "Missing user_id or password" }, 400);
    }

    const authz = await assertCanResetPassword(req, user_id);

    if (!authz.ok) {
      return jsonResponse({ error: authz.message }, authz.status);
    }

    const { error } = await adminClient.auth.admin.updateUserById(user_id, {
      password,
      user_metadata: { must_change_password: true },
    });

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("[reset-user-password] request failed:", error instanceof Error ? error.message : error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
