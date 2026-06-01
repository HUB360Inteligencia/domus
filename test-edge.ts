import { getSupabaseClient, requireEnv } from './test-env';

const supabase = getSupabaseClient();
const clientId = requireEnv('TEST_CLIENT_ID');

async function test() {
  console.log("Invoking edge function; expected result is 401/403 unless authenticated session exists");
  const { data, error } = await supabase.functions.invoke("user-management", {
    body: {
      action: "getClientUsers",
      client_id: clientId
    }
  });

  console.log("INVOKE FETCH ERROR:", error);
  console.log("INVOKE FETCH DATA:", JSON.stringify(data, null, 2));
}

test();
