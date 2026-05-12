import { Module } from '@nestjs/common';
import { LineController } from './line.controller';
import { LineApiModule } from './line-api.module';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [LineApiModule, BotModule],
  controllers: [LineController],
})
export class LineModule {}
