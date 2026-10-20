-- ==============================================================================
-- Public Service Request System - Supabase Schema
-- ==============================================================================

-- 1. PROFILES TABLE
-- Extends auth.users with public profile information and role-based access.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  id_number text check (id_number is null or id_number ~ '^[0-9]{8}$'),
  date_of_birth date,
  phone text,
  role text not null default 'citizen' check (role in ('citizen', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent column additions in case table already existed
alter table public.profiles add column if not exists id_number text;
alter table public.profiles add column if not exists date_of_birth date;

-- 2. SERVICE REQUESTS TABLE
-- Stores citizen requests with category, location, description, status and image.
create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('streetlight', 'water', 'garbage', 'roads', 'health', 'education', 'other')),
  location text not null,
  description text not null,
  image_url text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotent constraint update for existing databases when categories expand
alter table public.service_requests drop constraint if exists service_requests_category_check;
alter table public.service_requests add constraint service_requests_category_check 
  check (category in ('streetlight', 'water', 'garbage', 'roads', 'health', 'education', 'other'));

-- 3. INDEXES FOR PERFORMANCE
create index if not exists idx_service_requests_citizen_id on public.service_requests(citizen_id);
create index if not exists idx_service_requests_status on public.service_requests(status);
create index if not exists idx_service_requests_created_at on public.service_requests(created_at desc);

-- 4. SECURITY DEFINER HELPER: is_admin()
-- Evaluates if the executing user has the 'admin' role without triggering RLS recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5. AUTOMATIC PROFILE CREATION TRIGGER
-- When a user signs up via Supabase Auth, their profile is automatically populated.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, id_number, date_of_birth, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Citizen'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'id_number',
    case 
      when new.raw_user_meta_data->>'date_of_birth' is not null and new.raw_user_meta_data->>'date_of_birth' != '' 
      then (new.raw_user_meta_data->>'date_of_birth')::date 
      else null 
    end,
    'citizen' -- All public registrations are citizens by default
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. UPDATED_AT TRIGGER
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_service_requests_updated_at on public.service_requests;
create trigger set_service_requests_updated_at
  before update on public.service_requests
  for each row execute function public.handle_updated_at();

-- 7. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.service_requests enable row level security;

-- Profiles Policies
drop policy if exists "Users can view own profile or admins view all" on public.profiles;
create policy "Users can view own profile or admins view all"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Backfill any existing users in auth.users that don't have a profile row
insert into public.profiles (id, full_name, phone, role)
select 
  id, 
  coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'Citizen'),
  raw_user_meta_data->>'phone',
  'citizen'
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- Defense in depth: Restrict updateable columns for authenticated users
-- Prevents privilege escalation where citizens attempt to alter their own 'role'
revoke update on public.profiles from authenticated;
grant update (full_name, phone, id_number, date_of_birth) on public.profiles to authenticated;

-- Service Requests Policies
drop policy if exists "Citizens can view own requests, admins can view all" on public.service_requests;
create policy "Citizens can view own requests, admins can view all"
  on public.service_requests
  for select
  using (auth.uid() = citizen_id or public.is_admin());

-- Enforce that new requests must belong to the citizen AND always start as 'pending'
drop policy if exists "Citizens can create their own requests" on public.service_requests;
create policy "Citizens can create their own requests"
  on public.service_requests
  for insert
  with check (auth.uid() = citizen_id and status = 'pending');

drop policy if exists "Admins can update request status" on public.service_requests;
create policy "Admins can update request status"
  on public.service_requests
  for update
  using (public.is_admin())
  with check (public.is_admin());

-- 8. STORAGE BUCKET & STORAGE POLICIES
insert into storage.buckets (id, name, public)
values ('request-images', 'request-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read access for request images" on storage.objects;
create policy "Public read access for request images"
  on storage.objects for select
  using (bucket_id = 'request-images');

drop policy if exists "Authenticated users can upload images to their own folder" on storage.objects;
create policy "Authenticated users can upload images to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'request-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ==============================================================================
-- ADMIN PROMOTION INSTRUCTIONS:
-- To promote a citizen to an admin after they sign up, run this in Supabase SQL editor:
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');
-- ==============================================================================
