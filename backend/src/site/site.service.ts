import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { Site } from '@prisma/client';
import { CreateSiteContactDto } from './dto/create-site-contact.dto';
import { UpdateSiteContactDto } from './dto/update-site-contact.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateSiteDto): Promise<Site> {
    // Generate the proper sequential ID with customer prefix
    const siteID = await this.generateNextSiteId(data.addressBookId);
    
    return this.prisma.site.create({ 
      data: {
        siteName: data.siteName,
        siteAddress: data.siteAddress,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        gstNo: data.gstNo,
        addressBookId: data.addressBookId,
        siteID,
      }
    });
  }

  async generateNextSiteId(addressBookId: number): Promise<string> {
    // Get the customer's address book information
    const addressBook = await this.prisma.addressBook.findUnique({
      where: { id: addressBookId }
    });
    
    if (!addressBook) {
      throw new NotFoundException('Address book not found');
    }
    
    // Count existing sites for this customer
    const count = await this.prisma.site.count({
      where: { addressBookId }
    });
    
    const nextNumber = String(count + 1).padStart(3, '0');
    return `${addressBook.addressBookID}-SITE/${nextNumber}`;
  }

  findAll(): Promise<Site[]> {
    return this.prisma.site.findMany({ 
      include: { 
        contacts: true,
        addressBook: true 
      } 
    });
  }

  async findOne(id: number): Promise<Site> {
    if (!id || Number.isNaN(id)) {
      throw new BadRequestException('Site id is required');
    }

    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        contacts: true,
        addressBook: true,
        tasks: true,
      },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return site;
  }

  findAllBasedOnCust(addressBookId?: number) {
    return this.prisma.site.findMany({
      where: addressBookId
        ? { addressBookId }
        : undefined,
      orderBy: { siteName: 'asc' },
      include: {
        contacts: true,
        addressBook: true,
      },
    });
  }

  async update(id: number, data: UpdateSiteDto) {
    const site = await this.prisma.site.findUnique({
      where: { id }
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    return this.prisma.site.update({
      where: { id },
      data,
      include: {
        addressBook: true,
        contacts: true,
      },
    });
  }

  // Contact management methods
  async getSiteContacts(siteId: number) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    return this.prisma.siteContact.findMany({
      where: { siteId },
    });
  }

  async createSiteContact(siteId: number, data: CreateSiteContactDto) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${siteId} not found`);
    }

    return this.prisma.siteContact.create({
      data: {
        contactPerson: data.contactPerson,
        designation: data.designation,
        contactNumber: data.contactNumber,
        emailAddress: data.emailAddress,
        siteId,
      },
    });
  }

  async updateSiteContact(contactId: number, data: UpdateSiteContactDto) {
    const contact = await this.prisma.siteContact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    return this.prisma.siteContact.update({
      where: { id: contactId },
      data,
    });
  }

  async deleteSiteContact(contactId: number) {
    const contact = await this.prisma.siteContact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID ${contactId} not found`);
    }

    return this.prisma.siteContact.delete({
      where: { id: contactId },
    });
  }

  async remove(id: number): Promise<Site> {
    const site = await this.prisma.site.findUnique({
      where: { id }
    });

    if (!site) {
      throw new NotFoundException(`Site with ID ${id} not found`);
    }

    // Delete all contacts first (if using Prisma without cascading deletes)
    await this.removeSiteContactsBySiteId(id);
    
    return this.prisma.site.delete({ 
      where: { id } 
    });
  }

  // Utility methods
  async removeSiteContactsBySiteId(siteId: number): Promise<any> {
    return this.prisma.siteContact.deleteMany({
      where: { siteId },
    });
  }
}