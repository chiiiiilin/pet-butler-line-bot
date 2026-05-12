import { messagingApi } from '@line/bot-sdk';
import { TaskDocument } from '../../task/task.schema';
import { dateForPicker, formatDateTime } from '../lib/utils';
import { ACTION } from '../lib/actions';

export function editTaskCarousel(
  tasks: TaskDocument[],
): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: '選擇要編輯的任務',
    contents: {
      type: 'carousel',
      contents: tasks.slice(0, 12).map(editTaskBubble),
    },
  };
}

function editTaskBubble(task: TaskDocument): messagingApi.FlexBubble {
  const id = String(task._id);
  const today = dateForPicker(new Date());
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isOverdue = task.nextDueAt < startOfToday;
  const initial = isOverdue ? today : dateForPicker(task.nextDueAt);

  return {
    type: 'bubble',
    size: 'mega',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: task.name,
          weight: 'bold',
          size: 'lg',
          wrap: true,
        },
        { type: 'separator', margin: 'md' },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
          contents: [
            {
              type: 'text',
              text: '頻率',
              size: 'sm',
              color: '#888888',
              flex: 2,
            },
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
            {
              type: 'text',
              text: '下次',
              size: 'sm',
              color: '#888888',
              flex: 2,
            },
            {
              type: 'text',
              text: formatDateTime(task.nextDueAt),
              size: 'sm',
              flex: 5,
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '✏️ 改名稱',
            data: `action=${ACTION.EDIT_NAME}&id=${id}`,
            displayText: '改名稱',
          },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '🔁 改頻率',
            data: `action=${ACTION.EDIT_FREQ}&id=${id}`,
            displayText: '改頻率',
          },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'postback',
            label: '⏰ 改時間',
            data: `action=${ACTION.EDIT_TIME}&id=${id}`,
            displayText: '改時間',
          },
        },
        {
          type: 'button',
          style: 'secondary',
          height: 'sm',
          action: {
            type: 'datetimepicker',
            label: '📅 改下次日期',
            data: `action=${ACTION.EDIT_DATE}&id=${id}`,
            mode: 'date',
            initial,
            min: today,
          },
        },
      ],
    },
  };
}
