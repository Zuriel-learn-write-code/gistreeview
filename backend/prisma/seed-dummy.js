// Script untuk mengisi dummy data tree, road, dan report ke database menggunakan Prisma Client
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Hapus data lama
  await prisma.roadPicture.deleteMany();
  await prisma.reportPicture.deleteMany();
  await prisma.treePicture.deleteMany();
  await prisma.report.deleteMany();
  await prisma.road.deleteMany();
  await prisma.tree.deleteMany();
  // Dummy data untuk kota Ambon
  const ambonLat = -3.695;
  const ambonLng = 128.181;

  // Insert 20 trees dan treepictures sekalian
  const treeIds = [];
  for (let i = 1; i <= 20; i++) {
    const tree = await prisma.tree.create({
      data: {
        latitude: ambonLat + Math.random() * 0.05,
        longitude: ambonLng + Math.random() * 0.05,
        species: `Tree Species ${i}`,
        age: 5 + Math.floor(Math.random() * 50),
        trunk_diameter: 10 + Math.random() * 30,
        lbranch_width: 2 + Math.random() * 10,
        ownership: "Pemerintah Kota Ambon",
        street_name: `Jalan Pohon ${i}`,
        description: `Pohon nomor ${i} di Ambon`,
        status: ["good", "warning", "danger"][Math.floor(Math.random() * 3)],
      },
    });
    treeIds.push(tree.id);
    // Insert treepicture dummy
    await prisma.treePicture.create({
      data: {
        url: `/uploads/tree/tree${(i % 5) + 1}.jpg`,
        treeId: tree.id,
      },
    });
  }

  // Insert 20 roads dan roadpictures sekalian
  const roadIds = [];
  for (let i = 1; i <= 20; i++) {
    const road = await prisma.road.create({
      data: {
        nameroad: `Jalan Utama ${i}`,
        description: `Jalan utama nomor ${i} di Ambon`,
      },
    });
    roadIds.push(road.id);
    // Insert roadpicture dummy
    await prisma.roadPicture.create({
      data: {
        url: `/uploads/road/road${(i % 5) + 1}.jpg`,
        roadId: road.id,
      },
    });
  }

  // Ambil user untuk relasi report
  const users = await prisma.user.findMany({ take: 5 });

  // Insert 20 reports dan reportpictures sekalian
  for (let i = 1; i <= 20; i++) {
    const report = await prisma.report.create({
      data: {
        userId: users[i % users.length]?.id,
        treeId: treeIds[i % treeIds.length],
        description: `Laporan pohon ${i} di Ambon`,
        status: ["pending", "approved", "rejected", "resolved"][
          Math.floor(Math.random() * 4)
        ],
      },
    });
    // Insert reportpicture dummy
    await prisma.reportPicture.create({
      data: {
        url: `/uploads/report/report${(i % 5) + 1}.jpg`,
        reportId: report.id,
      },
    });
  }

  console.log("Dummy data inserted!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
