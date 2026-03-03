import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  // Generate ticket ID in format EN/TK/00001
  private async generateTicketId(): Promise<string> {
    const lastTicket = await this.prisma.supportTicket.findFirst({
      orderBy: {
        id: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastTicket && lastTicket.ticketID) {
      const lastNumber = parseInt(lastTicket.ticketID.split('/')[2]);
      nextNumber = lastNumber + 1;
    }

    return `EN/TK/${nextNumber.toString().padStart(5, '0')}`;
  }

  async create(createSupportTicketDto: CreateSupportTicketDto) {
    const ticketId = await this.generateTicketId();
    
    return await this.prisma.supportTicket.create({
      data: {
        ...createSupportTicketDto,
        ticketID: ticketId,
      },
      include: {
        site: true,
        addressBook: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.supportTicket.findMany({
      include: {
        site: true,
        addressBook: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const supportTicket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        site: true,
        addressBook: true,
      },
    });

    if (!supportTicket) {
      throw new NotFoundException(`SupportTicket with ID ${id} not found`);
    }

    return supportTicket;
  }

  async findByTicketId(ticketID: string) {
    const supportTicket = await this.prisma.supportTicket.findUnique({
      where: { ticketID },
      include: {
        site: true,
        addressBook: true,
      },
    });

    if (!supportTicket) {
      throw new NotFoundException(`SupportTicket with TicketID ${ticketID} not found`);
    }

    return supportTicket;
  }



  async update(id: number, updateSupportTicketDto: UpdateSupportTicketDto) {
    // Check if ticket exists
    await this.findOne(id);
    
    return await this.prisma.supportTicket.update({
      where: { id },
      data: updateSupportTicketDto,
      include: {
        site: true,
        addressBook: true,
      },
    });
  }

  async remove(id: number) {
    // Check if ticket exists
    await this.findOne(id);
    
    return await this.prisma.supportTicket.delete({
      where: { id },
    });
  }

  async findByStatus(status: string) {
    return await this.prisma.supportTicket.findMany({
      where: { status },
      include: {
        site: true,
        addressBook: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByCustomer(customerId: number) {
    return await this.prisma.supportTicket.findMany({
      where: { customerId },
      include: {
        site: true,
        addressBook: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
async getNextTicketId(): Promise<{ ticketId: string }> {
  const ticketId = await this.generateTicketId();
  return { ticketId };
}
}