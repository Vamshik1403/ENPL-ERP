import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { TelegramService } from '../telegram/telegram.service';


@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
    private telegramService: TelegramService,
  ) { }

    /* --------------------------------------------------
     CUSTOMER EMAILS FROM DB (SOURCE OF TRUTH)
  -------------------------------------------------- */
 private async getCustomerEmailsByAddressBook(
  addressBookId: number | null,
): Promise<string[]> {

  if (!addressBookId) {
    return []; // 🔥 inquiry without customer
  }

  const contacts = await this.prisma.customerContact.findMany({
    where: {
      sites: {
        some: {
          customerId: addressBookId,
        },
      },
    },
    select: {
      emailAddress: true,
    },
  });

  return contacts
    .map(c => c.emailAddress)
    .filter(Boolean);
}

  /* --------------------------------------------------
     CREATE TASK (INTERNAL + CUSTOMER)
  -------------------------------------------------- */
  async create(
    dto: CreateTaskDto,
    loggedInUserId?: number,
    customerInfo?: { name: string },
  ) {
    const {
      contacts,
      workscopeDetails,
      schedule,
      remarks,
      taskInventories,
      purchase,              // 🔥 NEW
      taskType,              // 🔥 NEW
      purchaseAttachments,   // 🔥 NEW for attachments
      engineerId,            // 🔥 ENGINEER
      ...taskData
    } = dto as any;

    // 🔹 Generate Task ID
    const now = new Date();
    const taskID = `ENSR${String(now.getFullYear()).slice(-2)}${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(
      now.getHours(),
    ).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(
      now.getSeconds(),
    ).padStart(2, '0')}`;

    // 🔹 Generate merged Engineer-Task ID if engineer assigned
    let engineerTaskId: string | null = null;
    if (engineerId) {
      const engineer = await this.prisma.engineer.findUnique({
        where: { id: engineerId },
      });
      if (engineer) {
        engineerTaskId = `${engineer.engineerId}/${taskID}`;
      }
    }

    const createdBy = loggedInUserId
      ? 'Internal User'
      : customerInfo?.name || 'Customer';

    const result = await this.prisma.$transaction(async (tx) => {
      try {

      // 🔹 Create Task
      const task = await tx.task.create({
        data: {
          taskID,
          departmentId: dto.departmentId,
          addressBookId: dto.addressBookId,
          siteId: dto.siteId,
          status: dto.status || 'Open',
          title: dto.title,
          description: dto.description ?? null,
          attachment: dto.attachment ?? null,
          priority: dto.priority ?? null,
          userId: loggedInUserId ?? null,
          engineerId: engineerId ?? null,
          engineerTaskId: engineerTaskId ?? null,
          createdBy,
          taskType: taskType ?? 'SERVICE',
        },
      });

      // 🔹 CONTACTS
if (contacts?.length) {
  await tx.tasksContacts.createMany({
    data: contacts.map(c => ({
      taskId: task.id,
      contactName: c.contactName,
      contactNumber: c.contactNumber,
      contactEmail: c.contactEmail || null,
    })),
  });
}

// 🔹 WORKSCOPE DETAILS
if (workscopeDetails?.length) {
  await tx.tasksWorkscopeDetails.createMany({
    data: workscopeDetails.map(w => ({
      taskId: task.id,
      workscopeCategoryId: Number(w.workscopeCategoryId),
      workscopeDetails: w.workscopeDetails,
      extraNote: w.extraNote || null,
    })),
  });
}

// 🔹 SCHEDULE
if (schedule?.length) {
  await tx.tasksSchedule.createMany({
    data: schedule.map(s => ({
      taskId: task.id,
      proposedDateTime: new Date(s.proposedDateTime),
      priority: s.priority || 'Normal',
    })),
  });
}

// 🔹 TASK INVENTORIES (you forgot this too)
if (taskInventories?.length) {
  await tx.taskInventory.createMany({
    data: taskInventories.map(inv => ({
      taskId: task.id,
      serviceContractId: inv.serviceContractId,
      productTypeId: inv.productTypeId,
      makeModel: inv.makeModel,
      snMac: inv.snMac,
      description: inv.description,
      purchaseDate: inv.purchaseDate
        ? new Date(inv.purchaseDate)
        : null,
      warrantyPeriod: inv.warrantyPeriod,
      warrantyStatus: inv.warrantyStatus,
      thirdPartyPurchase: inv.thirdPartyPurchase,
    })),
  });
}


      // 🔹 First remark
      if (remarks?.length === 1) {
        await tx.tasksRemarks.create({
          data: {
            taskId: task.id,
            remark: remarks[0].remark,
            status: remarks[0].status || 'Open',
            createdBy: remarks[0].createdBy || createdBy,
          },
        });
      }

      // 🔹 PURCHASE LOGIC (ONLY if present)
      if (purchase) {
        const taskPurchase = await tx.taskPurchase.create({
          data: {
            taskId: task.id,
            purchaseType: purchase.purchaseType,
            customerName: purchase.customerName,
            address: purchase.address,
          },
        });

        // Validate and create products
        for (const product of purchase.products || []) {
          // 🔒 Rule enforcement
          if (
            purchase.purchaseType === purchase.ORDER &&
            (product.validity || product.availability)
          ) {
            throw new BadRequestException(
              'Validity / availability not allowed for Purchase Order',
            );
          }

          await tx.taskPurchaseProduct.create({
            data: {
              taskPurchaseId: taskPurchase.id,
              make: product.make,
              model: product.model,
              description: product.description,
              warranty: product.warranty,
              rate: product.rate,
              vendor: product.vendor,
              validity: product.validity ? new Date(product.validity) : null,
              availability: product.availability,
            },
          });
        }

        // 🔹 Handle attachments if provided
        if (purchaseAttachments?.length) {
          for (const attachment of purchaseAttachments) {
            await tx.taskPurchaseAttachment.create({
              data: {
                taskPurchaseId: taskPurchase.id,
                filename: attachment.filename,
                filepath: attachment.filepath,
                mimeType: attachment.mimeType,
                fileSize: attachment.fileSize,
              },
            });
          }
        }
      }

      // 🔹 Reload full task
     const fullTask = await tx.task.findUnique({
  where: { id: task.id },
  include: {
    department: { include: { emails: true } },
    addressBook: true,
    site: true,
    user: true,
    engineer: true,

    // ✅ ADD THESE (THIS IS THE MISSING PART)
    contacts: true,
    workscopeDetails: true,
    schedule: true,
    taskInventories: true,

    remarks: {
      orderBy: { createdAt: 'asc' },
      take: 1,
    },

    purchase: {
      include: {
        products: true,
        taskPurchaseAttachments: true,
      },
    },
  },
});

      if (!fullTask) {
        throw new Error(`Task ${task.id} not found after creation`);
      }

      return fullTask;
      } catch (error) {
        console.error('❌ TASK CREATE ERROR:', error);
        throw error;
      }
    });

    // 🔹 Send email & Telegram OUTSIDE the transaction so failures don't roll back the task
    this.sendTaskCreatedEmail(result).catch(err =>
      console.error('📧 Email notification failed (task still saved):', err),
    );

    if (result.engineer && result.engineerTaskId) {
      this.telegramService.sendTaskNotification(result).catch(err =>
        console.error('📱 Telegram notification failed (task still saved):', err),
      );
    }

    return result;
  }

  async addPurchaseAttachment(taskId: number, file: Express.Multer.File) {
  const purchase = await this.prisma.taskPurchase.findUnique({
    where: { taskId },
  });

  if (!purchase) {
    throw new BadRequestException('Purchase record not found');
  }

  return this.prisma.taskPurchaseAttachment.create({
    data: {
      taskPurchaseId: purchase.id,
      filename: file.originalname,
      filepath: file.path,
      mimeType: file.mimetype,
      fileSize: file.size,
    },
  });
}


  /* --------------------------------------------------
     EMAIL BODY BUILDERS
  -------------------------------------------------- */
