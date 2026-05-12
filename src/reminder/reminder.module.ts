import { Module } from '@nestjs/common';
import { ReminderService } from './reminder.service';
import { ReminderController } from './reminder.controller';
import { TaskModule } from '../task/task.module';
import { LineApiModule } from '../line/line-api.module';

@Module({
  imports: [TaskModule, LineApiModule],
  controllers: [ReminderController],
  providers: [ReminderService],
})
export class ReminderModule {}
