import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TaskStatus = 'active' | 'done';

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true })
  groupId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: null })
  intervalDays: number | null;

  @Prop({ required: true, enum: ['active', 'done'], default: 'active' })
  status: TaskStatus;

  @Prop({ required: true })
  nextDueAt: Date;
}

export type TaskDocument = HydratedDocument<Task>;
export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ groupId: 1, status: 1, nextDueAt: 1 });
