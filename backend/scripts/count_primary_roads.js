import prisma from '../src/prismaClient.js';

(async () => {
  try {
    const cnt = await prisma.road.count({ where: { status: 'primary' } });
    console.log('PRIMARY_ROADS_COUNT:', cnt);
  } catch (err) {
    console.error('Error counting primary roads:', err);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
})();
