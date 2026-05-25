import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required Supabase secrets for keep-alive function')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const jsonHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: jsonHeaders,
      status: 405,
    })
  }

  const startedAt = Date.now()
  const source = req.headers.get('x-keep-alive-source') ?? 'unknown'

  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { head: true, count: 'exact' })

    if (error) {
      throw error
    }

    const timestamp = new Date().toISOString()
    const durationMs = Date.now() - startedAt

    console.log(`[keep-alive] source=${source} count=${count ?? 0} at=${timestamp} durationMs=${durationMs}`)

    return new Response(
      JSON.stringify({
        ok: true,
        status: 'alive',
        source,
        touched: 'profiles',
        profileCount: count ?? 0,
        timestamp,
        durationMs,
      }),
      {
        headers: jsonHeaders,
        status: 200,
      },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown keep-alive error'

    console.error(`[keep-alive] failure source=${source}: ${message}`)

    return new Response(JSON.stringify({ ok: false, error: message, source }), {
      headers: jsonHeaders,
      status: 500,
    })
  }
})
