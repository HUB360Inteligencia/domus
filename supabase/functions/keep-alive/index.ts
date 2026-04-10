import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const timestamp = new Date().toISOString()
  console.log(`[keep-alive] Ping at ${timestamp}`)

  return new Response(
    JSON.stringify({ status: 'alive', timestamp }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
  )
})
