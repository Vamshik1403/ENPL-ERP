import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEngineerDto } from './dto/create-engineer.dto';
import { UpdateEngineerDto } from './dto/update-engineer.dto';

@Injectable()
export class EngineerService {
  constructor(private prisma: PrismaService) {}

  /** Generate next engineer ID like ENG001, ENG002, etc. */
  private async generateEngineerId(): Promise<string> {
    const last = await this.prisma.engineer.findFirst({
      orderBy: { id: 'desc' },
    });

    const nextNum = last ? last.id + 1 : 1;
    return `ENG${String(nextNum).padStart(3, '0')}`;
  }

  async getNextId(): Promise<{ nextId: string }> {
    const id = await this.generateEngineerId();
    return { nextId: id };
  }

  async create(dto: CreateEngineerDto) {
    const engineerId = await this.generateEngineerId();

    return this.prisma.engineer.create({
      data: {
        engineerId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        telegramChatId: dto.telegramChatId ?? null,
      },
    });
  }

 // engineer.service.ts
async findAll() {
  return this.prisma.engineer.findMany({
    include: {
      // REMOVED: tasks: { ... } - this doesn't exist anymore
      // Instead, you can include taskAssignments if needed
      taskAssignments: {
        include: {
          task: true
        }
      }
    }
  });
}

async findOne(id: number) {
  const engineer = await this.prisma.engineer.findUnique({
    where: { id },
    include: {
      taskAssignments: {
        include: {
          task: true
        }
      }
    }
  });
  
  if (!engineer) {
    throw new NotFoundException(`Engineer #${id} not found`);
  }
  
  return engineer;
}

  async update(id: number, dto: UpdateEngineerDto) {
    await this.findOne(id);
    return this.prisma.engineer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.engineer.delete({ where: { id } });
  }
}
