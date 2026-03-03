import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private pollingOffset = 0;
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private isPolling = false;

  constructor(private prisma: PrismaService) {}

  private get botToken(): string | undefined {
    const raw = process.env.TELEGRAM_BOT_TOKEN;
    // Strip surrounding quotes if present
    return raw?.replace(/^["']|["']$/g, '');
  }

  private get botUsername(): string | undefined {
    const raw = process.env.TELEGRAM_BOT_USERNAME;
    return raw?.replace(/^["']|["']$/g, '');
  }

  /* ──────────────────────────────────────────
     LIFECYCLE — start/stop long-polling
  ────────────────────────────────────────── */
  async onModuleInit() {
    if (!this.botToken) {
      this.logger.warn('⚠️  TELEGRAM_BOT_TOKEN not set — bot disabled');
      return;
    }

    // Delete any stale webhook so getUpdates works
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
    this.poll();
  }

  onModuleDestroy() {
    this.isPolling = false;
    if (this.pollingTimer) clearTimeout(this.pollingTimer);
    this.logger.log('🤖 Stopped Telegram long-polling');
  }

  /* ──────────────────────────────────────────
     LONG-POLLING LOOP
  ────────────────────────────────────────── */
  private async poll() {
    if (!this.isPolling || !this.botToken) return;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.pollingOffset}&timeout=30`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        if (data.result.length > 0) {
          this.logger.log(`📨 Received ${data.result.length} update(s)`);
        }
        for (const update of data.result) {
          this.pollingOffset = update.update_id + 1;
          this.logger.log(`Processing update ${update.update_id}: ${JSON.stringify(update).substring(0, 200)}`);
          try {
            const result = await this.handleWebhook(update);
            this.logger.log(`Update ${update.update_id} handled: ${result}`);
          } catch (err) {
            this.logger.error(`Error processing update ${update.update_id}:`, err);
          }
        }
      } else if (!data.ok) {
        this.logger.error(`getUpdates API error: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      this.logger.error('Polling error (will retry):', err);
    }

    // Schedule next poll
    if (this.isPolling) {
      this.pollingTimer = setTimeout(() => this.poll(), 1000);
    }
  }

  /* ──────────────────────────────────────────
     INCOMING WEBHOOK  — processes updates
     from Telegram (message, callback_query)
  ────────────────────────────────────────── */
  async handleWebhook(update: any): Promise<string> {
    try {
      // 1️⃣ Handle /start command (engineer linking)
      if (update.message?.text?.startsWith('/start')) {
        return this.handleStartCommand(update.message);
      }

      // 2️⃣ Handle callback queries (button presses)
      if (update.callback_query) {
        return this.handleCallbackQuery(update.callback_query);
      }

      // 3️⃣ Any other text message — guide them
      if (update.message?.text) {
        const chatId = String(update.message.chat.id);
        await this.sendMessage(
          chatId,
          'ℹ️ To link your engineer account, type:\n/start ENG001\n\n(replace ENG001 with your engineer code)',
        );
        return 'guided';
      }

      return 'ok';
    } catch (err) {
      this.logger.error('Webhook processing error:', err);
      return 'error';
    }
  }

  /* ──────────────────────────────────────────
     /start ENG001  — link engineer to chatId
  ────────────────────────────────────────── */
  private async handleStartCommand(message: any): Promise<string> {
    const chatId = String(message.chat.id);
    const text = (message.text || '').trim();
    const parts = text.split(/\s+/);
    this.logger.log(`/start command from chatId=${chatId}, text="${text}", parts=${JSON.stringify(parts)}`);

    // /start without payload — show welcome
    if (parts.length < 2) {
      const sent = await this.sendMessage(
        chatId,
        '👋 Welcome to ENPL ERP Bot!\n\nTo link your engineer account, use the link provided in the Engineers page of ENPL ERP.\n\nOr type:  /start ENG001\n(replace ENG001 with your engineer code)',
      );
      this.logger.log(`Welcome message sent=${sent} to chatId=${chatId}`);
      return 'welcome';
    }

    const engineerCode = parts[1].toUpperCase();

    // Find engineer by code
    const engineer = await this.prisma.engineer.findUnique({
      where: { engineerId: engineerCode },
    });

    if (!engineer) {
      await this.sendMessage(
        chatId,
        `❌ Engineer code ${engineerCode} not found.\n\nPlease check the code and try again.`,
      );
      return 'engineer-not-found';
    }

    // Check if already linked to a DIFFERENT chat
    if (engineer.telegramChatId && engineer.telegramChatId !== chatId) {
      await this.sendMessage(
        chatId,
        `⚠️ Engineer ${engineerCode} is already linked to a different Telegram account.\n\nContact your admin to reset it.`,
      );
      return 'already-linked';
    }

    // Link engineer
    await this.prisma.engineer.update({
      where: { id: engineer.id },
      data: { telegramChatId: chatId },
    });

    await this.sendMessage(
      chatId,
      `✅ Successfully linked!\n\n👷 Engineer: ${engineer.firstName} ${engineer.lastName}\n🆔 Code: ${engineer.engineerId}\n\nYou will now receive task notifications here.`,
    );

    this.logger.log(`✅ Linked ${engineerCode} → chatId ${chatId}`);
    return 'linked';
  }

  /* ──────────────────────────────────────────
     CALLBACK QUERY HANDLER  (button presses)
  ────────────────────────────────────────── */
  private async handleCallbackQuery(query: any): Promise<string> {
    const chatId = String(query.message?.chat?.id);
    const data = query.data || '';

    // Handle task status updates: accept_<taskId> or reject_<taskId>
    if (data.startsWith('accept_')) {
      const taskId = parseInt(data.replace('accept_', ''));
      if (!isNaN(taskId)) {
        await this.updateTaskStatus(taskId, 'Work in Progress', chatId);
        // Answer the callback to remove loading state
        await this.answerCallbackQuery(query.id, '✅ Task Accepted');
      }
    } else if (data.startsWith('reject_')) {
      const taskId = parseInt(data.replace('reject_', ''));
      if (!isNaN(taskId)) {
        await this.updateTaskStatus(taskId, 'On-Hold', chatId);
        await this.answerCallbackQuery(query.id, '⏸ Task put On-Hold');
      }
    }

    return 'ok';
  }

  /* ──────────────────────────────────────────
     UPDATE TASK STATUS from Telegram button
  ────────────────────────────────────────── */
  private async updateTaskStatus(taskId: number, newStatus: string, chatId: string) {
    try {
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { engineer: true },
      });

      if (!task) {
        await this.sendMessage(chatId, '❌ Task not found.');
        return;
      }

      // Update task status
      await this.prisma.task.update({
        where: { id: taskId },
        data: { status: newStatus },
      });

      // Add a remark
      await this.prisma.tasksRemarks.create({
        data: {
          taskId,
          remark: `Status changed to "${newStatus}" via Telegram`,
          status: newStatus,
          createdBy: task.engineer
            ? `${task.engineer.firstName} ${task.engineer.lastName}`
            : 'Engineer (Telegram)',
        },
      });

      await this.sendMessage(
        chatId,
        `✅ Task *${task.engineerTaskId || task.taskID}* updated to *${newStatus}*`,
        'Markdown',
      );
    } catch (err) {
      this.logger.error('updateTaskStatus error:', err);
      await this.sendMessage(chatId, '❌ Failed to update task status. Please try again.');
    }
  }

  /* ──────────────────────────────────────────
     SEND TASK NOTIFICATION  (called from TaskService)
  ────────────────────────────────────────── */
  async sendTaskNotification(task: any): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('⚠️ TELEGRAM_BOT_TOKEN not set, skipping notification');
      return false;
    }

    const engineer = task.engineer;
    if (!engineer) return false;

    const chatId = engineer.telegramChatId;
    if (!chatId) {
      this.logger.warn(`⚠️ No Telegram chat ID for engineer ${engineer.engineerId}`);
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const message = [
      `🔧 *New Task Assigned*`,
      ``,
      `📋 *Task ID:* \`${task.engineerTaskId || task.taskID}\``,
      `👷 *Engineer:* ${engineer.firstName} ${engineer.lastName}`,
      `📝 *Title:* ${task.title || 'N/A'}`,
      `📃 *Description:* ${(task.description || 'N/A').substring(0, 200)}`,
      `🏢 *Department:* ${task.department?.departmentName || 'N/A'}`,
      `👤 *Customer:* ${task.addressBook?.customerName || 'N/A'}`,
      `📍 *Site:* ${task.site?.siteName || 'N/A'}`,
      `🔖 *Status:* ${task.status}`,
      `📅 *Created:* ${new Date(task.createdAt).toLocaleString('en-IN')}`,
    ].join('\n');

    // Inline keyboard with Accept / Hold + View Task buttons
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Accept', callback_data: `accept_${task.id}` },
          { text: '⏸ On Hold', callback_data: `reject_${task.id}` },
        ],
        [
          {
            text: '🔗 View Task',
            url: `${frontendUrl}/tasks`,
          },
        ],
      ],
    };

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: keyboard,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        this.logger.error('Telegram API error:', data);
        return false;
      }

      this.logger.log(`✅ Telegram notification sent to ${engineer.engineerId}`);
      return true;
    } catch (err) {
      this.logger.error('Telegram send error:', err);
      return false;
    }
  }

  /* ──────────────────────────────────────────
     LOW-LEVEL HELPERS
  ────────────────────────────────────────── */
  async sendMessage(chatId: string, text: string, parseMode?: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.error('sendMessage: no bot token');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const body = {
        chat_id: chatId,
        text,
        ...(parseMode ? { parse_mode: parseMode } : {}),
      };
      this.logger.log(`sendMessage → chatId=${chatId}, textLen=${text.length}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        this.logger.error(`sendMessage FAILED: ${JSON.stringify(data)}`);
      } else {
        this.logger.log(`sendMessage OK → message_id=${data.result?.message_id}`);
      }
      return data.ok === true;
    } catch (err) {
      this.logger.error('sendMessage exception:', err);
      return false;
    }
  }

  private async answerCallbackQuery(callbackQueryId: string, text: string): Promise<void> {
    if (!this.botToken) return;

    try {
      await fetch(
        `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text,
          }),
        },
      );
    } catch {
      // non-critical
    }
  }

  /* ──────────────────────────────────────────
     UTILITY: Get deep-link URL for an engineer
  ────────────────────────────────────────── */
  getDeepLink(engineerCode: string): string {
    const username = this.botUsername || 'YourBotUsername';
    return `https://t.me/${username}?start=${engineerCode}`;
  }

  /* ──────────────────────────────────────────
     UTILITY: Check if engineer is linked
  ────────────────────────────────────────── */
  async isLinked(engineerId: number): Promise<boolean> {
    const engineer = await this.prisma.engineer.findUnique({
      where: { id: engineerId },
      select: { telegramChatId: true },
    });
    return !!engineer?.telegramChatId;
  }

  /* ──────────────────────────────────────────
     GET BOT INFO (for frontend to show link)
  ────────────────────────────────────────── */
  getBotInfo() {
    return {
      configured: !!this.botToken,
      botUsername: this.botUsername || null,
    };
  }
}
