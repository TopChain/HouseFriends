-- HouseFriends initial schema for Neon Postgres + Neon Data API.
-- Neon Auth provisions the neon_auth schema. The Data API exposes the JWT subject
-- through auth.user_id() and auth.uid(); HouseFriends stores UUID user IDs.
begin;

create schema if not exists extensions;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists postgis with schema extensions;

create type public.app_role as enum ('sharer', 'searcher', 'individual_provider', 'company_provider', 'admin');
create type public.provider_kind as enum ('individual', 'company');
create type public.listing_source as enum ('community_shared', 'provider_self_listed');
create type public.placement_kind as enum ('organic', 'sponsored');
create type public.anchor_class as enum ('school', 'police_station', 'fire_station', 'hospital_urgent_care', 'place_of_worship');
create type public.publication_status as enum ('draft', 'pending_moderation', 'published', 'limited', 'removed');
create type public.verification_status as enum ('unclaimed', 'pending', 'verified', 'rejected', 'suspended');
create type public.referral_status as enum ('helpful', 'verified');
create type public.moderation_status as enum ('open', 'triaged', 'in_review', 'actioned', 'dismissed', 'appealed', 'closed');
create type public.report_reason as enum ('privacy', 'fraud', 'abuse', 'conflict', 'other');
create type public.company_role as enum ('owner', 'admin', 'branch_manager', 'analyst');

create table public.public_profiles (
  id uuid primary key references neon_auth.user(id) on delete cascade,
  alias text,
  hf_id text not null unique,
  locale text not null default 'en-US',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alias_length check (alias is null or char_length(alias) between 2 and 40),
  constraint alias_no_contact check (alias is null or (alias !~* '@|https?://' and alias !~ E'[\\r\\n\\t]')),
  constraint hf_id_format check (hf_id ~ '^HF-[A-Z0-9]{8}$')
);

-- RPCs run through the Data API without direct USAGE on Neon's managed auth
-- schema. RLS reduces this table to the caller's single UUID, which gives
-- security-invoker RPC wrappers a safe identity handoff.
create table public.request_identities (
  user_id uuid primary key references neon_auth.user(id) on delete cascade
);

