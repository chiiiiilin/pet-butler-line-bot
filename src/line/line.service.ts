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

  async reply(
    replyToken: string,
    messages: messagingApi.Message[],
  ): Promise<void> {
    await this.client.replyMessage({ replyToken, messages });
  }

  async push(
    to: string,
    messages: messagingApi.Message[],
  ): Promise<void> {
    await this.client.pushMessage({ to, messages });
  }

  async getDisplayName(
    userId: string,
    source: webhook.Source,
  ): Promise<string> {
    try {
      if (source.type === 'group') {
        const profile = await this.client.getGroupMemberProfile(
          source.groupId,
          userId,
        );
        return profile.displayName;
      }
      if (source.type === 'room') {
        const profile = await this.client.getRoomMemberProfile(
          source.roomId,
          userId,
        );
        return profile.displayName;
      }
      if (source.type === 'user') {
        const profile = await this.client.getProfile(userId);
        return profile.displayName;
      }
      return userId;
    } catch (e) {
      this.logger.warn(`getDisplayName failed for ${userId}: ${e}`);
      return userId;
    }
  }
}
