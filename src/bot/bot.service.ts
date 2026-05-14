import { Injectable } from '@nestjs/common';
import { webhook, messagingApi } from '@line/bot-sdk';
import { StateService } from '../state/state.service';
import { TaskService, TaskView } from '../task/task.service';
import { LineService } from '../line/line.service';
import {
  ConversationStateDocument,
  STEP,
} from '../state/conversation-state.schema';
import { textMsg, formatDate, dateForPicker } from './lib/utils';
import { confirmCard } from './flow/confirm-card';
import { taskListCarousel, taskDetailCard } from './messages/task-card';
import { dailyTaskCard } from './messages/daily-task-card';
import { deleteTaskCarousel } from './messages/delete-task-card';
import { editTaskCarousel } from './messages/edit-task-card';
import { askFrequency } from './flow/frequency-quick-reply';
import { askStartDate } from './flow/start-date-quick-reply';
import { commandsHelp } from './messages/help';
import { TEXT } from './messages/text';
import { COMMAND } from './lib/commands';
import { ACTION } from './lib/actions';

export interface ReplyIntent {
  replyToken: string;
  messages: messagingApi.Message[];
}

@Injectable()
export class BotService {
  constructor(
    private readonly state: StateService,
    private readonly task: TaskService,
    private readonly line: LineService,
  ) {}

  async handleEvent(event: webhook.Event): Promise<ReplyIntent | null> {
    if (event.type === 'message' && event.message.type === 'text') {
      return this.handleText(event, event.message.text);
    }
    if (event.type === 'postback') {
      return this.handlePostback(event);
    }
    if (event.type === 'join') {
      return this.handleJoin(event);
    }
    return null;
  }

