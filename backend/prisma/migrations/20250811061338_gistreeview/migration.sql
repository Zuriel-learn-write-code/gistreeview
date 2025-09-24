-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'officer', 'user');

-- CreateEnum
CREATE TYPE "TreeStatus" AS ENUM ('good', 'warning', 'danger');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'approved', 'rejected', 'resolved');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "userpic" TEXT,
    "bio" TEXT,
    "address" TEXT,
    "country" TEXT,
    "province" TEXT,
    "city" TEXT,
    "postalcode" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tree" (
    "id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "species" TEXT,
    "age" INTEGER,
    "trunk_diameter" DOUBLE PRECISION,
    "lbranch_width" DOUBLE PRECISION,
    "ownership" TEXT,
    "street_name" TEXT,
    "description" TEXT,
    "status" "TreeStatus" NOT NULL DEFAULT 'good',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road" (
    "id" TEXT NOT NULL,
    "nameroad" TEXT,
    "description" TEXT,

    CONSTRAINT "road_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "treeId" TEXT,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedById" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreePicture" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "uploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreePicture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadPicture" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "roadId" TEXT NOT NULL,
    "uploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadPicture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportPicture" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "uploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportPicture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "tree"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreePicture" ADD CONSTRAINT "TreePicture_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "tree"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadPicture" ADD CONSTRAINT "RoadPicture_roadId_fkey" FOREIGN KEY ("roadId") REFERENCES "road"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportPicture" ADD CONSTRAINT "ReportPicture_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
