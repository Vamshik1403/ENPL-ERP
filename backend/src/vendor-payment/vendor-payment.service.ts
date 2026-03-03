import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVendorPaymentDto } from './dto/create-vendor-payment.dto';
import { UpdateVendorPaymentDto } from './dto/update-vendor-payment.dto';

@Injectable()
export class VendorPaymentService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVendorPaymentDto) {
  const createdPayment = await this.prisma.vendorPayment.create({
    data: {
      vendorId: dto.vendorId,
      purchaseInvoiceNo: dto.purchaseInvoiceNo,
      invoiceGrossAmount: dto.invoiceGrossAmount,
      dueAmount: dto.dueAmount,
      paidAmount: dto.paidAmount,
      balanceDue: dto.balanceDue,
      paymentType: dto.paymentType,
      referenceNo: dto.referenceNo,
      remark: dto.remark,
      paymentDate: new Date(dto.paymentDate),
      createdAt: new Date(),
    },
  });

  // Step 1: Find the related inventory
  const inventory = await this.prisma.inventory.findUnique({
    where: { purchaseInvoice: dto.purchaseInvoiceNo }, // purchaseInvoice must be @unique in schema
  });

  if (!inventory) {
    throw new Error(`Inventory not found for invoice: ${dto.purchaseInvoiceNo}`);
  }

  // Step 2: Sum all paid amounts for this invoice
  const allPayments = await this.prisma.vendorPayment.findMany({
    where: {
      purchaseInvoiceNo: dto.purchaseInvoiceNo,
    },
    select: {
      paidAmount: true,
    },
  });

  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.paidAmount), 0);

  // Step 3: Calculate the updated due amount
  const updatedDueAmount = Number(inventory.invoiceGrossAmount) - totalPaid;

  // Step 4: Update the Inventory's dueAmount
  await this.prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      dueAmount: updatedDueAmount < 0 ? 0 : updatedDueAmount,
    },
  });

  return createdPayment;
}


  async findAll() {
    return this.prisma.vendorPayment.findMany({
      include: {
        vendor: true,
        inventory: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.vendorPayment.findUnique({
      where: { id },
      include: {
        vendor: true,
        inventory: true,
      },
    });
  }

  async update(id: number, dto: UpdateVendorPaymentDto) {
    return this.prisma.vendorPayment.update({
      where: { id },
      data: {
        vendorId: dto.vendorId,
        purchaseInvoiceNo: dto.purchaseInvoiceNo,
        invoiceGrossAmount: dto.invoiceGrossAmount,
        dueAmount: dto.dueAmount,
        paidAmount: dto.paidAmount,
        balanceDue: dto.balanceDue,
        paymentType: dto.paymentType,
        referenceNo: dto.referenceNo,
        remark: dto.remark,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.vendorPayment.delete({
      where: { id },
    });
  }
}
