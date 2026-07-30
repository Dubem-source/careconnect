-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "department" TEXT;
