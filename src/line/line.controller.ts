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

@Controller('webhook')
export class LineController {
  private readonly logger = new Logger(LineController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly lineService: LineService,
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

    const events: webhook.Event[] = JSON.parse(rawBody).events ?? [];
    this.logger.log(`Received ${events.length} event(s)`);

    for (const event of events) {
      await this.lineService.handleEvent(event);
    }

    return 'OK';
  }
}
