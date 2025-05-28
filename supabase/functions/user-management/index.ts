
// Follow Deno runtime API: https://deno.com/manual/runtime/http_server_apis
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

// Initialize Supabase client with service_role key
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Supabase client with service role key
const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Service function to create a new user
async function createUser(userData: {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  client_id: string;
  is_primary?: boolean;
  role?: string;
}) {
  console.log("Creating user:", userData.email);

  try {
    // Step 1: Create the user in auth.users
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
      },
    });

    if (authError) {
      console.error("Auth error:", authError);
      return { error: authError };
    }

    if (!authData.user) {
      return { error: { message: "Failed to create user" } };
    }

    // Step 2: Create entry in client_users table
    const { data: clientUserData, error: clientUserError } = await adminAuthClient
      .from("client_users")
      .insert({
        user_id: authData.user.id,
        client_id: userData.client_id,
        is_primary: userData.is_primary || false,
        role: userData.role || "user",
      })
      .select("*")
      .single();

    if (clientUserError) {
      console.error("Client user error:", clientUserError);
      // Cleanup: If there was an error, delete the auth user we just created
      await adminAuthClient.auth.admin.deleteUser(authData.user.id);
      return { error: clientUserError };
    }

    return {
      data: {
        ...clientUserData,
        profile: {
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
        },
      },
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error };
  }
}

// Service function to reset user password
async function resetPassword(data: { user_id: string; password: string }) {
  console.log("Resetting password for user:", data.user_id);

  try {
    const { error } = await adminAuthClient.auth.admin.updateUserById(
      data.user_id,
      { password: data.password }
    );

    if (error) {
      console.error("Reset password error:", error);
      return { error };
    }

    return { data: { success: true } };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error };
  }
}

// Service function to generate activation token
async function generateToken(userId: string) {
  console.log("Generating activation token for user:", userId);

  try {
    const token = crypto.randomUUID();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token valid for 24 hours
    
    const { error } = await adminAuthClient
      .from("profiles")
      .update({
        activation_token: token,
        activation_token_expires_at: expires.toISOString()
      })
      .eq("id", userId);
    
    if (error) {
      console.error("Token generation error:", error);
      return { error };
    }
    
    return { data: { token } };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  // Get the current authenticated user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Get action and request body
  try {
    const requestData = await req.json();
    const action = requestData.action;

    let result;
    
    switch (action) {
      case "createUser":
        result = await createUser(requestData.userData);
        break;
      case "resetPassword":
        result = await resetPassword(requestData.data);
        break;
      case "generateToken":
        result = await generateToken(requestData.userId);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    // Return result
    return new Response(
      JSON.stringify(result),
      {
        status: result.error ? 400 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Request processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
