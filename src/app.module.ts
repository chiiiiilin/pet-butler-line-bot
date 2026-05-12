import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LineModule } from './line/line.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LineModule,
  ],
})
export class AppModule {}
