@echo off
setlocal

set "REPO_ROOT=%~dp0.."

echo === [1/3] Building Go backend ===
pushd "%REPO_ROOT%\backend"
go build -o "%REPO_ROOT%\electron\resources\pinflow-backend.exe" .
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
