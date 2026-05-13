import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const STEP = {
  AWAITING_NAME: 'awaiting_name',
  AWAITING_FREQUENCY: 'awaiting_frequency',
  AWAITING_CUSTOM_DAYS: 'awaiting_custom_days',
  AWAITING_START_DATE: 'awaiting_start_date',
  AWAITING_CONFIRM: 'awaiting_confirm',
  AWAITING_EDIT_NAME: 'awaiting_edit_name',
  AWAITING_EDIT_FREQ: 'awaiting_edit_freq',
  AWAITING_EDIT_FREQ_CUSTOM: 'awaiting_edit_freq_custom',
} as const;

export type ConversationStep = (typeof STEP)[keyof typeof STEP];

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
