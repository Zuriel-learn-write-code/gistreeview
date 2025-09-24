import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.road.count({ where: { nameroad: null } });
  console.log('nameroad IS NULL count:', count);

  const sample = await prisma.road.findMany({
    where: { nameroad: null },
    select: { id: true, nameroad: true, source_osm_id: true },
    take: 10,
  });
  console.log('Sample rows (up to 10):', sample);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
