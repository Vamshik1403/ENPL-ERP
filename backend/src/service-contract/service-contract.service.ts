import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceContractDto } from './dto/create-service-contract.dto';
import { UpdateServiceContractDto } from './dto/update-service-contract.dto';

@Injectable()
export class ServiceContractService {
  constructor(private prisma: PrismaService) {}

async create(createDto: CreateServiceContractDto, file?: Express.Multer.File) {
  // 🔢 Step 1: Find last contract ID (numerically highest)
  const lastContract = await this.prisma.serviceContract.findFirst({
    orderBy: { id: 'desc' },
    select: { serviceContractID: true },
  });

  // 🔢 Step 2: Extract number and increment
  let nextNumber = 1;
  if (lastContract?.serviceContractID) {
    const match = lastContract.serviceContractID.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  // 🔢 Step 3: Format like EN/CSR/00001
  const nextID = `EN/CSR/${nextNumber.toString().padStart(5, '0')}`;

  // 🔢 Step 4: Create record with generated ID
return this.prisma.serviceContract.create({
  data: {
    serviceContractID: nextID,
    customerId: createDto.customerId,
    branchId: createDto.branchId,
    salesManagerName: createDto.salesManagerName,
    amcType: createDto.amcType,

    attachmentUrl: file ? `/uploads/service-contracts/${file.filename}` : null,
    attachmentName: file?.originalname || null,
    attachmentMimeType: file?.mimetype || null,
    attachmentSize: file?.size || null,
  },
});

}

async getNextContractId() {
  const lastContract = await this.prisma.serviceContract.findFirst({
    orderBy: { id: 'desc' },
    select: { serviceContractID: true },
  });

  let nextNumber = 1;
  if (lastContract?.serviceContractID) {
    const match = lastContract.serviceContractID.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  const nextID = `EN/CSR/${nextNumber.toString().padStart(5, '0')}`;

  return { nextID };
}

async removeByContractId(contractId: number) {
  await this.prisma.serviceContractBilling.deleteMany({
    where: { serviceContractType: { serviceContractId: contractId } },
  });

  await this.prisma.serviceContractType.deleteMany({
    where: { serviceContractId: contractId },
  });

  return { message: 'Deleted all contract-type and billing linked items.' };
}


  async findAll() {
    return this.prisma.serviceContract.findMany({
      include: {
        periods: true,
        terms: true,
        services: true,
        inventories: true,
        histories: true,
      },
    });
  }

  async findOne(id: number) {
    const contract = await this.prisma.serviceContract.findUnique({
      where: { id },
      include: {
        periods: true,
        terms: true,
        services: true,
        inventories: true,
        histories: true,
      },
    });

    if (!contract) {
      throw new NotFoundException(`Service Contract #${id} not found`);
    }

    return contract;
  }

async update(
  id: number,
  updateDto: UpdateServiceContractDto,
  file?: Express.Multer.File,
) {
  await this.findOne(id);

  const updateData: any = {
    ...updateDto,
  };

  // ✅ Convert numeric fields because FormData sends strings
  if (updateData.customerId !== undefined) {
    updateData.customerId = Number(updateData.customerId);
  }
  if (updateData.branchId !== undefined) {
    updateData.branchId = Number(updateData.branchId);
  }

  // ✅ If attachment uploaded then update attachment fields
  if (file) {
    updateData.attachmentUrl = `/uploads/service-contracts/${file.filename}`;
    updateData.attachmentName = file.originalname;
    updateData.attachmentMimeType = file.mimetype;
    updateData.attachmentSize = file.size;
  }

  return this.prisma.serviceContract.update({
    where: { id },
    data: updateData,
  });
}


  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.serviceContract.delete({
      where: { id },
    });
  }
}
