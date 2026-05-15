import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { messagingApi } from '@line/bot-sdk';

export interface QuotaStatus {
  exceeded: boolean;
  remaining: number | null;
}

const LOW_REMAINING_THRESHOLD = 20;

@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);
  private readonly client: messagingApi.MessagingApiClient;
  private exceeded = false;
  private remaining: number | null = null;

  constructor(config: ConfigService) {
    this.client = new messagingApi.MessagingApiClient({
      channelAccessToken: config.get<string>('LINE_CHANNEL_ACCESS_TOKEN') ?? '',
    });
  }

  getStatus(): QuotaStatus {
    return { exceeded: this.exceeded, remaining: this.remaining };
  }

  isLow(): boolean {
    return this.remaining !== null && this.remaining <= LOW_REMAINING_THRESHOLD;
  }

  markExceeded(): void {
    if (!this.exceeded) {
      this.logger.warn('LINE push quota marked as exceeded (429)');
    }
    this.exceeded = true;
    this.remaining = 0;
  }

  async refresh(): Promise<void> {
    try {
      const [quota, consumption] = await Promise.all([
        this.client.getMessageQuota(),
        this.client.getMessageQuotaConsumption(),
      ]);
      if (quota.type !== 'limited' || quota.value == null) {
        this.remaining = null;
        this.exceeded = false;
        return;
      }
      const used = consumption.totalUsage ?? 0;
      this.remaining = Math.max(0, quota.value - used);
      this.exceeded = this.remaining === 0;
      this.logger.log(
        `quota refresh: used=${used}/${quota.value}, remaining=${this.remaining}`,
      );
    } catch (e) {
      this.logger.warn(`quota refresh failed: ${e}`);
    }
  }
}
