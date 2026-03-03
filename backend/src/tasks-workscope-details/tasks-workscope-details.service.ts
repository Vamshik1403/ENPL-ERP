import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTasksWorkscopeDetailsDto } from './dto/create-tasks-workscope-detail.dto';
import { UpdateTasksWorkscopeDetailsDto } from './dto/update-tasks-workscope-detail.dto';

@Injectable()
export class TasksWorkscopeDetailsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTasksWorkscopeDetailsDto) {
    return this.prisma.tasksWorkscopeDetails.create({
      data: dto,
      include: { task: true },
    });
  }

  async findAll() {
    return this.prisma.tasksWorkscopeDetails.findMany({
      include: { task: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const detail = await this.prisma.tasksWorkscopeDetails.findUnique({
      where: { id },
      include: { task: true },
    });
    if (!detail) throw new NotFoundException(`TasksWorkscopeDetails #${id} not found`);
    return detail;
  }

  async update(id: number, dto: UpdateTasksWorkscopeDetailsDto) {
    await this.findOne(id);
    return this.prisma.tasksWorkscopeDetails.update({
      where: { id },
      data: dto,
      include: { task: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tasksWorkscopeDetails.delete({ where: { id } });
  }
}
