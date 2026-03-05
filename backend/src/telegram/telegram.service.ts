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

  const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
  const isProduction = process.env.NODE_ENV === 'production';

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

    // FIRST MESSAGE - Task Details (without link)
    const detailsMessage = `
🔧 <b>New Task Assigned</b>

👷 <b>Engineer:</b> ${engineer.firstName} ${engineer.lastName}
🏢 <b>Department:</b> ${task.department?.departmentName || 'N/A'}

📋 <b>Task ID:</b> <code>${task.taskID}</code>
🆔 <b>Engineer Task ID:</b> ${task.engineerTaskId || 'N/A'}

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
`;

    // SECOND MESSAGE - Task Link only (for easy copying)
    const linkMessage = `
━━━━━━━━━━━━━━━━━━━━━━
📎 <b>TASK LINK (copy below):</b>

<code>${taskUrl}</code>

<i>Long press to copy the link, then paste in your browser</i>
━━━━━━━━━━━━━━━━━━━━━━
`;

    try {
      // Send first message - Task Details
      const detailsRes = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: engineer.telegramChatId,
            text: detailsMessage,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        },
      );

      const detailsData = await detailsRes.json();

      if (detailsData.ok) {
        this.logger.log(`✅ Task details sent to ${engineer.engineerId}`);
        
        // Send second message - Task Link
        const linkRes = await fetch(
          `https://api.telegram.org/bot${this.botToken}/sendMessage`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: engineer.telegramChatId,
              text: linkMessage,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
              // Optional: Add a button in production
              ...(isProduction && {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: '🔗 Open Task',
                        url: taskUrl,
                      },
                    ],
                  ],
                },
              }),
            }),
          },
        );

        const linkData = await linkRes.json();

        if (linkData.ok) {
          this.logger.log(`✅ Task link sent to ${engineer.engineerId}`);
          successCount++;
        } else {
          this.logger.error('Telegram API error (link message):', linkData);
        }
      } else {
        this.logger.error('Telegram API error (details message):', detailsData);
      }
    } catch (err) {
      this.logger.error('Telegram send error:', err);
    }
  }
  return successCount > 0;
}
}