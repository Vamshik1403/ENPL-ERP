import { Controller, Get, Post, Param, Body, ParseIntPipe, Put } from '@nestjs/common';
import { UserPermissionService } from './user-permission.service';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';

@Controller('user-permissions')
export class UserPermissionController {
  constructor(private readonly service: UserPermissionService) {}

  @Get(':userId')
  getByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getByUser(userId);
  }

  @Get()
  getAll() {
    return this.service.getAll();
  }

   @Put(':userId')
  upsertPermission(
    @Param('userId') userId: number,
    @Body() permissions: Record<string, any>,
  ) {
    return this.service.upsertPermissions(Number(userId), permissions);
  }

  @Post()
  update(@Body() dto: UpdateUserPermissionDto) {
    return this.service.upsert(dto);
  }
}
