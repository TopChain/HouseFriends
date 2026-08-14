import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../neon/migrations/0001_initial_housefriends.sql',import.meta.url),'utf8');
const publicTables=[...sql.matchAll(/create table public\.([a-z_]+)/g)].map((match)=>match[1]);

test('every exposed public table enables row level security',()=>{for(const table of publicTables) assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security;`),`missing RLS: ${table}`);});
test('all 35 canonical categories are seeded once',()=>{const seed=sql.slice(sql.indexOf("insert into public.service_categories"),sql.indexOf("insert into public.country_feature_gates"));assert.equal((seed.match(/\('[a-z0-9-]+',\d+,/g)??[]).length,35);});
test('authorization never relies on user-editable metadata',()=>{assert.doesNotMatch(sql,/raw_user_meta_data|user_metadata/);});
test('deprecated auth.role helper is absent',()=>{assert.doesNotMatch(sql,/auth\.role\s*\(/);});
test('privileged helpers stay private and public RPC wrappers use caller identity',()=>{for(const name of ['mark_recommendation_helpful','confirm_verified_referral','publish_experience','request_account_deletion'])assert.match(sql,new RegExp(`create or replace function private\\.${name}_as_user`));assert.match(sql,/create or replace function public\.request_user_id\(\)/);assert.match(sql,/create policy request_identity_read_own/);});
test('account deletion is self-scoped and available only to authenticated callers',()=>{assert.match(sql,/grant execute on function public\.request_account_deletion\(\) to authenticated/);assert.match(sql,/private\.request_account_deletion_as_user\(public\.request_user_id\(\)\)/);assert.doesNotMatch(sql,/service_role|execute_account_deletion/);});
test('onboarding records versioned community-rules consent',()=>{assert.match(sql,/terms_version text/);assert.match(sql,/terms_accepted_at timestamptz/);assert.match(sql,/terms acceptance required/);});
test('provider blocks are owner-scoped and applied to public discovery',()=>{assert.match(sql,/provider_blocks_own_all/);assert.match(sql,/private\.is_provider_blocked\(provider_id, auth\.uid\(\)\)/);assert.match(sql,/not private\.is_provider_blocked\(p\.id, public\.request_user_id\(\)\)/);});
test('server validates experience branch, five ratings, private coordinates, and media cap',()=>{assert.match(sql,/active provider branch required/);assert.match(sql,/all five ratings are required/);assert.match(sql,/private address detected/);assert.match(sql,/at most four images are allowed/);});
test('safe anchor view returns the client service-area field',()=>{assert.match(sql,/service_area_id as "serviceAreaId"/);});
test('schema is Neon-native and contains no Supabase storage or legacy roles',()=>{assert.match(sql,/references neon_auth\.user\(id\)/);assert.doesNotMatch(sql,/storage\.objects|storage\.buckets|\banon\b|service_role/);assert.match(sql,/auth\.uid\(\)/);assert.match(sql,/to anonymous, authenticated/);});
test('sponsored placement requires enabled legal and billing gates',()=>{assert.match(sql,/g\.enabled and g\.legal_approved and g\.billing_approved/);});
test('views explicitly use security invoker',()=>{for(const name of ['safe_anchor_public','provider_rating_summary','referral_reputation_summary','provider_cards','experience_cards','saved_experience_cards'])assert.match(sql,new RegExp(`create view public\\.${name} with \\(security_invoker = true\\)`));});
test('exact home coordinates are never present on experiences',()=>{const experienceBlock=sql.slice(sql.indexOf('create table public.experiences'),sql.indexOf('create table public.experience_ratings'));assert.doesNotMatch(experienceBlock,/latitude|longitude|address|geography|geometry/);assert.match(experienceBlock,/safe_anchor_id/);});