private buildInternalEmail(task: any): string {
  const description =
    task.description || task.remarks?.[0]?.remark || 'N/A';
  
  // Fallback to purchase data if addressBook/site are null
  const customerName = task.addressBook?.customerName || task.purchase?.customerName || 'N/A';
  const siteName = task.site?.siteName || task.purchase?.address || 'N/A';

  return `
New Task Created (Internal)

Task ID:
${task.taskID}

Created By:
${task.user?.fullName || task.createdBy}

Department:
${task.department?.departmentName}

Customer:
${customerName}

Site:
${siteName}

Description:
${description}

---
Internal Notification
`;
}

private buildServiceRequestDetails(task: any, isInternal: boolean): string {
  const contact = task.contacts?.[0];

  const workscope =
    task.workscopeDetails?.length
      ? task.workscopeDetails
          .map((w, i) => `${i + 1}. ${w.workscopeDetails}`)
          .join('\n')
      : 'NA';

  const proposedDate =
    task.schedule?.[0]?.proposedDateTime
      ? new Date(task.schedule[0].proposedDateTime).toLocaleString()
      : 'NA';

  return `
Service Request Details
--------------------------------------------------

Task ID:
${task.taskID}

Task Created By:
${isInternal ? `${task.user?.fullName} (${task.user?.username})` : task.createdBy}

Task Creation Date & Time:
${new Date(task.createdAt).toLocaleString()}

Customer Name:
${task.addressBook?.customerName || task.purchase?.customerName || 'NA'}

Customer Address:
${task.addressBook?.regdAddress || task.purchase?.address || 'NA'}

Contact Person:
${contact?.contactName || 'NA'}

Contact Number:
${contact?.contactNumber || 'NA'}

Service Type:
${task.taskType || 'SERVICE'}

Service Category:
${task.department?.departmentName || 'NA'}

Bill of Material:
NA

Work Scope:
${workscope}

Note:
${task.description || 'NA'}

Proposed Date:
${proposedDate}

Priority:
${task.priority || 'Normal'}

--------------------------------------------------
${isInternal ? 'Internal Notification' : 'Support Team'}
`;
}


  /* --------------------------------------------------
     EMAIL SENDER (FIXED LOGIC)
  -------------------------------------------------- */
