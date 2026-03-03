import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTasksScheduleDto } from './dto/create-task-schedule.dto';
import { UpdateTasksScheduleDto } from './dto/update-task-schedule.dto';

@Injectable()
export class TasksScheduleService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTasksScheduleDto) {
    return this.prisma.tasksSchedule.create({
      data: dto,
      include: { task: true },
    });
  }

  async findAll() {
    return this.prisma.tasksSchedule.findMany({
      include: { task: true },
      orderBy: { proposedDateTime: 'desc' },
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.tasksSchedule.findUnique({
      where: { id },
      include: { task: true },
    });
    if (!schedule) throw new NotFoundException(`TasksSchedule #${id} not found`);
    return schedule;
  }

  async update(id: number, dto: UpdateTasksScheduleDto) {
    await this.findOne(id);
    return this.prisma.tasksSchedule.update({
      where: { id },
      data: dto,
      include: { task: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tasksSchedule.delete({ where: { id } });
  }
}
