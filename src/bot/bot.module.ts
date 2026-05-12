import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { StateModule } from '../state/state.module';
import { TaskModule } from '../task/task.module';
import { LineApiModule } from '../line/line-api.module';

@Module({
  imports: [StateModule, TaskModule, LineApiModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
