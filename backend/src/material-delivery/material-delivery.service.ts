import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMaterialDeliveryDto } from './dto/create-material-delivery.dto';
import { UpdateMaterialDeliveryDto } from './dto/update-material-delivery.dto';
import { MaterialDelivery } from '@prisma/client';
import { InventoryService } from 'src/inventory/inventory.service';

@Injectable()
export class MaterialDeliveryService {
  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async create(data: CreateMaterialDeliveryDto): Promise<MaterialDelivery[]> {
    try {
      if (
        !data.materialDeliveryItems ||
        data.materialDeliveryItems.length === 0
      ) {
        throw new Error('Material delivery items are required.');
      }

      const createdDeliveries: MaterialDelivery[] = [];

      // Generate deliveryChallan
      const lastEntry = await this.prisma.materialDelivery.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { deliveryChallan: true },
        where: { deliveryChallan: { startsWith: 'EN-MDN-' } },
      });

      let nextNumber = 1;
      if (lastEntry?.deliveryChallan) {
        const lastNumber = parseInt(
          lastEntry.deliveryChallan.split('EN-MDN-')[1],
        );
        if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
      }

      const paddedNumber = String(nextNumber).padStart(3, '0');
      const deliveryChallan = `EN-MDN-${paddedNumber}`;

      for (const item of data.materialDeliveryItems) {
        // ✅ Fetch ProductInventory to get correct Inventory ID
        const productInventory = await this.prisma.productInventory.findUnique({
          where: { id: item.inventoryId },
        });

        if (!productInventory) {
          throw new Error(
            `ProductInventory with ID ${item.inventoryId} does not exist.`,
          );
        }

        const created = await this.prisma.materialDelivery.create({
          data: {
            deliveryType: data.deliveryType,
            deliveryChallan,
            refNumber: data.refNumber || 'N/A',
            salesOrderNo: data.salesOrderNo || 'N/A',
            quotationNo: data.quotationNo || 'N/A',
            purchaseInvoiceNo: data.purchaseInvoiceNo || 'N/A',
            siteId: data.siteId ? Number(data.siteId) : null,
            customerId: data.customerId ? Number(data.customerId) : null,
            vendorId: data.vendorId ? Number(data.vendorId) : null,

            materialDeliveryItems: {
              create: {
                inventoryId: productInventory.inventoryId, // ✅ Use actual Inventory ID
                productId: item.productId,
                serialNumber: item.serialNumber,
                macAddress: item.macAddress,
              },
            },
          },
          include: {
            materialDeliveryItems: true,
          },
        });

        await this.inventoryService.updateStatusBySerialOrMac(
          item.serialNumber,
          item.macAddress,
          data.deliveryType,
        );

        createdDeliveries.push(created);
      }

      return createdDeliveries;
    } catch (error) {
      console.error('Error creating material deliveries:', error.message);
      throw new Error(`Failed to create material deliveries: ${error.message}`);
    }
  }

  async update(id: number, data: UpdateMaterialDeliveryDto) {
    const delivery = await this.prisma.materialDelivery.findUnique({
      where: { id },
    });
    if (!delivery) throw new NotFoundException('Material Delivery not found');

    // 🧹 Delete old items first
    await this.prisma.materialDeliveryItem.deleteMany({
      where: { materialDeliveryId: id },
    });

    // Now update MaterialDelivery and recreate items
    const updated = await this.prisma.materialDelivery.update({
      where: { id },
      data: {
        deliveryType: data.deliveryType,
        refNumber: data.refNumber,
        salesOrderNo: data.salesOrderNo,
        quotationNo: data.quotationNo,
        purchaseInvoiceNo: data.purchaseInvoiceNo,
        deliveryChallan: data.deliveryChallan ?? undefined,
        customerId: data.customerId ? Number(data.customerId) : null,
        vendorId: data.vendorId ? Number(data.vendorId) : null,
        materialDeliveryItems: {
          create:
            data.materialDeliveryItems?.map((item) => ({
              inventoryId: item.inventoryId,
              productId: item.productId,
              serialNumber: item.serialNumber,
              macAddress: item.macAddress,
            })) ?? [],
        },
        updatedAt: new Date(),
      },
      include: {
        materialDeliveryItems: {
          include: {
            inventory: true,
            product: true,
          },
        },
        addressBook: true,
        vendor: true,
      },
    });

    // Update inventory status after update
    for (const item of data.materialDeliveryItems || []) {
      await this.inventoryService.updateStatusBySerialOrMac(
        item.serialNumber,
        item.macAddress,
        data.deliveryType || delivery.deliveryType,
      );
    }

    return updated;
  }

  async findAll() {
    const result = await this.prisma.materialDelivery.findMany({
      include: {
        materialDeliveryItems: {
          include: {
            inventory: true,
            product: true,
          },
        },
        site: true,
        addressBook: true,
        vendor: true,
      },
    });

    return result;
  }

  async findOne(id: number) {
    const delivery = await this.prisma.materialDelivery.findUnique({
      where: { id },
      include: {
        materialDeliveryItems: {
          include: {
            inventory: true,
            product: true,
          },
        },
        site:true,
        addressBook: true,
        vendor: true,
      },
    });

    if (!delivery) throw new NotFoundException('Material Delivery not found');
    return delivery;
  }

  async remove(id: number) {
    const delivery = await this.prisma.materialDelivery.findUnique({
      where: { id },
    });
    if (!delivery) throw new NotFoundException('Material Delivery not found');

    // Manually delete the related MaterialDeliveryItem records
    await this.prisma.materialDeliveryItem.deleteMany({
      where: { materialDeliveryId: id },
    });

    // Now delete the MaterialDelivery record
    return this.prisma.materialDelivery.delete({
      where: { id },
    });
  }
}
