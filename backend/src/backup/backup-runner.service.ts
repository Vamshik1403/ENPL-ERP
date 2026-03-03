import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from 'src/prisma/prisma.service';
import { BackupService } from './backup.service';

@Injectable()
export class BackupRunnerService implements OnModuleInit {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private prisma: PrismaService,
    private backupService: BackupService,
  ) {}

  async onModuleInit() {
    await this.reloadFromDatabase();
  }

  async reloadFromDatabase() {
    const config = await this.prisma.backupConfig.findFirst();
    if (!config || !config.enabled) return;

    this.registerJob(config);
  }

  async registerJob(config: any) {

    
    try {
      this.schedulerRegistry.deleteCronJob('auto-backup');
    } catch {}

    const expression = this.buildCron(config);

    const job = new CronJob(expression, async () => {
      await this.backupService.createBackupAndEnforceRetention(config.maxFiles);
    });

    this.schedulerRegistry.addCronJob('auto-backup', job);
    job.start();
  }

  buildCron(cfg: any): string {
    switch (cfg.type) {
      case 'HOUR':
        return `${cfg.minute} * * * *`;
      case 'DAY':
        return `${cfg.minute} ${cfg.hour} * * *`;
      case 'WEEK':
        return `${cfg.minute} ${cfg.hour} * * ${cfg.dayOfWeek}`;
      case 'MONTH':
        return `${cfg.minute} ${cfg.hour} ${cfg.dayOfMonth} * *`;
      case 'YEAR':
        return `${cfg.minute} ${cfg.hour} ${cfg.dayOfMonth} ${cfg.month} *`;
      default:
        throw new Error('Invalid schedule type');
    }
  }
}
