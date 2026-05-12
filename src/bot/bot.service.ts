import { Injectable } from '@nestjs/common';
import { webhook, messagingApi } from '@line/bot-sdk';
import { StateService } from '../state/state.service';
import { TaskService } from '../task/task.service';
import { LineService } from '../line/line.service';
import { ConversationStateDocument } from '../state/conversation-state.schema';
import { textMsg, formatDate, dateForPicker } from './lib/utils';
import { confirmCard } from './flow/confirm-card';
import { taskListCarousel, taskDetailCard } from './messages/task-card';
import { dailyTaskCard } from './messages/daily-task-card';
import { deleteTaskCarousel } from './messages/delete-task-card';
import { editTaskCarousel } from './messages/edit-task-card';
import { askFrequency } from './flow/frequency-quick-reply';
import { askStartDate } from './flow/start-date-quick-reply';
import { commandsHelp } from './messages/help';
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
      return reply(replyToken, [textMsg('已取消')]);
    }
    if (trimmed === COMMAND.CREATE) {
      await this.state.setStep(userId, groupId, 'awaiting_name', {});
      return reply(replyToken, [textMsg('請輸入任務名稱：')]);
    }
    if (trimmed === COMMAND.LIST) {
      const tasks = await this.task.listByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [
          textMsg(`目前沒有任務。打 ${COMMAND.CREATE} 來建立第一個。`),
        ]);
      }
      return reply(replyToken, [taskListCarousel(tasks)]);
    }
    if (trimmed === COMMAND.TODAY) {
      const tasks = await this.task.listDueByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [textMsg('今天沒有待辦 ✨')]);
      }
      return reply(replyToken, [
        dailyTaskCard(tasks, `🐱 今天 ${tasks.length} 個任務`, 'today'),
      ]);
    }
    if (trimmed === COMMAND.DELETE) {
      const tasks = await this.task.listByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [textMsg('目前沒有任務可刪除')]);
      }
      return reply(replyToken, [deleteTaskCarousel(tasks)]);
    }
    if (trimmed === COMMAND.EDIT) {
      const tasks = await this.task.listByGroup(groupId);
      if (tasks.length === 0) {
        return reply(replyToken, [textMsg('目前沒有任務可編輯')]);
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
      return reply(replyToken, [textMsg(`收到: ${trimmed}`)]);
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
      case 'awaiting_name': {
        if (!text) {
          return reply(replyToken, [textMsg('請輸入任務名稱：')]);
        }
        await this.state.setStep(userId, groupId, 'awaiting_frequency', {
          name: text,
        });
        return reply(replyToken, [askFrequency()]);
      }

      case 'awaiting_custom_days': {
        const days = parseInt(text, 10);
        if (isNaN(days) || days < 1) {
          return reply(replyToken, [textMsg('請輸入正整數天數，例如 30')]);
        }
        await this.state.setStep(userId, groupId, 'awaiting_start_date', {
          intervalDays: days,
        });
        return reply(replyToken, [askStartDate()]);
      }

      case 'awaiting_edit_name': {
        if (!text) return reply(replyToken, [textMsg('請輸入新名稱：')]);
        const taskId = state.tempData.editTaskId;
        if (!taskId) {
          await this.state.clear(userId, groupId);
          return reply(replyToken, [
            textMsg(`狀態錯誤，請重新 ${COMMAND.EDIT}`),
          ]);
        }
        const updated = await this.task.update(taskId, { name: text });
        await this.state.clear(userId, groupId);
        if (!updated) return reply(replyToken, [textMsg('任務不存在')]);
        return reply(replyToken, [
          textMsg(`✏️ 已改名為「${updated.name}」`),
        ]);
      }

      case 'awaiting_edit_freq_custom': {
        const days = parseInt(text, 10);
        if (isNaN(days) || days < 1) {
          return reply(replyToken, [textMsg('請輸入正整數天數，例如 30')]);
        }
        const taskId = state.tempData.editTaskId;
        if (!taskId) {
          await this.state.clear(userId, groupId);
          return reply(replyToken, [
            textMsg(`狀態錯誤，請重新 ${COMMAND.EDIT}`),
          ]);
        }
        const updated = await this.task.update(taskId, {
          intervalDays: days,
        });
        await this.state.clear(userId, groupId);
        if (!updated) return reply(replyToken, [textMsg('任務不存在')]);
        return reply(replyToken, [
          textMsg(`🔁 已改頻率為每 ${days} 天`),
        ]);
      }

      case 'awaiting_frequency':
      case 'awaiting_start_date':
      case 'awaiting_edit_freq':
      case 'awaiting_confirm':
        return reply(replyToken, [
          textMsg(`請點上方按鈕，或輸入 ${COMMAND.CANCEL} 退出`),
        ]);
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
      const displayName = await this.line.getDisplayName(userId, event.source);
      const task = await this.task.complete(id, displayName);
      if (!task) return reply(replyToken, [textMsg('任務不存在')]);
      return reply(replyToken, [
        textMsg(
          `✅ 已完成「${task.name}」(by ${displayName})\n下次提醒：${formatDate(task.nextDueAt)}`,
        ),
      ]);
    }

    if (action === ACTION.SNOOZE) {
      const id = params.get('id');
      const dateStr = event.postback.params?.date;
      if (!id || !dateStr) return null;
      const task = await this.task.snooze(id, dateStr);
      if (!task) return reply(replyToken, [textMsg('任務不存在')]);
      return reply(replyToken, [
        textMsg(
          `⏭ 已忽略「${task.name}」\n下次提醒：${formatDate(task.nextDueAt)}`,
        ),
      ]);
    }

    if (action === ACTION.DELETE) {
      const id = params.get('id');
      if (!id) return null;
      const ok = await this.task.remove(id);
      return reply(replyToken, [textMsg(ok ? '已刪除任務' : '任務不存在')]);
    }

    if (action === ACTION.SHOW) {
      const id = params.get('id');
      if (!id) return null;
      const task = await this.task.findById(id);
      if (!task) return reply(replyToken, [textMsg('任務不存在')]);
      return reply(replyToken, [taskDetailCard(task)]);
    }

    if (action === ACTION.EDIT_DATE) {
      const id = params.get('id');
      const dateStr = event.postback.params?.date;
      if (!id || !dateStr) return null;
      const task = await this.task.snooze(id, dateStr);
      if (!task) return reply(replyToken, [textMsg('任務不存在')]);
      return reply(replyToken, [
        textMsg(
          `📅 已改下次日期「${task.name}」\n下次提醒：${formatDate(task.nextDueAt)}`,
        ),
      ]);
    }

    if (action === ACTION.EDIT_NAME) {
      const id = params.get('id');
      if (!id) return null;
      await this.state.setStep(userId, groupId, 'awaiting_edit_name', {
        editTaskId: id,
      });
      return reply(replyToken, [textMsg('請輸入新名稱：')]);
    }

    if (action === ACTION.EDIT_FREQ) {
      const id = params.get('id');
      if (!id) return null;
      await this.state.setStep(userId, groupId, 'awaiting_edit_freq', {
        editTaskId: id,
      });
      return reply(replyToken, [askFrequency()]);
    }

    const state = await this.state.get(userId, groupId);
    if (!state) return null;

    if (action === ACTION.FREQ && state.step === 'awaiting_frequency') {
      const value = params.get('value');
      if (value === 'custom') {
        await this.state.setStep(userId, groupId, 'awaiting_custom_days', {});
        return reply(replyToken, [textMsg('請輸入幾天，例如 30：')]);
      }
      const intervalDays = parseInt(value ?? '', 10);
      if (isNaN(intervalDays)) return null;
      await this.state.setStep(userId, groupId, 'awaiting_start_date', {
        intervalDays,
      });
      return reply(replyToken, [askStartDate()]);
    }

    if (
      action === ACTION.START_DATE &&
      state.step === 'awaiting_start_date'
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
        'awaiting_confirm',
        { startDate: dateStr },
      );
      return reply(replyToken, [confirmCard(updated.tempData)]);
    }

    if (action === ACTION.FREQ && state.step === 'awaiting_edit_freq') {
      const value = params.get('value');
      if (value === 'custom') {
        await this.state.setStep(userId, groupId, 'awaiting_edit_freq_custom');
        return reply(replyToken, [textMsg('請輸入幾天，例如 30：')]);
      }
      const intervalDays = parseInt(value ?? '', 10);
      if (isNaN(intervalDays)) return null;
      const taskId = state.tempData.editTaskId;
      if (!taskId) {
        await this.state.clear(userId, groupId);
        return reply(replyToken, [
          textMsg(`狀態錯誤，請重新 ${COMMAND.EDIT}`),
        ]);
      }
      await this.task.update(taskId, { intervalDays });
      await this.state.clear(userId, groupId);
      return reply(replyToken, [
        textMsg(`🔁 已改頻率為每 ${intervalDays} 天`),
      ]);
    }

    if (action === ACTION.CANCEL) {
      await this.state.clear(userId, groupId);
      return reply(replyToken, [textMsg('已取消')]);
    }

    if (action === ACTION.CONFIRM && state.step === 'awaiting_confirm') {
      const { name, intervalDays, startDate } = state.tempData;
      if (!name || !intervalDays || !startDate) {
        await this.state.clear(userId, groupId);
        return reply(replyToken, [
          textMsg(`資料不完整，請重新 ${COMMAND.CREATE}`),
        ]);
      }
      const created = await this.task.create({
        groupId,
        name,
        intervalDays,
        startDate,
      });
      await this.state.clear(userId, groupId);
      return reply(replyToken, [
        textMsg(
          `✅ 任務已建立\n名稱：${name}\n頻率：每 ${intervalDays} 天\n首次提醒：${formatDate(created.nextDueAt)}`,
        ),
      ]);
    }

    return null;
  }

  private handleJoin(event: webhook.JoinEvent): ReplyIntent | null {
    if (!event.replyToken) return null;
    return reply(event.replyToken, [
      textMsg(
        `哈囉 🐾 我是貓貓管家!\n打 ${COMMAND.CREATE} 開始建立新任務，打 ${COMMAND.HELP} 看全部指令。`,
      ),
    ]);
  }

  private getGroupId(source: webhook.Source): string {
    if (source.type === 'group') return source.groupId;
    if (source.type === 'room') return source.roomId;
    if (source.type === 'user') return `dm:${source.userId}`;
    return 'unknown';
  }
}

function reply(
  replyToken: string,
  messages: messagingApi.Message[],
): ReplyIntent {
  return { replyToken, messages };
}
