import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ConversationState,
  ConversationStateDocument,
  ConversationStep,
  TempData,
} from './conversation-state.schema';

@Injectable()
export class StateService {
  constructor(
    @InjectModel(ConversationState.name)
    private readonly model: Model<ConversationStateDocument>,
  ) {}

  async get(
    userId: string,
    groupId: string,
  ): Promise<ConversationStateDocument | null> {
    return this.model.findOne({ userId, groupId }).exec();
  }

  async setStep(
    userId: string,
    groupId: string,
    step: ConversationStep,
    tempDataPatch?: TempData,
  ): Promise<ConversationStateDocument> {
    const existing = await this.model.findOne({ userId, groupId }).exec();
    if (existing) {
      existing.step = step;
      if (tempDataPatch) {
        existing.tempData = { ...existing.tempData, ...tempDataPatch };
      }
      return existing.save();
    }
    return this.model.create({
      userId,
      groupId,
      step,
      tempData: tempDataPatch ?? {},
    });
  }

  async clear(userId: string, groupId: string): Promise<void> {
    await this.model.deleteOne({ userId, groupId }).exec();
  }
}
