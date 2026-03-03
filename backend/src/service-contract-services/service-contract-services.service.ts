import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractServicesDto } from './dto/create-service-contract-service.dto';
import { UpdateServiceContractServicesDto } from './dto/update-service-contract-service.dto';

@Injectable()
export class ServiceContractServicesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateServiceContractServicesDto) {
    return this.prisma.serviceContractServices.create({
      data: dto,
      include: {
        serviceContract: true,
        contractWorkCategory: true,
      },
    });
  }

  async findAll() {
    return this.prisma.serviceContractServices.findMany({
      include: { serviceContract: true, contractWorkCategory: true },
      orderBy: { id: 'desc' },
    });
  }

  async findByContract(contractId: number) {
  return this.prisma.serviceContractServices.findMany({
    where: { serviceContractId: contractId },
    include: { serviceContract: true, contractWorkCategory: true },
  });
}

async removeByContract(contractId: number) {
  return this.prisma.serviceContractServices.deleteMany({
    where: { serviceContractId: contractId },
  });
}

  async findOne(id: number) {
    const service = await this.prisma.serviceContractServices.findUnique({
      where: { id },
      include: { serviceContract: true, contractWorkCategory: true },
    });

    if (!service) throw new NotFoundException(`ServiceContractServices #${id} not found`);
    return service;
  }

  async update(id: number, dto: UpdateServiceContractServicesDto) {
    await this.findOne(id);
    return this.prisma.serviceContractServices.update({
      where: { id },
      data: dto,
      include: { serviceContract: true, contractWorkCategory: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContractServices.delete({
      where: { id },
    });
  }
}
