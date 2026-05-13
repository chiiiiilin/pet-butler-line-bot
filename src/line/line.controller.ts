import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  UnauthorizedException,
  Logger,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { validateSignature, webhook } from '@line/bot-sdk';
import { LineService } from './line.service';
import { BotService } from '../bot/bot.service';

@Controller('webhook')
export class LineController {
  private readonly logger = new Logger(LineController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly line: LineService,
    private readonly bot: BotService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
  ) {
    const rawBody = req.rawBody?.toString('utf-8') ?? '';
    const channelSecret = this.config.get<string>('LINE_CHANNEL_SECRET');

    if (!channelSecret) {
      throw new UnauthorizedException('Missing channel secret');
    }
    if (!validateSignature(rawBody, channelSecret, signature ?? '')) {
      throw new UnauthorizedException('Invalid LINE signature');
    }

    const parsed = JSON.parse(rawBody) as { events?: webhook.Event[] };
    const events = parsed.events ?? [];
    this.logger.log(`Received ${events.length} event(s)`);

    for (const event of events) {
      const intent = await this.bot.handleEvent(event);
      if (intent) {
        await this.line.reply(intent.replyToken, intent.messages);
      }
    }

    return 'OK';
  }
}
