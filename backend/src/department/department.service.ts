import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private prisma: PrismaService) {}

 async create(dto: CreateDepartmentDto) {
  const { emails, ...deptData } = dto;

  return this.prisma.department.create({
    data: {
      ...deptData,
      emails: emails
        ? {
            create: emails.map(email => ({ email })),
          }
        : undefined,
    },
    include: { emails: true },
  });
}

async findAll() {
  return this.prisma.department.findMany({
    include: {
      emails: true,
      tasks: true,
    },
  });
}


 async findOne(id: number) {
  const dept = await this.prisma.department.findUnique({
    where: { id },
    include: {
      emails: true,
      tasks: true,
    },
  });

  if (!dept) {
    throw new NotFoundException(`Department #${id} not found`);
  }

  return dept;
}


async update(id: number, dto: UpdateDepartmentDto) {
  await this.findOne(id);

  if (!dto.emails) return;

  return this.prisma.department.update({
    where: { id },
    data: {
      emails: {
        deleteMany: {}, // remove old emails
        create: dto.emails.map(email => ({ email })),
      },
    },
    include: { emails: true },
  });
}

async remove(id: number) {
  await this.findOne(id);
  return this.prisma.department.delete({ where: { id } });
}

}
