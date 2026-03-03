import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
                      
@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}
   
  async createCategory(createCategoryDto: CreateCategoryDto) {
    const { categoryId, categoryName } = createCategoryDto;
  
    return this.prisma.category.create({
      data: {
        categoryName,
        categoryId,
      },
      include: {
        subCategories: true,
      },
    });
  }
  
  async getCategories() {
    return this.prisma.category.findMany({
      include: {
        subCategories: true,
      },
    });
  }
  
  async getCategoryById(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: true,
      },
    });
  
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  
    return category;
  }
  
  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    const { categoryId, categoryName } = updateCategoryDto;
  
    return this.prisma.category.update({
      where: { id },
      data: {
        categoryName,
        categoryId, // Ensure categoryId is a string
        subCategories: {
          deleteMany: {}, // Remove all existing subcategories
        },
      },
      include: {
        subCategories: true, // Include updated subcategories
      },
    });
  }
  
  async deleteCategory(id: number) {
    try {
      await this.prisma.subCategory.deleteMany({
        where: { categoryId: id },
      });
  
      return await this.prisma.category.delete({
        where: { id },
      });

    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      throw new InternalServerErrorException('Failed to delete category');
    }
  }
}
