import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  UnauthorizedException,
  Logger,
  type RawBodyRequest,
  type OnApplicationShutdown,
} from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { validateSignature, webhook } from '@line/bot-sdk';
import { LineService } from './line.service';
import { BotService } from '../bot/bot.service';

@Controller('webhook')
export class LineController implements OnApplicationShutdown {
  private readonly logger = new Logger(LineController.name);
  private readonly inFlight = new Set<Promise<void>>();

  constructor(
    private readonly config: ConfigService,
    private readonly line: LineService,
    private readonly bot: BotService,
  ) {}

  async onApplicationShutdown(): Promise<void> {
    if (this.inFlight.size === 0) return;
    this.logger.log(
      `Waiting for ${this.inFlight.size} in-flight webhook task(s) to finish`,
    );
    await Promise.allSettled([...this.inFlight]);
  }

  @Post()
  @HttpCode(200)
  handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-line-signature') signature: string,
  ): string {
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

    const task = this.processEvents(events);
    this.inFlight.add(task);
    void task.finally(() => this.inFlight.delete(task));

    return 'OK';
  }

  private async processEvents(events: webhook.Event[]): Promise<void> {
    for (const event of events) {
      try {
        const intent = await this.bot.handleEvent(event);
        if (intent) {
          await this.line.reply(intent.replyToken, intent.messages);
        }
      } catch (err) {
        this.logger.error(
          `Failed to process event type=${event.type}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }
}
