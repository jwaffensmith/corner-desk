-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Track" ADD COLUMN "userId" TEXT;
ALTER TABLE "Week" ADD COLUMN "userId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN "userId" TEXT;
ALTER TABLE "PrepSettings" ADD COLUMN "userId" TEXT;

-- Data that predates accounts goes to a placeholder owner. `npm run claim-data -w server`
-- puts a real email on it, and the first OAuth sign-in with that email takes it over.
INSERT INTO "User" ("id", "name", "email", "emailVerified", "updatedAt")
SELECT 'legacy-owner', 'Owner', 'owner@cornerdesk.invalid', true, CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "Track")
   OR EXISTS (SELECT 1 FROM "Week")
   OR EXISTS (SELECT 1 FROM "PrepSettings");

UPDATE "Track" SET "userId" = 'legacy-owner';
UPDATE "Week" SET "userId" = 'legacy-owner';
UPDATE "Assignment" SET "userId" = 'legacy-owner';
UPDATE "PrepSettings" SET "userId" = 'legacy-owner';

-- AlterTable
ALTER TABLE "Track" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Week" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Assignment" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "PrepSettings" DROP CONSTRAINT "PrepSettings_pkey",
DROP COLUMN "id",
ALTER COLUMN "userId" SET NOT NULL,
ADD CONSTRAINT "PrepSettings_pkey" PRIMARY KEY ("userId");

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_trackId_fkey";
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_weekId_fkey";

-- DropIndex
DROP INDEX "Assignment_key_key";
DROP INDEX "Track_slug_key";
DROP INDEX "Week_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE UNIQUE INDEX "Assignment_userId_key_key" ON "Assignment"("userId", "key");
CREATE UNIQUE INDEX "Track_userId_slug_key" ON "Track"("userId", "slug");
CREATE UNIQUE INDEX "Track_id_userId_key" ON "Track"("id", "userId");
CREATE UNIQUE INDEX "Week_userId_number_key" ON "Week"("userId", "number");
CREATE UNIQUE INDEX "Week_id_userId_key" ON "Week"("id", "userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Track" ADD CONSTRAINT "Track_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PrepSettings" ADD CONSTRAINT "PrepSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Week" ADD CONSTRAINT "Week_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_weekId_userId_fkey" FOREIGN KEY ("weekId", "userId") REFERENCES "Week"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_trackId_userId_fkey" FOREIGN KEY ("trackId", "userId") REFERENCES "Track"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;
