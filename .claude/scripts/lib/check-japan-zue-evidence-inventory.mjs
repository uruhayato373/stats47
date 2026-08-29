#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const commands = [
  ["npm", ["run", "evidence:resolve", "--", "--check"]],
  ["npm", ["run", "evidence:validate"]],
  ["npm", ["run", "evidence:coverage", "--", "--check"]],
  ["npm", ["run", "evidence:test"]],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: "0" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Japan Zue evidence inventory gate: clean");
