import { Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubCategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Create a new subcategory and ensure category exists
  async createSubCategory(createSubCategoryDto: CreateSubCategoryDto) {
    const { subCategoryId, subCategoryName, categoryId } = createSubCategoryDto;

    // Check if category exists before proceeding
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      throw new NotFoundException(`Category with ID ${categoryId} not found.`);
    }

    return this.prisma.subCategory.create({
      data: {
        subCategoryId,
        subCategoryName,
        category: {
          connect: { id: categoryId },
        },
      },
      include: {
        category: true,
      },
    });
  }

  // ✅ Fetch all subcategories with category names
  async getSubCategories() {
    return this.prisma.subCategory.findMany({
      include: {
        category: true, // Include associated category
      },
    });
  }

  // ✅ Fetch a specific subcategory by its ID
  async getSubCategoryById(id: number) {
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!subCategory) {
      throw new NotFoundException(`SubCategory with ID ${id} not found.`);
    }

    return subCategory;
  }

  async updateSubCategory(id: number, updateSubCategoryDto: UpdateSubCategoryDto) {
    const { subCategoryId, subCategoryName, categoryId } = updateSubCategoryDto;
  
    if (categoryId) {
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: categoryId },
      });
  
      if (!categoryExists) {
        throw new NotFoundException(`Category with ID ${categoryId} not found.`);
      }
    }
  
    return this.prisma.subCategory.update({
      where: { id },
      data: {
        subCategoryId,
        subCategoryName,
        category: categoryId ? { connect: { id: categoryId } } : undefined,
      },
      include: {
        category: true,
      },
    });
  }
  
  // ✅ Fetch subcategories by category ID
  async getSubCategoriesByCategoryId(categoryId: number) {
    // Check if category exists
    const categoryExists = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      throw new NotFoundException(`Category with ID ${categoryId} not found.`);
    }

    const subcategories = await this.prisma.subCategory.findMany({
      where: { categoryId },
      include: {
        category: true,
      },
    });

    if (subcategories.length === 0) {
      throw new NotFoundException(`No subcategories found for category ID ${categoryId}`);
    }

    return subcategories;
  }

  // ✅ Delete a subcategory by its ID
  async deleteSubCategory(id: number) {
    try {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id },
      });

      if (!subCategory) {
        throw new NotFoundException(`SubCategory with ID ${id} not found.`);
      }

      return await this.prisma.subCategory.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`SubCategory with ID ${id} not found.`);
      }
      throw new InternalServerErrorException('Failed to delete subcategory');
    }
  }
}
