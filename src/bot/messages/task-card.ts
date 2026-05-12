import { messagingApi } from '@line/bot-sdk';
import { TaskDocument } from '../../task/task.schema';
import { dateForPicker, formatDateTime } from '../lib/utils';
import { ACTION } from '../lib/actions';

export function taskListCarousel(
  tasks: TaskDocument[],
): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: '任務列表',
    contents: {
      type: 'carousel',
      contents: tasks.slice(0, 12).map(taskBubble),
    },
  };
}

function taskBubble(task: TaskDocument): messagingApi.FlexBubble {
  const id = String(task._id);
  const today = dateForPicker(new Date());

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isOverdue = task.nextDueAt < startOfToday;
  const daysOverdue = isOverdue
    ? Math.floor(
        (startOfToday.getTime() - task.nextDueAt.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;
  const initial = isOverdue ? today : dateForPicker(task.nextDueAt);

  const bodyContents: messagingApi.FlexComponent[] = [
    {
      type: 'text',
      text: task.name,
      weight: 'bold',
      size: 'lg',
      wrap: true,
    },
  ];

  if (isOverdue) {
    bodyContents.push({
      type: 'text',
      text: `🔴 逾期 ${daysOverdue} 天`,
      size: 'sm',
      color: '#d33333',
      margin: 'sm',
    });
  }

  bodyContents.push(
    { type: 'separator', margin: 'md' },
    {
      type: 'box',
      layout: 'baseline',
      margin: 'md',
      contents: [
        { type: 'text', text: '頻率', size: 'sm', color: '#888888', flex: 2 },
        {
          type: 'text',
          text: `每 ${task.intervalDays} 天 · ${task.remindTime}`,
          size: 'sm',
          flex: 5,
        },
      ],
    },
    {
      type: 'box',
      layout: 'baseline',
      margin: 'sm',
      contents: [
        { type: 'text', text: '下次', size: 'sm', color: '#888888', flex: 2 },
        {
          type: 'text',
          text: formatDateTime(task.nextDueAt),
          size: 'sm',
          flex: 5,
        },
      ],
    },
  );

  if (task.lastCompletedAt) {
    const completedText = task.lastCompletedBy
      ? `${formatDateTime(task.lastCompletedAt)} (${task.lastCompletedBy})`
      : formatDateTime(task.lastCompletedAt);
    bodyContents.push({
      type: 'box',
      layout: 'baseline',
      margin: 'sm',
      contents: [
        {
          type: 'text',
          text: '上次完成',
          size: 'sm',
          color: '#888888',
          flex: 2,
        },
        {
          type: 'text',
          text: completedText,
          size: 'sm',
          flex: 5,
          wrap: true,
        },
      ],
    });
  }

  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: bodyContents,
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          height: 'md',
          action: {
            type: 'postback',
            label: '完成',
            data: `action=${ACTION.COMPLETE}&id=${id}`,
            displayText: '完成',
          },
        },
        {
          type: 'button',
          style: 'link',
          height: 'sm',
          action: {
            type: 'datetimepicker',
            label: '忽略',
            data: `action=${ACTION.SNOOZE}&id=${id}`,
            mode: 'date',
            initial,
            min: today,
          },
        },
      ],
    },
  };
}
