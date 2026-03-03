import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTasksRemarksDto } from './dto/create-task-remark.dto';
import { UpdateTasksRemarksDto } from './dto/update-task-remark.dto';
import { MailerService } from '@nestjs-modules/mailer';


@Injectable()
export class TasksRemarksService {
constructor(
  private prisma: PrismaService,
  private mailerService: MailerService,
) {}

  // ------------------------------
  // CREATE NEW REMARK
  // ------------------------------
 async create(dto: CreateTasksRemarksDto) {
  // 1️⃣ Create remark
  const remark = await this.prisma.tasksRemarks.create({
    data: {
      taskId: dto.taskId,
      remark: dto.remark,
      status: dto.status,
      createdBy: dto.createdBy || 'System User',
      createdAt: new Date(),
    },
  });

  // 2️⃣ Load full task with relations
  const task = await this.prisma.task.findUnique({
    where: { id: dto.taskId },
    include: {
      department: { include: { emails: true } },
      addressBook: true,
      site: true,
      user: true,
      remarks: {
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  });

  if (!task) return remark;

  // 3️⃣ Department emails
  const departmentEmails =
    task.department?.emails?.map(e => e.email) || [];

  // 4️⃣ Customer emails (via addressBook → customerContact)
  let customerEmails: string[] = [];
  
  if (task.addressBookId) {
    const customerContacts = await this.prisma.customerContact.findMany({
      where: {
        sites: {
          some: {
            customerId: task.addressBookId,
          },
        },
      },
      select: { emailAddress: true },
    });

    customerEmails = customerContacts.map(c => c.emailAddress);
  }

  // 5️⃣ Merge recipients
  const recipients = Array.from(
    new Set([...departmentEmails, ...customerEmails]),
  );

  if (!recipients.length) return remark;

  // 6️⃣ Email content
  const title = task.title ? task.title.trim() : 'No Title';

  const subject = `ENPL | SUPPORT TICKET | - ${task.taskID} | ${title}`;
  
  const body = `
Task Status Updated

Task ID:
${task.taskID}

New Status:
${remark.status}

Customer:
${task.addressBook?.customerName}

Site:
${task.site?.siteName}

Remark:
${remark.remark}

---
System Notification
`;

  // 7️⃣ Send email
  await this.mailerService.sendMail({
    to: recipients,
    subject,
    text: body,
  });

  return remark;
}

  // ------------------------------
  // LIST ALL REMARKS
  // ------------------------------
  async findAll() {
    return this.prisma.tasksRemarks.findMany({
      include: { task: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ------------------------------
  // FIND ONE REMARK
  // ------------------------------
  async findOne(id: number) {
    const remark = await this.prisma.tasksRemarks.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!remark) throw new NotFoundException(`TasksRemarks #${id} not found`);
    return remark;
  }

  // ------------------------------
  // UPDATE A REMARK
  // ------------------------------
  async update(id: number, dto: UpdateTasksRemarksDto) {
    await this.findOne(id);

    return this.prisma.tasksRemarks.update({
      where: { id },
      data: {
        remark: dto.remark,
        status: dto.status,
        createdAt: new Date()  // <-- or overwrite createdAt for edit timestamp
      },
      include: {
        task: true
      }
    });
  }

  // ------------------------------
  // DELETE A REMARK
  // ------------------------------
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.tasksRemarks.delete({ where: { id } });
  }
}
