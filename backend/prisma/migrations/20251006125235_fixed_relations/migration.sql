-- CreateTable
CREATE TABLE "AddressBook" (
    "id" SERIAL NOT NULL,
    "addressType" TEXT NOT NULL,
    "addressBookID" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "regdAddress" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "gstNo" TEXT NOT NULL,

    CONSTRAINT "AddressBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressBookContact" (
    "id" SERIAL NOT NULL,
    "addressBookId" INTEGER NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,

    CONSTRAINT "AddressBookContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "addressBookId" INTEGER NOT NULL,
    "siteID" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "siteAddress" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "pinCode" TEXT,
    "gstNo" TEXT NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContact" (
    "id" SERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,

    CONSTRAINT "SiteContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductType" (
    "id" SERIAL NOT NULL,
    "productTypeName" TEXT NOT NULL,

    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceWorkCategory" (
    "id" SERIAL NOT NULL,
    "serviceWorkCategoryName" TEXT NOT NULL,

    CONSTRAINT "ServiceWorkCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractWorkCategory" (
    "id" SERIAL NOT NULL,
    "contractWorkCategoryName" TEXT NOT NULL,

    CONSTRAINT "ContractWorkCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkscopeCategory" (
    "id" SERIAL NOT NULL,
    "workscopeCategoryName" TEXT NOT NULL,

    CONSTRAINT "WorkscopeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContract" (
    "id" SERIAL NOT NULL,
    "serviceContractID" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "salesManagerName" TEXT NOT NULL,

    CONSTRAINT "ServiceContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContractPeriod" (
    "id" SERIAL NOT NULL,
    "serviceContractId" INTEGER NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "nextPMVisitDate" TEXT,
    "contractDescription" TEXT,

    CONSTRAINT "ServiceContractPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContractTerms" (
    "id" SERIAL NOT NULL,
    "serviceContractId" INTEGER NOT NULL,
    "maxOnSiteVisits" TEXT NOT NULL,
    "maxPreventiveMaintenanceVisit" TEXT NOT NULL,
    "inclusiveInOnSiteVisitCounts" BOOLEAN NOT NULL,
    "preventiveMaintenanceCycle" TEXT NOT NULL,

    CONSTRAINT "ServiceContractTerms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContractServices" (
    "id" SERIAL NOT NULL,
    "serviceContractId" INTEGER NOT NULL,
    "contractWorkCategoryId" INTEGER NOT NULL,

    CONSTRAINT "ServiceContractServices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContractInventory" (
    "id" SERIAL NOT NULL,
    "serviceContractId" INTEGER NOT NULL,
    "productTypeId" INTEGER NOT NULL,
    "makeModel" TEXT NOT NULL,
    "snMac" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "warrantyPeriod" TEXT NOT NULL,
    "warrantyStatus" TEXT NOT NULL,
    "thirdPartyPurchase" BOOLEAN NOT NULL,

    CONSTRAINT "ServiceContractInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceContractHistory" (
    "id" SERIAL NOT NULL,
    "serviceContractId" INTEGER NOT NULL,
    "taskId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "serviceDetails" TEXT NOT NULL,

    CONSTRAINT "ServiceContractHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "departmentName" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "taskID" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "addressBookId" INTEGER NOT NULL,
    "siteId" INTEGER NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasksContacts" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,

    CONSTRAINT "TasksContacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasksWorkscopeCategory" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "workscopeCategoryId" INTEGER NOT NULL,

    CONSTRAINT "TasksWorkscopeCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasksWorkscopeDetails" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "workscopeDetails" TEXT NOT NULL,
    "extraNote" TEXT,

    CONSTRAINT "TasksWorkscopeDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasksSchedule" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "proposedDateTime" TIMESTAMP(3) NOT NULL,
    "priority" TEXT NOT NULL,

    CONSTRAINT "TasksSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasksRemarks" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "remark" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TasksRemarks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AddressBookContact" ADD CONSTRAINT "AddressBookContact_addressBookId_fkey" FOREIGN KEY ("addressBookId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_addressBookId_fkey" FOREIGN KEY ("addressBookId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteContact" ADD CONSTRAINT "SiteContact_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractPeriod" ADD CONSTRAINT "ServiceContractPeriod_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES "ServiceContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractTerms" ADD CONSTRAINT "ServiceContractTerms_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES "ServiceContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractServices" ADD CONSTRAINT "ServiceContractServices_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES "ServiceContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractServices" ADD CONSTRAINT "ServiceContractServices_contractWorkCategoryId_fkey" FOREIGN KEY ("contractWorkCategoryId") REFERENCES "ContractWorkCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractInventory" ADD CONSTRAINT "ServiceContractInventory_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES "ServiceContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractInventory" ADD CONSTRAINT "ServiceContractInventory_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceContractHistory" ADD CONSTRAINT "ServiceContractHistory_serviceContractId_fkey" FOREIGN KEY ("serviceContractId") REFERENCES "ServiceContract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_addressBookId_fkey" FOREIGN KEY ("addressBookId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasksContacts" ADD CONSTRAINT "TasksContacts_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasksWorkscopeCategory" ADD CONSTRAINT "TasksWorkscopeCategory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasksWorkscopeCategory" ADD CONSTRAINT "TasksWorkscopeCategory_workscopeCategoryId_fkey" FOREIGN KEY ("workscopeCategoryId") REFERENCES "WorkscopeCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasksWorkscopeDetails" ADD CONSTRAINT "TasksWorkscopeDetails_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasksSchedule" ADD CONSTRAINT "TasksSchedule_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasksRemarks" ADD CONSTRAINT "TasksRemarks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
