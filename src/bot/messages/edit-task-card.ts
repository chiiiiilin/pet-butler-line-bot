import { messagingApi } from '@line/bot-sdk';
import { TaskView } from '../../task/task.service';
import { dateForPicker, formatDate } from '../lib/utils';
import { ACTION } from '../lib/actions';

export function editTaskCarousel(tasks: TaskView[]): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: '選擇要編輯的任務',
    contents: {
      type: 'carousel',
      contents: tasks.slice(0, 12).map(editTaskBubble),
    },
  };
}

function editTaskBubble(task: TaskView): messagingApi.FlexBubble {
  const id = task._id;
  const today = dateForPicker(new Date());
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDueDate = new Date(task.nextDueAt);
  startOfDueDate.setHours(0, 0, 0, 0);
  const isOverdue = startOfDueDate < startOfToday;
  const initial = isOverdue ? today : dateForPicker(task.nextDueAt);
  const freqText =
    task.intervalDays == null ? '不重複' : `每 ${task.intervalDays} 天`;

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
              text: freqText,
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
              text: formatDate(task.nextDueAt),
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
