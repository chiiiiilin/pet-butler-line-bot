import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskService } from './task.service';
import { Task, TaskSchema } from './task.schema';
import { TaskCompletion, TaskCompletionSchema } from './task-completion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: TaskCompletion.name, schema: TaskCompletionSchema },
    ]),
  ],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
