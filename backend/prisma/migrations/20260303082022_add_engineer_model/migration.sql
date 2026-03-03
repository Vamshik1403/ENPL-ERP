-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "engineerId" INTEGER,
ADD COLUMN     "engineerTaskId" TEXT;

-- CreateTable
CREATE TABLE "Engineer" (
    "id" SERIAL NOT NULL,
    "engineerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "telegramChatId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Engineer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Engineer_engineerId_key" ON "Engineer"("engineerId");

-- CreateIndex
CREATE UNIQUE INDEX "Engineer_email_key" ON "Engineer"("email");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_engineerId_fkey" FOREIGN KEY ("engineerId") REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
