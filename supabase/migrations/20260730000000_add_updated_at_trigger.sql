create or replace function public.set_workspace_files_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_workspace_files_updated_at on public.workspace_files;

create trigger set_workspace_files_updated_at
before insert or update on public.workspace_files
for each row
execute function public.set_workspace_files_updated_at();
