// Cross-platform launcher for demo mode (works on Windows, macOS, Linux). No dependency.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const next = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [next, "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_DEMO: "1", NEXT_PUBLIC_HA_URL: "https://ha.example.ch" },
});
child.on("exit", (code) => process.exit(code ?? 0));