private async sendTaskCreatedEmail(task: any) {
  // 1️⃣ Department emails (ALWAYS)
  const departmentEmails =
    task.department?.emails?.map(e => e.email) || [];

  // 2️⃣ Internal creator email
  const internalCreatorEmail =
    task.user?.email ? [task.user.email] : [];

  // 3️⃣ Customer emails - check both sources
  let customerEmails: string[] = [];

  if (task.addressBookId) {
    // Use DB contacts if addressBookId exists
    customerEmails = await this.getCustomerEmailsByAddressBook(
      task.addressBookId,
    );
  } else if (task.purchase?.customerName) {
    // Fallback: notify internal creator
    customerEmails = internalCreatorEmail;
  }

  // 4️⃣ Merge recipients (DO NOT CHANGE LOGIC)
  const recipients = Array.from(
    new Set([
      ...departmentEmails,
      ...(task.userId ? internalCreatorEmail : customerEmails),
    ]),
  );

  if (!recipients.length) {
    console.warn('⚠️ No recipients resolved for task', task.taskID);
    return;
  }

  // 5️⃣ Subject (UNCHANGED)
  const title = task.title ? task.title.trim() : 'No Title';

  const subject = `ENPL | SUPPORT TICKET | - ${task.taskID} | ${title}`;

  // 6️⃣ Body (CLEAN, EXPANDED, USER-FRIENDLY)
  // 🔥 INTERNAL vs CUSTOMER logic preserved
  const body = this.buildServiceRequestDetails(task, !!task.userId);

  // 7️⃣ Send email
  await this.mailerService.sendMail({
    to: recipients,
    subject,
    text: body,
  });
}





  async addCustomerRemark(taskId: number, dto: {
    remark: string;
    status?: string;
    createdBy: string;
  }) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        remarks: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const lastStatus = task.remarks.length
      ? task.remarks[0].status
      : 'Open';

   // 🔒 CUSTOMER STATUS RULES
