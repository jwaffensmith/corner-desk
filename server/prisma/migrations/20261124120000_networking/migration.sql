-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('REGISTERED', 'ATTENDED', 'SKIPPED');

-- CreateTable
CREATE TABLE "NetworkingSettings" (
    "userId" TEXT NOT NULL,
    "eventsPerMonth" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NetworkingSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "NetworkingEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "location" TEXT,
    "url" TEXT,
    "notes" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NetworkingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NetworkingEvent_userId_date_idx" ON "NetworkingEvent"("userId", "date");

-- AddForeignKey
ALTER TABLE "NetworkingSettings" ADD CONSTRAINT "NetworkingSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkingEvent" ADD CONSTRAINT "NetworkingEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
