import { createClient } from 'npm:@supabase/supabase-js@2.112.3';

Deno.serve(async (request) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ error: 'Authentication required.' }, 401);
  const url = Deno.env.get('SUPABASE_URL');
  const secret = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !secret) return response({ error: 'Server configuration is incomplete.' }, 500);
  const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
  const token = authorization.slice('Bearer '.length);
  const { data: userData } = await admin.auth.getUser(token);
  if (!userData.user) return response({ error: 'Invalid session.' }, 401);

  // Deliberately fail closed until the production moderation/re-encoding worker is connected.
  // Pending files remain private; no client can mark metadata_stripped or publish an approved path.
  return response({ status: 'queued', message: 'Media remains private pending server-side safety processing.' }, 202);
});

function response(value: unknown, status: number) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}
