-- AlterTable
ALTER TABLE "Season" RENAME COLUMN "whitelist" TO "includeList";
ALTER TABLE "Season" ADD COLUMN "excludeList" INTEGER[] DEFAULT ARRAY[]::INTEGER[];