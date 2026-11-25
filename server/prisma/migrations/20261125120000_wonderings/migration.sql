-- CreateEnum
CREATE TYPE "BookNoteKind" AS ENUM ('NOTE', 'TAKEAWAY', 'WONDERING');

-- AlterTable
ALTER TABLE "BookNote" ADD COLUMN "kind" "BookNoteKind" NOT NULL DEFAULT 'NOTE',
ADD COLUMN "answer" TEXT;

-- Carry starred notes over before the flag goes.
UPDATE "BookNote" SET "kind" = 'TAKEAWAY' WHERE "isTakeaway";

-- AlterTable
ALTER TABLE "BookNote" DROP COLUMN "isTakeaway";
