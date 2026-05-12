import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StateService } from './state.service';
import {
  ConversationState,
  ConversationStateSchema,
} from './conversation-state.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConversationState.name, schema: ConversationStateSchema },
    ]),
  ],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
