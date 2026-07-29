@echo off
setlocal

set "REPO_ROOT=%~dp0.."

echo === [1/3] Building Go backend ===
pushd "%REPO_ROOT%\backend"
set "GO_LDFLAGS="
if defined PINFLOW_SUPABASE_URL set "GO_LDFLAGS=%GO_LDFLAGS% -X pinflow/sync.defaultSupabaseURL=%PINFLOW_SUPABASE_URL%"
if defined PINFLOW_SUPABASE_ANON_KEY set "GO_LDFLAGS=%GO_LDFLAGS% -X pinflow/sync.defaultSupabaseAnonKey=%PINFLOW_SUPABASE_ANON_KEY%"
go build -ldflags "%GO_LDFLAGS%" -o "%REPO_ROOT%\electron\resources\pinflow-backend.exe" .
if errorlevel 1 goto :fail
popd

echo === [2/3] Building frontend ===
pushd "%REPO_ROOT%\frontend"
set "ELECTRON_BUILD=1"
call pnpm build
if errorlevel 1 goto :fail
popd

echo === [3/3] Packaging with electron-builder ===
pushd "%REPO_ROOT%"
call npx electron-builder --win
if errorlevel 1 goto :fail
popd

echo === Done! Installer is in dist-electron/ ===
goto :eof

:fail
echo === Build failed! ===
popd
exit /b 1
