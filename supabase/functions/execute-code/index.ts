// Supabase Edge Function: Secure JDoodle Code Execution Proxy
// Deployed at: /functions/v1/execute-code
//
// This function keeps JDoodle API credentials server-side (in Supabase Vault
// or Edge Function secrets) and never exposes them to the browser client.
// It also validates the incoming request shape before forwarding to JDoodle.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const JDOODLE_API_URL = 'https://api.jdoodle.com/v1/execute';

// Allowed languages to prevent abuse
const ALLOWED_LANGUAGES = new Set([
  'nodejs',    // TypeScript / JavaScript
  'python3',   // Python
  'java',      // Java
  'cpp',       // C++
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Read secrets from Deno environment (set via `supabase secrets set`)
    const clientId = Deno.env.get('JDOODLE_CLIENT_ID');
    const clientSecret = Deno.env.get('JDOODLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: JDoodle credentials not set.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate client payload
    const body = await req.json();
    const { script, language, versionIndex } = body;

    if (!script || typeof script !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "script" field.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!language || !ALLOWED_LANGUAGES.has(language)) {
      return new Response(
        JSON.stringify({ error: `Invalid language "${language}". Allowed: ${[...ALLOWED_LANGUAGES].join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce a maximum script size (64 KB) to prevent abuse
    if (script.length > 65536) {
      return new Response(
        JSON.stringify({ error: 'Script exceeds maximum allowed size (64 KB).' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Forward to JDoodle with server-side credentials
    const jdoodleResponse = await fetch(JDOODLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientSecret,
        script,
        language,
        versionIndex: versionIndex || '0',
      }),
    });

    const jdoodleData = await jdoodleResponse.json();

    return new Response(
      JSON.stringify(jdoodleData),
      {
        status: jdoodleResponse.ok ? 200 : jdoodleResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('execute-code error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error during code execution.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
