import { Module } from '@nestjs/common';
import { SubcategoryController } from './subcategory.controller';
import { SubcategoryService } from './subcategory.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [SubcategoryController],
  providers: [SubcategoryService,PrismaService]
})
export class SubcategoryModule {}
