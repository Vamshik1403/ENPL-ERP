import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceContractBillingDto } from './dto/create-service-contract-billing.dto';
import { UpdateServiceContractBillingDto } from './dto/update-service-contract-billing.dto';

@Injectable()
export class ServiceContractBillingService {
  constructor(private prisma: PrismaService) {}

  // ➕ Create single record
  create(data: CreateServiceContractBillingDto) {
    return this.prisma.serviceContractBilling.create({ data });
  }

 
  // ➕ Bulk insert (used when contract is created)
  createMany(billings: CreateServiceContractBillingDto[]) {
    return this.prisma.serviceContractBilling.createMany({
      data: billings,
      skipDuplicates: true,
    });
  }

  // 🔍 Get all by ServiceContractTypeId
  findByTypeId(serviceContractTypeId: number) {
  if (!serviceContractTypeId || isNaN(serviceContractTypeId)) {
    throw new Error('Invalid serviceContractTypeId provided');
  }

  return this.prisma.serviceContractBilling.findMany({
    where: { serviceContractTypeId: Number(serviceContractTypeId) },
    orderBy: { dueDate: 'asc' },
  });
}


  // 🔍 Single record
  findOne(id: number) {
    return this.prisma.serviceContractBilling.findUnique({ where: { id } });
  }

  // ✏️ Update status or overdue days
  update(id: number, data: UpdateServiceContractBillingDto) {
    return this.prisma.serviceContractBilling.update({ where: { id }, data });
  }

  // ❌ Delete record
  remove(id: number) {
    return this.prisma.serviceContractBilling.delete({ where: { id } });
  }
}
