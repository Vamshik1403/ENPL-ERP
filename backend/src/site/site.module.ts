import { Module } from '@nestjs/common';
import { SitesService } from './site.service';
import { SiteController } from './site.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SiteController],
  providers: [SitesService, PrismaService],
})
export class SitesModule {}
