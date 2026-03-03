import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { BackupService } from "./backup.service";
import { PrismaService } from "src/prisma/prisma.service";
import { BackupRunnerService } from "./backup-runner.service";
import { FileInterceptor } from "@nestjs/platform-express";
import * as fs from "fs";
import * as path from "path";
import { BACKUP_DIR, DB_NAME, MAX_UPLOAD_MB } from "./backup.constants";
import { SaveBackupConfigDto } from "./dto/create-backup.dto";

@Controller("backup")
export class BackupController {
  constructor(
    private readonly backup: BackupService,
    private readonly prisma: PrismaService,
    private readonly runner: BackupRunnerService
  ) {}

  // ---------- CONFIG ----------
  @Get("config")
  async getConfig() {
    const c = await this.prisma.backupConfig.findFirst();
    if (c) return c;

    // ensure default row exists
    return this.prisma.backupConfig.create({
      data: {
        id: 1,
        enabled: false,
        type: "DAY",
        hour: 2,
        minute: 0,
        maxFiles: 5
      }
    });
  }

 @Post("config")
async saveConfig(@Body() dto: SaveBackupConfigDto) {

  const updated = await this.prisma.backupConfig.upsert({
    where: { id: 1 },
    update: {
      enabled: dto.enabled,
      type: dto.type,
      hour: dto.hour ?? null,
      minute: dto.minute ?? null,
      dayOfWeek: dto.dayOfWeek ?? null,
      dayOfMonth: dto.dayOfMonth ?? null,
      month: dto.month ?? null,
      maxFiles: dto.maxFiles
    },
    create: {
      id: 1,
      enabled: dto.enabled,
      type: dto.type,
      hour: dto.hour ?? null,
      minute: dto.minute ?? null,
      dayOfWeek: dto.dayOfWeek ?? null,
      dayOfMonth: dto.dayOfMonth ?? null,
      month: dto.month ?? null,
      maxFiles: dto.maxFiles
    }
  });

  // 🔥 THIS LINE IS MISSING IN YOUR SYSTEM
  if (updated.enabled) {
    await this.runner.registerJob(updated);
  } else {
    try {
      this.runner['schedulerRegistry'].deleteCronJob('auto-backup');
    } catch {}
  }

  return updated;
}


  // ---------- MANUAL CREATE ----------
  @Post("create")
  async createManual() {
    const cfg = await this.prisma.backupConfig.findFirst();
    const maxFiles = cfg?.maxFiles ?? 5;
    return this.backup.createBackupAndEnforceRetention(maxFiles);
  }

  // ---------- LIST (pagination + optional last N days) ----------
  @Get("list")
  list(
    @Query("page") page = "1",
    @Query("perPage") perPage = "10",
    @Query("days") days?: string
  ) {
    return this.backup.listBackups({
      page: Number(page),
      perPage: Number(perPage),
      days: days ? Number(days) : undefined
    });
  }

  // ---------- DOWNLOAD ----------
  @Get("download/:filename")
  async download(@Param("filename") filename: string, @Res() res: any) {
    const full = this.backup.getDownloadStream(filename);
    return res.download(full, filename);
  }

  // ---------- DELETE ----------
  @Delete("file/:filename")
  delete(@Param("filename") filename: string) {
    return this.backup.deleteBackupFile(filename);
  }

  // ---------- RESTORE BY EXISTING FILE ----------
  @Post("restore")
  restore(@Body("filename") filename: string) {
    if (!filename) throw new BadRequestException("filename required");
    return this.backup.restoreFromFilename(filename);
  }

  // ---------- UPLOAD + RESTORE ----------
  @Post("restore-upload")
  @UseInterceptors(FileInterceptor("file"))
  async restoreUpload(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException("file required");
    if (!file.originalname?.endsWith(".backup")) throw new BadRequestException("Only .backup allowed");
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new BadRequestException(`File too large > ${MAX_UPLOAD_MB}MB`);

    fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const target = path.join(BACKUP_DIR, safeName);

    fs.writeFileSync(target, file.buffer);

    // restore from uploaded file
    return this.backup.restoreFromFilename(safeName);
  }


}