  private async handleText(
    event: webhook.MessageEvent,
    text: string,
  ): Promise<ReplyIntent | null> {
    if (!event.source) return null;
    const userId = event.source.userId;
    const replyToken = event.replyToken;
    if (!userId || !replyToken) return null;

    const groupId = this.getGroupId(event.source);
    const trimmed = text.trim();

    if (trimmed === COMMAND.CANCEL) {
      await this.state.clear(userId, groupId);
      return reply(replyToken, [textMsg(TEXT.common.cancelled)]);
    }
    if (trimmed === COMMAND.CREATE) {
      await this.state.setStep(userId, groupId, STEP.AWAITING_NAME, {});
      return reply(replyToken, [textMsg(TEXT.create.askName)]);
    }
    if (trimmed === COMMAND.LIST) {
      const tasks = await this.task.listByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [textMsg(TEXT.list.empty)]);
      }
      const nameMap = await this.resolveNames(tasks, event.source);
      return reply(replyToken, [taskListCarousel(tasks, nameMap)]);
    }
    if (trimmed === COMMAND.TODAY) {
      const tasks = await this.task.listDueByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [textMsg(TEXT.today.empty)]);
      }
      return reply(replyToken, [
        dailyTaskCard(tasks, TEXT.today.intro(tasks.length), 'today'),
      ]);
    }
    if (trimmed === COMMAND.DELETE) {
      const tasks = await this.task.listByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [textMsg(TEXT.list.emptyToDelete)]);
      }
      return reply(replyToken, [deleteTaskCarousel(tasks)]);
    }
    if (trimmed === COMMAND.EDIT) {
      const tasks = await this.task.listByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [textMsg(TEXT.list.emptyToEdit)]);
      }
      return reply(replyToken, [editTaskCarousel(tasks)]);
    }
    if (trimmed === COMMAND.HELP || trimmed === COMMAND.HELP_EN) {
      return reply(replyToken, [commandsHelp()]);
    }

    const state = await this.state.get(userId, groupId);
    if (state) {
      return this.advance(state, trimmed, replyToken, userId, groupId);
    }

    if (event.source.type === 'user') {
      return reply(replyToken, [textMsg(TEXT.common.echo(trimmed))]);
    }
    return null;
  }

  private async advance(
    state: ConversationStateDocument,
    text: string,
    replyToken: string,
    userId: string,
    groupId: string,
  ): Promise<ReplyIntent> {
    switch (state.step) {
      case STEP.AWAITING_NAME: {
        if (!text) {
          return reply(replyToken, [textMsg(TEXT.create.askName)]);
        }
        await this.state.setStep(userId, groupId, STEP.AWAITING_FREQUENCY, {
          name: text,
        });
        return reply(replyToken, [askFrequency()]);
      }

      case STEP.AWAITING_CUSTOM_DAYS: {
        const days = parseInt(text, 10);
        if (isNaN(days) || days < 1) {
          return reply(replyToken, [textMsg(TEXT.create.invalidDays)]);
        }
        await this.state.setStep(userId, groupId, STEP.AWAITING_START_DATE, {
          intervalDays: days,
        });
        return reply(replyToken, [askStartDate()]);
      }

      case STEP.AWAITING_EDIT_NAME: {
        if (!text) return reply(replyToken, [textMsg(TEXT.edit.askNewName)]);
        const taskId = state.tempData.editTaskId;
        if (!taskId) {
          await this.state.clear(userId, groupId);
          return reply(replyToken, [textMsg(TEXT.common.stateErrorEdit)]);
        }
        const updated = await this.task.update(taskId, { name: text });
        await this.state.clear(userId, groupId);
        if (!updated)
          return reply(replyToken, [textMsg(TEXT.common.taskNotFound)]);
        return reply(replyToken, [
          textMsg(TEXT.edit.nameUpdated(updated.name)),
        ]);
      }

      case STEP.AWAITING_EDIT_FREQ_CUSTOM: {
        const days = parseInt(text, 10);
        if (isNaN(days) || days < 1) {
          return reply(replyToken, [textMsg(TEXT.create.invalidDays)]);
        }
        const taskId = state.tempData.editTaskId;
        if (!taskId) {
          await this.state.clear(userId, groupId);
          return reply(replyToken, [textMsg(TEXT.common.stateErrorEdit)]);
        }
        const updated = await this.task.update(taskId, {
          intervalDays: days,
        });
        await this.state.clear(userId, groupId);
        if (!updated)
          return reply(replyToken, [textMsg(TEXT.common.taskNotFound)]);
        return reply(replyToken, [textMsg(TEXT.edit.freqUpdatedDays(days))]);
      }

      case STEP.AWAITING_FREQUENCY:
      case STEP.AWAITING_START_DATE:
      case STEP.AWAITING_EDIT_FREQ:
      case STEP.AWAITING_CONFIRM:
        return reply(replyToken, [textMsg(TEXT.common.guideToButtons)]);
    }
  }

  private async handlePostback(
    event: webhook.PostbackEvent,
  ): Promise<ReplyIntent | null> {
    if (!event.source) return null;
    const userId = event.source.userId;
    const replyToken = event.replyToken;
    if (!userId || !replyToken) return null;
    const groupId = this.getGroupId(event.source);

    const params = new URLSearchParams(event.postback.data);
    const action = params.get('action');

    if (action === ACTION.COMPLETE) {
      const id = params.get('id');
      if (!id) return null;
      const task = await this.task.complete(id, userId);
      if (!task) return reply(replyToken, [textMsg(TEXT.common.taskNotFound)]);
      const displayName = await this.line.getDisplayName(userId, event.source);
      const tail =
        task.status === 'done'
          ? TEXT.task.archived
          : TEXT.task.nextReminder(formatDate(task.nextDueAt));
      return reply(replyToken, [
        textMsg(TEXT.task.completed(task.name, displayName, tail)),
      ]);
    }

    if (action === ACTION.SNOOZE) {
      const id = params.get('id');
      const dateStr = event.postback.params?.date;
      if (!id || !dateStr) return null;
      const task = await this.task.snooze(id, dateStr);
      if (!task) return reply(replyToken, [textMsg(TEXT.common.taskNotFound)]);
      return reply(replyToken, [
        textMsg(TEXT.task.snoozed(task.name, formatDate(task.nextDueAt))),
      ]);
    }

    if (action === ACTION.DELETE) {
      const id = params.get('id');
      if (!id) return null;
      const ok = await this.task.remove(id);
      return reply(replyToken, [
        textMsg(ok ? TEXT.task.deleted : TEXT.common.taskNotFound),
      ]);
    }

    if (action === ACTION.SHOW) {
      const id = params.get('id');
      if (!id) return null;
      const task = await this.task.findById(id);
      if (!task) return reply(replyToken, [textMsg(TEXT.common.taskNotFound)]);
      const nameMap = await this.resolveNames([task], event.source);
      return reply(replyToken, [taskDetailCard(task, nameMap)]);
    }

    if (action === ACTION.EDIT_DATE) {
      const id = params.get('id');
      const dateStr = event.postback.params?.date;
      if (!id || !dateStr) return null;
      const task = await this.task.snooze(id, dateStr);
      if (!task) return reply(replyToken, [textMsg(TEXT.common.taskNotFound)]);
      return reply(replyToken, [
        textMsg(TEXT.edit.dateUpdated(task.name, formatDate(task.nextDueAt))),
      ]);
    }

    if (action === ACTION.EDIT_NAME) {
      const id = params.get('id');
      if (!id) return null;
      await this.state.setStep(userId, groupId, STEP.AWAITING_EDIT_NAME, {
        editTaskId: id,
      });
      return reply(replyToken, [textMsg(TEXT.edit.askNewName)]);
    }

    if (action === ACTION.EDIT_FREQ) {
      const id = params.get('id');
      if (!id) return null;
      await this.state.setStep(userId, groupId, STEP.AWAITING_EDIT_FREQ, {
        editTaskId: id,
      });
      return reply(replyToken, [askFrequency()]);
    }

    const state = await this.state.get(userId, groupId);
    if (!state) return null;

    if (action === ACTION.FREQ && state.step === STEP.AWAITING_FREQUENCY) {
      const value = params.get('value');
      if (value === 'custom') {
        await this.state.setStep(
          userId,
          groupId,
          STEP.AWAITING_CUSTOM_DAYS,
          {},
        );
        return reply(replyToken, [textMsg(TEXT.create.askCustomDays)]);
      }
      if (value === 'oneoff') {
        await this.state.setStep(userId, groupId, STEP.AWAITING_START_DATE, {
          intervalDays: null,
        });
        return reply(replyToken, [askStartDate()]);
      }
      const intervalDays = parseInt(value ?? '', 10);
      if (isNaN(intervalDays)) return null;
      await this.state.setStep(userId, groupId, STEP.AWAITING_START_DATE, {
        intervalDays,
      });
      return reply(replyToken, [askStartDate()]);
    }

    if (
      action === ACTION.START_DATE &&
      state.step === STEP.AWAITING_START_DATE
    ) {
      let dateStr: string | null = null;
      if (event.postback.params && 'date' in event.postback.params) {
        dateStr = event.postback.params.date ?? null;
      } else {
        const value = params.get('value');
        if (value === 'today') {
          dateStr = dateForPicker(new Date());
        } else if (value === 'tomorrow') {
          const tmrw = new Date();
          tmrw.setDate(tmrw.getDate() + 1);
          dateStr = dateForPicker(tmrw);
        }
      }
      if (!dateStr) return null;
      const updated = await this.state.setStep(
        userId,
        groupId,
        STEP.AWAITING_CONFIRM,
        { startDate: dateStr },
      );
      return reply(replyToken, [confirmCard(updated.tempData)]);
    }

    if (action === ACTION.FREQ && state.step === STEP.AWAITING_EDIT_FREQ) {
      const value = params.get('value');
      if (value === 'custom') {
        await this.state.setStep(
          userId,
          groupId,
          STEP.AWAITING_EDIT_FREQ_CUSTOM,
        );
        return reply(replyToken, [textMsg(TEXT.create.askCustomDays)]);
      }
      const taskId = state.tempData.editTaskId;
      if (!taskId) {
        await this.state.clear(userId, groupId);
        return reply(replyToken, [textMsg(TEXT.common.stateErrorEdit)]);
      }
      if (value === 'oneoff') {
        await this.task.update(taskId, { intervalDays: null });
        await this.state.clear(userId, groupId);
        return reply(replyToken, [textMsg(TEXT.edit.freqUpdatedOneoff)]);
      }
      const intervalDays = parseInt(value ?? '', 10);
      if (isNaN(intervalDays)) return null;
      await this.task.update(taskId, { intervalDays });
      await this.state.clear(userId, groupId);
      return reply(replyToken, [
        textMsg(TEXT.edit.freqUpdatedDays(intervalDays)),
      ]);
    }

    if (action === ACTION.CANCEL) {
      await this.state.clear(userId, groupId);
      return reply(replyToken, [textMsg(TEXT.common.cancelled)]);
    }

    if (action === ACTION.CONFIRM && state.step === STEP.AWAITING_CONFIRM) {
      const { name, intervalDays, startDate } = state.tempData;
      if (!name || intervalDays === undefined || !startDate) {
        await this.state.clear(userId, groupId);
        return reply(replyToken, [textMsg(TEXT.create.incompleteData)]);
      }
      const created = await this.task.create({
        groupId,
        name,
        intervalDays,
        startDate,
      });
      await this.state.clear(userId, groupId);
      const freqText =
        intervalDays == null
          ? TEXT.freq.oneoff
          : TEXT.freq.everyDays(intervalDays);
      return reply(replyToken, [
        textMsg(
          TEXT.create.created(name, freqText, formatDate(created.nextDueAt)),
        ),
      ]);
    }

    return null;
  }

  private handleJoin(event: webhook.JoinEvent): ReplyIntent | null {
    if (!event.replyToken) return null;
    return reply(event.replyToken, [textMsg(TEXT.common.greeting)]);
  }

  private getGroupId(source: webhook.Source): string {
    if (source.type === 'group') return source.groupId;
    if (source.type === 'room') return source.roomId;
    if (source.type === 'user') return `dm:${source.userId}`;
    return 'unknown';
  }

  private async resolveNames(
    tasks: TaskView[],
    source: webhook.Source,
  ): Promise<Map<string, string>> {
    const userIds = [
      ...new Set(
        tasks.flatMap((t) =>
          t.lastCompletion ? [t.lastCompletion.userId] : [],
        ),
      ),
    ];
    const map = new Map<string, string>();
    await Promise.all(
      userIds.map(async (uid) => {
        map.set(uid, await this.line.getDisplayName(uid, source));
      }),
    );
    return map;
  }
}

function reply(
  replyToken: string,
  messages: messagingApi.Message[],
): ReplyIntent {
  return { replyToken, messages };
}
