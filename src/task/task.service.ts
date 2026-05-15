import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Task, TaskDocument, TaskStatus } from './task.schema';
import { TaskCompletion } from './task-completion.schema';

const DEFAULT_REMIND_HOUR = 9;

export interface TaskView {
  _id: string;
  groupId: string;
  name: string;
  intervalDays: number | null;
  status: TaskStatus;
  nextDueAt: Date;
  cycleVersion: number;
  lastCompletion: { userId: string; completedAt: Date } | null;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name)
    private readonly model: Model<TaskDocument>,
    @InjectModel(TaskCompletion.name)
    private readonly completionModel: Model<TaskCompletion>,
  ) {}

  async create(input: {
    groupId: string;
    name: string;
    intervalDays: number | null;
    startDate?: string;
  }): Promise<TaskDocument> {
    let nextDueAt: Date;
    if (input.startDate) {
      const [y, m, d] = input.startDate.split('-').map(Number);
      nextDueAt = new Date(y, m - 1, d, DEFAULT_REMIND_HOUR, 0, 0, 0);
    } else if (input.intervalDays != null) {
      nextDueAt = computeNextDue(new Date(), input.intervalDays);
    } else {
      nextDueAt = todayAtRemindHour();
    }
    return this.model.create({
      groupId: input.groupId,
      name: input.name,
      intervalDays: input.intervalDays,
      status: 'active',
      nextDueAt,
      cycleVersion: 0,
    });
  }

  async listByGroup(groupId: string): Promise<TaskView[]> {
    return this.aggregateView([
      { $match: { groupId, status: { $ne: 'done' } } },
      { $sort: { nextDueAt: 1 } },
    ]);
  }

  async listDueByGroup(groupId: string): Promise<TaskView[]> {
    const startOfTomorrow = new Date();
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    return this.aggregateView([
      {
        $match: {
          groupId,
          status: { $ne: 'done' },
          nextDueAt: { $lt: startOfTomorrow },
        },
      },
      { $sort: { nextDueAt: 1 } },
    ]);
  }

  async findDueGroupIds(): Promise<string[]> {
    const startOfTomorrow = new Date();
    startOfTomorrow.setHours(0, 0, 0, 0);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const result = await this.model
      .distinct('groupId', {
        status: { $ne: 'done' },
        nextDueAt: { $lt: startOfTomorrow },
      })
      .exec();
    return result;
  }

  async findById(id: string): Promise<TaskView | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const [result] = await this.aggregateView([
      { $match: { _id: new Types.ObjectId(id) } },
    ]);
    return result ?? null;
  }

  async complete(
    id: string,
    userId: string,
    expectedVersion?: number,
  ): Promise<TaskView | 'archived' | 'stale' | null> {
    const task = await this.findDocById(id);
    if (!task) return null;
    if (task.status === 'done') return 'archived';
    if (
      expectedVersion !== undefined &&
      (task.cycleVersion ?? 0) !== expectedVersion
    )
      return 'stale';
    const now = new Date();
    await this.completionModel.create({
      taskId: task._id,
      groupId: task.groupId,
      userId,
      completedAt: now,
    });
    if (task.intervalDays == null) {
      task.status = 'done';
    } else {
      task.nextDueAt = computeNextDue(now, task.intervalDays);
    }
    task.cycleVersion = (task.cycleVersion ?? 0) + 1;
    await task.save();
    return this.findById(id);
  }

  async snooze(
    id: string,
    dateStr: string,
    expectedVersion?: number,
  ): Promise<TaskView | 'archived' | 'stale' | null> {
    const task = await this.findDocById(id);
    if (!task) return null;
    if (task.status === 'done') return 'archived';
    if (
      expectedVersion !== undefined &&
      (task.cycleVersion ?? 0) !== expectedVersion
    )
      return 'stale';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return null;
    const next = new Date(y, m - 1, d, DEFAULT_REMIND_HOUR, 0, 0, 0);
    if (isNaN(next.getTime())) return null;
    task.nextDueAt = next;
    await task.save();
    return this.findById(id);
  }

  async update(
    id: string,
    patch: Partial<{
      name: string;
      intervalDays: number | null;
      nextDueAt: Date;
    }>,
  ): Promise<TaskView | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updated = await this.model
      .findByIdAndUpdate(id, { $set: patch }, { new: true })
      .exec();
    if (!updated) return null;
    return this.findById(id);
  }

  async remove(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  private async findDocById(id: string): Promise<TaskDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return this.model.findById(id).exec();
  }

  private async aggregateView(
    pipelinePrefix: PipelineStage[],
  ): Promise<TaskView[]> {
    const rows = await this.model.aggregate<{
      _id: Types.ObjectId;
      groupId: string;
      name: string;
      intervalDays: number | null;
      status?: TaskStatus;
      nextDueAt: Date;
      cycleVersion?: number;
      lastCompletion?: { userId: string; completedAt: Date };
    }>([
      ...pipelinePrefix,
      {
        $lookup: {
          from: 'taskcompletions',
          let: { tid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$taskId', '$$tid'] } } },
            { $sort: { completedAt: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, userId: 1, completedAt: 1 } },
          ],
          as: 'lastCompletion',
        },
      },
      {
        $addFields: {
          lastCompletion: { $arrayElemAt: ['$lastCompletion', 0] },
        },
      },
    ]);
    return rows.map((r) => ({
      _id: r._id.toString(),
      groupId: r.groupId,
      name: r.name,
      intervalDays: r.intervalDays ?? null,
      status: r.status ?? 'active',
      nextDueAt: r.nextDueAt,
      cycleVersion: r.cycleVersion ?? 0,
      lastCompletion: r.lastCompletion ?? null,
    }));
  }
}

function computeNextDue(from: Date, intervalDays: number): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + intervalDays);
  next.setHours(DEFAULT_REMIND_HOUR, 0, 0, 0);
  return next;
}

function todayAtRemindHour(): Date {
  const d = new Date();
  d.setHours(DEFAULT_REMIND_HOUR, 0, 0, 0);
  return d;
}
