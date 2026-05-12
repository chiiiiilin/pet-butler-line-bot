import { messagingApi } from '@line/bot-sdk';
import { TaskDocument } from '../../task/task.schema';
import { ACTION } from '../lib/actions';

export function deleteTaskCarousel(
  tasks: TaskDocument[],
): messagingApi.FlexMessage {
  return {
    type: 'flex',
    altText: '選擇要刪除的任務',
    contents: {
      type: 'carousel',
      contents: tasks.slice(0, 12).map(deleteTaskBubble),
    },
  };
}

function deleteTaskBubble(task: TaskDocument): messagingApi.FlexBubble {
  const id = String(task._id);
  return {
    type: 'bubble',
    size: 'kilo',
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
              text: `每 ${task.intervalDays} 天`,
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
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#d33333',
          height: 'sm',
          action: {
            type: 'postback',
            label: '刪除這個',
            data: `action=${ACTION.DELETE}&id=${id}`,
            displayText: '刪除這個任務',
          },
        },
      ],
    },
  };
}
