import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ServiceContractService } from './service-contract.service';
import { CreateServiceContractDto } from './dto/create-service-contract.dto';
import { UpdateServiceContractDto } from './dto/update-service-contract.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads/service-contracts',
    filename: (req, file, cb) => {
      const uniqueName = `${uuid()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
};

@Controller('service-contract')
export class ServiceContractController {
  constructor(private readonly serviceContractService: ServiceContractService) {}

 @Post()
  @UseInterceptors(FileInterceptor('attachment', multerOptions))
  create(
    @Body() createDto: CreateServiceContractDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.serviceContractService.create(createDto, file);
  }

  @Get()
  findAll() {
    return this.serviceContractService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('attachment', multerOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateServiceContractDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.serviceContractService.update(id, updateDto, file);
  }

    @Get('next/id')
  async getNextContractId() {
    return this.serviceContractService.getNextContractId();
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.serviceContractService.remove(id);
  }
  @Delete('contract/:contractId')
removeByContract(@Param('contractId', ParseIntPipe) contractId: number) {
  return this.serviceContractService.removeByContractId(contractId);
}

}
