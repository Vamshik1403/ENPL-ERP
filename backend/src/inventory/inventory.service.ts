import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { getStatusFromDeliveryType } from './dto/status-mapper';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateInventoryDto) {
    const inventory = await this.prisma.inventory.create({
      data: {
        vendor: { connect: { id: data.vendorId } },
        purchaseDate: new Date(data.purchaseDate),
        purchaseInvoice: data.purchaseInvoice,
        creditTerms: data.creditTerms,
        dueDate: data.dueDate,
        invoiceNetAmount: data.invoiceNetAmount,
        gstAmount: data.gstAmount,
        invoiceGrossAmount: data.invoiceGrossAmount,
        dueAmount: Number(data.invoiceGrossAmount),
        status: data.status,
      },
    });

    if (data.products && data.products.length > 0) {
      const productInventoryData = await Promise.all(
  data.products.flatMap(async (product) => {
    // Validate product existence
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: product.productId },
    });

    if (!existingProduct) {
      throw new Error(`Product with productId ${product.productId} not found`);
    }

    const isSerialEmpty = !product.serialNumber || product.serialNumber.trim() === '';
    const isMacEmpty = !product.macAddress || product.macAddress.trim() === '';

    let serials: string[];

    if (isSerialEmpty && isMacEmpty) {
      // Both serial and MAC empty: generate serial number
      const generatedSerial = await this.generateNextSerialNumber(product.productId);
      serials = [generatedSerial];
    } else if (!isSerialEmpty) {
      // Serial number(s) provided (comma separated)
      serials = product.serialNumber
        .split(',')
        .map((sn) => sn.trim())
        .filter((sn) => sn !== '');
    } else {
      // Serial empty but MAC provided: treat serials as empty string to create record with empty serial
      serials = [''];
    }

    return serials.map((serialNumber) => ({
      productId: existingProduct.id,
      make: product.make,
      model: product.model,
      inventoryId: inventory.id,
      serialNumber: product.serialNumber ? serialNumber : '',
macAddress: product.macAddress ?? null,
      warrantyPeriod: product.warrantyPeriod,
      purchaseRate: product.purchaseRate,
    }));
  }),
);


      const flatProductInventoryData = productInventoryData.flat();

      await this.prisma.productInventory.createMany({
        data: flatProductInventoryData,
      });
    }

    return inventory;
  }

  async generateNextSerialNumber(productId: number): Promise<string> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { productId: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found for serial generation');
    }

    const count = await this.prisma.productInventory.count({
      where: { productId },
    });

    return `${product.productId}-${(count + 1).toString().padStart(5, '0')}`;
  }

  async applyVendorPayment(purchaseInvoiceNo: string, paymentAmount: number) {
    // Get the inventory
    const inventory = await this.prisma.inventory.findUnique({
      where: { purchaseInvoice: purchaseInvoiceNo },
    });

    if (!inventory) throw new Error('Invoice not found');

    const newDueAmount = (inventory.dueAmount || 0) - paymentAmount;

    await this.prisma.inventory.update({
      where: { purchaseInvoice: purchaseInvoiceNo },
      data: { dueAmount: newDueAmount < 0 ? 0 : newDueAmount }, // No negative dues
    });

    // Optionally, record the payment somewhere else if needed
  }

  // Ensure that the inventory update logic is correctly updating the fields
 async update(id: number, data: UpdateInventoryDto) {
  const inventory = await this.prisma.inventory.findUnique({ where: { id } });
  if (!inventory) throw new NotFoundException('Inventory not found');

  const {
    vendorId,
    purchaseDate,
    purchaseInvoice,
    creditTerms,
    dueDate,
    invoiceNetAmount,
    gstAmount,
    invoiceGrossAmount,
    status,
    products,
  } = data;

  const updatedInventoryData: any = {
    updatedAt: new Date(),
  };

  if (purchaseDate) updatedInventoryData.purchaseDate = new Date(purchaseDate);
  if (purchaseInvoice) updatedInventoryData.purchaseInvoice = purchaseInvoice;
  if (creditTerms) updatedInventoryData.creditTerms = creditTerms;
  if (dueDate) updatedInventoryData.dueDate = dueDate;

  if (invoiceNetAmount !== undefined)
    updatedInventoryData.invoiceNetAmount = invoiceNetAmount;

  if (gstAmount !== undefined) updatedInventoryData.gstAmount = gstAmount;

  if (invoiceGrossAmount !== undefined)
    updatedInventoryData.invoiceGrossAmount = invoiceGrossAmount;

  if (status) updatedInventoryData.status = status;

  if (vendorId) updatedInventoryData.vendor = { connect: { id: vendorId } };

  await this.prisma.inventory.update({
    where: { id },
    data: updatedInventoryData,
  });

  // ✅ IMPORTANT: handle products update safely
  if (products !== undefined) {
    // delete all old product rows always
    await this.prisma.productInventory.deleteMany({
      where: { inventoryId: id },
    });

    if (products.length > 0) {
      const productInventoryData = await Promise.all(
        products.flatMap(async (product) => {
          const existingProduct = await this.prisma.product.findUnique({
            where: { id: product.productId },
          });

          if (!existingProduct) {
            throw new Error(
              `Product with productId ${product.productId} not found`,
            );
          }

          const isSerialEmpty =
            !product.serialNumber || product.serialNumber.trim() === '';
          const isMacEmpty =
            !product.macAddress || product.macAddress.trim() === '';

          let serials: string[];

          if (isSerialEmpty && isMacEmpty) {
            const generatedSerial = await this.generateNextSerialNumber(
              product.productId,
            );
            serials = [generatedSerial];
          } else if (!isSerialEmpty) {
            serials = product.serialNumber
              .split(',')
              .map((sn) => sn.trim())
              .filter((sn) => sn !== '');
          } else {
            serials = [''];
          }

          return serials.map((serialNumber) => ({
            productId: existingProduct.id,
            make: product.make,
            model: product.model,
            inventoryId: id,
            serialNumber,
            macAddress: product.macAddress ?? null,
            warrantyPeriod: product.warrantyPeriod,
            purchaseRate: product.purchaseRate,
          }));
        }),
      );

      const flatProductInventoryData = productInventoryData.flat();

      await this.prisma.productInventory.createMany({
        data: flatProductInventoryData,
      });
    }
  }

  return this.findOne(id);
}


  async getTotalPurchaseRate(): Promise<number> {
    const allProductInventories = await this.prisma.productInventory.findMany({
      where: {
        inventory: {
          status: {
            not: 'Purchase Return',
          },
        },
      },
      select: { purchaseRate: true },
    });

    const total = allProductInventories.reduce((sum, item) => {
      const rate = parseFloat(item.purchaseRate);
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0);

    return total;
  }

  async getTotalPurchaseRateSold(): Promise<number> {
    const allProductInventories = await this.prisma.productInventory.findMany({
      where: {
        inventory: {
          status: 'Sold',
        },
      },
      select: {
        purchaseRate: true,
      },
    });

    const total = allProductInventories.reduce((sum, item) => {
      const rate = parseFloat(item.purchaseRate);
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0);

    return total;
  }

  async getTotalDemoOut(): Promise<number> {
    const count = await this.prisma.productInventory.count({
      where: {
        inventory: {
          status: 'Demo Out',
        },
      },
    });

    return count;
  }

  async getTotalDueAmout(): Promise<number> {
    const allDueAmount = await this.prisma.inventory.findMany({
      select: {
        dueAmount: true,
      },
    });

    const total = allDueAmount.reduce((sum, item) => {
      const due = item.dueAmount ?? 0;
      return sum + due;
    }, 0);

    return total;
  }

  async getTotalPurchaseRestSold(): Promise<number> {
    const allProductInventories = await this.prisma.productInventory.findMany({
      where: {
        inventory: {
          status: {
            not: 'Sold',
          },
        },
      },
      select: {
        purchaseRate: true,
      },
    });

    const total = allProductInventories.reduce((sum, item) => {
      const rate = parseFloat(item.purchaseRate);
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0);

    return total;
  }

  async getUniquePurchaseInvoiceCount(): Promise<number> {
    const uniqueInvoices = await this.prisma.inventory.findMany({
      distinct: ['purchaseInvoice'],
      select: {
        purchaseInvoice: true,
      },
    });

    return uniqueInvoices.length;
  }

  async updateStatusBySerialOrMac(
    serialNumber: string,
    macAddress: string,
    deliveryType: string,
  ) {
    const status = getStatusFromDeliveryType(deliveryType);

    const inventory = await this.prisma.inventory.findFirst({
      where: {
        OR: [
          {
            products: {
              some: {
                serialNumber: serialNumber ?? undefined,
                macAddress: macAddress ?? undefined,
              },
            },
          },
        ],
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        `No inventory found for Serial: ${serialNumber} or MAC: ${macAddress}`,
      );
    }

    return this.prisma.inventory.update({
      where: { id: inventory.id },
      data: { status },
    });
  }

  async findAll() {
    return this.prisma.inventory.findMany({
      include: {
        products: {
          include: {
            product: true,
          },
        },
        vendor: true,
      },
    });
  }

  async findOne(id: number) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
        vendor: true,
      },
    });
    if (!inventory) throw new NotFoundException('Inventory not found');
    return inventory;
  }

  async remove(id: number) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id } });
    if (!inventory) throw new NotFoundException('Inventory not found');

    await this.prisma.productInventory.deleteMany({
      where: { inventoryId: id },
    });

    return this.prisma.inventory.delete({ where: { id } });
  }
}
