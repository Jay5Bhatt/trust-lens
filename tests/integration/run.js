#!/usr/bin/env node

/**
 * Integration test runner
 * This script runs integration tests against a running API server
 * 
 * Usage:
 *   API_URL=http://localhost:3000 node tests/integration/run.js
 */

import { run } from "vitest/node";

const apiUrl = process.env.API_URL || "http://localhost:3000";

console.log(`Running integration tests against: ${apiUrl}`);

run({
  config: {
    test: {
      include: ["tests/integration/**/*.test.ts"],
      environment: "node",
    },
  },
  env: {
    API_URL: apiUrl,
  },
}).then((exitCode) => {
  process.exit(exitCode);
});


