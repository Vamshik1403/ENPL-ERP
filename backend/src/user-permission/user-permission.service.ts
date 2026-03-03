import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserPermissionService {
  constructor(private prisma: PrismaService) {}

  async getByUser(userId: number) {
    const permission = await this.prisma.userPermission.findUnique({
      where: { userId },
    });

    if (!permission) {
      return { userId, permissions: { permissions: {} }, message: 'No permissions found' };
    }

    return permission;
  }

  getAll() {
    return this.prisma.userPermission.findMany();
  }

   async upsertPermissions(userId: number, incoming: Record<string, any>) {
    const existing = await this.prisma.userPermission.findUnique({
      where: { userId },
    });

    // SAFELY convert JsonValue → object
    const oldPermissions =
      (existing?.permissions as Prisma.JsonObject) || {};

    const mergedPermissions = {
      ...oldPermissions,
      ...incoming,
    };

    if (existing) {
      return this.prisma.userPermission.update({
        where: { userId },
        data: {
          permissions: mergedPermissions,
        },
      });
    }

    return this.prisma.userPermission.create({
      data: {
        userId,
        permissions: mergedPermissions,
      },
    });
  }


  async upsert(dto: UpdateUserPermissionDto) {
    const existing = await this.prisma.userPermission.findUnique({
      where: { userId: dto.userId },
    });

const existingPermissions =
  typeof existing?.permissions === 'object' && existing.permissions !== null
    ? (existing.permissions as Record<string, any>)
    : {};

const mergedPermissions = {
  ...existingPermissions,
  ...dto.permissions,
};


    return this.prisma.userPermission.upsert({
      where: { userId: dto.userId },
      update: {
        permissions: mergedPermissions,
      },
      create: {
        userId: dto.userId,
        permissions: mergedPermissions,
      },
    });
  }
}
