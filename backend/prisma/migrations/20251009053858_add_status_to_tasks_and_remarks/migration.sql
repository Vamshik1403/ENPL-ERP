-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Open';

-- AlterTable
ALTER TABLE "TasksRemarks" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Open';
