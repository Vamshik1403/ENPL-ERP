/*
  Warnings:

  - A unique constraint covering the columns `[taskID]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ServiceContract" ADD COLUMN     "amcType" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "ServiceContractType" (
    "id" SERIAL NOT NULL,
    "serviceContractType" TEXT NOT NULL,
    "serviceContractId" INTEGER NOT NULL,
    "billingType" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "billingDueDate" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,

    CONSTRAINT "ServiceContractType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContractBilling" (
    "id" SERIAL NOT NULL,
    "serviceContractTypeId" INTEGER NOT NULL,
    "dueDate" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "overdueDays" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ServiceContractBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentEmail" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "DepartmentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskInventory" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "serviceContractId" INTEGER NOT NULL,
    "productTypeId" INTEGER NOT NULL,
    "makeModel" TEXT,
    "snMac" TEXT,
    "description" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "warrantyPeriod" TEXT,
    "warrantyStatus" TEXT,
    "thirdPartyPurchase" BOOLEAN,

    CONSTRAINT "TaskInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskImage" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "designation" TEXT,
    "contactNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicketUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMapping" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,
    "supportTicketUserId" INTEGER NOT NULL,

    CONSTRAINT "SupportTicketMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "ticketID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "designation" TEXT,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,
    "description" TEXT,
    "supportType" TEXT NOT NULL,
    "prority" TEXT,
    "contactPerson" TEXT,
    "contactNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "userType" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" SERIAL NOT NULL,
    "custFirstName" TEXT NOT NULL,
    "custLastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContactSite" (
    "id" SERIAL NOT NULL,
    "customerContactId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,

    CONSTRAINT "CustomerContactSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintRegistration" (
    "id" SERIAL NOT NULL,
    "complaintID" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentEmail_email_departmentId_key" ON "DepartmentEmail"("email", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketID_key" ON "SupportTicket"("ticketID");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerContact_emailAddress_key" ON "CustomerContact"("emailAddress");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerContactSite_customerContactId_customerId_siteId_key" ON "CustomerContactSite"("customerContactId", "customerId", "siteId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintRegistration_complaintID_key" ON "ComplaintRegistration"("complaintID");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_key" ON "UserPermission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskID_key" ON "Task"("taskID");

-- AddForeignKey
ALTER TABLE "ServiceContractType" ADD CONSTRAINT "ServiceContractType_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES "ServiceContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractBilling" ADD CONSTRAINT "ServiceContractBilling_serviceContractTypeId_fkey" FOREIGN KEY ("serviceContractTypeId") REFERENCES "ServiceContractType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentEmail" ADD CONSTRAINT "DepartmentEmail_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInventory" ADD CONSTRAINT "TaskInventory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskInventory" ADD CONSTRAINT "TaskInventory_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskImage" ADD CONSTRAINT "TaskImage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMapping" ADD CONSTRAINT "SupportTicketMapping_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMapping" ADD CONSTRAINT "SupportTicketMapping_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMapping" ADD CONSTRAINT "SupportTicketMapping_supportTicketUserId_fkey" FOREIGN KEY ("supportTicketUserId") REFERENCES "SupportTicketUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContactSite" ADD CONSTRAINT "CustomerContactSite_customerContactId_fkey" FOREIGN KEY ("customerContactId") REFERENCES "CustomerContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContactSite" ADD CONSTRAINT "CustomerContactSite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContactSite" ADD CONSTRAINT "CustomerContactSite_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintRegistration" ADD CONSTRAINT "ComplaintRegistration_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintRegistration" ADD CONSTRAINT "ComplaintRegistration_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintRegistration" ADD CONSTRAINT "ComplaintRegistration_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
