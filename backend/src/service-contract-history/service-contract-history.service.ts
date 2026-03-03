import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractHistoryDto } from './dto/create-service-contract-history.dto';
import { UpdateServiceContractHistoryDto } from './dto/update-service-contract-history.dto';

@Injectable()
export class ServiceContractHistoryService {
  constructor(private prisma: PrismaService) {}

 async create(dto: CreateServiceContractHistoryDto) {
  return this.prisma.serviceContractHistory.create({
    data: {
      ...dto,
      serviceDate: new Date(dto.serviceDate), // Convert to Date object
    },
    include: { serviceContract: true },
  });
}

  async findAll() {
    return this.prisma.serviceContractHistory.findMany({
      include: { serviceContract: true },
      orderBy: { serviceDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.serviceContractHistory.findUnique({
      where: { id },
      include: { serviceContract: true },
    });

    if (!record) throw new NotFoundException(`ServiceContractHistory #${id} not found`);
    return record;
  }

async update(id: number, dto: UpdateServiceContractHistoryDto) {
  await this.findOne(id);
  return this.prisma.serviceContractHistory.update({
    where: { id },
    data: {
      ...dto,
      // Only convert serviceDate if it's provided in the update
      ...(dto.serviceDate && { serviceDate: new Date(dto.serviceDate) }),
    },
    include: { serviceContract: true },
  });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContractHistory.delete({ where: { id } });
  }
}
