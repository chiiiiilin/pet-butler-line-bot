import { Controller, Post } from '@nestjs/common';
import { ReminderService } from './reminder.service';

@Controller('debug/reminder')
export class ReminderController {
  constructor(private readonly reminder: ReminderService) {}

  @Post('morning')
  async triggerMorning() {
    return this.reminder.sendDailyReminders('morning');
  }

  @Post('evening')
  async triggerEvening() {
    return this.reminder.sendDailyReminders('evening');
  }
}
