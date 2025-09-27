#!/usr/bin/env node
import { chmodSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

const prismaBin = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');

try {
  if (existsSync(prismaBin)) {
    // Try to make it executable
    try {
      chmodSync(prismaBin, 0o755);
      console.log('Made prisma binary executable.');
    } catch (e) {
      console.warn('Could not chmod prisma binary:', e.message);
    }

    // Run prisma generate
    const res = spawnSync(prismaBin, ['generate'], { stdio: 'inherit' });
    if (res.error) {
      console.error('Error running prisma generate:', res.error);
      process.exit(1);
    }
    process.exit(res.status || 0);
    } else {
    console.warn('Prisma binary not found at', prismaBin, '- skipping prisma generate (likely running in production without devDependencies).');
    // Do not fail the install when prisma is not present (e.g., production installs that skip devDependencies).
    process.exit(0);
  }
} catch (err) {
  console.error('Unexpected error in prisma-generate script:', err);
  process.exit(1);
}
