import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomerContactDto } from './dto/create-customer-contact.dto';
import { UpdateCustomerContactDto } from './dto/update-customer-contact.dto';
import { AddSiteDto } from './dto/add-site.dto';

@Injectable()
export class CustomerContactService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerContactDto) {
    if (!dto.sites?.length) {
      throw new BadRequestException('At least one customer-site mapping is required.');
    }

    return this.prisma.customerContact.create({
      data: {
        custFirstName: dto.custFirstName,
        custLastName: dto.custLastName,
        phoneNumber: dto.phoneNumber,
        emailAddress: dto.emailAddress,
        sites: {
          create: dto.sites.map((s) => ({
            customerId: s.customerId,
            siteId: s.siteId,
          })),
        },
      },
      include: {
        sites: {
          include: { addressBook: true, site: true },
        },
      },
    });
  }

  findAll() {
    return this.prisma.customerContact.findMany({
      include: {
        sites: {
          include: { addressBook: true, site: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const contact = await this.prisma.customerContact.findUnique({
      where: { id },
      include: {
        sites: {
          include: { addressBook: true, site: true },
        },
      },
    });

    if (!contact) throw new NotFoundException(`CustomerContact #${id} not found`);
    return contact;
  }

  /**
   * Update contact + replace mappings in one call.
   * This matches your UI: edit person + full table rows.
   */
  async update(id: number, dto: UpdateCustomerContactDto) {
    await this.findOne(id);

    // Replace mappings only if provided
    const replaceSites = Array.isArray(dto.sites);

return this.prisma.$transaction(async (tx) => {
  if (replaceSites) {
    // Clear old mappings
    await tx.customerContactSite.deleteMany({
      where: { customerContactId: id },
    });

    // Recreate mappings only if provided and not empty
    if (dto.sites && dto.sites.length > 0) {
      await tx.customerContactSite.createMany({
        data: dto.sites.map((s) => ({
          customerContactId: id,
          customerId: s.customerId,
          siteId: s.siteId,
        })),
        skipDuplicates: true,
      });
    }
  }

  // Update base contact fields
  return tx.customerContact.update({
    where: { id },
    data: {
      custFirstName: dto.custFirstName,
      custLastName: dto.custLastName,
      phoneNumber: dto.phoneNumber,
      emailAddress: dto.emailAddress,
    },
    include: {
      sites: {
        include: { addressBook: true, site: true },
      },
    },
  });
});
  }

  async findByEmail(email: string) {
  return this.prisma.customerContact.findUnique({
    where: { emailAddress: email },
    include: {
      sites: {
        include: {
          addressBook: true,
          site: true,
          customerContact: true,
        },
      },
    },
  });
}

  

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.customerContact.delete({ where: { id } });
  }

  /** Add ONE mapping row (for your “+ Add” button behavior) */
  async addSite(contactId: number, dto: AddSiteDto) {
    await this.findOne(contactId);

    return this.prisma.customerContactSite.create({
      data: {
        customerContactId: contactId,
        customerId: dto.customerId,
        siteId: dto.siteId,
      },
      include: {
        addressBook: true,
        site: true,
      },
    });
  }

  /** Remove ONE mapping row */
  async removeSite(mappingId: number) {
    return this.prisma.customerContactSite.delete({
      where: { id: mappingId },
    });
  }
}
