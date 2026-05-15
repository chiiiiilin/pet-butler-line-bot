import { Module } from '@nestjs/common';
import { LineService } from './line.service';
import { QuotaService } from './quota.service';

@Module({
  providers: [LineService, QuotaService],
  exports: [LineService, QuotaService],
})
export class LineApiModule {}
