/*
  Warnings:

  - Added the required column `workscopeCategoryId` to the `TasksWorkscopeDetails` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add the column as nullable first
ALTER TABLE "TasksWorkscopeDetails" ADD COLUMN "workscopeCategoryId" INTEGER;

-- Step 2: Update existing records with a default workscope category (assuming ID 1 exists)
UPDATE "TasksWorkscopeDetails" SET "workscopeCategoryId" = 1 WHERE "workscopeCategoryId" IS NULL;

-- Step 3: Make the column NOT NULL
ALTER TABLE "TasksWorkscopeDetails" ALTER COLUMN "workscopeCategoryId" SET NOT NULL;

-- Step 4: Add the foreign key constraint
ALTER TABLE "TasksWorkscopeDetails" ADD CONSTRAINT "TasksWorkscopeDetails_workscopeCategoryId_fkey" FOREIGN KEY ("workscopeCategoryId") REFERENCES "WorkscopeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
