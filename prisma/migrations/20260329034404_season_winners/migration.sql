-- AlterTable
ALTER TABLE "Season" ADD COLUMN     "winners" TEXT[] DEFAULT ARRAY[]::TEXT[];
