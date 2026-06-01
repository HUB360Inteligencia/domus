import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

type AppRole = "admin" | "manager" | "user" | "viewer" | "system_admin";

type ClientMembership = {
  client_id: string | null;
  role: string | null;
  is_primary: boolean | null;
};

type Actor = {
  id: string;
  email?: string;
  systemRole: AppRole | null;
  memberships: ClientMembership[];
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing required Supabase secrets for user-management");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders,
  });
}

function safeMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

function extractBearerToken(authHeader: string) {
  const [scheme, token] = authHeader.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new HttpError(401, "Invalid authorization header");
  }

  return token;
}

function normalizeRole(role?: string): Exclude<AppRole, "system_admin"> {
  const allowedRoles: Array<Exclude<AppRole, "system_admin">> = ["admin", "manager", "user", "viewer"];
  return allowedRoles.includes(role as Exclude<AppRole, "system_admin">)
    ? (role as Exclude<AppRole, "system_admin">)
    : "user";
}

function generateTemporaryPassword() {
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%*?";
  const all = lower + upper + digits + symbols;
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);

  const required = [
    lower[bytes[0] % lower.length],
    upper[bytes[1] % upper.length],
    digits[bytes[2] % digits.length],
    symbols[bytes[3] % symbols.length],
  ];

  const rest = Array.from(bytes.slice(4), (byte) => all[byte % all.length]);
  return [...required, ...rest].sort(() => crypto.getRandomValues(new Uint8Array(1))[0] - 128).join("");
}

async function getActor(req: Request): Promise<Actor> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    throw new HttpError(401, "Missing authorization header");
  }

  const { data: userData, error: userError } = await adminAuthClient.auth.getUser(extractBearerToken(authHeader));

  if (userError || !userData.user) {
    throw new HttpError(401, "Invalid or expired session");
  }

  const [roleResult, membershipsResult] = await Promise.all([
    adminAuthClient.rpc("get_user_role", { user_id: userData.user.id }),
    adminAuthClient
      .from("client_users")
      .select("client_id, role, is_primary")
      .eq("user_id", userData.user.id),
  ]);

  if (membershipsResult.error) {
    throw membershipsResult.error;
  }

  return {
    id: userData.user.id,
    email: userData.user.email,
    systemRole: (roleResult.data as AppRole | null) ?? null,
    memberships: (membershipsResult.data ?? []) as ClientMembership[],
  };
}

async function actorHasPermission(actor: Actor, permissionName: string) {
  if (actor.systemRole === "system_admin") {
    return true;
  }

  const { data, error } = await adminAuthClient.rpc("user_has_permission", {
    user_id: actor.id,
    permission_name: permissionName,
  });

  if (error) {
    console.error("[user-management] permission check failed:", error.message);
    return false;
  }

  return Boolean(data);
}

function actorHasClientRole(actor: Actor, clientId: string, roles: string[]) {
  if (actor.systemRole === "system_admin") {
    return true;
  }

  return actor.memberships.some((membership) =>
    membership.client_id === clientId && roles.includes(membership.role ?? "")
  );
}

async function requireSystemAdmin(actor: Actor) {
  if (actor.systemRole === "system_admin" || await actorHasPermission(actor, "admin_access")) {
    return;
  }

  throw new HttpError(403, "System administrator permission required");
}

async function requireClientViewer(actor: Actor, clientId: string) {
  if (actorHasClientRole(actor, clientId, ["admin", "manager"]) || await actorHasPermission(actor, "users.view")) {
    return;
  }

  throw new HttpError(403, "You do not have access to this organization");
}

async function requireClientAdmin(actor: Actor, clientId: string) {
  if (actorHasClientRole(actor, clientId, ["admin"]) || await actorHasPermission(actor, "users.invite")) {
    return;
  }

  throw new HttpError(403, "Organization administrator permission required");
}

