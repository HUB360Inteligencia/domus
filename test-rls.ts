import { getSupabaseClient, requireEnv } from './test-env';

const supabase = getSupabaseClient();
const testEmail = requireEnv('TEST_USER_EMAIL');
const testPassword = requireEnv('TEST_USER_PASSWORD');
const testClientId = requireEnv('TEST_CLIENT_ID');

async function test() {
  const { data: user, error: userError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  console.log("LOGIN:", userError ? userError : "OK");

  if (user.session) {
    const { data: clientUsers, error: cuError } = await supabase
      .from("client_users")
      .select('id, user_id, client_id, is_primary, role')
      .eq("client_id", testClientId);

    console.log("CLIENT USERS FETCH:", cuError ? cuError : clientUsers);
  }
}

test();
