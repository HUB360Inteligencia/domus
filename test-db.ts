import { getSupabaseClient } from './test-env';

const supabase = getSupabaseClient();

async function test() {
  const { data: clientUsers, error: cuError } = await supabase.from('client_users').select('*');
  console.log("CLIENT_USERS ERROR:", cuError);
  console.log("CLIENT_USERS:", JSON.stringify(clientUsers, null, 2));

  const { data: userRoles, error: urError } = await supabase.from('user_roles').select('*, roles(name)');
  console.log("USER_ROLES ERROR:", urError);
  console.log("USER_ROLES:", JSON.stringify(userRoles, null, 2));
}

test();
