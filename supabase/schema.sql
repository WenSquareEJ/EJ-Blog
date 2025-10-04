create type role as enum ('child','parent','guest');
create type post_visibility as enum ('family','public');
create type post_status as enum ('draft','pending','approved','rejected');
create type comment_status as enum ('pending','approved','rejected');
create type reaction_kind as enum ('like','party','idea','heart');

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text,
  role role not null default 'guest',
  allowlisted boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author uuid references profiles(id) on delete cascade,
  title text not null,
  content text not null,
  content_html text,
  content_json jsonb,
  image_url text,
  visibility post_visibility not null default 'family',
  status post_status not null default 'draft',
  created_at timestamptz default now(),
  published_at timestamptz
);

create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  path text not null,
  has_faces boolean default false,
  faces_blurred boolean default true,
  alt_text text
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author uuid references profiles(id) on delete set null,
  content text not null,
  status comment_status not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  target_type text check (target_type in ('post','comment')),
  target_id uuid not null,
  user_id uuid references profiles(id) on delete set null,
  kind reaction_kind not null,
  created_at timestamptz default now()
);

create table if not exists moderation_logs (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  action text check (action in ('approved','rejected','edited')) not null,
  by_parent uuid references profiles(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  frequency text check (frequency in ('instant','daily','weekly')) not null default 'daily'
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  criteria jsonb
);

create table if not exists user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  primary key (user_id, badge_id)
);
