import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskService } from './task.service';
import { Task, TaskSchema } from './task.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