create table private.account_private (
  user_id uuid primary key references neon_auth.user(id) on delete cascade,
  terms_version text,
  terms_accepted_at timestamptz,
  deletion_requested_at timestamptz,
  deletion_completed_at timestamptz,
  suspended_at timestamptz,
  moderation_notes text,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references neon_auth.user(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.service_categories (
  id text primary key,
  display_order smallint not null unique check (display_order between 1 and 35),
  name_en text not null unique,
  regulated boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.specialty_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggested_by uuid not null references neon_auth.user(id) on delete cascade,
  raw_label text not null check (char_length(raw_label) between 2 and 80),
  normalized_label text not null,
  status public.moderation_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.service_areas (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  parent_id uuid references public.service_areas(id),
  canonical_name text not null,
  localized_names jsonb not null default '{}'::jsonb,
  hierarchy_path uuid[] not null default '{}'::uuid[],
  internal_subdivision boolean not null default false,
  boundary extensions.geometry(multipolygon, 4326),
  adjacent_area_ids uuid[] not null default '{}'::uuid[],
  active boolean not null default true,
  unique (country_code, parent_id, canonical_name)
);
create index service_areas_parent_idx on public.service_areas(parent_id);
create index service_areas_path_gin_idx on public.service_areas using gin(hierarchy_path);
create index service_areas_boundary_gist_idx on public.service_areas using gist(boundary);

create table public.safe_anchors (
  id uuid primary key default gen_random_uuid(),
  service_area_id uuid not null references public.service_areas(id),
  class public.anchor_class not null,
  public_name text not null,
  locality_label text not null,
  point extensions.geography(point, 4326) not null,
  source text not null,
  source_license text not null,
  approved boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index safe_anchors_area_idx on public.safe_anchors(service_area_id) where approved and active;
create index safe_anchors_point_gist_idx on public.safe_anchors using gist(point);

create table public.provider_entities (
  id uuid primary key default gen_random_uuid(),
  kind public.provider_kind not null,
  owner_user_id uuid references neon_auth.user(id) on delete set null,
  public_name text not null check (char_length(public_name) between 2 and 100),
  individual_alias_user_id uuid references public.public_profiles(id),
  voluntary_trade_name text,
  listing_source public.listing_source not null,
  verification_status public.verification_status not null default 'unclaimed',
  publication_status public.publication_status not null default 'draft',
  canonical_contact_version integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provider_identity_shape check (
    (kind = 'individual' and individual_alias_user_id is not null)
    or (kind = 'company' and individual_alias_user_id is null)
  )
);
create index provider_entities_owner_idx on public.provider_entities(owner_user_id);
create index provider_entities_public_idx on public.provider_entities(publication_status, verification_status);

create table public.provider_private_contacts (
  provider_id uuid primary key references public.provider_entities(id) on delete cascade,
  approved_public_phone text,
  approved_public_email text,
  website_url text,
  updated_by uuid not null references neon_auth.user(id),
  updated_at timestamptz not null default now()
);

create table public.provider_branches (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  branch_name text not null check (char_length(branch_name) between 2 and 100),
  public_phone text,
  public_email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(provider_id, branch_name)
);
create index provider_branches_provider_idx on public.provider_branches(provider_id);

create table public.provider_members (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  user_id uuid not null references neon_auth.user(id) on delete cascade,
  role public.company_role not null,
  branch_id uuid references public.provider_branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique nulls not distinct (provider_id, user_id, role, branch_id)
);
create index provider_members_user_idx on public.provider_members(user_id);

create table public.branch_categories (
  branch_id uuid not null references public.provider_branches(id) on delete cascade,
  category_id text not null references public.service_categories(id),
  created_at timestamptz not null default now(),
  primary key(branch_id, category_id)
);

create table public.provider_area_selections (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  branch_id uuid references public.provider_branches(id) on delete cascade,
  service_area_id uuid not null references public.service_areas(id),
  include_descendants boolean not null default false,
  created_by uuid not null references neon_auth.user(id),
  created_at timestamptz not null default now(),
  unique(provider_id, branch_id, service_area_id)
);
create index provider_area_resolution_idx on public.provider_area_selections(service_area_id, provider_id, branch_id);

create table private.provider_claims (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  claimant_user_id uuid not null references neon_auth.user(id) on delete cascade,
  evidence_paths text[] not null default '{}'::text[],
  status public.verification_status not null default 'pending',
  assigned_admin_id uuid references neon_auth.user(id),
  decision_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table private.business_cards (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.provider_entities(id) on delete cascade,
  uploaded_by uuid not null references neon_auth.user(id) on delete cascade,
  storage_path text not null unique,
  provider_approved_at timestamptz,
  archived_at timestamptz,
  contact_version integer,
  created_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  sharer_user_id uuid references neon_auth.user(id) on delete set null,
  sharer_alias_snapshot text not null,
  sharer_hf_id_snapshot text not null,
  provider_id uuid not null references public.provider_entities(id),
  branch_id uuid references public.provider_branches(id),
  category_id text not null references public.service_categories(id),
  service_item text not null check (char_length(service_item) between 3 and 120),
  service_month date not null check (extract(day from service_month) = 1),
  cost_minor bigint not null check (cost_minor between 0 and 10000000000),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  includes_materials_tax boolean,
  comment text not null check (char_length(comment) between 10 and 2000),
  safe_anchor_id uuid not null references public.safe_anchors(id),
  service_area_id uuid not null references public.service_areas(id),
  status public.publication_status not null default 'pending_moderation',
  moderation_reason text,
  search_document tsvector generated always as (to_tsvector('simple', coalesce(service_item, '') || ' ' || coalesce(comment, ''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index experiences_discovery_idx on public.experiences(service_area_id, category_id, status, created_at desc);
create index experiences_provider_idx on public.experiences(provider_id, branch_id, status);
create index experiences_search_gin_idx on public.experiences using gin(search_document);

create table public.experience_ratings (
  experience_id uuid primary key references public.experiences(id) on delete cascade,
  customer_user_id uuid references neon_auth.user(id) on delete set null,
  provider_id uuid not null references public.provider_entities(id),
  branch_id uuid references public.provider_branches(id),
  category_id text not null references public.service_categories(id),
  quality smallint not null check (quality between 1 and 5),
  value smallint not null check (value between 1 and 5),
  reliability smallint not null check (reliability between 1 and 5),
  communication smallint not null check (communication between 1 and 5),
  recommend smallint not null check (recommend between 1 and 5),
  updated_at timestamptz not null default now()
);
create index ratings_provider_customer_idx on public.experience_ratings(provider_id, customer_user_id, updated_at desc);

create table public.experience_media (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  uploaded_by uuid references neon_auth.user(id) on delete set null,
  pending_storage_path text not null,
  approved_storage_path text,
  media_type text not null check (media_type in ('image', 'video')),
  metadata_stripped boolean not null default false,
  processing_status public.moderation_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.provider_responses (
  experience_id uuid primary key references public.experiences(id) on delete cascade,
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  responder_user_id uuid references neon_auth.user(id) on delete set null,
  response text not null check (char_length(response) between 2 and 1000),
  status public.publication_status not null default 'pending_moderation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_experiences (
  user_id uuid not null references neon_auth.user(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, experience_id)
);

create table public.referral_relationships (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experiences(id) on delete cascade,
  searcher_user_id uuid not null references neon_auth.user(id) on delete cascade,
  recommender_user_id uuid references neon_auth.user(id) on delete set null,
  provider_id uuid not null references public.provider_entities(id),
  status public.referral_status not null default 'helpful',
  attribution_source public.placement_kind not null default 'organic',
  helpful_at timestamptz not null default now(),
  verified_at timestamptz,
  risk_flags text[] not null default '{}'::text[],
  reversed_at timestamptz,
  unique(experience_id, searcher_user_id),
  constraint referral_not_self check (searcher_user_id <> recommender_user_id),
  constraint verified_has_timestamp check (status = 'helpful' or verified_at is not null)
);
create index referrals_recommender_idx on public.referral_relationships(recommender_user_id, status) where reversed_at is null;
create index referrals_provider_idx on public.referral_relationships(provider_id, status) where reversed_at is null;

create table public.reputation_snapshots (
  user_id uuid primary key references public.public_profiles(id) on delete cascade,
  unique_trust_relationships integer not null default 0 check (unique_trust_relationships >= 0),
  verified_referrals integer not null default 0 check (verified_referrals >= 0),
  badge text,
  updated_at timestamptz not null default now()
);

create table public.thank_you_offers (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  referral_relationship_id uuid not null references public.referral_relationships(id) on delete cascade,
  recipient_user_id uuid not null references neon_auth.user(id) on delete cascade,
  description text not null check (char_length(description) between 2 and 500),
  material_benefit_disclosure text not null,
  sentiment_condition boolean not null default false check (sentiment_condition = false),
  rating_condition smallint check (rating_condition is null),
  review_removal_condition boolean not null default false check (review_removal_condition = false),
  created_at timestamptz not null default now()
);

create table public.user_blocks (
  blocker_user_id uuid not null references neon_auth.user(id) on delete cascade,
  blocked_user_id uuid not null references neon_auth.user(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(blocker_user_id, blocked_user_id),
  check (blocker_user_id <> blocked_user_id)
);

create table public.provider_blocks (
  user_id uuid not null references neon_auth.user(id) on delete cascade,
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, provider_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references neon_auth.user(id) on delete cascade,
  target_type text not null check (target_type in ('experience', 'provider', 'profile', 'response', 'media')),
  target_id uuid not null,
  reason public.report_reason not null,
  details text not null check (char_length(details) between 5 and 1000),
  status public.moderation_status not null default 'open',
  created_at timestamptz not null default now()
);
create index reports_queue_idx on public.reports(status, reason, created_at);

create table private.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete set null,
  priority smallint not null default 3 check(priority between 1 and 5),
  status public.moderation_status not null default 'open',
  assigned_admin_id uuid references neon_auth.user(id),
  action text,
  evidence_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  appellant_user_id uuid not null references neon_auth.user(id) on delete cascade,
  case_id uuid not null references private.moderation_cases(id),
  statement text not null check (char_length(statement) between 10 and 2000),
  status public.moderation_status not null default 'appealed',
  created_at timestamptz not null default now()
);

create table public.country_feature_gates (
  country_code char(2) not null,
  feature_key text not null,
  enabled boolean not null default false,
  legal_approved boolean not null default false,
  billing_approved boolean not null default false,
  approved_by uuid references neon_auth.user(id),
  updated_at timestamptz not null default now(),
  primary key(country_code, feature_key)
);

create table public.regulated_category_gates (
  country_code char(2) not null,
  region_code text not null default '*',
  category_id text not null references public.service_categories(id),
  enabled boolean not null default false,
  legal_approved boolean not null default false,
  verification_available boolean not null default false,
  authority_source text,
  updated_at timestamptz not null default now(),
  primary key(country_code, region_code, category_id)
);

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_entities(id) on delete cascade,
  branch_id uuid references public.provider_branches(id) on delete cascade,
  country_code char(2) not null,
  price_per_area_minor integer not null default 1000 check(price_per_area_minor >= 0),
  currency char(3) not null default 'USD',
  duration_days smallint not null default 30 check(duration_days = 30),
  monthly_cap_minor bigint not null check(monthly_cap_minor >= 0),
  renewal_enabled boolean not null default false,
  status public.publication_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null references neon_auth.user(id),
  created_at timestamptz not null default now()
);

create table public.ad_campaign_areas (
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  service_area_id uuid not null references public.service_areas(id),
  primary key(campaign_id, service_area_id)
);

create table private.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references neon_auth.user(id) on delete set null,
  actor_alias_snapshot text,
  action text not null,
  object_type text not null,
  object_id text not null,
  before_state jsonb,
  after_state jsonb,
  occurred_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references neon_auth.user(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  object_type text,
  object_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);

-- Every table in the exposed public schema has RLS enabled.
alter table public.public_profiles enable row level security;
alter table public.request_identities enable row level security;
alter table public.user_roles enable row level security;
alter table public.service_categories enable row level security;
alter table public.specialty_suggestions enable row level security;
alter table public.service_areas enable row level security;
alter table public.safe_anchors enable row level security;
alter table public.provider_entities enable row level security;
alter table public.provider_private_contacts enable row level security;
alter table public.provider_branches enable row level security;
alter table public.provider_members enable row level security;
alter table public.branch_categories enable row level security;
alter table public.provider_area_selections enable row level security;
alter table public.experiences enable row level security;
alter table public.experience_ratings enable row level security;
alter table public.experience_media enable row level security;
alter table public.provider_responses enable row level security;
alter table public.saved_experiences enable row level security;
alter table public.referral_relationships enable row level security;
alter table public.reputation_snapshots enable row level security;
alter table public.thank_you_offers enable row level security;
alter table public.user_blocks enable row level security;
alter table public.provider_blocks enable row level security;
alter table public.reports enable row level security;
alter table public.appeals enable row level security;
alter table public.country_feature_gates enable row level security;
alter table public.regulated_category_gates enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_campaign_areas enable row level security;
alter table public.notifications enable row level security;
alter table private.account_private enable row level security;
alter table private.provider_claims enable row level security;
alter table private.business_cards enable row level security;
alter table private.moderation_cases enable row level security;
alter table private.audit_events enable row level security;

create or replace function private.is_admin(p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and exists(select 1 from public.user_roles where user_id = p_user_id and role = 'admin');
$$;

create or replace function private.is_provider_member(p_provider_id uuid, p_user_id uuid, p_roles public.company_role[] default null) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and exists(
    select 1 from public.provider_members m
    where m.provider_id = p_provider_id and m.user_id = p_user_id and (p_roles is null or m.role = any(p_roles))
  );
$$;

create or replace function private.can_manage_branch(p_branch_id uuid, p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and exists(
    select 1 from public.provider_branches b join public.provider_members m on m.provider_id = b.provider_id
    where b.id = p_branch_id and m.user_id = p_user_id and m.role in ('owner','admin','branch_manager')
      and (m.branch_id is null or m.branch_id = p_branch_id)
  );
$$;

create or replace function private.is_user_blocked(p_blocked_user_id uuid, p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and exists(select 1 from public.user_blocks b where b.blocker_user_id = p_user_id and b.blocked_user_id = p_blocked_user_id);
$$;

create or replace function private.is_provider_blocked(p_provider_id uuid, p_user_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select p_user_id is not null and exists(select 1 from public.provider_blocks b where b.user_id = p_user_id and b.provider_id = p_provider_id);
$$;

revoke all on function private.is_admin(uuid) from public;
revoke all on function private.is_provider_member(uuid, uuid, public.company_role[]) from public;
revoke all on function private.can_manage_branch(uuid, uuid) from public;
revoke all on function private.is_user_blocked(uuid,uuid), private.is_provider_blocked(uuid,uuid) from public;
grant execute on function private.is_admin(uuid), private.is_provider_member(uuid, uuid, public.company_role[]), private.can_manage_branch(uuid, uuid) to authenticated;
grant execute on function private.is_user_blocked(uuid,uuid), private.is_provider_blocked(uuid,uuid) to anonymous, authenticated;

create policy public_profiles_read on public.public_profiles for select to anonymous, authenticated using (alias is not null);
create policy public_profiles_update_own on public.public_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy request_identity_read_own on public.request_identities for select to anonymous, authenticated using ((select auth.uid()) = user_id);
create policy user_roles_read_own on public.user_roles for select to authenticated using ((select auth.uid()) = user_id or private.is_admin(auth.uid()));
create policy user_roles_insert_initial on public.user_roles for insert to authenticated with check ((select auth.uid()) = user_id and role <> 'admin');
create policy categories_read on public.service_categories for select to anonymous, authenticated using (active);
create policy categories_admin_all on public.service_categories for all to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy specialty_own_insert on public.specialty_suggestions for insert to authenticated with check ((select auth.uid()) = suggested_by);
create policy specialty_read_own_admin on public.specialty_suggestions for select to authenticated using ((select auth.uid()) = suggested_by or private.is_admin(auth.uid()));
create policy specialty_admin_update on public.specialty_suggestions for update to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy areas_read on public.service_areas for select to anonymous, authenticated using (active);
create policy anchors_read on public.safe_anchors for select to anonymous, authenticated using (approved and active);
create policy geo_admin_all on public.service_areas for all to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy anchor_admin_all on public.safe_anchors for all to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy providers_public_read on public.provider_entities for select to anonymous, authenticated using (publication_status = 'published');
create policy providers_owner_read on public.provider_entities for select to authenticated using ((select auth.uid()) = owner_user_id or private.is_provider_member(id, auth.uid()) or private.is_admin(auth.uid()));
create policy providers_owner_insert on public.provider_entities for insert to authenticated with check ((select auth.uid()) = owner_user_id and verification_status = 'unclaimed' and publication_status = 'draft');
create policy providers_owner_update on public.provider_entities for update to authenticated using ((select auth.uid()) = owner_user_id or private.is_provider_member(id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid())) with check ((select auth.uid()) = owner_user_id or private.is_provider_member(id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid()));
create policy contacts_member_all on public.provider_private_contacts for all to authenticated using (private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid())) with check (private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid()));
create policy branches_public_read on public.provider_branches for select to anonymous, authenticated using (active and exists(select 1 from public.provider_entities p where p.id = provider_id and p.publication_status = 'published'));
create policy branches_member_all on public.provider_branches for all to authenticated using (private.is_provider_member(provider_id, auth.uid(), array['owner','admin','branch_manager']::public.company_role[]) or private.is_admin(auth.uid())) with check (private.is_provider_member(provider_id, auth.uid(), array['owner','admin','branch_manager']::public.company_role[]) or private.is_admin(auth.uid()));
create policy members_read_team on public.provider_members for select to authenticated using ((select auth.uid()) = user_id or private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid()));
create policy members_manage on public.provider_members for all to authenticated using (private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid())) with check (private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid()));
create policy branch_categories_public_read on public.branch_categories for select to anonymous, authenticated using (true);
create policy branch_categories_manage on public.branch_categories for all to authenticated using (private.can_manage_branch(branch_id, auth.uid()) or private.is_admin(auth.uid())) with check (private.can_manage_branch(branch_id, auth.uid()) or private.is_admin(auth.uid()));
create policy area_selections_public_read on public.provider_area_selections for select to anonymous, authenticated using (exists(select 1 from public.provider_entities p where p.id = provider_id and p.publication_status = 'published'));
create policy area_selections_manage on public.provider_area_selections for all to authenticated using (private.is_provider_member(provider_id, auth.uid(), array['owner','admin','branch_manager']::public.company_role[]) or private.is_admin(auth.uid())) with check ((select auth.uid()) = created_by and (private.is_provider_member(provider_id, auth.uid(), array['owner','admin','branch_manager']::public.company_role[]) or private.is_admin(auth.uid())));
create policy experiences_public_read on public.experiences for select to anonymous, authenticated using (status = 'published' and not private.is_user_blocked(sharer_user_id, auth.uid()) and not private.is_provider_blocked(provider_id, auth.uid()));
create policy experiences_sharer_read on public.experiences for select to authenticated using ((select auth.uid()) = sharer_user_id or private.is_admin(auth.uid()));
create policy experiences_sharer_update on public.experiences for update to authenticated using ((select auth.uid()) = sharer_user_id and status in ('draft','pending_moderation') or private.is_admin(auth.uid())) with check ((select auth.uid()) = sharer_user_id or private.is_admin(auth.uid()));
create policy ratings_public_read on public.experience_ratings for select to anonymous, authenticated using (exists(select 1 from public.experiences e where e.id = experience_id and e.status = 'published'));
create policy ratings_owner_read on public.experience_ratings for select to authenticated using ((select auth.uid()) = customer_user_id or private.is_admin(auth.uid()));
create policy media_public_read on public.experience_media for select to anonymous, authenticated using (processing_status = 'actioned' and metadata_stripped and approved_storage_path is not null);
create policy media_owner_read on public.experience_media for select to authenticated using ((select auth.uid()) = uploaded_by or private.is_admin(auth.uid()));
create policy responses_public_read on public.provider_responses for select to anonymous, authenticated using (status = 'published');
create policy responses_member_manage on public.provider_responses for all to authenticated using (private.is_provider_member(provider_id, auth.uid(), array['owner','admin','branch_manager']::public.company_role[]) or private.is_admin(auth.uid())) with check ((select auth.uid()) = responder_user_id and (private.is_provider_member(provider_id, auth.uid(), array['owner','admin','branch_manager']::public.company_role[]) or private.is_admin(auth.uid())));
create policy saved_own_all on public.saved_experiences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy referrals_participant_read on public.referral_relationships for select to authenticated using ((select auth.uid()) in (searcher_user_id, recommender_user_id) or private.is_provider_member(provider_id, auth.uid()) or private.is_admin(auth.uid()));
create policy reputation_public_read on public.reputation_snapshots for select to anonymous, authenticated using (true);
create policy offers_participant_read on public.thank_you_offers for select to authenticated using ((select auth.uid()) = recipient_user_id or private.is_provider_member(provider_id, auth.uid()) or private.is_admin(auth.uid()));
create policy offers_provider_insert on public.thank_you_offers for insert to authenticated with check (private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]) and sentiment_condition = false and rating_condition is null and review_removal_condition = false);
create policy blocks_own_all on public.user_blocks for all to authenticated using ((select auth.uid()) = blocker_user_id) with check ((select auth.uid()) = blocker_user_id);
create policy provider_blocks_own_all on public.provider_blocks for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy reports_own_insert on public.reports for insert to authenticated with check ((select auth.uid()) = reporter_user_id);
create policy reports_own_read on public.reports for select to authenticated using ((select auth.uid()) = reporter_user_id or private.is_admin(auth.uid()));
create policy reports_admin_update on public.reports for update to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy appeals_own_insert on public.appeals for insert to authenticated with check ((select auth.uid()) = appellant_user_id);
create policy appeals_own_read on public.appeals for select to authenticated using ((select auth.uid()) = appellant_user_id or private.is_admin(auth.uid()));
create policy appeals_admin_update on public.appeals for update to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy country_gates_read on public.country_feature_gates for select to anonymous, authenticated using (true);
create policy country_gates_admin_all on public.country_feature_gates for all to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy regulated_gates_read on public.regulated_category_gates for select to anonymous, authenticated using (true);
create policy regulated_gates_admin_all on public.regulated_category_gates for all to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy campaigns_member_read on public.ad_campaigns for select to authenticated using (private.is_provider_member(provider_id, auth.uid()) or private.is_admin(auth.uid()));
create policy campaigns_member_insert_draft on public.ad_campaigns for insert to authenticated with check ((select auth.uid()) = created_by and status = 'draft' and private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]));
create policy campaigns_member_update_draft on public.ad_campaigns for update to authenticated using (status = 'draft' and private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[])) with check (status = 'draft' and (select auth.uid()) = created_by and private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]));
create policy campaigns_member_delete_draft on public.ad_campaigns for delete to authenticated using (status = 'draft' and private.is_provider_member(provider_id, auth.uid(), array['owner','admin']::public.company_role[]));
create policy campaigns_admin_all on public.ad_campaigns for all to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy campaign_areas_member_all on public.ad_campaign_areas for all to authenticated using (exists(select 1 from public.ad_campaigns c where c.id = campaign_id and (private.is_provider_member(c.provider_id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid())))) with check (exists(select 1 from public.ad_campaigns c where c.id = campaign_id and (private.is_provider_member(c.provider_id, auth.uid(), array['owner','admin']::public.company_role[]) or private.is_admin(auth.uid()))));
create policy notifications_own_all on public.notifications for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy account_private_own_read on private.account_private for select to authenticated using ((select auth.uid()) = user_id or private.is_admin(auth.uid()));
create policy claims_own_admin_read on private.provider_claims for select to authenticated using ((select auth.uid()) = claimant_user_id or private.is_admin(auth.uid()));
create policy claims_own_insert on private.provider_claims for insert to authenticated with check ((select auth.uid()) = claimant_user_id);
create policy cards_owner_read on private.business_cards for select to authenticated using ((select auth.uid()) = uploaded_by or private.is_admin(auth.uid()));
create policy cards_owner_insert on private.business_cards for insert to authenticated with check ((select auth.uid()) = uploaded_by);
create policy moderation_admin_all on private.moderation_cases for all to authenticated using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));
create policy audit_admin_read on private.audit_events for select to authenticated using (private.is_admin(auth.uid()));

