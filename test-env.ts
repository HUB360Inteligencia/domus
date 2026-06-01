import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function parseEnvValue(value: string) {
  const trimmed = value.trim();
  const isQuoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return isQuoted ? trimmed.slice(1, -1) : trimmed;
}

const envFile = (() => {
  try {
    return Object.fromEntries(
      readFileSync('.env', 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), parseEnvValue(line.slice(index + 1))];
        }),
    );
  } catch {
    return {} as Record<string, string>;
  }
})();

export function getEnv(name: string) {
  return process.env[name] || envFile[name];
}

export function requireEnv(name: string) {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export function getSupabaseUrl() {
  return requireEnv('VITE_SUPABASE_URL');
}

export function getSupabasePublishableKey() {
  return requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY');
}

export function getSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabasePublishableKey());
}
