-- =============================================================
-- Argent: Initial Schema
-- =============================================================

-- Enable moddatetime extension (auto-update updated_at columns)
create extension if not exists moddatetime with schema extensions;

-- =============================================================
-- Enums
-- =============================================================

create type user_tier as enum ('free', 'pro');
create type film_format as enum ('35mm', '120', '4x5', '8x10', 'instant', 'other');
create type film_process as enum ('C-41', 'E-6', 'BW', 'BW-C41', 'other');
create type roll_status as enum ('loaded', 'active', 'finished', 'developed', 'scanned', 'archived');
create type metering_mode as enum ('spot', 'center', 'matrix', 'incident', 'sunny16');

-- =============================================================
-- Tables
-- =============================================================

-- User profiles (auto-created on signup via trigger)
create table user_profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  tier       user_tier not null default 'free',
  display_name text,
  copyright_notice text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_profiles enable row level security;

create policy "Users read own profile"
  on user_profiles for select
  using (id = auth.uid());

create policy "Users update own profile"
  on user_profiles for update
  using (id = auth.uid());

create trigger user_profiles_moddatetime
  before update on user_profiles
  for each row execute function extensions.moddatetime(updated_at);

-- Waitlist (pricing page Pro waitlist)
create table waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

-- No select/update/delete policies — insert only via server action
create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);

-- Cameras
create table cameras (
  id                  text primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  name                text not null,
  make                text not null default '',
  format              film_format not null default '35mm',
  default_frame_count integer not null default 36,
  notes               text,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table cameras enable row level security;

create policy "Users CRUD own cameras"
  on cameras for all
  using (user_id = auth.uid());

create index cameras_user_id_idx on cameras (user_id);
create index cameras_user_active_idx on cameras (user_id) where deleted_at is null;

create trigger cameras_moddatetime
  before update on cameras
  for each row execute function extensions.moddatetime(updated_at);

-- Lenses
create table lenses (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  camera_id    text,
  name         text not null,
  make         text not null default '',
  focal_length real,
  max_aperture real,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table lenses enable row level security;

create policy "Users CRUD own lenses"
  on lenses for all
  using (user_id = auth.uid());

create index lenses_user_id_idx on lenses (user_id);
create index lenses_user_active_idx on lenses (user_id) where deleted_at is null;
create index lenses_camera_id_idx on lenses (camera_id);

create trigger lenses_moddatetime
  before update on lenses
  for each row execute function extensions.moddatetime(updated_at);

-- Films (user-created custom stocks)
create table films (
  id         text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  brand      text not null,
  name       text not null,
  iso        integer not null,
  format     film_format not null default '35mm',
  process    film_process not null default 'C-41',
  is_custom  boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table films enable row level security;

create policy "Users CRUD own films"
  on films for all
  using (user_id = auth.uid());

create index films_user_id_idx on films (user_id);
create index films_user_active_idx on films (user_id) where deleted_at is null;

create trigger films_moddatetime
  before update on films
  for each row execute function extensions.moddatetime(updated_at);

-- Rolls
create table rolls (
  id           text primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  camera_id    text not null,
  film_id      text not null,
  lens_id      text,
  status       roll_status not null default 'loaded',
  frame_count  integer not null default 36,
  ei           integer,
  push_pull    integer not null default 0,
  lab_name     text,
  dev_notes    text,
  start_date   timestamptz not null default now(),
  finish_date  timestamptz,
  develop_date timestamptz,
  scan_date    timestamptz,
  notes        text,
  deleted_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table rolls enable row level security;

create policy "Users CRUD own rolls"
  on rolls for all
  using (user_id = auth.uid());

create index rolls_user_id_idx on rolls (user_id);
create index rolls_user_status_idx on rolls (user_id, status);
create index rolls_user_active_idx on rolls (user_id) where deleted_at is null;
create index rolls_camera_id_idx on rolls (camera_id);
create index rolls_film_id_idx on rolls (film_id);

create trigger rolls_moddatetime
  before update on rolls
  for each row execute function extensions.moddatetime(updated_at);

-- Frames
create table frames (
  id              text primary key,
  roll_id         text not null references rolls(id) on delete cascade,
  frame_number    integer not null,
  shutter_speed   text,
  aperture        real,
  lens_id         text,
  metering_mode   metering_mode,
  exposure_comp   real,
  filter          text,
  latitude        double precision,
  longitude       double precision,
  location_name   text,
  notes           text,
  image_url       text,
  captured_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table frames enable row level security;

-- Frames RLS: join through rolls to check user_id
create policy "Users CRUD own frames"
  on frames for all
  using (
    exists (
      select 1 from rolls
      where rolls.id = frames.roll_id
        and rolls.user_id = auth.uid()
    )
  );

create index frames_roll_id_idx on frames (roll_id);
create unique index frames_roll_frame_idx on frames (roll_id, frame_number);

create trigger frames_moddatetime
  before update on frames
  for each row execute function extensions.moddatetime(updated_at);

-- =============================================================
-- Auto-create user_profiles on signup
-- =============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.user_profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- Storage: reference images bucket
-- =============================================================

insert into storage.buckets (id, name, public)
values ('reference-images', 'reference-images', false);

-- Users can upload to their own folder
create policy "Users upload own images"
  on storage.objects for insert
  with check (
    bucket_id = 'reference-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own images
create policy "Users read own images"
  on storage.objects for select
  using (
    bucket_id = 'reference-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own images
create policy "Users delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'reference-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
