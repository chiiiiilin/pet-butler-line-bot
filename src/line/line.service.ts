import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { messagingApi, webhook } from '@line/bot-sdk';

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);
  private readonly client: messagingApi.MessagingApiClient;

  constructor(private readonly config: ConfigService) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken:
        this.config.get<string>('LINE_CHANNEL_ACCESS_TOKEN') ?? '',
    });
  }

  async handleEvent(event: webhook.Event): Promise<void> {
    this.logger.log(`Event type: ${event.type}`);

    if (
      event.type === 'message' &&
      event.message.type === 'text' &&
      event.replyToken
    ) {
      await this.client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: 'text',
            text: `收到: ${event.message.text}`,
          },
        ],
      });
    }
  }
}
