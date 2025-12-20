-- AlterTable
ALTER TABLE "Completion" ADD COLUMN     "season" TEXT;

-- CreateTable
CREATE TABLE "Seasons" (
    "id" SERIAL NOT NULL,
    "seasonName" TEXT NOT NULL,

    CONSTRAINT "Seasons_pkey" PRIMARY KEY ("id")
);