async function getTargetClientIds(userId: string) {
  const { data, error } = await adminAuthClient
    .from("client_users")
    .select("client_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => row.client_id)
    .filter((clientId): clientId is string => Boolean(clientId));
}

async function requireCanAdminTargetUser(actor: Actor, targetUserId: string) {
  if (actor.systemRole === "system_admin") {
    return;
  }

  const clientIds = await getTargetClientIds(targetUserId);

  if (clientIds.some((clientId) => actorHasClientRole(actor, clientId, ["admin"]))) {
    return;
  }

  throw new HttpError(403, "You cannot manage this user");
}

async function createUser(userData: {
  email: string;
  password?: string;
  use_generic_password?: boolean;
  first_name?: string;
  last_name?: string;
  client_id: string;
  is_primary?: boolean;
  role?: string;
  must_change_password?: boolean;
}) {
  const role = normalizeRole(userData.role);
  const shouldGeneratePassword = userData.use_generic_password || !userData.password;
  const password = shouldGeneratePassword ? generateTemporaryPassword() : userData.password!;
  const mustChangePassword = userData.must_change_password ?? shouldGeneratePassword;

  const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
    email: userData.email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: userData.first_name,
      last_name: userData.last_name,
      must_change_password: mustChangePassword,
    },
  });

  if (authError) {
    return { error: authError };
  }

  if (!authData.user) {
    return { error: { message: "Failed to create user" } };
  }

  const { error: profileError } = await adminAuthClient
    .from("profiles")
    .update({
      first_name: userData.first_name || null,
      last_name: userData.last_name || null,
      email: userData.email,
    })
    .eq("id", authData.user.id);

  if (profileError) {
    console.error("[user-management] profile update failed:", profileError.message);
  }

  const { data: clientUserData, error: clientUserError } = await adminAuthClient
    .from("client_users")
    .insert({
      user_id: authData.user.id,
      client_id: userData.client_id,
      is_primary: userData.is_primary || false,
      role,
    })
    .select("*")
    .single();

  if (clientUserError) {
    await adminAuthClient.auth.admin.deleteUser(authData.user.id);
    return { error: clientUserError };
  }

  const { data: roleData, error: roleError } = await adminAuthClient
    .from("roles")
    .select("id")
    .eq("name", role)
    .maybeSingle();

  if (!roleError && roleData) {
    await adminAuthClient
      .from("user_roles")
      .insert({
        user_id: authData.user.id,
        role_id: roleData.id,
      });
  }

  return {
    data: {
      ...clientUserData,
      profile: {
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
      must_change_password: mustChangePassword,
      generated_password: shouldGeneratePassword ? password : undefined,
    },
  };
}

async function createOrganizationWithUser(orgData: {
  org_name: string;
  org_email: string;
  org_phone?: string;
  org_document_number?: string;
  user_email: string;
  user_password?: string;
  use_generic_password?: boolean;
  user_first_name?: string;
  user_last_name?: string;
  user_role?: string;
  must_change_password?: boolean;
}) {
  const { data: clientData, error: clientError } = await adminAuthClient
    .from("clients")
    .insert({
      name: orgData.org_name,
      email: orgData.org_email,
      phone: orgData.org_phone || null,
      document_number: orgData.org_document_number || null,
      is_active: true,
    })
    .select("*")
    .single();

  if (clientError) {
    return { error: clientError };
  }

  const userResult = await createUser({
    email: orgData.user_email,
    password: orgData.user_password,
    use_generic_password: orgData.use_generic_password,
    first_name: orgData.user_first_name,
    last_name: orgData.user_last_name,
    client_id: clientData.id,
    is_primary: true,
    role: orgData.user_role || "admin",
    must_change_password: orgData.must_change_password,
  });

  if (userResult.error) {
    await adminAuthClient.from("clients").delete().eq("id", clientData.id);
    return { error: userResult.error };
  }

  return {
    data: {
      client: clientData,
      user: userResult.data,
    },
  };
}

async function resetPassword(data: { user_id: string; password: string }) {
  const { error } = await adminAuthClient.auth.admin.updateUserById(
    data.user_id,
    {
      password: data.password,
      user_metadata: { must_change_password: true },
    },
  );

  if (error) {
    return { error };
  }

  return { data: { success: true } };
}

