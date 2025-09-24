// clean-roads.js
// Deletes all rows from the `road` table. Supports --dry-run
// Usage: from backend/ folder: node prisma/clean-roads.js [--dry-run]
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
  const count = await prisma.road.count();
  console.log('Road rows currently in DB:', count);
  if (count === 0) {
    console.log('Nothing to delete.');
    return;
  }

  if (dryRun) {
    console.log('[dry-run] would delete all rows from road');
    return;
  }

  const deleted = await prisma.road.deleteMany({});
  console.log('Deleted rows:', deleted.count);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
