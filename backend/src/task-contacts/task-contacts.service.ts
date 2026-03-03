import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTasksContactsDto } from './dto/create-task-contact.dto';
import { UpdateTasksContactsDto } from './dto/update-task-contact.dto';

@Injectable()
export class TasksContactsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTasksContactsDto) {
    return this.prisma.tasksContacts.create({
      data: dto,
      include: { task: true },
    });
  }

  async findAll() {
    return this.prisma.tasksContacts.findMany({
      include: { task: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const contact = await this.prisma.tasksContacts.findUnique({
      where: { id },
      include: { task: true },
    });
    if (!contact) throw new NotFoundException(`TasksContacts #${id} not found`);
    return contact;
  }

  async update(id: number, dto: UpdateTasksContactsDto) {
    await this.findOne(id);
    return this.prisma.tasksContacts.update({
      where: { id },
      data: dto,
      include: { task: true },
    });
  }

async remove(id: number) {
  const existing = await this.prisma.serviceContractInventory.findUnique({ where: { id } });

  if (!existing) {
    console.warn(`⚠️ ServiceContractInventory ${id} not found, skipping delete.`);
    return { message: `No record found with ID ${id}` };
  }

  return this.prisma.serviceContractInventory.delete({ where: { id } });
}

}