async function clearMustChangePassword(userId: string) {
  const { error } = await adminAuthClient.auth.admin.updateUserById(
    userId,
    { user_metadata: { must_change_password: false } },
  );

  if (error) {
    return { error };
  }

  return { data: { success: true } };
}

async function getClientUsers(clientId: string) {
  const { data: clientUsers, error: clientUsersError } = await adminAuthClient
    .from("client_users")
    .select("*")
    .eq("client_id", clientId);

  if (clientUsersError) {
    return { error: clientUsersError };
  }

  if (!clientUsers || clientUsers.length === 0) {
    return { data: [] };
  }

  const userIds = clientUsers
    .map((clientUser) => clientUser.user_id)
    .filter((userId): userId is string => Boolean(userId));

  const { data: profiles, error: profilesError } = await adminAuthClient
    .from("profiles")
    .select("id, first_name, last_name, email, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    console.error("[user-management] profile fetch failed:", profilesError.message);
  }

  return {
    data: clientUsers.map((clientUser) => ({
      ...clientUser,
      profiles: profiles?.find((profile) => profile.id === clientUser.user_id) || null,
    })),
  };
}

async function changeOwnPassword(data: { user_id: string; new_password: string }, actor: Actor) {
  if (data.user_id !== actor.id) {
    throw new HttpError(403, "You can only change your own password");
  }

  const { error } = await adminAuthClient.auth.admin.updateUserById(actor.id, { password: data.new_password });

  if (error) {
    return { error };
  }

  return clearMustChangePassword(actor.id);
}

async function generateToken(userId: string) {
  const token = crypto.randomUUID();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  const { error } = await adminAuthClient
    .from("profiles")
    .update({
      activation_token: token,
      activation_token_expires_at: expires.toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { error };
  }

  return { data: { token } };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const actor = await getActor(req);
    const requestData = await req.json();
    const action = requestData.action;

    let result;

    if (action === "createUser") {
      if (!requestData.userData?.client_id || !requestData.userData?.email) {
        throw new HttpError(400, "Missing required fields for createUser");
      }
      await requireClientAdmin(actor, requestData.userData.client_id);
      result = await createUser(requestData.userData);
    } else if (action === "createOrganizationWithUser") {
      await requireSystemAdmin(actor);
      result = await createOrganizationWithUser(requestData.orgData);
    } else if (action === "resetPassword") {
      if (!requestData.data?.user_id || !requestData.data?.password) {
        throw new HttpError(400, "Missing required fields for resetPassword");
      }
      await requireCanAdminTargetUser(actor, requestData.data.user_id);
      result = await resetPassword(requestData.data);
    } else if (action === "changeOwnPassword") {
      if (!requestData.data?.user_id || !requestData.data?.new_password) {
        throw new HttpError(400, "Missing required fields for changeOwnPassword");
      }
      result = await changeOwnPassword(requestData.data, actor);
    } else if (action === "generateToken") {
      if (!requestData.userId) {
        throw new HttpError(400, "Missing userId for generateToken");
      }
      await requireCanAdminTargetUser(actor, requestData.userId);
      result = await generateToken(requestData.userId);
    } else if (action === "getClientUsers") {
      if (!requestData.client_id) {
        throw new HttpError(400, "Missing client_id for getClientUsers");
      }
      await requireClientViewer(actor, requestData.client_id);
      result = await getClientUsers(requestData.client_id);
    } else if (action === "clearMustChangePassword") {
      if (!requestData.userId) {
        throw new HttpError(400, "Missing userId for clearMustChangePassword");
      }
      if (requestData.userId !== actor.id) {
        await requireCanAdminTargetUser(actor, requestData.userId);
      }
      result = await clearMustChangePassword(requestData.userId);
    } else {
      throw new HttpError(400, `Unknown action: ${action}`);
    }

    return jsonResponse(result, result.error ? 400 : 200);
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonResponse({ error: { message: error.message } }, error.status);
    }

    console.error("[user-management] request failed:", safeMessage(error));
    return jsonResponse({ error: { message: "Internal server error" } }, 500);
  }
});
