import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from './task.schema';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name)
    private readonly model: Model<TaskDocument>,
  ) {}

  async create(input: {
    groupId: string;
    name: string;
    intervalDays: number;
    remindTime: string;
  }): Promise<TaskDocument> {
    const nextDueAt = computeNextDue(
      new Date(),
      input.intervalDays,
      input.remindTime,
    );
    return this.model.create({ ...input, nextDueAt });
  }

  async listByGroup(groupId: string): Promise<TaskDocument[]> {
    return this.model.find({ groupId }).sort({ nextDueAt: 1 }).exec();
  }

  async listDueByGroup(groupId: string): Promise<TaskDocument[]> {
    const startOfTomorrow = new Date();
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    return this.model
      .find({ groupId, nextDueAt: { $lt: startOfTomorrow } })
      .sort({ nextDueAt: 1 })
      .exec();
  }

  async findById(id: string): Promise<TaskDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).exec();
  }

  async complete(id: string, byName?: string): Promise<TaskDocument | null> {
    const task = await this.findById(id);
    if (!task) return null;
    const now = new Date();
    task.lastCompletedAt = now;
    if (byName) task.lastCompletedBy = byName;
    task.nextDueAt = computeNextDue(now, task.intervalDays, task.remindTime);
    return task.save();
  }

  async snooze(id: string, dateStr: string): Promise<TaskDocument | null> {
    const task = await this.findById(id);
    if (!task) return null;
    const next = new Date(`${dateStr}T${task.remindTime}:00`);
    if (isNaN(next.getTime())) return null;
    task.nextDueAt = next;
    return task.save();
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      intervalDays: number;
      remindTime: string;
      nextDueAt: Date;
    }>,
  ): Promise<TaskDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .exec();
  }

  async remove(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}

function computeNextDue(
  from: Date,
  intervalDays: number,
  remindTime: string,
): Date {
  const [hh, mm] = remindTime.split(':').map(Number);
  const next = new Date(from);
  next.setDate(next.getDate() + intervalDays);
  next.setHours(hh, mm, 0, 0);
  return next;
}
