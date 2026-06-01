import { getSupabaseClient } from './test-env';

const supabase = getSupabaseClient();

async function test() {
  const { data, error } = await supabase.from('user_roles').select('*').limit(1);
  console.log("SCHEMA DATA:", data);
  console.log("SCHEMA ERROR:", error);

  const { data: roles, error: rolesError } = await supabase.from('roles').select('*').limit(5);
  console.log("ROLES:", roles);
  console.log("ROLES ERROR:", rolesError);
}

test();
