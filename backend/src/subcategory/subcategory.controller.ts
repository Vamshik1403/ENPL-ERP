import { Controller, Get, Post, Put, Delete, Body, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { SubcategoryService } from './subcategory.service';  
import { CreateSubCategoryDto } from './dto/create-subcategory.dto'; 
import { UpdateSubCategoryDto } from './dto/update-subcategory.dto';

@Controller('subcategory')  
export class SubcategoryController {
  constructor(private readonly subCategoryService: SubcategoryService) {}

  // Create a new Subcategory
  @Post()
  async create(@Body() createSubCategoryDto: CreateSubCategoryDto) {
    try {
      return await this.subCategoryService.createSubCategory(createSubCategoryDto);
    } catch (error) {
      throw new BadRequestException('Error creating subcategory');
    }
  }

  // Get all subcategories for a specific category
  @Get('/:categoryId')
  async getSubCategories(@Param('categoryId') categoryId: string) {
    const numericId = parseInt(categoryId, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid Category ID');
    }

    const subcategories = await this.subCategoryService.getSubCategoriesByCategoryId(numericId);
    if (!subcategories || subcategories.length === 0) {
      throw new NotFoundException(`No subcategories found for category ID ${numericId}`);
    }

    return subcategories;
  }

  // Get all subcategories
  @Get()
  async findAll() {
    try {
      return await this.subCategoryService.getSubCategories();
    } catch (error) {
      throw new BadRequestException('Error fetching subcategories');
    }
  }

  // Get a specific subcategory by ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid ID');
    }

    const subCategory = await this.subCategoryService.getSubCategoryById(numericId);
    if (!subCategory) {
      throw new NotFoundException(`Subcategory with ID ${numericId} not found`);
    }

    return subCategory;
  }

  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() updateSubCategoryDto: UpdateSubCategoryDto
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid ID');
    }
  
    const updatedSubCategory = await this.subCategoryService.updateSubCategory(numericId, updateSubCategoryDto);
    if (!updatedSubCategory) {
      throw new NotFoundException(`Subcategory with ID ${numericId} not found`);
    }
  
    return updatedSubCategory;
  }
  

  // Delete a subcategory by ID
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('Invalid ID');
    }

    try {
      await this.subCategoryService.deleteSubCategory(numericId);
      return { message: `Subcategory with ID ${numericId} deleted successfully` };
    } catch (error) {
      throw new BadRequestException('Error deleting subcategory');
    }
  }
}