let finalStatus = lastStatus;

const allowedCustomerStatuses = ['Completed', 'Reopen'];

// ✅ Allow status change ONLY if requested status is allowed
if (dto.status && allowedCustomerStatuses.includes(dto.status)) {
  finalStatus = dto.status;
}

    return this.prisma.tasksRemarks.create({
      data: {
        taskId,
        remark: dto.remark,
        status: finalStatus,   
        createdBy: dto.createdBy,
      },
    });
  }



  async findByCustomer(customerId: number) {
    return this.prisma.task.findMany({
      where: {
        addressBookId: customerId,
      },
      include: {
        department: true,
        addressBook: true,
        site: true,
        contacts: true,
        workscopeCat: true,
        workscopeDetails: true,
        schedule: true,
        remarks: true,
        taskInventories: true,
        engineer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCustomers(customerIds: number[]) {
    if (!customerIds?.length) return [];

    return this.prisma.task.findMany({
      where: {
        addressBookId: {
          in: customerIds,
        },
      },
      include: {
        department: true,
        addressBook: true,
        site: true,
        contacts: true,
        workscopeDetails: true,
        schedule: true,
        remarks: true,
        taskInventories: true,
        engineer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }


 async findAll() {
  return this.prisma.task.findMany({
    include: {
      department: true,
      addressBook: true,
      site: true,
      contacts: true,
      workscopeDetails: true,
      schedule: true,
      remarks: true,
      taskInventories: true,
      engineer: true,
      purchase: { 
        include: { 
          products: true,
          taskPurchaseAttachments: true
        } 
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        department: true,
        addressBook: true,
        site: true,
        contacts: true,
        workscopeCat: true,
        workscopeDetails: true,
        schedule: true,
        remarks: true,
        taskInventories: true,
        engineer: true,
        purchase: { include: {
          products: true,
          taskPurchaseAttachments: true
          } }, // 🔥 NEW
      },
    });

    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

 async update(id: number, dto: UpdateTaskDto) {
    await this.findOne(id);

    const {
      contacts,
      workscopeDetails,
      schedule,
      remarks,
      taskInventories,
      purchase,              // 🔥 NEW
      purchaseAttachments,   // 🔥 NEW
      engineerId,            // 🔥 ENGINEER
      ...updateData
    } = dto as any;

    // Handle engineer assignment merged ID
    if (engineerId !== undefined) {
      const existingTask = await this.prisma.task.findUnique({ where: { id } });
      if (engineerId) {
        const engineer = await this.prisma.engineer.findUnique({ where: { id: engineerId } });
        if (engineer && existingTask) {
          updateData.engineerId = engineerId;
          updateData.engineerTaskId = `${engineer.engineerId}/${existingTask.taskID}`;
        }
      } else {
        updateData.engineerId = null;
        updateData.engineerTaskId = null;
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {

      // --- UPDATE MAIN TASK ---
      await tx.task.update({
        where: { id },
        data: updateData,
      });

      // --- CONTACTS ---
      await tx.tasksContacts.deleteMany({ where: { taskId: id } });
      if (contacts?.length) {
        await tx.tasksContacts.createMany({
          data: contacts.map((c: any) => ({
            taskId: id,
            contactName: c.contactName,
            contactNumber: c.contactNumber,
            contactEmail: c.contactEmail,
          })),
        });
      }

      // --- WORKSCOPE DETAILS ---
      await tx.tasksWorkscopeDetails.deleteMany({ where: { taskId: id } });
      if (workscopeDetails?.length) {
        await tx.tasksWorkscopeDetails.createMany({
          data: workscopeDetails.map((d: any) => ({
            taskId: id,
            workscopeCategoryId: parseInt(d.workscopeCategoryId),
            workscopeDetails: d.workscopeDetails,
            extraNote: d.extraNote,
          })),
        });
      }

      // --- SCHEDULE ---
      await tx.tasksSchedule.deleteMany({ where: { taskId: id } });
      if (schedule?.length) {
        await tx.tasksSchedule.createMany({
          data: schedule.map((s: any) => ({
            taskId: id,
            proposedDateTime: new Date(s.proposedDateTime),
            priority: s.priority,
          })),
        });
      }

      // --- INVENTORY ---
      await tx.taskInventory.deleteMany({ where: { taskId: id } });
      if (taskInventories?.length) {
        for (const inv of taskInventories) {
          await tx.taskInventory.create({
            data: {
              taskId: id,
              serviceContractId: inv.serviceContractId,
              productTypeId: inv.productTypeId,
              makeModel: inv.makeModel,
              snMac: inv.snMac,
              description: inv.description,
              purchaseDate: inv.purchaseDate
                ? new Date(inv.purchaseDate)
                : null,
              warrantyPeriod: inv.warrantyPeriod,
              warrantyStatus: inv.warrantyStatus,
              thirdPartyPurchase: inv.thirdPartyPurchase,
            },
          });
        }
      }

      // 🔥 PURCHASE UPDATE / CREATE
      if (purchase) {
        // 🔒 VALIDATE UPDATE RULES
        if (purchase.products !== undefined && purchase.products.length === 0) {
          throw new BadRequestException(
            'Products cannot be empty if provided'
          );
        }

        // Validate product rules for ORDER type
        if (purchase.products) {
          for (const product of purchase.products) {
            if (
              purchase.purchaseType === purchase.ORDER &&
              (product.validity || product.availability)
            ) {
              throw new BadRequestException(
                'Validity / availability not allowed for Purchase Order'
              );
            }
          }
        }

        let taskPurchase = await tx.taskPurchase.findUnique({
          where: { taskId: id },
        });

        if (!taskPurchase) {
          taskPurchase = await tx.taskPurchase.create({
            data: {
              taskId: id,
              purchaseType: purchase.purchaseType,
              customerName: purchase.customerName,
              address: purchase.address,
            },
          });
        } else {
          await tx.taskPurchase.update({
            where: { id: taskPurchase.id },
            data: {
              purchaseType: purchase.purchaseType,
              customerName: purchase.customerName,
              address: purchase.address,
            },
          });
        }

        // Update products if provided
        if (purchase.products) {
          await tx.taskPurchaseProduct.deleteMany({
            where: { taskPurchaseId: taskPurchase.id },
          });

          for (const product of purchase.products) {
            await tx.taskPurchaseProduct.create({
              data: {
                taskPurchaseId: taskPurchase.id,
                make: product.make,
                model: product.model,
                description: product.description,
                warranty: product.warranty,
                rate: product.rate,
                vendor: product.vendor,
                validity: product.validity ? new Date(product.validity) : null,
                availability: product.availability,
              },
            });
          }
        }

       
      }

      return tx.task.findUnique({
        where: { id },
        include: {
          department: true,
          addressBook: true,
          site: true,
          contacts: true,
          workscopeCat: true,
          workscopeDetails: true,
          schedule: true,
          remarks: true,
          taskInventories: true,
          engineer: true,
          purchase: {
            include: {
              products: true,
              taskPurchaseAttachments: true, // 🔥 NEW
            },
          },
        },
      });
    });

    // 🔹 Send Telegram notification if engineer was (re)assigned
    if (result && result.engineer && result.engineerTaskId) {
      this.telegramService.sendTaskNotification(result).catch(err =>
        console.error('📱 Telegram notification failed (task still saved):', err),
      );
    }

    return result;
  }


  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.task.delete({ where: { id } });
  }
}
