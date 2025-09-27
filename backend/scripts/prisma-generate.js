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
    console.error('Prisma binary not found at', prismaBin);
    process.exit(1);
  }
} catch (err) {
  console.error('Unexpected error in prisma-generate script:', err);
  process.exit(1);
}
