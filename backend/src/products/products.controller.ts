import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

  @Controller('products')
  export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

   @Get('/count')
  getTotalVendors() {
    return this.productService.countProducts();
  }

  @Get()
  findAll() {
    return this.productService.getProducts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const productId = parseInt(id, 10); // Parse the string `id` to an integer
    if (isNaN(productId)) {
      throw new NotFoundException('Invalid ID');
    }
    return this.productService.getProductById(productId);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productService.deleteProduct(id);
  }

  
}
