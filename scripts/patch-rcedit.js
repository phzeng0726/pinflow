#!/usr/bin/env node
/**
 * Patches app-builder-lib's winPackager.js to use standalone rcedit binary
 * instead of app-builder.exe's internal rcedit command.
 *
 * Why: app-builder.exe internally downloads winCodeSign-2.6.0.7z which contains
 * macOS symbolic links. On Windows without Developer Mode, 7-Zip fails to
 * extract these symlinks, causing the build to fail.
 *
 * This patch replaces the app-builder rcedit call with a direct call to
 * the rcedit npm package binary, bypassing the winCodeSign download entirely.
 */
const fs = require("fs");
const path = require("path");

const ORIGINAL = `await (0, builder_util_1.executeAppBuilder)(["rcedit", "--args", JSON.stringify(args)], undefined /* child-process */, {}, 3 /* retry three times */);`;

const PATCHED = `// [PATCHED] Use standalone rcedit to avoid winCodeSign symlink issue on Windows
            const _rceditPkg = require("path").dirname(require.resolve("rcedit"));
            const _rceditExe = require("path").join(_rceditPkg, "..", "bin", process.arch === "x64" ? "rcedit-x64.exe" : "rcedit.exe");
            require("child_process").execFileSync(_rceditExe, args, { timeout: 60000 });`;

// Find all winPackager.js in app-builder-lib v26+
const pnpmDir = path.resolve(__dirname, "..", "node_modules", ".pnpm");
if (!fs.existsSync(pnpmDir)) {
  console.log("[patch-rcedit] node_modules/.pnpm not found, skipping");
  process.exit(0);
}

let patched = 0;
for (const entry of fs.readdirSync(pnpmDir)) {
  if (!entry.startsWith("app-builder-lib@26")) continue;
  const wpPath = path.join(
    pnpmDir,
    entry,
    "node_modules",
    "app-builder-lib",
    "out",
    "winPackager.js"
  );
  if (!fs.existsSync(wpPath)) continue;

  let content = fs.readFileSync(wpPath, "utf8");
  if (content.includes("[PATCHED]")) {
    console.log(`[patch-rcedit] ${entry} already patched`);
    continue;
  }
  if (!content.includes(ORIGINAL)) {
    console.log(`[patch-rcedit] ${entry} original code not found, skipping`);
    continue;
  }

  content = content.replace(ORIGINAL, PATCHED);
  fs.writeFileSync(wpPath, content, "utf8");
  console.log(`[patch-rcedit] patched ${entry}`);
  patched++;
}

if (patched === 0) {
  console.log("[patch-rcedit] no files needed patching");
} else {
  console.log(`[patch-rcedit] done, ${patched} file(s) patched`);
}
