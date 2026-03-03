import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractPeriodDto } from './dto/create-service-contract-period.dto';
import { UpdateServiceContractPeriodDto } from './dto/update-service-contract-period.dto';

@Injectable()
export class ServiceContractPeriodService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateServiceContractPeriodDto) {
    return this.prisma.serviceContractPeriod.create({
      data: {
        ...createDto,
        // Optional: You can auto-calculate nextPMVisitDate here if needed
      },
    });
  }

  async findAll() {
    return this.prisma.serviceContractPeriod.findMany({
      include: { serviceContract: true },
    });
  }

  async findOne(id: number) {
    const period = await this.prisma.serviceContractPeriod.findUnique({
      where: { id },
      include: { serviceContract: true },
    });
    if (!period) {
      throw new NotFoundException(`ServiceContractPeriod #${id} not found`);
    }
    return period;
  }

  async update(id: number, updateDto: UpdateServiceContractPeriodDto) {
    await this.findOne(id);
    return this.prisma.serviceContractPeriod.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContractPeriod.delete({
      where: { id },
    });
  }
}
