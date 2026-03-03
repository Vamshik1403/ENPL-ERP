import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractTermsDto } from './dto/create-service-contract-term.dto';
import { UpdateServiceContractTermsDto } from './dto/update-service-contract-term.dto';

@Injectable()
export class ServiceContractTermsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateServiceContractTermsDto) {
    return this.prisma.serviceContractTerms.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.serviceContractTerms.findMany({
      include: { serviceContract: true },
    });
  }

  async findOne(id: number) {
    const terms = await this.prisma.serviceContractTerms.findUnique({
      where: { id },
      include: { serviceContract: true },
    });

    if (!terms) {
      throw new NotFoundException(`ServiceContractTerms #${id} not found`);
    }
    return terms;
  }

  async update(id: number, updateDto: UpdateServiceContractTermsDto) {
    await this.findOne(id);
    return this.prisma.serviceContractTerms.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContractTerms.delete({
      where: { id },
    });
  }
}
