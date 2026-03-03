import { Module } from "@nestjs/common";
import { BackupController } from "./backup.controller";
import { BackupService } from "./backup.service";
import { BackupRunnerService } from "./backup-runner.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  controllers: [BackupController],
  providers: [BackupService, BackupRunnerService, PrismaService],
})
export class BackupModule {}
