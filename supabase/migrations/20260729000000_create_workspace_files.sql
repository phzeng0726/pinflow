create table if not exists public.workspace_files (
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

alter table public.workspace_files enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_files'
      and policyname = 'Users manage their own workspace files'
  ) then
    create policy "Users manage their own workspace files"
      on public.workspace_files
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;
