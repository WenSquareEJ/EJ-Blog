import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import supabaseServer from '@/lib/supabaseServer';
import supabaseAdmin from '@/lib/supabaseAdmin';
import type { Database } from '@/lib/database.types';

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

type ResolveRequest = {
  email?: string;
};

type ResolveSuccess = {
  kind: 'success';
  userId: string;
};

type ResolveNotFound = {
  kind: 'not_found';
};

type ResolveMultiple = {
  kind: 'multiple';
};

type ResolveResult = ResolveSuccess | ResolveNotFound | ResolveMultiple;

async function resolveUserIdByEmail(
  email: string,
  client: SupabaseClient<Database>,
): Promise<ResolveResult> {
  const normalized = email.toLowerCase();
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 200 });

  if (error) {
    throw new Error(error.message);
  }

  const users: User[] = data?.users ?? [];
  const matches = users.filter((candidate) => candidate.email?.toLowerCase() === normalized);

  if (matches.length === 0) {
    return { kind: 'not_found' };
  }

  if (matches.length > 1) {
    return { kind: 'multiple' };
  }

  return { kind: 'success', userId: matches[0].id };
}

export async function POST(request: Request) {
  const sb = supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (!ADMIN_EMAIL || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as ResolveRequest | null;
  const email = payload?.email?.trim();

  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const adminClient = supabaseAdmin();

  let result: ResolveResult;
  try {
    result = await resolveUserIdByEmail(email, adminClient);
  } catch (error) {
    console.error('[badges/resolve-user] Failed to list users', error);
    return NextResponse.json({ error: 'Failed to look up user' }, { status: 500 });
  }

  if (result.kind === 'not_found') {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (result.kind === 'multiple') {
    return NextResponse.json({ error: 'Multiple users matched' }, { status: 400 });
  }

  return NextResponse.json({ user_id: result.userId });
}
