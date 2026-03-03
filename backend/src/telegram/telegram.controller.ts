import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Webhook endpoint — Telegram sends updates here.
   * Register via: POST https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourdomain.com/telegram/webhook
   */
  @Post('webhook')
  async handleWebhook(@Body() update: any) {
    const result = await this.telegramService.handleWebhook(update);
    return { ok: true, result };
  }

  /**
   * Get bot configuration info (for frontend)
   */
  @Get('bot-info')
  getBotInfo() {
    return this.telegramService.getBotInfo();
  }

  /**
   * Get the deep-link URL for an engineer to link their Telegram
   */
  @Get('deep-link/:engineerCode')
  getDeepLink(@Param('engineerCode') engineerCode: string) {
    return {
      url: this.telegramService.getDeepLink(engineerCode),
    };
  }

  /**
   * Check if an engineer's Telegram is linked
   */
  @Get('linked/:engineerId')
  async isLinked(@Param('engineerId', ParseIntPipe) engineerId: number) {
    const linked = await this.telegramService.isLinked(engineerId);
    return { linked };
  }
}
