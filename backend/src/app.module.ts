import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { AddressBookController } from './address-book/address-book.controller';
import { AddressBookService } from './address-book/address-book.service';
import { AddressBookModule } from './address-book/address-book.module';
import { SitesModule } from './site/site.module';
import { ProductTypeModule } from './product/product.module';
import { ServiceWorkCategoryModule } from './service-work-category/service-work-category.module';
import { ContractWorkCategoryModule } from './contract-work-category/contract-work-category.module';
import { WorkscopeCategoryModule } from './workscope-category/workscope-category.module';
import { ServiceContractModule } from './service-contract/service-contract.module';
import { ServiceContractPeriodModule } from './service-contract-period/service-contract-period.module';
import { ServiceContractTermsModule } from './service-contract-terms/service-contract-terms.module';
import { ServiceContractServicesModule } from './service-contract-services/service-contract-services.module';
import { ServiceContractInventoryModule } from './service-contract-inventory/service-contract-inventory.module';
import { ServiceContractHistoryModule } from './service-contract-history/service-contract-history.module';
import { DepartmentModule } from './department/department.module';
import { TaskModule } from './task/task.module';
import { TasksContactsModule } from './task-contacts/task-contacts.module';
import { TasksWorkscopeCategoryModule } from './task-workscope-category/task-workscope-category.module';
import { TasksWorkscopeDetailsModule } from './tasks-workscope-details/tasks-workscope-details.module';
import { TasksScheduleModule } from './task-schedule/task-schedule.module';
import { TasksRemarksModule } from './task-remarks/task-remarks.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { ServiceContractTypeModule } from './service-contract-type/service-contract-type.module';
import { ServiceContractBillingModule } from './service-contract-billing/service-contract-billing.module';
import { TaskImagesModule } from './task-images/task-images.module';
import { AuthModule } from './auth/auth.module';
import { CustomerContactModule } from './customer-contact/customer-contact.module';
import { UserPermissionModule } from './user-permission/user-permission.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CategoryModule } from './category/category.module';
import { SubcategoryModule } from './subcategory/subcategory.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { MaterialDeliveryModule } from './material-delivery/material-delivery.module';
import { VendorModule } from './vendor/vendor.module';
import { VendorPaymentModule } from './vendor-payment/vendor-payment.module';
import { BackupModule } from './backup/backup.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EngineerModule } from './engineer/engineer.module';
import { TelegramModule } from './telegram/telegram.module';


@Module({
  imports: [
    // ✅ Schedule module
    ScheduleModule.forRoot(),

    // ✅ Mailer module
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
  },
}),

    AddressBookModule, SitesModule,ProductTypeModule, ServiceWorkCategoryModule, ContractWorkCategoryModule, WorkscopeCategoryModule, ServiceContractModule, ServiceContractPeriodModule, ServiceContractTermsModule, ServiceContractServicesModule, ServiceContractInventoryModule, ServiceContractHistoryModule, DepartmentModule, TaskModule, TasksContactsModule, TasksWorkscopeCategoryModule, TasksWorkscopeDetailsModule, TasksScheduleModule, TasksRemarksModule, SupportTicketsModule,  ServiceContractTypeModule, ServiceContractBillingModule, TaskImagesModule, AuthModule, CustomerContactModule, UserPermissionModule, CategoryModule, SubcategoryModule, ProductsModule, InventoryModule, MaterialDeliveryModule, VendorModule, VendorPaymentModule, BackupModule, EngineerModule, TelegramModule],
  controllers: [
    AppController,
    AddressBookController,
  ],
  providers: [
    AppService,
    PrismaService,
    AddressBookService,
  ],
  
})


export class AppModule {}
