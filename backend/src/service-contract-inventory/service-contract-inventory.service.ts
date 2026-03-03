import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractInventoryDto } from './dto/create-service-contract-inventory.dto';
import { UpdateServiceContractInventoryDto } from './dto/update-service-contract-inventory.dto';
import { add, differenceInDays } from 'date-fns';

@Injectable()
export class ServiceContractInventoryService {
  constructor(private prisma: PrismaService) {}

  private computeWarrantyStatus(purchaseDate: Date, warrantyPeriod: string): string {
    // Example: if warrantyPeriod = "12 months"
    const months = parseInt(warrantyPeriod);
    const expiryDate = add(purchaseDate, { months });
    return expiryDate > new Date() ? 'Active' : 'Expired';
  }

  async create(dto: CreateServiceContractInventoryDto) {
    // Compute warranty status before creating
    const warrantyStatus = this.computeWarrantyStatus(dto.purchaseDate, dto.warrantyPeriod);
    
    const record = await this.prisma.serviceContractInventory.create({
      data: {
        ...dto,
        warrantyStatus,
      },
      include: { serviceContract: true, productType: true },
    });

    return { ...record, warrantyStatus };
  }

  async findAll() {
  return this.prisma.serviceContract.findMany({
    include: {
      periods: true,
      terms: true,
      services: {
        include: { contractWorkCategory: true }, // ✅ Correct relation name
      },
      inventories: {
        include: { productType: true }, // ✅ Also include productType name
      },
      histories: true,
    },
  });
}

async findByContract(contractId: number) {
  return this.prisma.serviceContractInventory.findMany({
    where: { serviceContractId: contractId },
    include: { serviceContract: true, productType: true },
  });
}

async removeByContract(contractId: number) {
  return this.prisma.serviceContractInventory.deleteMany({
    where: { serviceContractId: contractId },
  });
}

 async findOne(id: number) {
  const record = await this.prisma.serviceContractInventory.findUnique({
    where: { id },
    include: { serviceContract: true, productType: true },
  });

  // 🟢 Don’t throw NotFoundException — just return null
  if (!record) return null;

  return {
    ...record,
    warrantyStatus: this.computeWarrantyStatus(record.purchaseDate, record.warrantyPeriod),
  };
}


  async update(id: number, dto: UpdateServiceContractInventoryDto) {
    await this.findOne(id);

    const record = await this.prisma.serviceContractInventory.update({
      where: { id },
      data: dto,
      include: { serviceContract: true, productType: true },
    });

    return { ...record, warrantyStatus: this.computeWarrantyStatus(record.purchaseDate, record.warrantyPeriod) };
  }

  async deleteManyByContract(contractId: number) {
  await this.prisma.serviceContractInventory.deleteMany({
    where: { serviceContractId: contractId },
  });
  return { message: 'All inventories removed for this contract.' };
}

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContractInventory.delete({ where: { id } });
  }
}
