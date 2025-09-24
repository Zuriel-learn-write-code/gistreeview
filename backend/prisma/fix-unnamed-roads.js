import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Scanning roads for OSM-only nameroads to nullify...');

  // Find rows where nameroad looks like 'way/12345' or 'node/12345' or 'relation/12345'
  // Prisma doesn't support regex in filters; use startsWith/contains to find candidates,
  // then validate precisely in JS.
  const patternMatches = await prisma.road.findMany({
    where: {
      OR: [
        { nameroad: { startsWith: 'way/' } },
        { nameroad: { startsWith: 'node/' } },
        { nameroad: { startsWith: 'relation/' } },
        { nameroad: { contains: 'unknown (' } },
      ],
    },
    select: { id: true, nameroad: true, source_osm_id: true },
  });

  console.log('Candidates found:', patternMatches.length);
  if (patternMatches.length === 0) {
    console.log('No rows to update.');
    return;
  }

  let updated = 0;
  for (const r of patternMatches) {
    // If nameroad contains an osm id and source_osm_id is present and matches, clear it.
    const isOsmOnly = r.nameroad && /^(?:way|node|relation)\/\d+$/.test(r.nameroad);
    const isUnknownWithOsm = r.nameroad && /^unknown \((?:way|node|relation)\/\d+\)$/.test(r.nameroad);
    if (isOsmOnly || isUnknownWithOsm) {
      await prisma.road.update({ where: { id: r.id }, data: { nameroad: null } });
      updated++;
      console.log('Cleared nameroad for id', r.id, 'old:', r.nameroad);
    }
  }

  console.log('Updated rows:', updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
