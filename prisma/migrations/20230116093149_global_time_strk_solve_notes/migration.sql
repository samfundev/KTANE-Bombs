-- AlterTable
ALTER TABLE "Completion" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Mission" ADD COLUMN     "strikeMode" TEXT,
ADD COLUMN     "timeMode" TEXT;
