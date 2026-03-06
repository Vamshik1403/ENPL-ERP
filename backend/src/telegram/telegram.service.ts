import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private pollingOffset = 0;
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private isPolling = false;
  private botToken: string;
  private botUsername: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService, // Add this
  ) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN')?.replace(/^["']|["']$/g, '') || '';
    this.botUsername = this.configService.get('TELEGRAM_BOT_USERNAME')?.replace(/^["']|["']$/g, '') || '';
    
    if (!this.botToken) {
      this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN not set in environment variables');
    }
  }

  // Remove the private getter methods since we now have properties
  // private get botToken(): string | undefined { ... }  // REMOVE THIS
  // private get botUsername(): string | undefined { ... } // REMOVE THIS

  /* ──────────────────────────────────────────
     LIFECYCLE — start/stop long-polling
  ────────────────────────────────────────── */
  async onModuleInit() {
    if (!this.botToken) {
      this.logger.warn('⚠️  TELEGRAM_BOT_TOKEN not set — bot disabled');
      return;
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.botToken}/deleteWebhook`,
        { method: 'POST' },
      );
      const data = await res.json();
      this.logger.log(`Webhook cleanup: ${JSON.stringify(data)}`);
    } catch {
      // ignore
    }

    this.isPolling = true;
    this.logger.log('🤖 Starting Telegram long-polling…');
  }

  onModuleDestroy() {
    this.isPolling = false;
    if (this.pollingTimer) clearTimeout(this.pollingTimer);
    this.logger.log('🤖 Stopped Telegram long-polling');
  }


  
  /* ──────────────────────────────────────────
     SEND TASK NOTIFICATION (called from TaskService)
  ────────────────────────────────────────── */
 async sendTaskNotification(task: any): Promise<boolean> {
  if (!this.botToken) {
    this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN not set, skipping notification');
    return false;
  }

  if (!task.engineerAssignments?.length) {
    this.logger.warn(`⚠️ No engineer assignments for task ${task.taskID}`);
    return false;
  }

  const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://yourdomain.com';
  
  let successCount = 0;

  for (const assignment of task.engineerAssignments) {
    const engineer = assignment.engineer;

    if (!engineer?.telegramChatId) {
      this.logger.warn(
        `⚠️ No Telegram chat ID for engineer ${engineer?.engineerId}`,
      );
      continue;
    }

    const taskUrl = encodeURI(
      `${frontendUrl}/tasks/view/${engineer.engineerId}/${task.taskID}`
    );

    // SINGLE MESSAGE with clean format
    const message = `
🔧 <b>New Task Assigned</b>

👷 <b>Engineer:</b> ${engineer.firstName} ${engineer.lastName}
🏢 <b>Department:</b> ${task.department?.departmentName || 'N/A'}

📝 <b>Title:</b> ${task.title || 'N/A'}
📃 <b>Description:</b> ${(task.description || 'N/A').substring(0, 200)}

👤 <b>Customer:</b> ${task.addressBook?.customerName || 'N/A'}
📍 <b>Site:</b> ${task.site?.siteName || 'N/A'}

📅 <b>Created:</b> ${new Date(task.createdAt).toLocaleString('en-IN')}
📅 <b>Visit Scheduled:</b> ${
      assignment.proposedDateTime
        ? new Date(assignment.proposedDateTime).toLocaleString('en-IN')
        : 'Not scheduled'
    }

⚡ <b>Priority:</b> ${assignment.priority || task.priority || 'Normal'}

━━━━━━━━━━━━━━━━━━━━━━
🔗 <b>Task Link:</b> <a href="${taskUrl}">Click here to open task</a>
━━━━━━━━━━━━━━━━━━━━━━
`;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: engineer.telegramChatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🔗 Open Task',
                    url: taskUrl,
                  }
                ],
              
              ],
            },
          }),
        },
      );

      const data = await res.json();

      if (data.ok) {
        this.logger.log(
          `✅ Telegram notification sent to ${engineer.engineerId}`,
        );
        successCount++;
      } else {
        this.logger.error('Telegram API error:', data);
      }
    } catch (err) {
      this.logger.error('Telegram send error:', err);
    }
  }
  return successCount > 0;
}
}