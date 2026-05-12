import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { LineModule } from './line/line.module';
import { StateModule } from './state/state.module';
import { TaskModule } from './task/task.module';
import { BotModule } from './bot/bot.module';
import { ReminderModule } from './reminder/reminder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        LINE_CHANNEL_SECRET: Joi.string().required(),
        LINE_CHANNEL_ACCESS_TOKEN: Joi.string().required(),
        MONGO_URI: Joi.string().required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    ScheduleModule.forRoot(),
    LineModule,
    StateModule,
    TaskModule,
    BotModule,
    ReminderModule,
  ],
})
export class AppModule {}
