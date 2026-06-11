import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TaskService } from '../task/task.service';
import { LineService } from '../line/line.service';
import { QuotaService } from '../line/quota.service';
import { dailyTaskCard } from '../bot/messages/daily-task-card';
import { TEXT } from '../bot/messages/text';

export type ReminderTime = 'morning' | 'evening';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private readonly task: TaskService,
    private readonly line: LineService,
    private readonly quota: QuotaService,
  ) {}

  @Cron('0 8 * * *', { name: 'morning', timeZone: 'Asia/Taipei' })
  async morningCron(): Promise<void> {
    await this.sendDailyReminders('morning');
  }

  @Cron('0 18 * * *', { name: 'evening', timeZone: 'Asia/Taipei' })
  async eveningCron(): Promise<void> {
    await this.sendDailyReminders('evening');
  }

  async sendDailyReminders(
    time: ReminderTime,
  ): Promise<{ groupsNotified: number }> {
    await this.quota.refresh();
    const { exceeded, remaining } = this.quota.getStatus();
    const warning = exceeded
      ? TEXT.quota.exceeded
      : this.quota.isLow() && remaining !== null
        ? TEXT.quota.low(remaining)
        : undefined;

    const groupIds = await this.task.findDueGroupIds();
    let groupsNotified = 0;

    for (const groupId of groupIds) {
      try {
        const tasks = await this.task.listDueByGroup(groupId);
        if (tasks.length === 0) continue;
        const intro =
          time === 'morning'
            ? TEXT.reminder.morningIntro(tasks.length)
            : TEXT.reminder.eveningIntro(tasks.length);
        const dest = groupId.startsWith('dm:') ? groupId.slice(3) : groupId;
        await this.line.push(dest, [
          dailyTaskCard(tasks, intro, time, warning),
        ]);
        groupsNotified++;
      } catch (e) {
        this.logger.warn(`push to ${groupId} failed: ${e}`);
      }
    }

    this.logger.log(`${time} reminder: notified ${groupsNotified} group(s)`);
    return { groupsNotified };
  }
}
