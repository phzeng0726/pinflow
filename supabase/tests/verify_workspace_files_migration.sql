do $$
declare
  constraint_definition text;
  policy_count integer;
begin
  if to_regclass('public.workspace_files') is null then
    raise exception 'workspace_files table is missing';
  end if;

  if (
    select count(*)
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'workspace_files'
      and (
        (column_name = 'user_id' and data_type = 'uuid' and is_nullable = 'NO')
        or (column_name = 'path' and data_type = 'text' and is_nullable = 'NO')
        or (column_name = 'content' and data_type = 'jsonb' and is_nullable = 'NO')
        or (
          column_name = 'updated_at'
          and data_type = 'timestamp with time zone'
          and is_nullable = 'NO'
          and column_default = 'now()'
        )
      )
  ) <> 4 then
    raise exception 'workspace_files columns do not match the REST contract';
  end if;

  select pg_get_constraintdef(oid)
  into constraint_definition
  from pg_constraint
  where conrelid = 'public.workspace_files'::regclass
    and contype = 'p';

  if constraint_definition <> 'PRIMARY KEY (user_id, path)' then
    raise exception 'unexpected primary key: %', constraint_definition;
  end if;

  select pg_get_constraintdef(oid)
  into constraint_definition
  from pg_constraint
  where conrelid = 'public.workspace_files'::regclass
    and contype = 'f';

  if constraint_definition not like
    'FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE'
  then
    raise exception 'unexpected foreign key: %', constraint_definition;
  end if;

  if not (
    select relrowsecurity
    from pg_class
    where oid = 'public.workspace_files'::regclass
  ) then
    raise exception 'row-level security is disabled';
  end if;

  select count(*)
  into policy_count
  from pg_policies
  where schemaname = 'public'
    and tablename = 'workspace_files'
    and policyname = 'Users manage their own workspace files'
    and cmd = 'ALL'
    and qual = '(auth.uid() = user_id)'
    and with_check = '(auth.uid() = user_id)';

  if policy_count <> 1 then
    raise exception 'expected one per-user RLS policy, got %', policy_count;
  end if;

  if exists (
    select 1
    from auth.users
    where id = '00000000-0000-0000-0000-000000000001'
  ) and not exists (
    select 1
    from public.workspace_files
    where user_id = '00000000-0000-0000-0000-000000000001'
      and path = 'manifest.json'
      and content = '{"name":"preserved"}'::jsonb
      and updated_at = '2024-01-02T03:04:05Z'::timestamptz
  ) then
    raise exception 'legacy workspace row was changed or deleted';
  end if;
end
$$;
