import { Controller, Get, Param, ParseIntPipe, Post, Body, Req, Patch, Delete, UploadedFile, UseInterceptors } from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskService } from "./task.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // ---------- STATIC ROUTES FIRST ----------

  @Get('by-customer/:customerId')
  findByCustomer(
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    return this.taskService.findByCustomer(customerId);
  }

  @Post('by-customers')
  findByCustomers(@Body('customerIds') customerIds: number[]) {
    return this.taskService.findByCustomers(customerIds);
  }

  @Post('internal')
  createInternal(
    @Body() dto: CreateTaskDto,
    @Req() req,
  ) {
    return this.taskService.create(dto, req.user.id);
  }

  // 🔥 CUSTOMER ROUTE MUST BE HERE
  @Post('customer')
  createFromCustomer(@Body() body: any) {
    const { customerName, customerEmail, ...dto } = body;

    return this.taskService.create(
      dto,
      undefined,
      {
        name: customerName,
      },
    );
  }

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.taskService.create(dto, dto.userId);
  }
@Post(':taskId/purchase-attachment')
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/purchase',
      filename: (req, file, cb) => {
        const uniqueName =
          Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueName}-${file.originalname}`);
      },
    }),
  }),
)
async uploadPurchaseAttachment(
  @Param('taskId', ParseIntPipe) taskId: number,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.taskService.addPurchaseAttachment(taskId, file);
}


  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  // ---------- DYNAMIC ROUTES LAST ----------

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  @Post(':id/customer-remark')
  addCustomerRemark(
    @Param('id', ParseIntPipe) taskId: number,
    @Body() body: { remark: string; status?: string; createdBy: string },
  ) {
    return this.taskService.addCustomerRemark(taskId, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }
}
