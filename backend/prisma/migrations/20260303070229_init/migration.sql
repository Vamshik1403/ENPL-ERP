-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('SERVICE', 'PRODUCT_INQUIRY', 'PURCHASE_ORDER');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('INQUIRY', 'ORDER');

-- AlterTable
ALTER TABLE "ServiceContract" ADD COLUMN     "attachmentMimeType" TEXT,
ADD COLUMN     "attachmentName" TEXT,
ADD COLUMN     "attachmentSize" INTEGER,
ADD COLUMN     "attachmentUrl" TEXT;

-- AlterTable
ALTER TABLE "ServiceContractType" ALTER COLUMN "billingType" DROP NOT NULL,
ALTER COLUMN "billingCycle" DROP NOT NULL,
ALTER COLUMN "billingDueDate" DROP NOT NULL,
ALTER COLUMN "paymentStatus" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "attachment" TEXT,
ADD COLUMN     "priority" TEXT,
ADD COLUMN     "taskType" "TaskType" NOT NULL DEFAULT 'SERVICE',
ALTER COLUMN "addressBookId" DROP NOT NULL,
ALTER COLUMN "siteId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TaskPurchase" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "customerName" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purchaseType" "PurchaseType" NOT NULL,

    CONSTRAINT "TaskPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPurchaseProduct" (
    "id" SERIAL NOT NULL,
    "taskPurchaseId" INTEGER NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "description" TEXT,
    "warranty" TEXT,
    "rate" DECIMAL(10,2),
    "vendor" TEXT,
    "validity" TIMESTAMP(3),
    "availability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskPurchaseProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPurchaseAttachment" (
    "id" SERIAL NOT NULL,
    "taskPurchaseId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskPurchaseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,
    "categoryId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubCategory" (
    "id" SERIAL NOT NULL,
    "subCategoryName" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productDescription" TEXT NOT NULL,
    "HSN" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "gstRate" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchaseInvoice" TEXT NOT NULL,
    "creditTerms" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "invoiceNetAmount" TEXT NOT NULL,
    "gstAmount" TEXT NOT NULL,
    "dueAmount" DOUBLE PRECISION,
    "invoiceGrossAmount" TEXT NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInventory" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT,
    "serialNumber" TEXT,
    "macAddress" TEXT,
    "warrantyPeriod" TEXT NOT NULL,
    "purchaseRate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDelivery" (
    "id" SERIAL NOT NULL,
    "deliveryType" TEXT NOT NULL,
    "deliveryChallan" TEXT,
    "refNumber" TEXT,
    "salesOrderNo" TEXT,
    "quotationNo" TEXT,
    "purchaseInvoiceNo" TEXT,
    "siteId" INTEGER,
    "customerId" INTEGER,
    "vendorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialDeliveryItem" (
    "id" SERIAL NOT NULL,
    "materialDeliveryId" INTEGER NOT NULL,
    "inventoryId" INTEGER,
    "productId" INTEGER NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "macAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialDeliveryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayment" (
    "id" SERIAL NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "inventoryId" INTEGER,
    "purchaseInvoiceNo" TEXT NOT NULL,
    "invoiceGrossAmount" TEXT NOT NULL,
    "dueAmount" TEXT NOT NULL,
    "paidAmount" TEXT NOT NULL,
    "balanceDue" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentType" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "vendorCode" TEXT,
    "vendorName" TEXT NOT NULL,
    "registerAddress" TEXT NOT NULL,
    "gstNo" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "businessType" TEXT,
    "state" TEXT,
    "city" TEXT,
    "website" TEXT,
    "products" JSONB,
    "creditTerms" TEXT NOT NULL,
    "creditLimit" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "gstpdf" TEXT,
    "hodId" INTEGER,
    "managerId" INTEGER,
    "executiveId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankDetail" (
    "id" SERIAL NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,

    CONSTRAINT "BankDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorContact" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "contactPhoneNumber" TEXT NOT NULL,
    "contactEmailId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "landlineNumber" TEXT,
    "vendorId" INTEGER NOT NULL,

    CONSTRAINT "VendorContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackupConfig" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "hour" INTEGER,
    "minute" INTEGER,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "month" INTEGER,
    "maxFiles" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskPurchase_taskId_key" ON "TaskPurchase"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_purchaseInvoice_key" ON "Inventory"("purchaseInvoice");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_gstNo_key" ON "Vendor"("gstNo");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_emailId_key" ON "Vendor"("emailId");

-- AddForeignKey
ALTER TABLE "TaskPurchase" ADD CONSTRAINT "TaskPurchase_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPurchaseProduct" ADD CONSTRAINT "TaskPurchaseProduct_taskPurchaseId_fkey" FOREIGN KEY ("taskPurchaseId") REFERENCES "TaskPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPurchaseAttachment" ADD CONSTRAINT "TaskPurchaseAttachment_taskPurchaseId_fkey" FOREIGN KEY ("taskPurchaseId") REFERENCES "TaskPurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInventory" ADD CONSTRAINT "ProductInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "AddressBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDelivery" ADD CONSTRAINT "MaterialDelivery_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDeliveryItem" ADD CONSTRAINT "MaterialDeliveryItem_materialDeliveryId_fkey" FOREIGN KEY ("materialDeliveryId") REFERENCES "MaterialDelivery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDeliveryItem" ADD CONSTRAINT "MaterialDeliveryItem_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialDeliveryItem" ADD CONSTRAINT "MaterialDeliveryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayment" ADD CONSTRAINT "VendorPayment_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "Inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetail" ADD CONSTRAINT "BankDetail_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorContact" ADD CONSTRAINT "VendorContact_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
