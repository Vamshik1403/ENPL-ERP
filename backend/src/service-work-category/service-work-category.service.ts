import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceWorkCategoryDto } from './dto/create-service-work-category.dto';
import { UpdateServiceWorkCategoryDto } from './dto/update-service-work-category.dto';

@Injectable()
export class ServiceWorkCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateServiceWorkCategoryDto) {
    return this.prisma.serviceWorkCategory.create({ data });
  }

  async findAll() {
    return this.prisma.serviceWorkCategory.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.serviceWorkCategory.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: UpdateServiceWorkCategoryDto) {
    return this.prisma.serviceWorkCategory.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.serviceWorkCategory.delete({
      where: { id },
    });
  }
}
