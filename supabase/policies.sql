alter table profiles enable row level security;
alter table posts enable row level security;
alter table images enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;
alter table moderation_logs enable row level security;
alter table subscriptions enable row level security;

create policy "profiles_self_read" on profiles for select using (auth.uid() = id);
create policy "profiles_parents_read" on profiles for select using ((select role from profiles where id = auth.uid()) = 'parent');
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);

create policy "posts_read_family" on posts for select using (
  (exists (select 1 from profiles p where p.id = auth.uid() and p.allowlisted))
  and status = 'approved' and visibility = 'family'
);
create policy "posts_read_public" on posts for select using (
  status = 'approved' and visibility = 'public'
);
create policy "posts_parents_all" on posts for select using ((select role from profiles where id = auth.uid()) = 'parent');

create policy "posts_child_insert" on posts for insert with check (
  (select role from profiles where id = auth.uid()) = 'child'
);
create policy "posts_child_update_own" on posts for update using (
  (select role from profiles where id = auth.uid()) = 'child' and author = auth.uid() and status in ('draft','pending')
);
create policy "posts_parents_moderate" on posts for update using (
  (select role from profiles where id = auth.uid()) = 'parent'
);

create policy "comments_read" on comments for select using (
  status = 'approved' or (select role from profiles where id = auth.uid()) = 'parent'
);
create policy "comments_insert_allowlisted" on comments for insert with check (
  (select allowlisted from profiles where id = auth.uid()) = true
);
create policy "comments_parents_moderate" on comments for update using (
  (select role from profiles where id = auth.uid()) = 'parent'
);

create policy "reactions_insert" on reactions for insert with check (
  (select allowlisted from profiles where id = auth.uid()) = true
);
create policy "reactions_read" on reactions for select using (true);

create policy "images_read" on images for select using (
  exists (
    select 1 from posts where posts.id = images.post_id and posts.status = 'approved' and (
      posts.visibility = 'public' or (
        posts.visibility = 'family' and (select allowlisted from profiles where id = auth.uid()) = true
      ) or (select role from profiles where id = auth.uid()) = 'parent'
    )
  )
);
create policy "images_write_authors_or_parents" on images for insert with check (
  (select role from profiles where id = auth.uid()) in ('child','parent')
);

create policy "subscriptions_self" on subscriptions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
