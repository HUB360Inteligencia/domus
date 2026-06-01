import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadDotEnv() {
  try {
    const content = readFileSync('.env', 'utf8');

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const index = trimmed.indexOf('=');
      if (index === -1) continue;

      const key = trimmed.slice(0, index).trim();
      const value = parseEnvValue(trimmed.slice(index + 1));

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // CI can provide env vars directly.
  }
}

function parseEnvValue(value) {
  const trimmed = value.trim();
  const isQuoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return isQuoted ? trimmed.slice(1, -1) : trimmed;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function optionalEnv(name) {
  return parseEnvValue(process.env[name] || '');
}

function isEmail(value) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

async function check(label, fn) {
  try {
    await fn();
    console.log(`[ok] ${label}`);
    return true;
  } catch (error) {
    console.error(`[fail] ${label}: ${error.message}`);
    return false;
  }
}

async function warn(label, fn) {
  try {
    await fn();
    console.log(`[ok] ${label}`);
  } catch (error) {
    console.warn(`[warn] ${label}: ${error.message}`);
  }
}

loadDotEnv();

const supabaseUrl = requireEnv('VITE_SUPABASE_URL');
const supabaseKey = requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY');
const testEmail = optionalEnv('TEST_USER_EMAIL');
const testPassword = optionalEnv('TEST_USER_PASSWORD');
const testClientId = optionalEnv('TEST_CLIENT_ID');
const requireMigration = optionalEnv('REQUIRE_MIGRATION') === '1';
const requireAuthSmoke = optionalEnv('REQUIRE_AUTH_SMOKE') === '1';

let failures = 0;

const healthOk = await check('Supabase auth health endpoint reachable', async () => {
  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      apikey: supabaseKey,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
});

if (!healthOk) failures += 1;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

if (requireMigration) {
  const migrationOk = await check('required hardening RPCs are installed', async () => {
    const { error } = await supabase.rpc('is_current_user_system_admin');
    if (error) throw error;
  });

  if (!migrationOk) failures += 1;
}

const unauthenticatedEdgeOk = await check('user-management rejects unauthenticated requests', async () => {
  const response = await fetch(`${supabaseUrl}/functions/v1/user-management`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      action: 'getClientUsers',
      client_id: '00000000-0000-0000-0000-000000000000',
    }),
  });

  if (response.status !== 401) {
    throw new Error(`Expected HTTP 401, got ${response.status}`);
  }
});

if (!unauthenticatedEdgeOk) failures += 1;

if (!testEmail || !testPassword) {
  const message = 'Authenticated checks need TEST_USER_EMAIL and TEST_USER_PASSWORD';
  if (requireAuthSmoke) {
    console.error(`[fail] ${message}`);
    failures += 1;
  } else {
    console.warn(`[skip] ${message}`);
  }
} else if (!isEmail(testEmail)) {
  console.error('[fail] TEST_USER_EMAIL must be a real email address');
  failures += 1;
} else {
  let userId = '';
  let accessToken = '';

  const authOk = await check('Test user can sign in', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (error) throw error;
    if (!data.session) throw new Error('No session returned');
    if (!data.user?.id) throw new Error('No user returned');

    userId = data.user.id;
    accessToken = data.session.access_token;
  });

  if (!authOk) failures += 1;

  if (authOk) {
    let resolvedClientId = testClientId;
    let resolvedClientRole = '';

    await warn('Own profile is readable', async () => {
      const { error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
    });

    if (!resolvedClientId) {
      await warn('Infer TEST_CLIENT_ID from signed-in membership', async () => {
        const { data, error } = await supabase
          .from('client_users')
          .select('client_id, role')
          .eq('user_id', userId)
          .not('client_id', 'is', null)
          .limit(1);

        if (error) throw error;

        const inferredClientId = data?.[0]?.client_id;
        if (!inferredClientId) {
          throw new Error('No client_users membership found for signed-in user');
        }

        resolvedClientId = inferredClientId;
        resolvedClientRole = data[0]?.role || '';
        console.log(`[info] inferred TEST_CLIENT_ID=${resolvedClientId}`);
      });
    }

    if (!resolvedClientId) {
      const message = 'Client-scoped checks need TEST_CLIENT_ID';
      if (requireAuthSmoke) {
        console.error(`[fail] ${message}`);
        failures += 1;
      } else {
        console.warn(`[skip] ${message}`);
      }
    } else {
      const roleOk = await check('current_user_role RPC responds for signed-in user', async () => {
        const { error } = await supabase.rpc('current_user_role');
        if (error) throw error;
      });

      if (!roleOk) failures += 1;

      const membershipOk = await check('client_users membership is readable under RLS', async () => {
        const { data, error } = await supabase
          .from('client_users')
          .select('id, user_id, client_id, role, is_primary')
          .eq('client_id', resolvedClientId)
          .limit(10);

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('No readable client_users rows for TEST_CLIENT_ID');
        }

        const ownMembership = data.find((row) => row.user_id === userId) || data[0];
        resolvedClientRole = resolvedClientRole || ownMembership.role || '';
      });

      if (!membershipOk) failures += 1;

      const clientOk = await check('Client record is readable under RLS', async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('id, name')
          .eq('id', resolvedClientId)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('No readable clients row for TEST_CLIENT_ID');
      });

      if (!clientOk) failures += 1;

      const edgeOk = await check('user-management getClientUsers authorization behaves correctly', async () => {
        const response = await fetch(`${supabaseUrl}/functions/v1/user-management`, {
          method: 'POST',
          headers: {
            apikey: supabaseKey,
            authorization: `Bearer ${accessToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getClientUsers',
            client_id: resolvedClientId,
          }),
        });

        if (response.ok) return;

        const canListClientUsers = ['admin', 'manager'].includes(resolvedClientRole);
        if (response.status === 403 && !canListClientUsers) {
          console.log(`[info] getClientUsers blocked for role=${resolvedClientRole || 'unknown'} as expected`);
          return;
        }

        throw new Error(`HTTP ${response.status}`);
      });

      if (!edgeOk) failures += 1;
    }

    const readOnlyTables = [
      ['properties', 'id, title, client_id, user_id'],
      ['contracts', 'id, tenant_name, client_id, user_id'],
      ['documents', 'id, name, client_id, user_id'],
      ['financial_transactions', 'id, description, user_id, transaction_date'],
      ['financial_categories', 'id, name, user_id, is_default'],
    ];

    for (const [tableName, columns] of readOnlyTables) {
      const tableOk = await check(`${tableName} read path works under RLS`, async () => {
        const { error } = await supabase.from(tableName).select(columns).limit(1);
        if (error) throw error;
      });

      if (!tableOk) failures += 1;
    }

    await supabase.auth.signOut();
  }
}

if (failures > 0) {
  console.error(`Smoke test failed with ${failures} blocking check(s).`);
  process.exit(1);
}

console.log('Smoke test completed.');
