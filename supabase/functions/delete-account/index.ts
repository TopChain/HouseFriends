import { createClient } from 'npm:@supabase/supabase-js@2.112.3';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required.' }, 401);
    const body = await request.json();
    if (body.confirm !== 'DELETE MY ACCOUNT') return json({ error: 'Explicit deletion confirmation is required.' }, 400);

    const url = Deno.env.get('SUPABASE_URL');
    const secret = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !secret) return json({ error: 'Server configuration is incomplete.' }, 500);
    const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
    const token = authorization.slice('Bearer '.length);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json({ error: 'Session is invalid or expired.' }, 401);

    const { data: paths, error: cleanupError } = await admin.rpc('execute_account_deletion', { p_user_id: authData.user.id });
    if (cleanupError) throw cleanupError;
    if (Array.isArray(paths) && paths.length > 0) await admin.storage.from('experience-media-pending').remove(paths);
    const { error: deleteError } = await admin.auth.admin.deleteUser(authData.user.id, false);
    if (deleteError) throw deleteError;
    return json({ status: 'deleted' }, 200);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Account deletion failed.' }, 500);
  }
});

function json(value: unknown, status: number) {
  return new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