create or replace function public.request_user_id() returns uuid
language sql stable security invoker set search_path = '' as $$
  select user_id from public.request_identities limit 1;
$$;
revoke all on function public.request_user_id() from public;
grant execute on function public.request_user_id() to anonymous, authenticated;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.request_identities(user_id) values(new.id);
  insert into public.public_profiles(id, hf_id)
  values(new.id, 'HF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)));
  insert into private.account_private(user_id) values(new.id);
  insert into public.reputation_snapshots(user_id) values(new.id);
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;
create trigger on_auth_user_created after insert on neon_auth.user for each row execute function private.handle_new_user();

create or replace function private.complete_onboarding_as_user(p_actor_user_id uuid, p_alias text, p_role public.app_role, p_terms_version text) returns public.public_profiles
language plpgsql security definer set search_path = '' as $$
declare v_profile public.public_profiles;
begin
  if p_actor_user_id is null then raise exception 'authentication required'; end if;
  if coalesce(char_length(trim(p_terms_version)), 0) < 3 then raise exception 'terms acceptance required'; end if;
  p_alias := regexp_replace(trim(p_alias), '\s+', ' ', 'g');
  if char_length(p_alias) not between 2 and 40 or p_alias ~* '@|https?://' or p_alias ~ E'[\\r\\n\\t]' then raise exception 'invalid alias'; end if;
  if p_role = 'admin' then raise exception 'admin role cannot be self-assigned'; end if;
  update public.public_profiles set alias = p_alias, updated_at = now() where id = p_actor_user_id returning * into v_profile;
  update private.account_private set terms_version = trim(p_terms_version), terms_accepted_at = now() where user_id = p_actor_user_id;
  insert into public.user_roles(user_id, role) values(p_actor_user_id, p_role) on conflict do nothing;
  return v_profile;
end;
$$;
revoke all on function private.complete_onboarding_as_user(uuid, text, public.app_role, text) from public;
grant execute on function private.complete_onboarding_as_user(uuid, text, public.app_role, text) to authenticated;

create or replace function public.complete_onboarding(p_alias text, p_role public.app_role, p_terms_version text) returns public.public_profiles
language sql volatile security invoker set search_path = '' as $$
  select private.complete_onboarding_as_user(public.request_user_id(), p_alias, p_role, p_terms_version);
$$;
revoke all on function public.complete_onboarding(text, public.app_role, text) from public;
grant execute on function public.complete_onboarding(text, public.app_role, text) to authenticated;

create or replace function private.create_provider_profile_as_user(p_actor_user_id uuid, p_kind public.provider_kind, p_public_name text, p_trade_name text default null)
returns table(provider_id uuid, branch_id uuid)
language plpgsql security definer set search_path = '' as $$
declare v_profile public.public_profiles; v_provider_id uuid; v_branch_id uuid; v_required_role public.app_role;
begin
  if p_actor_user_id is null then raise exception 'authentication required'; end if;
  select * into v_profile from public.public_profiles where id=p_actor_user_id and alias is not null;
  if not found then raise exception 'complete onboarding first'; end if;
  v_required_role := case when p_kind='individual' then 'individual_provider'::public.app_role else 'company_provider'::public.app_role end;
  if not exists(select 1 from public.user_roles where user_id=p_actor_user_id and role=v_required_role) then raise exception 'provider role required'; end if;
  select p.id,b.id into v_provider_id,v_branch_id from public.provider_entities p left join public.provider_branches b on b.provider_id=p.id
  where p.owner_user_id=p_actor_user_id and p.kind=p_kind order by p.created_at limit 1;
  if found then return query select v_provider_id,v_branch_id; return; end if;
  p_public_name := regexp_replace(trim(p_public_name), '\s+', ' ', 'g');
  if char_length(p_public_name) not between 2 and 100 then raise exception 'invalid public provider name'; end if;
  if p_kind='individual' then p_public_name := v_profile.alias; end if;
  insert into public.provider_entities(kind,owner_user_id,public_name,individual_alias_user_id,voluntary_trade_name,listing_source,verification_status,publication_status)
  values(p_kind,p_actor_user_id,p_public_name,case when p_kind='individual' then p_actor_user_id else null end,nullif(trim(p_trade_name),''),'provider_self_listed','unclaimed','draft')
  returning id into v_provider_id;
  insert into public.provider_branches(provider_id,branch_name) values(v_provider_id,case when p_kind='individual' then 'Primary service profile' else 'Main branch' end) returning id into v_branch_id;
  insert into public.provider_members(provider_id,user_id,role,branch_id) values(v_provider_id,p_actor_user_id,'owner',null);
  insert into private.audit_events(actor_user_id,actor_alias_snapshot,action,object_type,object_id,after_state)
  values(p_actor_user_id,v_profile.alias,'provider_profile_created','provider',v_provider_id::text,jsonb_build_object('kind',p_kind,'branch_id',v_branch_id));
  return query select v_provider_id,v_branch_id;
end;
$$;
revoke all on function private.create_provider_profile_as_user(uuid, public.provider_kind,text,text) from public;
grant execute on function private.create_provider_profile_as_user(uuid, public.provider_kind,text,text) to authenticated;

create or replace function public.create_provider_profile(p_kind public.provider_kind, p_public_name text, p_trade_name text default null)
returns table(provider_id uuid, branch_id uuid)
language sql volatile security invoker set search_path = '' as $$
  select * from private.create_provider_profile_as_user(public.request_user_id(), p_kind, p_public_name, p_trade_name);
$$;
revoke all on function public.create_provider_profile(public.provider_kind,text,text) from public;
grant execute on function public.create_provider_profile(public.provider_kind,text,text) to authenticated;

create or replace function private.enforce_branch_category_cap() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.provider_branches where id = new.branch_id for update;
  if (select count(*) from public.branch_categories where branch_id = new.branch_id) >= 5 then raise exception 'provider category cap exceeded'; end if;
  return new;
end;
$$;
revoke all on function private.enforce_branch_category_cap() from public;
create trigger branch_category_cap before insert on public.branch_categories for each row execute function private.enforce_branch_category_cap();

create or replace function private.enforce_provider_area_cap() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_kind public.provider_kind; v_cap integer; v_count integer;
begin
  perform 1 from public.provider_entities where id = new.provider_id for update;
  select kind into v_kind from public.provider_entities where id = new.provider_id;
  v_cap := case when v_kind = 'individual' then 100 else 1000 end;
  select count(*) into v_count from public.provider_area_selections where provider_id = new.provider_id and branch_id is not distinct from new.branch_id;
  if v_count >= v_cap then raise exception 'provider service-area cap exceeded'; end if;
  return new;
end;
$$;
revoke all on function private.enforce_provider_area_cap() from public;
create trigger provider_area_cap before insert on public.provider_area_selections for each row execute function private.enforce_provider_area_cap();

create or replace function private.enforce_campaign_area_cap() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.ad_campaigns where id = new.campaign_id for update;
  if (select count(*) from public.ad_campaign_areas where campaign_id = new.campaign_id) >= 1000 then raise exception 'campaign service-area cap exceeded'; end if;
  return new;
end;
$$;
revoke all on function private.enforce_campaign_area_cap() from public;
create trigger campaign_area_cap before insert on public.ad_campaign_areas for each row execute function private.enforce_campaign_area_cap();

create or replace function private.mark_recommendation_helpful_as_user(p_actor_user_id uuid, p_experience_id uuid) returns public.referral_relationships
language plpgsql security definer set search_path = '' as $$
declare v_experience public.experiences; v_result public.referral_relationships;
begin
  if p_actor_user_id is null then raise exception 'authentication required'; end if;
  select * into v_experience from public.experiences where id = p_experience_id and status = 'published';
  if not found then raise exception 'published experience not found'; end if;
  if v_experience.sharer_user_id is null or v_experience.sharer_user_id = p_actor_user_id then raise exception 'self-attribution is not allowed'; end if;
  insert into public.referral_relationships(experience_id, searcher_user_id, recommender_user_id, provider_id, status)
  values(p_experience_id, p_actor_user_id, v_experience.sharer_user_id, v_experience.provider_id, 'helpful')
  on conflict(experience_id, searcher_user_id) do update set helpful_at = public.referral_relationships.helpful_at
  returning * into v_result;
  return v_result;
end;
$$;
revoke all on function private.mark_recommendation_helpful_as_user(uuid, uuid) from public;
grant execute on function private.mark_recommendation_helpful_as_user(uuid, uuid) to authenticated;

create or replace function public.mark_recommendation_helpful(p_experience_id uuid) returns public.referral_relationships
language sql volatile security invoker set search_path = '' as $$
  select private.mark_recommendation_helpful_as_user(public.request_user_id(), p_experience_id);
$$;
revoke all on function public.mark_recommendation_helpful(uuid) from public;
grant execute on function public.mark_recommendation_helpful(uuid) to authenticated;

create or replace function private.confirm_verified_referral_as_user(p_actor_user_id uuid, p_experience_id uuid) returns public.referral_relationships
language plpgsql security definer set search_path = '' as $$
declare v_result public.referral_relationships;
begin
  if p_actor_user_id is null then raise exception 'authentication required'; end if;
  perform private.mark_recommendation_helpful_as_user(p_actor_user_id, p_experience_id);
  update public.referral_relationships set status = 'verified', verified_at = coalesce(verified_at, now())
  where experience_id = p_experience_id and searcher_user_id = p_actor_user_id and reversed_at is null returning * into v_result;
  return v_result;
end;
$$;
revoke all on function private.confirm_verified_referral_as_user(uuid, uuid) from public;
grant execute on function private.confirm_verified_referral_as_user(uuid, uuid) to authenticated;

create or replace function public.confirm_verified_referral(p_experience_id uuid) returns public.referral_relationships
language sql volatile security invoker set search_path = '' as $$
  select private.confirm_verified_referral_as_user(public.request_user_id(), p_experience_id);
$$;
revoke all on function public.confirm_verified_referral(uuid) from public;
grant execute on function public.confirm_verified_referral(uuid) to authenticated;

create or replace function private.refresh_reputation_snapshot() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid; v_helpful integer; v_verified integer; v_badge text;
begin
  v_user_id := coalesce(new.recommender_user_id, old.recommender_user_id);
  if v_user_id is null then return coalesce(new, old); end if;
  select count(*), count(*) filter(where status = 'verified') into v_helpful, v_verified
  from public.referral_relationships where recommender_user_id = v_user_id and reversed_at is null;
  v_badge := case when v_verified >= 50 then 'HouseFriends Champion' when v_verified >= 25 then 'Community Connector'
    when v_verified >= 10 then 'Trusted Connector' when v_verified >= 5 then 'Connector' else null end;
  insert into public.reputation_snapshots(user_id, unique_trust_relationships, verified_referrals, badge, updated_at)
  values(v_user_id, v_helpful, v_verified, v_badge, now())
  on conflict(user_id) do update set unique_trust_relationships = excluded.unique_trust_relationships,
    verified_referrals = excluded.verified_referrals, badge = excluded.badge, updated_at = excluded.updated_at;
  return coalesce(new, old);
end;
$$;
revoke all on function private.refresh_reputation_snapshot() from public;
create trigger refresh_reputation_after_change after insert or update or delete on public.referral_relationships
for each row execute function private.refresh_reputation_snapshot();

create or replace function private.publish_experience_as_user(p_actor_user_id uuid, p_payload jsonb) returns public.experiences
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.public_profiles;
  v_anchor public.safe_anchors;
  v_provider public.provider_entities;
  v_branch public.provider_branches;
  v_experience public.experiences;
  v_rating jsonb;
  v_path text;
  v_service_month date;
begin
  if p_actor_user_id is null then raise exception 'authentication required'; end if;
  select * into v_profile from public.public_profiles where id = p_actor_user_id and alias is not null;
  if not found then raise exception 'complete onboarding first'; end if;
  select * into v_anchor from public.safe_anchors where id = (p_payload->'anchor'->>'id')::uuid and approved and active;
  if not found then raise exception 'approved safe anchor required'; end if;
  select * into v_provider from public.provider_entities where id = (p_payload->'provider'->>'id')::uuid and publication_status = 'published';
  if not found then raise exception 'published provider required'; end if;
  select * into v_branch from public.provider_branches where id = nullif(p_payload->'provider'->>'branchId','')::uuid and provider_id = v_provider.id and active;
  if not found then raise exception 'active provider branch required'; end if;
  if not exists(select 1 from public.branch_categories bc join public.service_categories c on c.id = bc.category_id and c.active where bc.branch_id = v_branch.id and bc.category_id = p_payload->>'categoryId') then
    raise exception 'provider category is not active for this branch';
  end if;
  if (p_payload->>'serviceItem') ~* '\m\d{1,6}\s+.+\s(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd|way)\M'
     or (p_payload->>'comment') ~* '\m\d{1,6}\s+.+\s(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|boulevard|blvd|way)\M'
     or (p_payload->>'serviceItem') ~ '-?\d{1,3}\.\d{4,}\s*[,/]\s*-?\d{1,3}\.\d{4,}'
     or (p_payload->>'comment') ~ '-?\d{1,3}\.\d{4,}\s*[,/]\s*-?\d{1,3}\.\d{4,}'
  then raise exception 'private address detected'; end if;
  v_rating := p_payload->'rating';
  if v_rating is null or jsonb_typeof(v_rating) <> 'object' or not (v_rating ?& array['quality','value','reliability','communication','recommend']) then raise exception 'all five ratings are required'; end if;
  if exists(select 1 from jsonb_each_text(v_rating) where value::integer not between 1 and 5) then raise exception 'ratings must be 1 to 5'; end if;
  v_service_month := (p_payload->>'serviceMonth')::date;
  if extract(day from v_service_month) <> 1 or v_service_month > date_trunc('month', current_date)::date then raise exception 'service month must be a completed current or prior month'; end if;
  if jsonb_array_length(coalesce(p_payload->'mediaPaths','[]'::jsonb)) > 4 then raise exception 'at most four images are allowed'; end if;
  insert into public.experiences(sharer_user_id, sharer_alias_snapshot, sharer_hf_id_snapshot, provider_id, branch_id, category_id, service_item, service_month, cost_minor, currency, includes_materials_tax, comment, safe_anchor_id, service_area_id, status)
  values(p_actor_user_id, v_profile.alias, v_profile.hf_id, v_provider.id, v_branch.id, p_payload->>'categoryId', trim(p_payload->>'serviceItem'), v_service_month, (p_payload->>'costMinor')::bigint, p_payload->>'currency', (p_payload->>'includesMaterialsTax')::boolean, trim(p_payload->>'comment'), v_anchor.id, v_anchor.service_area_id, 'pending_moderation')
  returning * into v_experience;
  insert into public.experience_ratings(experience_id, customer_user_id, provider_id, branch_id, category_id, quality, value, reliability, communication, recommend)
  values(v_experience.id, p_actor_user_id, v_experience.provider_id, v_experience.branch_id, v_experience.category_id, (v_rating->>'quality')::smallint, (v_rating->>'value')::smallint, (v_rating->>'reliability')::smallint, (v_rating->>'communication')::smallint, (v_rating->>'recommend')::smallint);
  for v_path in select jsonb_array_elements_text(coalesce(p_payload->'mediaPaths','[]'::jsonb)) loop
    if split_part(v_path,'/',1) <> p_actor_user_id::text then raise exception 'invalid media ownership path'; end if;
    insert into public.experience_media(experience_id, uploaded_by, pending_storage_path, media_type, metadata_stripped, processing_status)
    values(v_experience.id, p_actor_user_id, v_path, 'image', false, 'open');
  end loop;
  return v_experience;
end;
$$;
revoke all on function private.publish_experience_as_user(uuid, jsonb) from public;
grant execute on function private.publish_experience_as_user(uuid, jsonb) to authenticated;

create or replace function public.publish_experience(p_payload jsonb) returns public.experiences
language sql volatile security invoker set search_path = '' as $$
  select private.publish_experience_as_user(public.request_user_id(), p_payload);
$$;
revoke all on function public.publish_experience(jsonb) from public;
grant execute on function public.publish_experience(jsonb) to authenticated;

create or replace function private.request_account_deletion_as_user(p_actor_user_id uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare v_paths text[]; v_user_id uuid;
begin
  v_user_id := p_actor_user_id;
  if v_user_id is null then raise exception 'authentication required'; end if;
  select coalesce(array_agg(pending_storage_path), '{}'::text[]) into v_paths from public.experience_media where uploaded_by = v_user_id;
  delete from public.referral_relationships where searcher_user_id = v_user_id;
  update public.referral_relationships set recommender_user_id = null where recommender_user_id = v_user_id;
  update public.provider_entities set owner_user_id = null, verification_status = 'unclaimed' where owner_user_id = v_user_id;
  update private.account_private set deletion_requested_at = coalesce(deletion_requested_at, now()) where user_id = v_user_id;
  insert into private.audit_events(actor_user_id, action, object_type, object_id, after_state)
  values(v_user_id, 'account_deletion_requested', 'user', v_user_id::text, jsonb_build_object('requested_at', now()));
  return v_paths;
end;
$$;
revoke all on function private.request_account_deletion_as_user(uuid) from public;
grant execute on function private.request_account_deletion_as_user(uuid) to authenticated;

create or replace function public.request_account_deletion() returns text[]
language sql volatile security invoker set search_path = '' as $$
  select private.request_account_deletion_as_user(public.request_user_id());
$$;
revoke all on function public.request_account_deletion() from public;
grant execute on function public.request_account_deletion() to authenticated;

create or replace function private.search_provider_cards_as_user(p_actor_user_id uuid, p_service_area_id uuid default null, p_category_id text default null, p_query text default null)
returns table(provider_id uuid, branch_id uuid, public_name text, provider_kind public.provider_kind, listing_source public.listing_source, placement public.placement_kind, rating numeric, rating_count bigint, branch_name text, category_ids text[], service_area_ids text[], verified boolean, alias text, hf_id text, trade_name text, phone text)
language sql stable security definer set search_path = '' as $$
  with eligible as (
    select p.id provider_id, b.id branch_id, p.public_name, p.kind provider_kind, p.listing_source,
      case when exists(
        select 1 from public.ad_campaigns c join public.ad_campaign_areas ca on ca.campaign_id = c.id
        join public.country_feature_gates g on g.country_code = c.country_code and g.feature_key = 'sponsored_promotion'
        where c.provider_id = p.id and (c.branch_id is null or c.branch_id = b.id) and ca.service_area_id = p_service_area_id
          and c.status = 'published' and now() between c.starts_at and c.ends_at and g.enabled and g.legal_approved and g.billing_approved
      ) then 'sponsored'::public.placement_kind else 'organic'::public.placement_kind end placement
    from public.provider_entities p
    left join public.provider_branches b on b.provider_id = p.id and b.active
    where p.publication_status = 'published'
      and not private.is_provider_blocked(p.id, p_actor_user_id)
      and (p_query is null or p.public_name ilike '%' || p_query || '%')
      and (p_service_area_id is null or exists(
        select 1 from public.provider_area_selections s join public.service_areas a on a.id = p_service_area_id
        where s.provider_id = p.id and (s.branch_id is null or s.branch_id = b.id)
          and (s.service_area_id = p_service_area_id or (s.include_descendants and s.service_area_id = any(a.hierarchy_path)))
      ))
      and (p_category_id is null or exists(select 1 from public.branch_categories bc where bc.branch_id = b.id and bc.category_id = p_category_id))
  ), latest_per_customer as (
    select distinct on (r.provider_id, r.branch_id, r.customer_user_id) r.provider_id, r.branch_id, r.customer_user_id,
      (r.quality + r.value + r.reliability + r.communication + r.recommend)::numeric / 5 score
    from public.experience_ratings r join public.experiences e on e.id = r.experience_id and e.status = 'published'
    order by r.provider_id, r.branch_id, r.customer_user_id, r.updated_at desc
  ), aggregates as (
    select provider_id, branch_id, round(avg(score),2) rating, count(*) rating_count from latest_per_customer group by provider_id, branch_id
  )
  select distinct on (e.provider_id, e.branch_id) e.provider_id, e.branch_id, e.public_name, e.provider_kind, e.listing_source, e.placement,
    coalesce(a.rating,0), coalesce(a.rating_count,0), b.branch_name,
    coalesce((select array_agg(bc.category_id order by c.display_order) from public.branch_categories bc join public.service_categories c on c.id=bc.category_id where bc.branch_id=e.branch_id),'{}'::text[]),
    coalesce((select array_agg(s.service_area_id::text order by s.created_at) from public.provider_area_selections s where s.provider_id=e.provider_id and s.branch_id is not distinct from e.branch_id),'{}'::text[]),
    p.verification_status='verified', pp.alias, pp.hf_id, p.voluntary_trade_name, b.public_phone
  from eligible e join public.provider_entities p on p.id=e.provider_id
  left join public.provider_branches b on b.id=e.branch_id
  left join public.public_profiles pp on pp.id=p.individual_alias_user_id
  left join aggregates a on a.provider_id = e.provider_id and a.branch_id is not distinct from e.branch_id
  order by e.provider_id, e.branch_id, (e.placement = 'sponsored') desc;
$$;
revoke all on function private.search_provider_cards_as_user(uuid,uuid,text,text) from public;
grant execute on function private.search_provider_cards_as_user(uuid,uuid,text,text) to anonymous, authenticated;

create or replace function public.search_provider_cards(p_service_area_id uuid default null, p_category_id text default null, p_query text default null)
returns table(provider_id uuid, branch_id uuid, public_name text, provider_kind public.provider_kind, listing_source public.listing_source, placement public.placement_kind, rating numeric, rating_count bigint, branch_name text, category_ids text[], service_area_ids text[], verified boolean, alias text, hf_id text, trade_name text, phone text)
language sql stable security invoker set search_path = '' as $$
  select * from private.search_provider_cards_as_user(public.request_user_id(), p_service_area_id, p_category_id, p_query);
$$;
revoke all on function public.search_provider_cards(uuid,text,text) from public;
grant execute on function public.search_provider_cards(uuid,text,text) to anonymous, authenticated;

create view public.safe_anchor_public with (security_invoker = true) as
select id, public_name as name, class, locality_label as locality, service_area_id as "serviceAreaId",
  extensions.st_y(point::extensions.geometry) as latitude, extensions.st_x(point::extensions.geometry) as longitude
from public.safe_anchors where approved and active;

create view public.provider_rating_summary with (security_invoker = true) as
with latest as (
  select distinct on (r.provider_id, r.branch_id, r.customer_user_id) r.*
  from public.experience_ratings r join public.experiences e on e.id = r.experience_id and e.status = 'published'
  order by r.provider_id, r.branch_id, r.customer_user_id, r.updated_at desc
)
select provider_id, branch_id, round(avg((quality+value+reliability+communication+recommend)::numeric/5),2) rating, count(*) unique_customer_count
from latest group by provider_id, branch_id;

create view public.referral_reputation_summary with (security_invoker = true) as
select user_id as recommender_user_id, unique_trust_relationships, verified_referrals, badge, updated_at
from public.reputation_snapshots;

create view public.provider_cards with (security_invoker = true) as
select p.id,
  p.kind,
  p.public_name as "publicName",
  pp.alias,
  pp.hf_id as "hfId",
  p.voluntary_trade_name as "tradeName",
  b.id as "branchId",
  b.branch_name as "branchName",
  coalesce((select array_agg(bc.category_id order by c.display_order) from public.branch_categories bc join public.service_categories c on c.id = bc.category_id where bc.branch_id = b.id), '{}'::text[]) as "categoryIds",
  coalesce((select array_agg(s.service_area_id::text order by s.created_at) from public.provider_area_selections s where s.provider_id = p.id and s.branch_id is not distinct from b.id), '{}'::text[]) as "serviceAreaIds",
  p.listing_source as "listingSource",
  'organic'::public.placement_kind as placement,
  coalesce(pr.rating,0) as rating,
  coalesce(pr.unique_customer_count,0) as "ratingCount",
  p.verification_status = 'verified' as verified,
  b.public_phone as phone
from public.provider_entities p
left join public.provider_branches b on b.provider_id = p.id and b.active
left join public.public_profiles pp on pp.id = p.individual_alias_user_id
left join public.provider_rating_summary pr on pr.provider_id = p.id and pr.branch_id is not distinct from b.id
where p.publication_status = 'published'
  and not private.is_provider_blocked(p.id, public.request_user_id());

create view public.experience_cards with (security_invoker = true) as
select e.id,
  jsonb_build_object('id', coalesce(e.sharer_user_id::text, ''), 'alias', e.sharer_alias_snapshot, 'hfId', e.sharer_hf_id_snapshot,
    'trustRelationships', coalesce(rs.unique_trust_relationships,0), 'verifiedReferrals', coalesce(rs.verified_referrals,0)) as sharer,
  jsonb_build_object('id', p.id, 'kind', p.kind, 'publicName', p.public_name, 'alias', pp.alias, 'hfId', pp.hf_id,
    'tradeName', p.voluntary_trade_name, 'branchId', b.id, 'branchName', b.branch_name,
    'categoryIds', coalesce((select jsonb_agg(bc.category_id order by c.display_order) from public.branch_categories bc join public.service_categories c on c.id = bc.category_id where bc.branch_id = b.id), '[]'::jsonb),
    'serviceAreaIds', coalesce((select jsonb_agg(s.service_area_id::text order by s.created_at) from public.provider_area_selections s where s.provider_id = p.id and s.branch_id is not distinct from b.id), '[]'::jsonb),
    'listingSource', p.listing_source, 'placement', 'organic', 'rating', coalesce(pr.rating,0), 'ratingCount', coalesce(pr.unique_customer_count,0),
    'verified', p.verification_status = 'verified', 'phone', b.public_phone) as provider,
  e.category_id as "categoryId", e.service_item as "serviceItem", e.service_month::text as "serviceMonth",
  e.service_area_id as "serviceAreaId",
  e.cost_minor as "costMinor", e.currency, e.includes_materials_tax as "includesMaterialsTax",
  jsonb_build_object('quality',r.quality,'value',r.value,'reliability',r.reliability,'communication',r.communication,'recommend',r.recommend) as rating,
  e.comment,
  jsonb_build_object('id',a.id,'name',a.public_name,'class',a.class,'locality',a.locality_label,'serviceAreaId',a.service_area_id,
    'latitude',extensions.st_y(a.point::extensions.geometry),'longitude',extensions.st_x(a.point::extensions.geometry)) as anchor,
  '[]'::jsonb as "mediaUrls",
  (select count(*) from public.referral_relationships rr where rr.experience_id=e.id and rr.reversed_at is null) as "helpfulCount",
  (select count(*) from public.referral_relationships rr where rr.experience_id=e.id and rr.status='verified' and rr.reversed_at is null) as "verifiedReferralCount",
  prsp.response as "providerResponse", e.status, e.search_document
from public.experiences e
join public.experience_ratings r on r.experience_id=e.id
join public.safe_anchors a on a.id=e.safe_anchor_id
join public.provider_entities p on p.id=e.provider_id
left join public.provider_branches b on b.id=e.branch_id
left join public.public_profiles pp on pp.id=p.individual_alias_user_id
left join public.provider_rating_summary pr on pr.provider_id=p.id and pr.branch_id is not distinct from e.branch_id
left join public.provider_responses prsp on prsp.experience_id=e.id and prsp.status='published'
left join public.reputation_snapshots rs on rs.user_id=e.sharer_user_id
where e.status='published';

create view public.saved_experience_cards with (security_invoker = true) as
select s.user_id, c.* from public.saved_experiences s join public.experience_cards c on c.id=s.experience_id;

grant usage on schema public to anonymous, authenticated;
grant usage on schema private to anonymous, authenticated;
grant select on public.request_identities to anonymous, authenticated;
grant select on public.public_profiles, public.service_categories, public.service_areas, public.safe_anchors, public.provider_entities, public.provider_branches, public.branch_categories, public.provider_area_selections, public.experiences, public.experience_ratings, public.experience_media, public.provider_responses, public.reputation_snapshots, public.country_feature_gates, public.regulated_category_gates to anonymous;
grant select on all tables in schema public to authenticated;
grant insert on public.user_roles to authenticated;
grant update(alias, locale, updated_at) on public.public_profiles to authenticated;
grant insert on public.specialty_suggestions, public.provider_entities, public.reports, public.appeals, public.saved_experiences, public.user_blocks, public.provider_blocks to authenticated;
grant insert, update, delete on public.provider_private_contacts, public.provider_branches, public.provider_members, public.branch_categories, public.provider_area_selections, public.provider_responses, public.thank_you_offers, public.ad_campaigns, public.ad_campaign_areas, public.notifications to authenticated;
grant update on public.experiences, public.reports, public.appeals, public.country_feature_gates, public.regulated_category_gates to authenticated;
grant delete on public.saved_experiences, public.user_blocks, public.provider_blocks to authenticated;
grant select on public.safe_anchor_public, public.provider_rating_summary, public.referral_reputation_summary, public.provider_cards, public.experience_cards to anonymous, authenticated;
grant select on public.saved_experience_cards to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into public.service_categories(id, display_order, name_en, regulated) values
('handyman',1,'Handyman',false),('house-cleaning',2,'House Cleaning',false),('plumber',3,'Plumber',true),('electrician',4,'Electrician',true),('hvac',5,'HVAC / AC & Heating',true),('appliance-repair',6,'Appliance Repair',false),('landscaping',7,'Landscaping / Gardener',false),('pest-control',8,'Pest Control',true),('locksmith',9,'Locksmith',true),('painter',10,'Painter',false),('garage-door',11,'Garage Door',false),('pool-service',12,'Pool Cleaning & Service',false),('drain-sewer',13,'Drain / Sewer Cleaning',true),('carpenter',14,'Carpenter / Woodwork',false),('drywall',15,'Drywall / Plaster',false),('general-contractor',16,'General Contractor / Remodel',true),('roofing',17,'Roofing',true),('tree-service',18,'Tree Service / Arborist',true),('window-glass',19,'Window / Glass / Screen',false),('flooring',20,'Flooring',false),('tile-grout',21,'Tile / Grout',false),('irrigation',22,'Irrigation / Sprinkler',false),('fence-gate',23,'Fence / Gate Repair',false),('pressure-washing',24,'Pressure Washing / Exterior Cleaning',false),('gutter-drainage',25,'Gutter / Drainage',false),('junk-removal',26,'Junk Removal',false),('moving-help',27,'Moving / Heavy Item Help',false),('water-mold',28,'Water Damage / Mold Remediation',true),('home-security',29,'Home Security / Cameras / Smart Home',true),('solar-ev',30,'Solar / Battery / EV Charger',true),('chimney',31,'Chimney / Fireplace',false),('insulation',32,'Insulation / Weatherproofing',false),('septic',33,'Septic Service',true),('well-pump',34,'Well / Water Pump',true),('other-specialty',35,'Other / Specialty Service',false);

insert into public.country_feature_gates(country_code, feature_key, enabled, legal_approved, billing_approved) values
('US','core_experiences',true,true,false),('US','sponsored_promotion',false,false,false),('US','video_media',false,false,false),
('TW','core_experiences',false,false,false),('TW','sponsored_promotion',false,false,false),('TW','video_media',false,false,false);

commit;
