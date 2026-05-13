import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ConversationStep =
  | 'awaiting_name'
  | 'awaiting_frequency'
  | 'awaiting_custom_days'
  | 'awaiting_start_date'
  | 'awaiting_confirm'
  | 'awaiting_edit_name'
  | 'awaiting_edit_freq'
  | 'awaiting_edit_freq_custom';

export interface TempData {
  name?: string;
  intervalDays?: number | null;
  startDate?: string;
  editTaskId?: string;
}

@Schema({ timestamps: true })
export class ConversationState {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  groupId: string;

  @Prop({ required: true })
  step: ConversationStep;

  @Prop({ type: Object, default: {} })
  tempData: TempData;
}

export type ConversationStateDocument = HydratedDocument<ConversationState>;
export const ConversationStateSchema =
  SchemaFactory.createForClass(ConversationState);
ConversationStateSchema.index({ userId: 1, groupId: 1 }, { unique: true });
