const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS c FROM "road" WHERE geom IS NOT NULL');
    console.log('geom non-null count:', res[0].c);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
