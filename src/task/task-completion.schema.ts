import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class TaskCompletion {
  @Prop({ required: true, type: SchemaTypes.ObjectId })
  taskId: Types.ObjectId;

  @Prop({ required: true })
  groupId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  completedAt: Date;
}

export type TaskCompletionDocument = HydratedDocument<TaskCompletion>;
export const TaskCompletionSchema =
  SchemaFactory.createForClass(TaskCompletion);

TaskCompletionSchema.index({ taskId: 1, completedAt: -1 });
TaskCompletionSchema.index({ groupId: 1, completedAt: -1 });
