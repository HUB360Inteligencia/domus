import { getSupabasePublishableKey, getSupabaseUrl, requireEnv } from './test-env';

const supabaseUrl = getSupabaseUrl();
const publishableKey = getSupabasePublishableKey();
const clientId = requireEnv('TEST_CLIENT_ID');

async function test() {
  console.log("Invoking edge function with anon credentials; expected result is 401/403 unless TEST_AUTH_TOKEN is set");

  const response = await fetch(`${supabaseUrl}/functions/v1/user-management`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TEST_AUTH_TOKEN || publishableKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: "getClientUsers",
      client_id: clientId
    })
  });

  console.log("INVOKE FETCH STATUS:", response.status);
  const data = await response.json();
  console.log("INVOKE FETCH DATA:", JSON.stringify(data, null, 2));
}

test();
