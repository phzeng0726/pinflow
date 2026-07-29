param(
    [string]$Container = "pinflow-test-db",
    [string]$Image = "postgres:17-alpine",
    [int]$Port = 5433,
    [string]$Database = "pinflow_test",
    [string]$DatabaseUser = "test_user",
    [string]$DatabasePassword = "test_pass"
)

$ErrorActionPreference = "Stop"

$migrationSQL = Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $PSScriptRoot "../supabase/migrations/20260729000000_create_workspace_files.sql"
)
$verificationSQL = Get-Content -Raw -Encoding UTF8 -LiteralPath (
    Join-Path $PSScriptRoot "../supabase/tests/verify_workspace_files_migration.sql"
)

$authSQL = @'
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid()
returns uuid
language sql
stable
as $$
  select null::uuid
$$;
'@

$legacySQL = @'
create table public.workspace_files (
  user_id uuid not null references auth.users(id) on delete cascade,
  path text not null,
  content jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

alter table public.workspace_files enable row level security;

create policy "Users manage their own workspace files"
  on public.workspace_files
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

insert into auth.users (id)
values ('00000000-0000-0000-0000-000000000001');

insert into public.workspace_files (user_id, path, content, updated_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'manifest.json',
  '{"name":"preserved"}',
  '2024-01-02T03:04:05Z'
);
'@

function Invoke-Docker {
    param([string[]]$Arguments)

    $output = & docker @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "docker $($Arguments -join ' ') failed:`n$($output -join [Environment]::NewLine)"
    }
}

function Invoke-SQL {
    param(
        [string]$TargetDatabase,
        [string]$SQL
    )

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = $SQL | & docker exec -i $Container psql `
            -v ON_ERROR_STOP=1 `
            -U $DatabaseUser `
            -d $TargetDatabase `
            -f - 2>&1
        $exitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousPreference
    }

    if ($exitCode -ne 0) {
        throw "SQL failed for ${TargetDatabase}:`n$($output -join [Environment]::NewLine)"
    }
}

function New-TestDatabase {
    param([string]$Name)
    Invoke-Docker @("exec", $Container, "createdb", "-U", $DatabaseUser, $Name)
}

function Invoke-MigrationScenario {
    param(
        [string]$TargetDatabase,
        [string]$SetupSQL
    )

    New-TestDatabase $TargetDatabase
    Invoke-SQL $TargetDatabase $authSQL
    if ($SetupSQL) {
        Invoke-SQL $TargetDatabase $SetupSQL
    }
    Invoke-SQL $TargetDatabase $migrationSQL
    Invoke-SQL $TargetDatabase $migrationSQL
    Invoke-SQL $TargetDatabase $verificationSQL
}

try {
    try {
        & docker rm -f $Container 2>&1 | Out-Null
    }
    catch {
        # The exact test container may not exist before a run.
    }

    Write-Host "Starting $Image on localhost:$Port..."
    Invoke-Docker @(
        "run", "-d",
        "--name", $Container,
        "-e", "POSTGRES_DB=$Database",
        "-e", "POSTGRES_USER=$DatabaseUser",
        "-e", "POSTGRES_PASSWORD=$DatabasePassword",
        "-p", "${Port}:5432",
        $Image
    )

    $deadline = (Get-Date).AddSeconds(30)
    do {
        & docker exec $Container pg_isready -U $DatabaseUser -d $Database *> $null
        if ($LASTEXITCODE -eq 0) {
            break
        }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)

    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL did not become ready within 30 seconds"
    }

    Write-Host "Testing a fresh schema..."
    Invoke-MigrationScenario "pinflow_migration_fresh" ""

    Write-Host "Testing a legacy schema with existing data..."
    Invoke-MigrationScenario "pinflow_migration_legacy" $legacySQL

    Write-Host "Supabase migration verification passed."
}
finally {
    Write-Host "Removing migration test database container..."
    try {
        & docker rm -f $Container 2>&1 | Out-Null
    }
    catch {
        # Cleanup is idempotent when startup failed.
    }
}
