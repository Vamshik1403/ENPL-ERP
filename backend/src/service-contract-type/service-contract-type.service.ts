import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ServiceContractTypeService {
  constructor(private prisma: PrismaService) {}

  /* -----------------------------------------------------
    CREATE ServiceContractType + billingSchedule
  ------------------------------------------------------ */
  async create(data: any) {
    const { billingSchedule, ...mainData } = data;

    // Create the main record
    const contractType = await this.prisma.serviceContractType.create({
      data: mainData,
    });

    // Create billing schedule entries
    if (billingSchedule?.length) {
      await this.prisma.serviceContractBilling.createMany({
        data: billingSchedule.map((b: any) => ({
          serviceContractTypeId: contractType.id,
          dueDate: b.dueDate,
          paymentStatus: b.paymentStatus,
          overdueDays: b.overdueDays ?? 0,
        })),
      });
    }

    return contractType;
  }

  /* -----------------------------------------------------
    GET ALL
  ------------------------------------------------------ */
  findAll() {
    return this.prisma.serviceContractType.findMany({
      include: {
        serviceContract: true,
        serviceContractBillings: true,
      },
    });
  }

  /* -----------------------------------------------------
    GET ONE
  ------------------------------------------------------ */
  findOne(id: number) {
    return this.prisma.serviceContractType.findUnique({
      where: { id },
      include: {
        serviceContract: true,
        serviceContractBillings: true,
      },
    });
  }

  /* -----------------------------------------------------
    UPDATE — FIXED & FULLY STABLE
  ------------------------------------------------------ */
  async update(id: number, data: any) {
    const { billingSchedule, serviceContractId, ...updateData } = data;

    if (!serviceContractId) {
      throw new Error('serviceContractId is required for updating ServiceContractType');
    }

    // Step 1: Check if ServiceContractType exists
    let existingType = await this.prisma.serviceContractType.findUnique({
      where: { id },
    });

    // Step 2: If it does NOT exist → create one
    if (!existingType) {
      existingType = await this.prisma.serviceContractType.create({
        data: {
          serviceContractId,
          serviceContractType: updateData.serviceContractType || 'Free',
          billingType: updateData.billingType || '',
          billingCycle: updateData.billingCycle || '',
          billingDueDate: updateData.billingDueDate || '',
          paymentStatus: updateData.paymentStatus || 'Unpaid',
        },
      });
    }

    const typeId = existingType.id;

    // Step 3: Update ServiceContractType
    await this.prisma.serviceContractType.update({
      where: { id: typeId },
      data: updateData,
    });

    // Step 4: Refresh BillingSchedule
    await this.prisma.serviceContractBilling.deleteMany({
      where: { serviceContractTypeId: typeId },
    });

    if (billingSchedule?.length) {
      await this.prisma.serviceContractBilling.createMany({
        data: billingSchedule.map((b: any) => ({
          serviceContractTypeId: typeId,
          dueDate: b.dueDate,
          paymentStatus: b.paymentStatus,
          overdueDays: b.overdueDays ?? 0,
        })),
      });
    }

    // Step 5: Return updated record
    return this.prisma.serviceContractType.findUnique({
      where: { id: typeId },
      include: {
        serviceContract: true,
        serviceContractBillings: true,
      },
    });
  }

  /* -----------------------------------------------------
    DELETE — SAFE
  ------------------------------------------------------ */
  async remove(id: number) {
    // Clean billing schedule first
    await this.prisma.serviceContractBilling.deleteMany({
      where: { serviceContractTypeId: id },
    });

    // Delete main record
    return this.prisma.serviceContractType.delete({
      where: { id },
    });
  }
}
