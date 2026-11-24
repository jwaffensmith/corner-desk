-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('TODO', 'DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "Track" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weeklyTargetMin" INTEGER NOT NULL DEFAULT 45,
    "countsTowardStudy" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrepSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "targetHours" INTEGER NOT NULL DEFAULT 100,
    "weeklyTargetMin" INTEGER NOT NULL DEFAULT 180,
    "weeklyStretchMin" INTEGER NOT NULL DEFAULT 240,
    "assessmentEvery" INTEGER NOT NULL DEFAULT 4,

    CONSTRAINT "PrepSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "milestone" TEXT,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "objectives" TEXT[],
    "estimatedMin" INTEGER NOT NULL,
    "resources" JSONB NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL,
    "isSupplementary" BOOLEAN NOT NULL DEFAULT false,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'TODO',
    "completedAt" TIMESTAMP(3),
    "actualMin" INTEGER,
    "confidence" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Track_slug_key" ON "Track"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Week_number_key" ON "Week"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_key_key" ON "Assignment"("key");

-- CreateIndex
CREATE INDEX "Assignment_weekId_sortOrder_idx" ON "Assignment"("weekId", "sortOrder");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

