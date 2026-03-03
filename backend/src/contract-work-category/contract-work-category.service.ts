import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContractWorkCategoryDto } from './dto/create-contract-work-category.dto';
import { UpdateContractWorkCategoryDto } from './dto/update-contract-work-category.dto';

@Injectable()
export class ContractWorkCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateContractWorkCategoryDto) {
    return this.prisma.contractWorkCategory.create({ data });
  }

  async findAll() {
    return this.prisma.contractWorkCategory.findMany({
      include: { serviceContractServices: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.contractWorkCategory.findUnique({
      where: { id },
      include: { serviceContractServices: true },
    });
  }

  async update(id: number, data: UpdateContractWorkCategoryDto) {
    return this.prisma.contractWorkCategory.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.contractWorkCategory.delete({
      where: { id },
    });
  }
}
