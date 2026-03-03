import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductTypeDto } from './dto/create-product.dto';
import { UpdateProductTypeDto } from './dto/update-product.dto';

@Injectable()
export class ProductTypeService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateProductTypeDto) {
    return this.prisma.productType.create({ data });
  }

  async findAll() {
    return this.prisma.productType.findMany({
      include: { serviceContractsInventory: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.productType.findUnique({
      where: { id },
      include: { serviceContractsInventory: true },
    });
  }

  async update(id: number, data: UpdateProductTypeDto) {
    return this.prisma.productType.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.productType.delete({
      where: { id },
    });
  }
}
