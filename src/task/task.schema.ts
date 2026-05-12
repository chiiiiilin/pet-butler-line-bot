import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  groupId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  intervalDays: number;

  @Prop({ required: true })
  remindTime: string;

  @Prop()
  lastCompletedAt?: Date;

  @Prop()
  lastCompletedBy?: string;

  @Prop({ required: true })
  nextDueAt: Date;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);
