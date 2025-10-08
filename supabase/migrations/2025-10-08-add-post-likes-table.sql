-- Create post_likes table for 8 reaction types
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  type text not null check (type in ('diamond','emerald','heart','blaze','brick','star','coin','gear')),
  created_at timestamptz default now()
);

-- Create index for efficient lookups
create index if not exists post_likes_post_id_type_idx on post_likes (post_id, type);
create index if not exists post_likes_post_id_idx on post_likes (post_id);

-- Allow anonymous inserts for likes (since they don't require authentication)
-- and anyone can read counts
create policy "Anyone can insert likes" on post_likes for insert with check (true);
create policy "Anyone can read likes" on post_likes for select using (true);

-- Enable RLS
alter table post_likes enable row level security;