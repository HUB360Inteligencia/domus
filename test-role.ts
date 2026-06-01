import { getSupabaseClient, requireEnv } from './test-env';

const supabase = getSupabaseClient();
const testEmail = requireEnv('TEST_USER_EMAIL');
const testPassword = requireEnv('TEST_USER_PASSWORD');

async function check() {
  const { data: user, error: userError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (userError || !user.user) {
    console.log("LOGIN:", userError);
    return;
  }

  const { data: role, error: roleError } = await supabase.rpc("get_user_role", {
    user_id: user.user.id,
  });

  console.log("ROLE:", roleError || role);
}

check();
