import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTasksWorkscopeCategoryDto } from './dto/create-task-workscope-category.dto';
import { UpdateTasksWorkscopeCategoryDto } from './dto/update-task-workscope-category.dto';

@Injectable()
export class TasksWorkscopeCategoryService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTasksWorkscopeCategoryDto) {
    return this.prisma.tasksWorkscopeCategory.create({
      data: dto,
      include: { task: true, workscopeCategory: true },
    });
  }

  async findAll() {
    return this.prisma.tasksWorkscopeCategory.findMany({
      include: { task: true, workscopeCategory: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.tasksWorkscopeCategory.findUnique({
      where: { id },
      include: { task: true, workscopeCategory: true },
    });
    if (!record) throw new NotFoundException(`TasksWorkscopeCategory #${id} not found`);
    return record;
  }

  async update(id: number, dto: UpdateTasksWorkscopeCategoryDto) {
    await this.findOne(id);
    return this.prisma.tasksWorkscopeCategory.update({
      where: { id },
      data: dto,
      include: { task: true, workscopeCategory: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tasksWorkscopeCategory.delete({ where: { id } });
  }
}
