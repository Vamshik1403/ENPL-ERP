import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(createProductDto: CreateProductDto) {
    const {
      productName,
      productDescription,
      HSN,
      unit,
      gstRate,
      categoryId,
      subCategoryId,
    } = createProductDto;

    // Step 1: Validate category and subcategory
    const category = await this.prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });
    if (!category) throw new NotFoundException('Category not found');

    const subCategory = subCategoryId
      ? await this.prisma.subCategory.findUnique({
          where: { id: Number(subCategoryId) },
        })
      : null;

    if (!subCategory) {
      throw new BadRequestException('Subcategory not found');
    }

    // Step 2: Use subCategory.subCategoryId as base prefix
    const baseProductId = subCategory.subCategoryId; // e.g., "MATCH-BAT"

    // Step 3: Find all products starting with that prefix
    const existingProducts = await this.prisma.product.findMany({
      where: {
        productId: {
          startsWith: `${baseProductId}-`,
        },
      },
    });

    // Step 4: Extract the max numeric suffix
    let maxSuffix = 0;
    for (const product of existingProducts) {
      const match = product.productId.match(/-(\d{5})$/); // 5-digit suffix
      if (match) {
        const suffix = parseInt(match[1], 10);
        if (suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      }
    }

    const nextNumber = maxSuffix + 1;
    const paddedNumber = String(nextNumber).padStart(5, '0');

    // Step 5: Final product ID
    const productId = `${baseProductId}-${paddedNumber}`; // e.g., MATCH-BAT-00001

    // Step 6: Create Product
    try {
      return await this.prisma.product.create({
        data: {
          productId,
          productName,
          productDescription,
          HSN,
          unit,
          gstRate,
          categoryId: Number(categoryId),
          subCategoryId: Number(subCategoryId),
        },
      });
    } catch (error) {
      console.error('Failed to create product:', error);
      throw new BadRequestException('Failed to create product');
    }
  }

  async countProducts() {
    return this.prisma.product.count();
  }

  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        subCategory: true,
      },
    });
  }

  async getProductById(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
        subCategory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(id: number, updateProductDto: UpdateProductDto) {
    try {
      const {
        productId,
        productName,
        productDescription,
        HSN,
        unit,
        gstRate,
        categoryId,
        subCategoryId,
      } = updateProductDto;

      const productIdNumber = Number(id);
      const categoryNumber = Number(categoryId);
      const subCategoryNumber = subCategoryId ? Number(subCategoryId) : null;

      if (isNaN(productIdNumber)) {
        throw new BadRequestException('Invalid product ID');
      }

      return await this.prisma.product.update({
        where: { id: productIdNumber },
        data: {
          productId,
          productName,
          productDescription,
          HSN,
          unit,
          gstRate,
          categoryId: categoryNumber,
          subCategoryId: subCategoryNumber ?? undefined,
        },
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw new BadRequestException(
        `Failed to update product: ${error.message}`,
      );
    }
  }

  async deleteProduct(id: number) {
    return this.prisma.product.delete({
      where: {
        id: Number(id),
      },
    });
  }
}
