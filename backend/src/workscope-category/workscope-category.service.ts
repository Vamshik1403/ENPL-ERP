import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkscopeCategoryDto } from './dto/create-workscope-category.dto';
import { UpdateWorkscopeCategoryDto } from './dto/update-workscope-category.dto';

@Injectable()
export class WorkscopeCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateWorkscopeCategoryDto) {
    return this.prisma.workscopeCategory.create({
      data: createDto,
    });
  }

  async findAll() {
    return this.prisma.workscopeCategory.findMany({
      include: { taskWorkscopeCategory: true },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.workscopeCategory.findUnique({
      where: { id },
      include: { taskWorkscopeCategory: true },
    });
    if (!category) throw new NotFoundException(`WorkscopeCategory #${id} not found`);
    return category;
  }

  async update(id: number, updateDto: UpdateWorkscopeCategoryDto) {
    await this.findOne(id);
    return this.prisma.workscopeCategory.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.workscopeCategory.delete({
      where: { id },
    });
  }
}
