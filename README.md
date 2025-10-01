# Kid-Safe Blog (Next.js 14 + Supabase)

Family-only blog with pre-moderation, reactions, calendar archive, and email digests. Includes **Banner** and **Logo** placeholders.

## 1) Setup
1. **Create Supabase project** → copy URL + keys.
2. **Storage**: create a bucket named `images` (public).
3. Run SQL: `supabase/schema.sql` and `supabase/policies.sql` in SQL editor.
4. (Optional) Seed: update emails in `supabase/seed.sql` → run.
5. Copy `.env.local.example` to `.env.local` and fill values.
6. `npm i` → `npm run dev`.

## 2) Calendar counts function
Create this Postgres function:
```sql
create or replace function posts_per_day(from_ts timestamptz, to_ts timestamptz)
returns table(day int, count int) language sql as $$
  select extract(day from published_at)::int as day, count(*)::int
  from posts
  where status='approved' and published_at between from_ts and to_ts
  group by 1 order by 1;
$$;
```

## 3) Emails
- Resend optional; if unset, functions are no-ops.
- Add a daily Vercel Cron to POST `/api/digest`.

## 4) Deploy
- Push to GitHub → Import to Vercel.
- Add env vars in Vercel project settings.
- Point your custom domain to Vercel.
